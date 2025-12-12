// 获取当前用户信息
import { NextRequest, NextResponse } from 'next/server'
import { validTokens } from '../callback/route'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		const token = request.cookies.get('admin_token')?.value

		if (!token) {
			return NextResponse.json({ user: null, authenticated: false })
		}

		const session = validTokens.get(token)
		if (!session || Date.now() > session.expiresAt) {
			validTokens.delete(token)
			return NextResponse.json({ user: null, authenticated: false })
		}

		return NextResponse.json({
			user: { id: session.username, role: 'admin' },
			authenticated: true
		})
	} catch (error) {
		console.error('Auth error:', error)
		return NextResponse.json({ user: null, authenticated: false }, { status: 500 })
	}
}
