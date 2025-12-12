// Session 验证 API
import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const session = request.cookies.get(SESSION_COOKIE)?.value

		if (!session) {
			return NextResponse.json({ valid: false })
		}

		const data = await verifySession(session)
		return NextResponse.json({ valid: !!data })
	} catch (error) {
		console.error('Verify error:', error)
		return NextResponse.json({ valid: false })
	}
}
