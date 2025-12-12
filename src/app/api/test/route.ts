// 最简单的测试 API
export const runtime = 'edge'

export async function GET() {
	return Response.json({
		ok: true,
		time: new Date().toISOString(),
		env: {
			hasClientId: !!process.env.GITHUB_CLIENT_ID,
			hasSecret: !!process.env.GITHUB_CLIENT_SECRET,
			siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'not set',
		},
	})
}
