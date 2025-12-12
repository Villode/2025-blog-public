// GitHub OAuth 登录 - 重定向到 GitHub
export const runtime = 'edge'

export async function GET(request: Request) {
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
	const clientId = process.env.GITHUB_CLIENT_ID || ''
	const redirectUri = `${siteUrl}/api/auth/callback`

	if (!clientId) {
		return new Response(JSON.stringify({ error: 'missing_github_client_id' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
	})

	const url = `https://github.com/login/oauth/authorize?${params}`

	return Response.redirect(url, 302)
}
