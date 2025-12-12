// 获取当前用户信息
import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/cf-auth'
import { getOrCreateUser, type D1Database } from '@/lib/db'

// Cloudflare Workers 环境变量
declare global {
	var DB: D1Database | undefined
}

export const runtime = 'edge'

export async function GET(request: NextRequest) {
	try {
		// 验证 Cloudflare Access JWT
		const accessUser = await getUserFromRequest(request)
		
		if (!accessUser) {
			return NextResponse.json({ user: null, authenticated: false })
		}
		
		// 获取 D1 数据库（从 Cloudflare 环境）
		const db = (globalThis as any).DB as D1Database | undefined
		
		if (!db) {
			// 没有数据库时只返回基本信息
			return NextResponse.json({
				user: {
					id: accessUser.sub,
					email: accessUser.email,
					role: 'user'
				},
				authenticated: true
			})
		}
		
		// 获取或创建数据库用户
		const dbUser = await getOrCreateUser(db, accessUser.sub, accessUser.email)
		
		return NextResponse.json({
			user: dbUser,
			authenticated: true
		})
	} catch (error) {
		console.error('Auth error:', error)
		return NextResponse.json({ user: null, authenticated: false, error: 'Auth failed' }, { status: 500 })
	}
}
