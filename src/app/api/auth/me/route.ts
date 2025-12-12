// 获取当前用户信息
import { NextRequest, NextResponse } from 'next/server'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		const session = request.cookies.get(SESSION_COOKIE)?.value

		if (!session) {
			return NextResponse.json({ user: null, authenticated: false })
		}

		const data = await verifySession(session)
		if (!data) {
			return NextResponse.json({ user: null, authenticated: false })
		}

		return NextResponse.json({
			user: { id: data.username, role: data.role },
			authenticated: true
		})
	} catch (error) {
		console.error('Auth error:', error)
		return NextResponse.json({ user: null, authenticated: false }, { status: 500 })
	}
}
