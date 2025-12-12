'use client'

import Card from '@/components/card'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useCenterStore } from '@/hooks/use-center'
import { CARD_SPACING } from '@/consts'
import ScrollOutlineSVG from '@/svgs/scroll-outline.svg'
import ScrollFilledSVG from '@/svgs/scroll-filled.svg'
import TalksOutlineSVG from '@/svgs/talks-outline.svg'
import TalksFilledSVG from '@/svgs/talks-filled.svg'
import HomeFilledSVG from '@/svgs/home-filled.svg'
import HomeOutlineSVG from '@/svgs/home-outline.svg'
import AboutFilledSVG from '@/svgs/about-filled.svg'
import AboutOutlineSVG from '@/svgs/about-outline.svg'
import PicturesFilledSVG from '@/svgs/pictures-filled.svg'
import PicturesOutlineSVG from '@/svgs/pictures-outline.svg'
import WebsiteFilledSVG from '@/svgs/website-filled.svg'
import WebsiteOutlineSVG from '@/svgs/website-outline.svg'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { cn } from '@/lib/utils'
import { useSize } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { HomeDraggableLayer } from '@/app/(home)/home-draggable-layer'
import { useFullscreenStore } from '@/hooks/use-fullscreen'
import { useAdmin } from '@/hooks/use-admin'
import { toast } from 'sonner'
import { X } from 'lucide-react'

// PC端导航列表
const pcList = [
	{
		icon: HomeOutlineSVG,
		iconActive: HomeFilledSVG,
		label: '主页',
		href: '/'
	},
	{
		icon: ScrollOutlineSVG,
		iconActive: ScrollFilledSVG,
		label: '近期文章',
		href: '/blog'
	},
	{
		icon: AboutOutlineSVG,
		iconActive: AboutFilledSVG,
		label: '关于网站',
		href: '/about'
	},
	{
		icon: PicturesOutlineSVG,
		iconActive: PicturesFilledSVG,
		label: '相册',
		href: '/pictures'
	},
	{
		icon: WebsiteOutlineSVG,
		iconActive: WebsiteFilledSVG,
		label: '优秀博客',
		href: '/bloggers'
	}
]

// 移动端导航列表
const mobileList = [
	{
		icon: HomeOutlineSVG,
		iconActive: HomeFilledSVG,
		label: '主页',
		href: '/'
	},
	{
		icon: TalksOutlineSVG,
		iconActive: TalksFilledSVG,
		label: '说说',
		href: '/talks'
	},
	{
		icon: AboutOutlineSVG,
		iconActive: AboutFilledSVG,
		label: '关于网站',
		href: '/about'
	},
	{
		icon: PicturesOutlineSVG,
		iconActive: PicturesFilledSVG,
		label: '相册',
		href: '/pictures'
	},
	{
		icon: WebsiteOutlineSVG,
		iconActive: WebsiteFilledSVG,
		label: '优秀博客',
		href: '/bloggers'
	}
]

const extraSize = 8

