// 获取当前用户信息
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function GET(request: Request) {
	try {
		const cookieHeader = request.headers.get('cookie') || ''
		const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
		const session = sessionMatch?.[1]

		if (!session) {
			return Response.json({ user: null, authenticated: false })
		}

		const data = await verifySession(session)
		if (!data) {
			return Response.json({ user: null, authenticated: false })
		}

		return Response.json({
			user: { id: data.username, role: data.role },
			authenticated: true,
		})
	} catch (error) {
		console.error('Auth error:', error)
		return Response.json({ user: null, authenticated: false }, { status: 500 })
	}
}
