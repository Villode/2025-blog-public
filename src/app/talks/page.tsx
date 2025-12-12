'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { useIsAdmin } from '@/hooks/use-user'

interface Talk {
	id: string
	content: string
	createdAt: string
	images?: string[]
}

// 示例数据，后续可以改为从 D1 数据库获取
const initialTalks: Talk[] = [
	{
		id: '1',
		content: '今天天气真好，适合出去走走 ☀️',
		createdAt: '2024-12-10T10:30:00Z'
	},
	{
		id: '2',
		content: '新学了一个 CSS 技巧，记录一下，这个技巧可以让页面更加美观',
		createdAt: '2024-12-09T15:20:00Z'
	},
	{
		id: '3',
		content: '周末去爬山了，风景很美 🏔️',
		createdAt: '2024-12-08T09:00:00Z'
	},
	{
		id: '4',
		content: '读完了一本好书，推荐给大家',
		createdAt: '2024-12-07T20:30:00Z'
	}
]

const formatDate = (dateStr: string): string => {
	const date = new Date(dateStr)
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const minutes = Math.floor(diff / 60000)
	const hours = Math.floor(diff / 3600000)
	const days = Math.floor(diff / 86400000)

	if (minutes < 1) return '刚刚'
	if (minutes < 60) return `${minutes}分钟前`
	if (hours < 24) return `${hours}小时前`
	if (days < 7) return `${days}天前`

	return `${date.getMonth() + 1}月${date.getDate()}日`
}

export default function TalksPage() {
	const [talks, setTalks] = useState<Talk[]>(initialTalks)
	const [showCompose, setShowCompose] = useState(false)
	const [newContent, setNewContent] = useState('')
	const { isAdmin } = useIsAdmin()

	const handlePublish = () => {
		if (!newContent.trim()) return
		
		const newTalk: Talk = {
			id: `${Date.now()}`,
			content: newContent.trim(),
			createdAt: new Date().toISOString()
		}
		
		setTalks(prev => [newTalk, ...prev])
		setNewContent('')
		setShowCompose(false)
		// TODO: 保存到 D1 数据库
	}

	if (talks.length === 0 && !isAdmin) {
		return (
			<div className='text-secondary flex min-h-screen items-center justify-center px-6 text-center text-sm'>
				还没有说说
			</div>
		)
	}

	return (
		<div className='mx-auto max-w-md px-4 pb-32 pt-24 sm:pt-24'>
			{/* 管理员发布按钮 */}
			{isAdmin && !showCompose && (
				<motion.button
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					onClick={() => setShowCompose(true)}
					className='mb-4 w-full rounded-2xl border border-dashed border-gray-300 bg-white/40 p-4 text-center text-sm text-gray-500 backdrop-blur-sm transition-colors hover:border-gray-400 hover:bg-white/60'>
					写点什么...
				</motion.button>
			)}

			{/* 发布框 */}
			{showCompose && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className='mb-4 rounded-2xl border bg-white/80 p-4 backdrop-blur-sm'>
					<textarea
						value={newContent}
						onChange={e => setNewContent(e.target.value)}
						placeholder='写点什么...'
						className='w-full resize-none bg-transparent text-sm outline-none'
						rows={3}
						autoFocus
					/>
					<div className='mt-3 flex justify-end gap-2'>
						<button
							onClick={() => {
								setShowCompose(false)
								setNewContent('')
							}}
							className='rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100'>
							取消
						</button>
						<button
							onClick={handlePublish}
							disabled={!newContent.trim()}
							className='brand-btn rounded-lg px-4 py-1.5 text-xs disabled:opacity-50'>
							发布
						</button>
					</div>
				</motion.div>
			)}

			{/* 瀑布流布局 - 两列 */}
			<div className='columns-2 gap-3'>
				{talks.map((talk, index) => (
					<motion.div
						key={talk.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05, duration: 0.3 }}
						className='mb-3 break-inside-avoid'>
						<div className='rounded-2xl border bg-white/60 p-3 backdrop-blur-sm'>
							<p className='text-primary text-sm leading-relaxed'>{talk.content}</p>
							{talk.images && talk.images.length > 0 && (
								<div className='mt-2 grid grid-cols-2 gap-1.5'>
									{talk.images.map((img, i) => (
										<img key={i} src={img} alt='' className='aspect-square rounded-lg object-cover' />
									))}
								</div>
							)}
							<p className='text-secondary mt-2 text-xs'>{formatDate(talk.createdAt)}</p>
						</div>
					</motion.div>
				))}
			</div>

			{/* 底部提示 */}
			<motion.div
				initial={{ opacity: 0 }}
				whileInView={{ opacity: 1 }}
				viewport={{ once: false, amount: 0.8 }}
				transition={{ duration: 0.5 }}
				className='mt-8 text-center'>
				<span className='text-secondary text-xs'>— 到底了 —</span>
			</motion.div>
		</div>
	)
}