export default function NavCard() {
	const pathname = usePathname()
	const center = useCenterStore()
	const [show, setShow] = useState(false)
	const { maxSM } = useSize()
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
	const { siteContent, cardStyles } = useConfigStore()
	const { isFullscreen } = useFullscreenStore()
	const { isAdmin, loginWithGitHub, logout } = useAdmin()
	const styles = cardStyles.navCard
	const hiCardStyles = cardStyles.hiCard

	// 三次点击头像弹出认证
	const [clickCount, setClickCount] = useState(0)
	const [showAuthDialog, setShowAuthDialog] = useState(false)
	const clickTimerRef = useRef<NodeJS.Timeout | null>(null)

	const handleAvatarClick = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		
		setClickCount(prev => {
			const newCount = prev + 1
			if (newCount >= 3) {
				setShowAuthDialog(true)
				return 0
			}
			return newCount
		})

		// 重置计时器
		if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
		clickTimerRef.current = setTimeout(() => setClickCount(0), 1000)
	}

	const handleLogout = async () => {
		await logout()
		setShowAuthDialog(false)
		toast.success('已退出登录')
	}

	// 根据设备选择导航列表
	const list = maxSM ? mobileList : pcList

	const activeIndex = useMemo(() => {
		const currentList = maxSM ? mobileList : pcList
		const index = currentList.findIndex(item => pathname === item.href)
		return index >= 0 ? index : undefined
	}, [pathname, maxSM])

	useEffect(() => {
		setShow(true)
	}, [])

	let form = useMemo(() => {
		if (pathname == '/') return 'full'
		else if (pathname == '/write') return 'mini'
		else return 'icons'
	}, [pathname])
	if (maxSM) form = 'icons'

	const itemHeight = form === 'full' ? 52 : 28

	let position = useMemo(() => {
		if (form === 'full') {
			const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - hiCardStyles.width / 2 - styles.width - CARD_SPACING
			const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 - styles.height
			return { x, y }
		}

		return {
			x: 24,
			y: 16
		}
	}, [form, center, styles, hiCardStyles])

	const size = useMemo(() => {
		if (form === 'mini') return { width: 64, height: 64 }
		else if (form === 'icons') return { width: 340, height: 64 }
		else return { width: styles.width, height: styles.height }
	}, [form, styles])

	// 根据当前路由设置高亮
	useEffect(() => {
		if (activeIndex !== undefined) {
			setHoveredIndex(activeIndex)
		} else {
			setHoveredIndex(null)
		}
	}, [activeIndex])

	if (maxSM) position = { x: center.x - size.width / 2, y: 16 }

	if (show && !isFullscreen)
		return (
			<>
			{/* 认证弹窗 */}
			<AnimatePresence>
				{showAuthDialog && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm'
						onClick={() => setShowAuthDialog(false)}>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							onClick={e => e.stopPropagation()}
							className='relative w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-xl'>
							<button onClick={() => setShowAuthDialog(false)} className='absolute top-4 right-4 text-gray-400 hover:text-gray-600'>
								<X size={20} />
							</button>
							
							<h3 className='mb-4 text-lg font-semibold'>{isAdmin ? '已登录' : '管理员登录'}</h3>
							
							{isAdmin ? (
								<div className='space-y-4'>
									<p className='text-sm text-gray-600'>你已通过 GitHub 登录，可以编辑网站内容。</p>
									<button onClick={handleLogout} className='w-full rounded-xl bg-red-50 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100'>
										退出登录
									</button>
								</div>
							) : (
								<div className='space-y-4'>
									<p className='text-sm text-gray-500'>使用 GitHub 账号登录</p>
									<button 
										onClick={loginWithGitHub} 
										className='flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-medium text-white hover:bg-gray-800'>
										<svg className='h-5 w-5' fill='currentColor' viewBox='0 0 24 24'>
											<path d='M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z'/>
										</svg>
										使用 GitHub 登录
									</button>
								</div>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			<HomeDraggableLayer cardKey='navCard' x={position.x} y={position.y} width={styles.width} height={styles.height}>
				<Card
					order={styles.order}
					width={size.width}
					height={size.height}
					x={position.x}
					y={position.y}
					className={clsx(
						'overflow-hidden',
						form === 'mini' && 'p-3',
						form === 'icons' && 'flex items-center gap-6 p-3 !fixed z-50',
						maxSM && '!fixed z-50 !bg-white/60 !backdrop-blur-xl !border-white/40 !shadow-[0_4px_16px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.5)]'
					)}>
					<div className='flex items-center gap-3'>
						<button onClick={handleAvatarClick} className={cn('relative', pathname === '/' && 'after:absolute after:inset-[-4px] after:rounded-full after:bg-gradient-to-br after:from-amber-200/60 after:to-orange-300/40 after:blur-md after:-z-10', isAdmin && 'ring-2 ring-green-400 ring-offset-2 rounded-full')}>
							<Image src='/images/avatar.png' alt='avatar' width={40} height={40} style={{ boxShadow: ' 0 12px 20px -5px #E2D9CE' }} className='rounded-full' />
						</button>
						{form === 'full' && <Link href='/'><span className='font-averia mt-1 text-2xl leading-none font-medium'>{siteContent.meta.title}</span></Link>}
						{form === 'full' && <span className='text-brand mt-2 text-xs font-medium'>(开发中)</span>}
					</div>

					{(form === 'full' || form === 'icons') && (
						<>
							{form !== 'icons' && <div className='text-secondary mt-6 text-sm uppercase'>General</div>}

							<div className={cn('relative mt-2 space-y-2', form === 'icons' && 'mt-0 flex items-center gap-6 space-y-0')}>
								{hoveredIndex !== null && (
									<motion.div
										className={cn(
											'absolute max-w-[230px] rounded-full border',
											maxSM && 'bg-white/50 backdrop-blur-md border-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
										)}
										layoutId='nav-hover'
										initial={false}
										animate={
											form === 'icons'
												? {
														left: hoveredIndex * (itemHeight + 24) - extraSize,
														top: -extraSize,
														width: itemHeight + extraSize * 2,
														height: itemHeight + extraSize * 2
													}
												: { top: hoveredIndex * (itemHeight + 8), left: 0, width: '100%', height: itemHeight }
										}
										transition={{
											type: 'spring',
											stiffness: 400,
											damping: 30
										}}
										style={!maxSM ? { backgroundImage: 'linear-gradient(to right bottom, var(--color-border) 60%, var(--color-card) 100%)' } : undefined}
									/>
								)}

								{list.map((item, index) => (
									<Link
										key={item.href}
										href={item.href}
										className={cn('text-secondary text-md relative z-10 flex items-center gap-3 rounded-full px-5 py-3', form === 'icons' && 'p-0')}
										>
										<div className='flex h-7 w-7 items-center justify-center'>
											{hoveredIndex == index ? <item.iconActive className='text-brand absolute h-7 w-7' /> : <item.icon className='absolute h-7 w-7 text-gray-600' />}
										</div>
										{form !== 'icons' && <span className={clsx(index == hoveredIndex && 'text-primary font-medium')}>{item.label}</span>}
									</Link>
								))}
							</div>
						</>
					)}
				</Card>
			</HomeDraggableLayer>
			</>
		)
}
