// 简单的签名 session（使用 HMAC-SHA256）

export const SESSION_COOKIE = 'session'

// 用 GITHUB_CLIENT_SECRET 作为签名密钥
// 在 Cloudflare Workers 中，secrets 通过 process.env 访问
function getSecret(): string {
	return process.env.GITHUB_CLIENT_SECRET || 'dev-secret-key'
}

interface SessionData {
	username: string
	role: 'admin' | 'user'
	exp?: number
}

// Edge-safe base64 编码（支持 Unicode）
function base64Encode(str: string): string {
	const bytes = new TextEncoder().encode(str)
	let binary = ''
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

// Edge-safe base64 解码（支持 Unicode）
function base64Decode(b64: string): string {
	const binary = atob(b64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i)
	}
	return new TextDecoder().decode(bytes)
}

// 签名 session
export async function signSession(data: SessionData): Promise<string> {
	const payload = {
		...data,
		exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
	}

	const payloadStr = JSON.stringify(payload)
	const payloadB64 = base64Encode(payloadStr)

	const secret = getSecret()
	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)

	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64))
	const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))

	return `${payloadB64}.${sigB64}`
}

// 验证并解析 session
export async function verifySession(session: string): Promise<SessionData | null> {
	try {
		const [payloadB64, sigB64] = session.split('.')
		if (!payloadB64 || !sigB64) return null

		const secret = getSecret()
		const encoder = new TextEncoder()
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		)

		const signature = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
		const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(payloadB64))

		if (!valid) return null

		const payload = JSON.parse(base64Decode(payloadB64)) as SessionData

		// 检查过期
		if (payload.exp && payload.exp < Date.now()) {
			return null
		}

		return payload
	} catch {
		return null
	}
}
