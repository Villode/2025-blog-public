// Cloudflare Access JWT 验证
// Team Domain: villode.cloudflareaccess.com
// AUD: 34e98442-f89b-4cc0-8a34-165fa4a33ae8

const TEAM_DOMAIN = 'villode.cloudflareaccess.com'
const AUD = '34e98442-f89b-4cc0-8a34-165fa4a33ae8'
const CERTS_URL = `https://${TEAM_DOMAIN}/cdn-cgi/access/certs`

export interface AccessUser {
	email: string
	sub: string // 用户唯一ID
	iat: number
	exp: number
	iss: string
	aud: string[]
}

export interface DbUser {
	id: string
	email: string
	role: 'admin' | 'user'
	createdAt: string
	lastLoginAt: string
}

// 获取 Cloudflare Access 公钥
async function getPublicKeys(): Promise<JsonWebKey[]> {
	const response = await fetch(CERTS_URL)
	const data = await response.json()
	return data.keys
}

// 验证 JWT
export async function verifyAccessJWT(token: string): Promise<AccessUser | null> {
	try {
		const keys = await getPublicKeys()
		
		// 解析 JWT header 获取 kid
		const [headerB64] = token.split('.')
		const header = JSON.parse(atob(headerB64))
		const kid = header.kid
		
		// 找到对应的公钥
		const key = keys.find((k: any) => k.kid === kid)
		if (!key) return null
		
		// 导入公钥
		const cryptoKey = await crypto.subtle.importKey(
			'jwk',
			key,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
			false,
			['verify']
		)
		
		// 验证签名
		const [, payloadB64, signatureB64] = token.split('.')
		const signatureBuffer = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
		const dataBuffer = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
		
		const valid = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			cryptoKey,
			signatureBuffer,
			dataBuffer
		)
		
		if (!valid) return null
		
		// 解析 payload
		const payload = JSON.parse(atob(payloadB64)) as AccessUser
		
		// 验证 aud 和过期时间
		if (!payload.aud.includes(AUD)) return null
		if (payload.exp * 1000 < Date.now()) return null
		
		return payload
	} catch (e) {
		console.error('JWT verification failed:', e)
		return null
	}
}

// 从请求中获取用户
export async function getUserFromRequest(request: Request): Promise<AccessUser | null> {
	// Cloudflare Access 会在 cookie 中设置 CF_Authorization
	const cookie = request.headers.get('cookie') || ''
	const match = cookie.match(/CF_Authorization=([^;]+)/)
	
	if (!match) {
		// 也检查 header（用于 API 调用）
		const headerToken = request.headers.get('CF-Access-JWT-Assertion')
		if (headerToken) {
			return verifyAccessJWT(headerToken)
		}
		return null
	}
	
	return verifyAccessJWT(match[1])
}
