// Session 验证 API
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function POST(request: Request) {
	try {
		const cookieHeader = request.headers.get('cookie') || ''
		const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
		const session = sessionMatch?.[1]

		if (!session) {
			return Response.json({ valid: false })
		}

		const data = await verifySession(session)
		return Response.json({ valid: !!data })
	} catch (error) {
		console.error('Verify error:', error)
		return Response.json({ valid: false })
	}
}
