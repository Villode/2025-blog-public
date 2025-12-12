// Token 验证 API
import { NextRequest, NextResponse } from 'next/server'
import { validTokens } from '../callback/route'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const { token } = await request.json()

		if (!token) {
			return NextResponse.json({ valid: false })
		}

		const session = validTokens.get(token)
		const valid = !!session && Date.now() < session.expiresAt

		return NextResponse.json({ valid })
	} catch (error) {
		console.error('Verify error:', error)
		return NextResponse.json({ valid: false })
	}
}
