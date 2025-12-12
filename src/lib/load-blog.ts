export type BlogConfig = {
	title?: string
	tags?: string[]
	date?: string
	summary?: string
	cover?: string
}

export type LoadedBlog = {
	slug: string
	config: BlogConfig
	markdown: string
	cover?: string
}

/**
 * Load blog data from API
 * Used by both view page and edit page
 */
export async function loadBlog(slug: string): Promise<LoadedBlog> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	const res = await fetch(`/api/articles/${encodeURIComponent(slug)}`)
	if (!res.ok) {
		throw new Error('Blog not found')
	}

	const data = await res.json()
	const { article, content } = data

	return {
		slug: article.slug,
		config: {
			title: article.title,
			tags: article.tags || [],
			date: article.publishedAt || article.createdAt,
			summary: article.summary,
			cover: article.coverKey ? `/api/images/${article.coverKey}` : undefined
		},
		markdown: content || '',
		cover: article.coverKey ? `/api/images/${article.coverKey}` : undefined
	}
}
