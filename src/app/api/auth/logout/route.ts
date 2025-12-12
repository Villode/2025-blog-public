// 登出
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function POST() {
	const response = NextResponse.json({ success: true })
	response.cookies.delete(SESSION_COOKIE)
	return response
}
