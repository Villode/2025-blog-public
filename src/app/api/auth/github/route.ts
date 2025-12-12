// GitHub OAuth 登录 - 重定向到 GitHub
import { NextResponse } from 'next/server'

export const runtime = 'edge'

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''

export async function GET() {
	const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`
	
	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
	})

	return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
}
