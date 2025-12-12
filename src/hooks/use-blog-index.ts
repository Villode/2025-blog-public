import useSWR from 'swr'

export type BlogIndexItem = {
	slug: string
	title: string
	tags: string[]
	date: string
	summary?: string
	cover?: string
}

const fetcher = async (url: string) => {
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		throw new Error('Failed to load blog index')
	}
	const data = await res.json()
	// 从 API 返回的 articles 数组转换为 BlogIndexItem 格式
	const articles = data.articles || []
	return articles.map((a: any) => ({
		slug: a.slug,
		title: a.title,
		tags: a.tags || [],
		date: a.publishedAt || a.createdAt,
		summary: a.summary,
		cover: a.coverKey ? `/api/images/${a.coverKey}` : undefined
	}))
}

export function useBlogIndex() {
	const { data, error, isLoading } = useSWR<BlogIndexItem[]>('/api/articles?status=published', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	return {
		items: data || [],
		loading: isLoading,
		error
	}
}

export function useLatestBlog() {
	const { items, loading, error } = useBlogIndex()

	const latestBlog = items.length > 0 ? items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null

	return {
		blog: latestBlog,
		loading,
		error
	}
}
