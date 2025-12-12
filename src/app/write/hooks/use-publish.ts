import { useCallback } from 'react'
import { toast } from 'sonner'
import { useWriteStore } from '../stores/write-store'
import { useAdmin } from '@/hooks/use-admin'

export function usePublish() {
	const { loading, setLoading, form, cover, images, mode, originalSlug } = useWriteStore()
	const { isAdmin } = useAdmin()

	const onPublish = useCallback(async () => {
		if (!isAdmin) {
			toast.error('请先登录')
			return
		}

		if (!form.slug || !form.title || !form.md) {
			toast.error('请填写标题、slug 和内容')
			return
		}

		try {
			setLoading(true)

			const url = mode === 'edit' ? `/api/articles/${originalSlug || form.slug}` : '/api/articles'
			const method = mode === 'edit' ? 'PUT' : 'POST'

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					slug: form.slug,
					title: form.title,
					content: form.md,
					summary: form.summary,
					tags: form.tags,
					status: 'published',
				}),
			})

			const data = await res.json()
			if (!res.ok) {
				throw new Error(data.error || '操作失败')
			}

			toast.success(mode === 'edit' ? '更新成功' : '发布成功')
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '操作失败')
		} finally {
			setLoading(false)
		}
	}, [form, mode, originalSlug, setLoading, isAdmin])

	const onDelete = useCallback(async () => {
		if (!isAdmin) {
			toast.error('请先登录')
			return
		}

		const targetSlug = originalSlug || form.slug
		if (!targetSlug) {
			toast.error('缺少 slug，无法删除')
			return
		}

		try {
			setLoading(true)

			const res = await fetch(`/api/articles/${targetSlug}`, { method: 'DELETE' })
			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || '删除失败')
			}

			toast.success('删除成功')
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '删除失败')
		} finally {
			setLoading(false)
		}
	}, [form.slug, originalSlug, setLoading, isAdmin])

	return {
		isAdmin,
		loading,
		onPublish,
		onDelete
	}
}
