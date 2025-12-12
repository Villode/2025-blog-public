// 单篇文章 API
import { NextRequest, NextResponse } from 'next/server'
import { getArticleBySlug, getArticleContent, updateArticle, deleteArticle, incrementViews } from '@/lib/articles'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

// 获取单篇文章
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	try {
		const article = await getArticleBySlug(slug)
		if (!article) {
			return NextResponse.json({ error: 'Article not found' }, { status: 404 })
		}

		// 获取正文
		const content = await getArticleContent(article.contentKey)

		// 增加浏览数
		await incrementViews(slug)

		return NextResponse.json({ article, content })
	} catch (error) {
		console.error('Get article error:', error)
		return NextResponse.json({ error: 'Failed to get article' }, { status: 500 })
	}
}

// 更新文章
export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	// 验证登录
	const session = request.cookies.get(SESSION_COOKIE)?.value
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const data = await request.json()
		const article = await updateArticle(slug, data)

		if (!article) {
			return NextResponse.json({ error: 'Article not found' }, { status: 404 })
		}

		return NextResponse.json({ article })
	} catch (error) {
		console.error('Update article error:', error)
		return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
	}
}

// 删除文章
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params

	// 验证登录
	const session = request.cookies.get(SESSION_COOKIE)?.value
	if (!session) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}
	const user = await verifySession(session)
	if (!user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const success = await deleteArticle(slug)
		if (!success) {
			return NextResponse.json({ error: 'Article not found' }, { status: 404 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Delete article error:', error)
		return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
	}
}
