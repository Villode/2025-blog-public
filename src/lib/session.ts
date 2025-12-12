// 简单的签名 session（使用 HMAC-SHA256）

export const SESSION_COOKIE = 'session'

// 用 GITHUB_CLIENT_SECRET 作为签名密钥
function getSecret(): string {
	return process.env.GITHUB_CLIENT_SECRET || 'dev-secret-key'
}

interface SessionData {
	username: string
	role: 'admin' | 'user'
	exp?: number
}

// 签名 session
export async function signSession(data: SessionData): Promise<string> {
	const payload = {
		...data,
		exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天过期
	}

	const payloadStr = JSON.stringify(payload)
	const payloadB64 = btoa(payloadStr)

	const encoder = new TextEncoder()
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(getSecret()),
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

		const encoder = new TextEncoder()
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(getSecret()),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		)

		const signature = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0))
		const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(payloadB64))

		if (!valid) return null

		const payload = JSON.parse(atob(payloadB64)) as SessionData

		// 检查过期
		if (payload.exp && payload.exp < Date.now()) {
			return null
		}

		return payload
	} catch {
		return null
	}
}
