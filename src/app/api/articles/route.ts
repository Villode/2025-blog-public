// 文章列表 API
import { NextRequest, NextResponse } from 'next/server'
import { getArticles, createArticle } from '@/lib/articles'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

// 获取文章列表
export async function GET(request: NextRequest) {
	const status = request.nextUrl.searchParams.get('status') as 'draft' | 'published' | null

	try {
		const articles = await getArticles(status || undefined)
		return NextResponse.json({ articles })
	} catch (error) {
		console.error('Get articles error:', error)
		return NextResponse.json({ error: 'Failed to get articles' }, { status: 500 })
	}
}

// 创建文章
export async function POST(request: NextRequest) {
	// 验证登录
	const session = request.cookies.get(SESSION_COOKIE)?.value
	if (!session) {
		return NextResponse.json({ error: '请先登录' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
	}

	try {
		const data = await request.json()

		if (!data.slug || !data.title || !data.content) {
			return NextResponse.json({ error: '请填写标题、slug 和内容' }, { status: 400 })
		}

		const article = await createArticle({
			slug: data.slug,
			title: data.title,
			summary: data.summary,
			author: user.username,
			tags: data.tags,
			content: data.content,
			status: data.status,
		})

		return NextResponse.json({ article })
	} catch (error: any) {
		console.error('Create article error:', error)
		const message = error?.message || '创建文章失败'
		if (message.includes('not available')) {
			return NextResponse.json({ error: '本地开发环境不支持，请部署到 Cloudflare 后测试' }, { status: 500 })
		}
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
