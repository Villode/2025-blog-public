'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'motion/react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { Picture } from '../page'
import { useFullscreenStore } from '@/hooks/use-fullscreen'

interface GridLayoutProps {
	pictures: Picture[]
	isEditMode?: boolean
	onDeleteSingle?: (pictureId: string, imageIndex: number | 'single') => void
	onDeleteGroup?: (picture: Picture) => void
}

type ImageItemType = {
	url: string
	pictureId: string
	imageIndex: number | 'single'
	description?: string
	uploadedAt?: string
	groupIndex: number
}

const buildImageList = (pictures: Picture[]): ImageItemType[] => {
	const result: ImageItemType[] = []

	for (const [index, picture] of pictures.entries()) {
		if (picture.image) {
			result.push({
				url: picture.image,
				pictureId: picture.id,
				imageIndex: 'single',
				description: picture.description,
				uploadedAt: picture.uploadedAt,
				groupIndex: index
			})
		}

		if (picture.images && picture.images.length > 0) {
			result.push(
				...picture.images.map((url, imageIndex) => ({
					url,
					pictureId: picture.id,
					imageIndex: imageIndex,
					description: picture.description,
					uploadedAt: picture.uploadedAt,
					groupIndex: index
				}))
			)
		}
	}

	return result
}

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return ''
	const date = new Date(dateStr)
	if (Number.isNaN(date.getTime())) return ''

	const today = new Date()
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
	const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
	const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`

	if (dateKey === todayKey) return '今天'
	if (dateKey === yesterdayKey) return '昨天'
	if (date.getFullYear() === today.getFullYear()) {
		return `${date.getMonth() + 1}月${date.getDate()}日`
	}
	return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}


// 瀑布流卡片组件
interface WaterfallCardProps {
	item: ImageItemType
	isEditMode: boolean
	onDeleteSingle?: (pictureId: string, imageIndex: number | 'single') => void
	index: number
}

const WaterfallCard = ({ item, isEditMode, onDeleteSingle, index }: WaterfallCardProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			whileTap={{ scale: 0.96 }}
			transition={{ delay: index * 0.05, duration: 0.3 }}
			className='mb-4 break-inside-avoid'>
			<PhotoView src={item.url}>
				<motion.div
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
					transition={{ type: 'spring', stiffness: 400, damping: 25 }}
					className='group relative cursor-pointer overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md'>
					{/* 图片 */}
					<img
						src={item.url}
						alt=''
						className='w-full object-cover transition-transform duration-300 group-hover:scale-105'
						style={{ minHeight: '120px' }}
					/>

					{/* 底部渐变遮罩 + 介绍和日期 */}
					{(item.description || item.uploadedAt) && (
						<div className='absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-8 pb-3'>
							{item.description && <p className='mb-1 line-clamp-2 text-sm text-white'>{item.description}</p>}
							<p className='text-xs text-white/70'>{formatDate(item.uploadedAt)}</p>
						</div>
					)}

					{/* 编辑模式删除按钮 */}
					{isEditMode && (
						<button
							onClick={e => {
								e.stopPropagation()
								onDeleteSingle?.(item.pictureId, item.imageIndex)
							}}
							className='absolute top-2 right-2 rounded-full bg-red-500 p-1.5 shadow-lg transition-transform hover:scale-110'>
							<svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
							</svg>
						</button>
					)}
				</motion.div>
			</PhotoView>
		</motion.div>
	)
}

export const GridLayout = ({ pictures, isEditMode = false, onDeleteSingle }: GridLayoutProps) => {
	const { setFullscreen } = useFullscreenStore()

	// 组件卸载时清理
	useEffect(() => {
		return () => {
			setFullscreen(false)
			document.body.style.overflow = ''
		}
	}, [setFullscreen])

	const imageList = useMemo(() => {
		const list = buildImageList(pictures)
		// 按时间倒序排列
		return list.sort((a, b) => {
			const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
			const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
			return dateB - dateA
		})
	}, [pictures])

	if (imageList.length === 0) {
		return <div className='text-secondary py-20 text-center text-sm'>暂无图片</div>
	}

	return (
		<PhotoProvider
			maskOpacity={0.9}
			onVisibleChange={visible => {
				setFullscreen(visible)
				document.body.style.overflow = visible ? 'hidden' : ''
			}}
			overlayRender={({ index, scale }) => {
				const item = imageList[index]
				// 放大时隐藏介绍
				if (scale !== 1) return null
				if (!item?.description && !item?.uploadedAt) return null
				return (
					<div className='pointer-events-none fixed right-0 bottom-0 left-0 z-[1001] bg-gradient-to-t from-black/80 to-transparent px-4 pt-10 pb-8'>
						<div className='mx-auto max-w-md text-center'>
							{item?.description && (
								<p className='mb-2 text-sm leading-relaxed text-white'>{item.description}</p>
							)}
							<p className='text-xs text-white/50'>{formatDate(item?.uploadedAt)}</p>
						</div>
					</div>
				)
			}}>
			<div className='mx-auto max-w-4xl px-4 pb-32 pt-24 sm:pb-8 sm:pt-24'>
				{/* 瀑布流布局 - 移动端2列，PC端4列 */}
				<div className='columns-2 gap-4 sm:columns-4'>
					{imageList.map((item, index) => (
						<WaterfallCard
							key={`${item.pictureId}-${item.imageIndex}`}
							item={item}
							isEditMode={isEditMode}
							onDeleteSingle={onDeleteSingle}
							index={index}
						/>
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
		</PhotoProvider>
	)
}
