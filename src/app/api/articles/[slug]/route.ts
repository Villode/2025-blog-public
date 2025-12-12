// 单篇文章 API
import {
	getArticleBySlug,
	getArticleContent,
	updateArticle,
	deleteArticle,
	incrementViews,
} from '@/lib/articles'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

function getSession(request: Request): string | undefined {
	const cookieHeader = request.headers.get('cookie') || ''
	const sessionMatch = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))
	return sessionMatch?.[1]
}

// 获取单篇文章
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	try {
		const article = await getArticleBySlug(slug)
		if (!article) {
			return Response.json({ error: 'Article not found' }, { status: 404 })
		}

		// 获取正文
		const content = await getArticleContent(article.contentKey)

		// 增加浏览数
		await incrementViews(slug)

		return Response.json({ article, content })
	} catch (error) {
		console.error('Get article error:', error)
		return Response.json({ error: 'Failed to get article' }, { status: 500 })
	}
}

// 更新文章
export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	// 验证登录
	const session = getSession(request)
	if (!session) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const data = await request.json()
		const article = await updateArticle(slug, data)

		if (!article) {
			return Response.json({ error: 'Article not found' }, { status: 404 })
		}

		return Response.json({ article })
	} catch (error) {
		console.error('Update article error:', error)
		return Response.json({ error: 'Failed to update article' }, { status: 500 })
	}
}

// 删除文章
export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	// 验证登录
	const session = getSession(request)
	if (!session) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const success = await deleteArticle(slug)
		if (!success) {
			return Response.json({ error: 'Article not found' }, { status: 404 })
		}

		return Response.json({ success: true })
	} catch (error) {
		console.error('Delete article error:', error)
		return Response.json({ error: 'Failed to delete article' }, { status: 500 })
	}
}
