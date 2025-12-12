'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import initialList from './list.json'
import { GridLayout } from './components/grid-layout'
import UploadDialog from './components/upload-dialog'
import { pushPictures } from './services/push-pictures'
import { useAuthStore } from '@/hooks/use-auth'
import { useFullscreenStore } from '@/hooks/use-fullscreen'
import { useIsAdmin } from '@/hooks/use-user'
import type { ImageItem } from '../projects/components/image-upload-dialog'
import { useRouter } from 'next/navigation'

export interface Picture {
	id: string
	uploadedAt: string
	description?: string
	image?: string
	images?: string[]
}

export default function Page() {
	const [pictures, setPictures] = useState<Picture[]>(initialList as Picture[])
	const [originalPictures, setOriginalPictures] = useState<Picture[]>(initialList as Picture[])
	const [isEditMode, setIsEditMode] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
	const [imageItems, setImageItems] = useState<Map<string, ImageItem>>(new Map())
	const [mounted, setMounted] = useState(false)
	const [expanded, setExpanded] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const keyInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	const { isAuth, setPrivateKey } = useAuthStore()
	const { isFullscreen } = useFullscreenStore()
	const { isAdmin, loading: adminLoading } = useIsAdmin()

	useEffect(() => {
		setMounted(true)
	}, [])

	// 点击外部区域自动收起
	useEffect(() => {
		if (!expanded) return

		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setExpanded(false)
				// 收起时退出编辑模式
				setPictures(originalPictures)
				setImageItems(new Map())
				setIsEditMode(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [expanded, originalPictures])

	// 3秒无操作自动收起
	useEffect(() => {
		if (!expanded) return

		const timer = setTimeout(() => {
			setExpanded(false)
			// 收起时退出编辑模式
			setPictures(originalPictures)
			setImageItems(new Map())
			setIsEditMode(false)
		}, 3000)

		return () => clearTimeout(timer)
	}, [expanded, originalPictures])

	const handleUploadSubmit = ({ images, description }: { images: ImageItem[]; description: string }) => {
		const now = new Date().toISOString()

		if (images.length === 0) {
			toast.error('请至少选择一张图片')
			return
		}

		const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
		const desc = description.trim() || undefined

		const imageUrls = images.map(imageItem => (imageItem.type === 'url' ? imageItem.url : imageItem.previewUrl))

		const newPicture: Picture = {
			id,
			uploadedAt: now,
			description: desc,
			images: imageUrls
		}

		const newMap = new Map(imageItems)

		images.forEach((imageItem, index) => {
			if (imageItem.type === 'file') {
				newMap.set(`${id}::${index}`, imageItem)
			}
		})

		setPictures(prev => [...prev, newPicture])
		setImageItems(newMap)
		setIsUploadDialogOpen(false)
	}

	const handleDeleteSingleImage = (pictureId: string, imageIndex: number | 'single') => {
		setPictures(prev => {
			return prev
				.map(picture => {
					if (picture.id !== pictureId) return picture

					// 如果是 single image，删除整个 Picture
					if (imageIndex === 'single') {
						return null
					}

					// 如果是 images 数组中的图片
					if (picture.images && picture.images.length > 0) {
						const newImages = picture.images.filter((_, idx) => idx !== imageIndex)
						// 如果删除后数组为空，删除整个 Picture
						if (newImages.length === 0) {
							return null
						}
						return {
							...picture,
							images: newImages
						}
					}

					return picture
				})
				.filter((p): p is Picture => p !== null)
		})

		// 更新 imageItems Map
		setImageItems(prev => {
			const next = new Map(prev)
			if (imageIndex === 'single') {
				// 删除所有相关的文件项
				for (const key of next.keys()) {
					if (key.startsWith(`${pictureId}::`)) {
						next.delete(key)
					}
				}
			} else {
				// 删除特定索引的文件项
				next.delete(`${pictureId}::${imageIndex}`)
				
				// 重新索引：删除索引 imageIndex 后，后面的索引需要前移
				// 例如：删除索引 1，原来的索引 2 变成 1，索引 3 变成 2
				const keysToUpdate: Array<{ oldKey: string; newKey: string }> = []
				for (const key of next.keys()) {
					if (key.startsWith(`${pictureId}::`)) {
						const [, indexStr] = key.split('::')
						const oldIndex = Number(indexStr)
						if (!isNaN(oldIndex) && oldIndex > imageIndex) {
							const newIndex = oldIndex - 1
							keysToUpdate.push({
								oldKey: key,
								newKey: `${pictureId}::${newIndex}`
							})
						}
					}
				}
				
				// 执行重新索引
				for (const { oldKey, newKey } of keysToUpdate) {
					const value = next.get(oldKey)
					if (value) {
						next.set(newKey, value)
						next.delete(oldKey)
					}
				}
			}
			return next
		})
	}

	const handleDeleteGroup = (picture: Picture) => {
		if (!confirm('确定要删除这一组图片吗？')) return

		setPictures(prev => prev.filter(p => p.id !== picture.id))
		setImageItems(prev => {
			const next = new Map(prev)
			for (const key of next.keys()) {
				if (key.startsWith(`${picture.id}::`)) {
					next.delete(key)
				}
			}
			return next
		})
	}

	const handleChoosePrivateKey = async (file: File) => {
		try {
			const text = await file.text()
			setPrivateKey(text)
			await handleSave()
		} catch (error) {
			console.error('Failed to read private key:', error)
			toast.error('读取密钥文件失败')
		}
	}

	const handleSaveClick = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			handleSave()
		}
	}

	const handleSave = async () => {
		setIsSaving(true)

		try {
			await pushPictures({
				pictures,
				imageItems
			})

			setOriginalPictures(pictures)
			setImageItems(new Map())
			setIsEditMode(false)
			toast.success('保存成功！')
		} catch (error: any) {
			console.error('Failed to save:', error)
			toast.error(`保存失败: ${error?.message || '未知错误'}`)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setPictures(originalPictures)
		setImageItems(new Map())
		setIsEditMode(false)
	}

	const buttonText = isAuth ? '保存' : '导入密钥'

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await handleChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			{pictures.length === 0 ? (
				<div className='text-secondary flex min-h-screen items-center justify-center px-6 text-center text-sm'>
					<div>
						<div className='mb-2'>还没有上传图片</div>
						<div className='text-xs opacity-70'>
							点击<span className='hidden sm:inline'>右上角</span>
							<span className='sm:hidden'>右下角</span>「编辑」后即可开始上传
						</div>
					</div>
				</div>
			) : (
				<GridLayout pictures={pictures} isEditMode={isEditMode} onDeleteSingle={handleDeleteSingleImage} onDeleteGroup={handleDeleteGroup} />
			)}

			{/* 桌面端按钮 - 仅管理员可见 */}
			{isAdmin && (
				<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='absolute top-4 right-6 hidden gap-3 sm:flex'>
					{isEditMode ? (
					<>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => router.push('/image-toolbox')}
							className='rounded-xl border bg-blue-50 px-4 py-2 text-sm text-blue-700'>
							压缩工具
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={handleCancel}
							disabled={isSaving}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							取消
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsUploadDialogOpen(true)}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm'>
							上传
						</motion.button>
						<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSaveClick} disabled={isSaving} className='brand-btn px-6'>
							{isSaving ? '保存中...' : buttonText}
						</motion.button>
					</>
				) : (
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							onClick={() => setIsEditMode(true)}
							className='rounded-xl border bg-white/60 px-6 py-2 text-sm backdrop-blur-sm transition-colors hover:bg-white/80'>
							编辑
						</motion.button>
					)}
				</motion.div>
			)}

			{/* 移动端悬浮按钮 - 仅管理员可见 */}
			{mounted && !isFullscreen && isAdmin && (
				<motion.div
					ref={containerRef}
					initial={{ opacity: 0, x: 100 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: 100 }}
					transition={{ duration: 0.3 }}
					className='fixed bottom-24 right-0 z-50 flex items-center gap-3 sm:hidden'>
					{/* 展开时显示的按钮 */}
					{expanded && (
						<>
							{/* 压缩工具 */}
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut' }}
								onClick={() => {
									router.push('/image-toolbox')
									setExpanded(false)
								}}
								whileTap={{ scale: 0.9 }}
								className='rounded-full border border-white/20 bg-blue-50 p-3 shadow-lg backdrop-blur-sm'>
								<svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-blue-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' />
								</svg>
							</motion.button>
							{/* 取消 */}
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
								onClick={() => {
									handleCancel()
									setExpanded(false)
								}}
								disabled={isSaving}
								whileTap={{ scale: 0.9 }}
								className='rounded-full border border-white/20 bg-white/80 p-3 shadow-lg backdrop-blur-sm'>
								<svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
								</svg>
							</motion.button>
							{/* 上传 */}
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
								onClick={() => {
									setIsUploadDialogOpen(true)
									setExpanded(false)
								}}
								whileTap={{ scale: 0.9 }}
								className='rounded-full border border-white/20 bg-white/80 p-3 shadow-lg backdrop-blur-sm'>
								<svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-gray-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
									<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
								</svg>
							</motion.button>
							{/* 保存 */}
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
								onClick={() => {
									handleSaveClick()
									setExpanded(false)
								}}
								disabled={isSaving}
								whileTap={{ scale: 0.9 }}
								className='brand-btn rounded-full p-3 shadow-lg'>
								{isSaving ? (
									<svg className='h-6 w-6 animate-spin text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
										<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
										<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
									</svg>
								) : (
									<svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
										<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
									</svg>
								)}
							</motion.button>
						</>
					)}

					{/* 切换按钮 */}
					<motion.button
						onClick={() => {
							if (!expanded) {
								setIsEditMode(true)
							} else {
								// 收起时退出编辑模式并还原
								handleCancel()
							}
							setExpanded(!expanded)
						}}
						whileTap={{ scale: 0.9 }}
						className='rounded-l-full border border-white/20 bg-white/80 py-2.5 pl-2.5 pr-3 shadow-lg backdrop-blur-sm'
						transition={{ duration: 0.3 }}>
						<motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
							<svg className='h-5 w-5 text-gray-700' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
							</svg>
						</motion.div>
					</motion.button>
				</motion.div>
			)}

			{isUploadDialogOpen && <UploadDialog onClose={() => setIsUploadDialogOpen(false)} onSubmit={handleUploadSubmit} />}
		</>
	)
}
