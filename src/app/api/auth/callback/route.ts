// GitHub OAuth 回调
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const ALLOWED_USER = process.env.GITHUB_ALLOWED_USER || '' // 你的 GitHub 用户名

// 生成随机 token
function generateToken(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let token = ''
	for (let i = 0; i < 64; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return token
}

// 内存存储（和 login/route.ts 共享）
export const validTokens = new Map<string, { expiresAt: number; username: string }>()

export async function GET(request: NextRequest) {
	const code = request.nextUrl.searchParams.get('code')
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

	if (!code) {
		return NextResponse.redirect(`${siteUrl}?error=no_code`)
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
				client_id: GITHUB_CLIENT_ID,
				client_secret: GITHUB_CLIENT_SECRET,
				code,
			}),
		})

		const tokenData = await tokenRes.json()
		if (!tokenData.access_token) {
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
		if (ALLOWED_USER && username !== ALLOWED_USER) {
			return NextResponse.redirect(`${siteUrl}?error=not_allowed`)
		}

		// 生成 session token
		const token = generateToken()
		const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7天

		validTokens.set(token, { expiresAt, username })

		// 重定向回首页，带上 token
		const response = NextResponse.redirect(`${siteUrl}?login=success`)
		response.cookies.set('admin_token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60, // 7天
		})

		return response
	} catch (error) {
		console.error('OAuth error:', error)
		return NextResponse.redirect(`${siteUrl}?error=oauth_failed`)
	}
}
