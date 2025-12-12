// GitHub OAuth 登录 - 重定向到 GitHub
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
	// 在函数内部读取环境变量，确保在 Cloudflare 环境中正确获取
	const clientId = process.env.GITHUB_CLIENT_ID || ''
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://0n0.uk'
	const redirectUri = `${siteUrl}/api/auth/callback`

	if (!clientId) {
		return NextResponse.json({ error: '缺少 GITHUB_CLIENT_ID 配置' }, { status: 500 })
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
	})

	return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
