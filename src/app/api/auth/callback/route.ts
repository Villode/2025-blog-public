// GitHub OAuth 回调
import { signSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function GET(request: Request) {
	const clientId = process.env.GITHUB_CLIENT_ID || ''
	const clientSecret = process.env.GITHUB_CLIENT_SECRET || ''
	const allowedUser = process.env.GITHUB_ALLOWED_USER || ''
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://0n0.uk'

	const url = new URL(request.url)
	const code = url.searchParams.get('code')

	if (!code) {
		return Response.redirect(`${siteUrl}?error=no_code`, 302)
	}

	if (!clientId || !clientSecret) {
		return Response.redirect(`${siteUrl}?error=missing_config`, 302)
	}

	try {
		// 用 code 换 access_token
		const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code,
			}),
		})

		const tokenData = await tokenRes.json()
		if (!tokenData.access_token) {
			console.error('Token exchange failed:', tokenData)
			return Response.redirect(`${siteUrl}?error=token_failed`, 302)
		}

		// 获取用户信息
		const userRes = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${tokenData.access_token}`,
				Accept: 'application/vnd.github+json',
			},
		})

		const userData = await userRes.json()
		const username = userData.login

		// 检查是否是允许的用户
		if (allowedUser && username !== allowedUser) {
			return Response.redirect(`${siteUrl}?error=not_allowed`, 302)
		}

		// 生成签名 session
		const session = await signSession({ username, role: 'admin' })

		const headers = new Headers({ Location: siteUrl })
		headers.append(
			'Set-Cookie',
			`${SESSION_COOKIE}=${session}; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
		)

		return new Response(null, { status: 302, headers })
	} catch (error) {
		console.error('OAuth error:', error)
		return Response.redirect(`${siteUrl}?error=oauth_failed`, 302)
	}
}
