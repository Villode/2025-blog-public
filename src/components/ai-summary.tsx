'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

type AiSummaryProps = {
	markdown: string
	title: string
	slug?: string
	delay?: number
}

// 本地缓存key
const getCacheKey = (slug: string) => `ai-summary-${slug}`

export function AiSummary({ markdown, title, slug, delay = 0 }: AiSummaryProps) {
	const [summary, setSummary] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string>('')
	const [expanded, setExpanded] = useState(false)

	// 从缓存加载
	useEffect(() => {
		if (!slug) return
		const cached = localStorage.getItem(getCacheKey(slug))
		if (cached) {
			setSummary(cached)
			setExpanded(true)
		}
	}, [slug])

	const generateSummary = async () => {
		if (loading) return
		setLoading(true)
		setError('')

		try {
			const response = await fetch('/api/ai-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: markdown, title })
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || '请求失败')
			}

			setSummary(data.summary)
			setExpanded(true)
			// 缓存到本地
			if (slug) {
				localStorage.setItem(getCacheKey(slug), data.summary)
			}
		} catch (err: any) {
			setError(err.message || '生成失败')
		} finally {
			setLoading(false)
		}
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay }}
			className='bg-card w-full rounded-xl border p-3 text-sm'>
			<div className='mb-2 flex items-center justify-between'>
				<h2 className='text-secondary flex items-center gap-1.5 font-medium'>
					<svg className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
						<path d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z' />
						<circle cx='7.5' cy='14.5' r='1.5' fill='currentColor' />
						<circle cx='16.5' cy='14.5' r='1.5' fill='currentColor' />
					</svg>
					AI 总结
				</h2>
				{!summary && !loading && (
					<button onClick={generateSummary} className='text-brand text-xs hover:underline'>
						生成
					</button>
				)}
			</div>

			<AnimatePresence mode='wait'>
				{loading && (
					<motion.div
						key='loading'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='text-secondary flex items-center gap-2 py-2'>
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
							className='h-4 w-4 rounded-full border-2 border-current border-t-transparent'
						/>
						<span>正在思考...</span>
					</motion.div>
				)}

				{error && (
					<motion.div key='error' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='py-2 text-red-500'>
						{error}
						<button onClick={generateSummary} className='ml-2 text-xs underline'>
							重试
						</button>
					</motion.div>
				)}

				{!loading && !error && summary && (
					<motion.div
						key='summary'
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='text-secondary cursor-text whitespace-pre-line leading-relaxed'>
						{summary}
					</motion.div>
				)}

				{!loading && !error && !summary && (
					<motion.div key='empty' initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='text-secondary/50 py-1'>
						点击「生成」让 AI 总结文章
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}
