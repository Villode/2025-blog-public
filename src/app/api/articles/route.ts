// 文章列表 API
import { getArticles, createArticle } from '@/lib/articles'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

// 获取文章列表
export async function GET(request: Request) {
	const url = new URL(request.url)
	const status = url.searchParams.get('status') as 'draft' | 'published' | null

	try {
		const articles = await getArticles(status || undefined)
		return Response.json({ articles })
	} catch (error) {
		console.error('Get articles error:', error)
		return Response.json({ error: 'Failed to get articles' }, { status: 500 })
	}
}

// 创建文章
export async function POST(request: Request) {
	// 验证登录
	const cookieHeader = request.headers.get('cookie') || ''
	const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
	const session = sessionMatch?.[1]

	if (!session) {
		return Response.json({ error: '请先登录' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return Response.json({ error: '登录已过期，请重新登录' }, { status: 401 })
	}

	try {
		const data = await request.json()

		if (!data.slug || !data.title || !data.content) {
			return Response.json({ error: '请填写标题、slug 和内容' }, { status: 400 })
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

		return Response.json({ article })
	} catch (error: any) {
		console.error('Create article error:', error)
		const message = error?.message || '创建文章失败'
		if (message.includes('not available')) {
			return Response.json({ error: '本地开发环境不支持，请部署到 Cloudflare 后测试' }, { status: 500 })
		}
		return Response.json({ error: message }, { status: 500 })
	}
}
