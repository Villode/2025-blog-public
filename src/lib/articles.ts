// 文章相关的数据库和 R2 操作
import type { D1Database, R2Bucket } from '@cloudflare/workers-types'

// 动态导入 getCloudflareContext 避免构建时问题
async function getCloudflareContext() {
	const mod = await import('@opennextjs/cloudflare')
	return mod.getCloudflareContext()
}

export interface Article {
	id: number
	slug: string
	title: string
	summary?: string
	author: string
	tags: string[]
	coverKey?: string
	contentKey: string
	status: 'draft' | 'published'
	views: number
	createdAt: string
	updatedAt: string
	publishedAt?: string
}

interface ArticleRow {
	id: number
	slug: string
	title: string
	summary: string | null
	author: string
	tags: string | null
	cover_key: string | null
	content_key: string
	status: string
	views: number
	created_at: string
	updated_at: string
	published_at: string | null
}

function rowToArticle(row: ArticleRow): Article {
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		summary: row.summary || undefined,
		author: row.author,
		tags: row.tags ? JSON.parse(row.tags) : [],
		coverKey: row.cover_key || undefined,
		contentKey: row.content_key,
		status: row.status as 'draft' | 'published',
		views: row.views,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		publishedAt: row.published_at || undefined,
	}
}

// 获取 D1 和 R2
async function getBindings(): Promise<{ db: D1Database | null; bucket: R2Bucket | null }> {
	try {
		const ctx = await getCloudflareContext()
		const env = ctx.env as { DB?: D1Database; BUCKET?: R2Bucket }
		return {
			db: env.DB || null,
			bucket: env.BUCKET || null,
		}
	} catch (error) {
		console.error('Failed to get Cloudflare context:', error)
		// 本地开发环境没有 Cloudflare context
		return { db: null, bucket: null }
	}
}

// 获取文章列表
export async function getArticles(status?: 'draft' | 'published'): Promise<Article[]> {
	const { db } = await getBindings()
	if (!db) return []

	let query = 'SELECT * FROM articles'
	if (status) {
		query += ` WHERE status = '${status}'`
	}
	query += ' ORDER BY created_at DESC'

	const result = await db.prepare(query).all()
	return ((result.results || []) as ArticleRow[]).map(rowToArticle)
}

// 根据 slug 获取文章
export async function getArticleBySlug(slug: string): Promise<Article | null> {
	const { db } = await getBindings()
	if (!db) return null

	const row = (await db
		.prepare('SELECT * FROM articles WHERE slug = ?')
		.bind(slug)
		.first()) as ArticleRow | null

	return row ? rowToArticle(row) : null
}

// 获取文章正文
export async function getArticleContent(contentKey: string): Promise<string | null> {
	const { bucket } = await getBindings()
	if (!bucket) return null

	const object = await bucket.get(contentKey)
	if (!object) return null

	return object.text()
}


// 创建文章
export async function createArticle(data: {
	slug: string
	title: string
	summary?: string
	author?: string
	tags?: string[]
	content: string
	coverImage?: ArrayBuffer
	status?: 'draft' | 'published'
}): Promise<Article> {
	const { db, bucket } = await getBindings()
	if (!db || !bucket) throw new Error('Database or bucket not available')

	const contentKey = `articles/${data.slug}/content.md`
	const coverKey = data.coverImage ? `articles/${data.slug}/cover.jpg` : null

	// 上传正文到 R2
	await bucket.put(contentKey, data.content, {
		httpMetadata: { contentType: 'text/markdown' },
	})

	// 上传封面图到 R2
	if (data.coverImage && coverKey) {
		await bucket.put(coverKey, data.coverImage, {
			httpMetadata: { contentType: 'image/jpeg' },
		})
	}

	const now = new Date().toISOString()
	const publishedAt = data.status === 'published' ? now : null

	const result = await db
		.prepare(
			`INSERT INTO articles (slug, title, summary, author, tags, cover_key, content_key, status, published_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			data.slug,
			data.title,
			data.summary || null,
			data.author || 'Villode',
			data.tags ? JSON.stringify(data.tags) : null,
			coverKey,
			contentKey,
			data.status || 'draft',
			publishedAt
		)
		.run()

	const article = await getArticleBySlug(data.slug)
	if (!article) throw new Error('Failed to create article')

	return article
}

// 更新文章
export async function updateArticle(
	slug: string,
	data: {
		title?: string
		summary?: string
		tags?: string[]
		content?: string
		coverImage?: ArrayBuffer
		status?: 'draft' | 'published'
	}
): Promise<Article | null> {
	const { db, bucket } = await getBindings()
	if (!db || !bucket) return null

	const existing = await getArticleBySlug(slug)
	if (!existing) return null

	// 更新正文
	if (data.content) {
		await bucket.put(existing.contentKey, data.content, {
			httpMetadata: { contentType: 'text/markdown' },
		})
	}

	// 更新封面图
	if (data.coverImage) {
		const coverKey = `articles/${slug}/cover.jpg`
		await bucket.put(coverKey, data.coverImage, {
			httpMetadata: { contentType: 'image/jpeg' },
		})
		await db.prepare('UPDATE articles SET cover_key = ? WHERE slug = ?').bind(coverKey, slug).run()
	}

	// 更新数据库字段
	const updates: string[] = ['updated_at = CURRENT_TIMESTAMP']
	const values: any[] = []

	if (data.title) {
		updates.push('title = ?')
		values.push(data.title)
	}
	if (data.summary !== undefined) {
		updates.push('summary = ?')
		values.push(data.summary || null)
	}
	if (data.tags) {
		updates.push('tags = ?')
		values.push(JSON.stringify(data.tags))
	}
	if (data.status) {
		updates.push('status = ?')
		values.push(data.status)
		if (data.status === 'published' && !existing.publishedAt) {
			updates.push('published_at = CURRENT_TIMESTAMP')
		}
	}

	if (values.length > 0) {
		values.push(slug)
		await db.prepare(`UPDATE articles SET ${updates.join(', ')} WHERE slug = ?`).bind(...values).run()
	}

	return getArticleBySlug(slug)
}

// 删除文章
export async function deleteArticle(slug: string): Promise<boolean> {
	const { db, bucket } = await getBindings()
	if (!db || !bucket) return false

	const article = await getArticleBySlug(slug)
	if (!article) return false

	// 删除 R2 文件
	await bucket.delete(article.contentKey)
	if (article.coverKey) {
		await bucket.delete(article.coverKey)
	}

	// 删除数据库记录
	await db.prepare('DELETE FROM articles WHERE slug = ?').bind(slug).run()

	return true
}

// 增加浏览数
export async function incrementViews(slug: string): Promise<void> {
	const { db } = await getBindings()
	if (!db) return

	await db.prepare('UPDATE articles SET views = views + 1 WHERE slug = ?').bind(slug).run()
}

// 上传文章内图片
export async function uploadArticleImage(slug: string, filename: string, data: ArrayBuffer): Promise<string> {
	const { bucket } = await getBindings()
	if (!bucket) throw new Error('Bucket not available')

	const key = `articles/${slug}/images/${filename}`
	await bucket.put(key, data, {
		httpMetadata: { contentType: 'image/jpeg' },
	})

	return key
}

// 获取图片 URL
export function getImageUrl(key: string): string {
	// R2 公开访问 URL，需要在 Cloudflare 配置公开访问
	return `/api/images/${key}`
}
