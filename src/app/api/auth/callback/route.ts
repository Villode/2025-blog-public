// GitHub OAuth 回调
import { NextRequest, NextResponse } from 'next/server'
import { signSession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	// 在函数内部读取环境变量
	const clientId = process.env.GITHUB_CLIENT_ID || ''
	const clientSecret = process.env.GITHUB_CLIENT_SECRET || ''
	const allowedUser = process.env.GITHUB_ALLOWED_USER || ''
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://0n0.uk'

	const code = request.nextUrl.searchParams.get('code')

	if (!code) {
		return NextResponse.redirect(`${siteUrl}?error=no_code`)
	}

	if (!clientId || !clientSecret) {
		return NextResponse.redirect(`${siteUrl}?error=missing_config`)
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
			return NextResponse.redirect(`${siteUrl}?error=token_failed`)
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
			return NextResponse.redirect(`${siteUrl}?error=not_allowed`)
		}

		// 生成签名 session
		const session = await signSession({ username, role: 'admin' })

		const response = NextResponse.redirect(siteUrl)
		response.cookies.set(SESSION_COOKIE, session, {
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60,
		})

		return response
	} catch (error) {
		console.error('OAuth error:', error)
		return NextResponse.redirect(`${siteUrl}?error=oauth_failed`)
	}
}
