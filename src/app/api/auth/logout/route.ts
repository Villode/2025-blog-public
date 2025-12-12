// 登出
import { NextRequest, NextResponse } from 'next/server'
import { validTokens } from '../callback/route'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	const token = request.cookies.get('admin_token')?.value

	if (token) {
		validTokens.delete(token)
	}

	const response = NextResponse.json({ success: true })
	response.cookies.delete('admin_token')

	return response
}
