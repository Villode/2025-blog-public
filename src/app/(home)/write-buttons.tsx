import { ANIMATION_DELAY, CARD_SPACING } from '@/consts'
import PenSVG from '@/svgs/pen.svg'
import { motion } from 'motion/react'
import { useEffect, useState, useRef } from 'react'
import { useConfigStore } from './stores/config-store'
import { useCenterStore } from '@/hooks/use-center'
import { useRouter } from 'next/navigation'
import { useSize } from '@/hooks/use-size'
import DotsSVG from '@/svgs/dots.svg'
import ConfigDialog from './config-dialog/index'
import { HomeDraggableLayer } from './home-draggable-layer'

export default function WriteButton() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const { maxSM } = useSize()
	const router = useRouter()
	const [isConfigOpen, setIsConfigOpen] = useState(false)
	const [expanded, setExpanded] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const styles = cardStyles.writeButtons
	const hiCardStyles = cardStyles.hiCard
	const clockCardStyles = cardStyles.clockCard

	const [show, setShow] = useState(false)
	useEffect(() => {
		setTimeout(() => setShow(true), styles.order * ANIMATION_DELAY * 1000)
	}, [styles.order])

	// 监听滚动，在顶部时隐藏按钮
	useEffect(() => {
		if (!maxSM) return
		
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 100)
		}
		handleScroll()
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, [maxSM])

	// 点击外部区域自动收起
	useEffect(() => {
		if (!expanded || !maxSM) return

		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setExpanded(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [expanded, maxSM])

	// 3秒无操作自动收起
	useEffect(() => {
		if (!expanded || !maxSM) return

		const timer = setTimeout(() => {
			setExpanded(false)
		}, 3000)

		return () => clearTimeout(timer)
	}, [expanded, maxSM])

	if (!show) return null

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + CARD_SPACING + hiCardStyles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - clockCardStyles.offset - styles.height - CARD_SPACING / 2 - clockCardStyles.height

	// 移动端显示为悬浮按钮
	if (maxSM) {
		// 在顶部时不显示
		if (!isScrolled) return null
		
		return (
			<>
				<motion.div 
					ref={containerRef}
					initial={{ opacity: 0, x: 100 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: 100 }}
					transition={{ duration: 0.3 }}
					className='fixed bottom-24 right-0 z-50 flex items-center gap-3'>
					{/* 展开时显示的按钮 - 从右侧滑入 */}
					{expanded && (
						<>
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut' }}
								onClick={() => {
									setIsConfigOpen(true)
									setExpanded(false)
								}}
								whileTap={{ scale: 0.9 }}
								className='bg-brand/20 rounded-full border border-white/20 p-3 shadow-lg backdrop-blur-sm'>
								<DotsSVG className='text-brand h-6 w-6' />
							</motion.button>
							<motion.button
								initial={{ opacity: 0, scale: 0.8, x: 100 }}
								animate={{ opacity: 1, scale: 1, x: 0 }}
								exit={{ opacity: 0, scale: 0.8, x: 100 }}
								transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
								onClick={() => {
									router.push('/write')
									setExpanded(false)
								}}
								whileTap={{ scale: 0.9 }}
								className='bg-brand/20 rounded-full border border-white/20 p-3 shadow-lg backdrop-blur-sm'>
								<PenSVG className='text-brand h-6 w-6' />
							</motion.button>
						</>
					)}
					
					{/* 切换按钮 */}
					<motion.button
						onClick={() => setExpanded(!expanded)}
						whileTap={{ scale: 0.9 }}
						className='bg-brand/20 rounded-l-full border border-white/20 py-2.5 pl-2.5 pr-3 shadow-lg backdrop-blur-sm'
						transition={{ duration: 0.3 }}>
						<motion.div
							animate={{ rotate: expanded ? 180 : 0 }}
							transition={{ duration: 0.3 }}>
							<svg className='text-brand h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
							</svg>
						</motion.div>
					</motion.button>
				</motion.div>
				<ConfigDialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
			</>
		)
	}

	// 桌面端保持原样
	return (
		<HomeDraggableLayer cardKey='writeButtons' x={x} y={y} width={styles.width} height={styles.height}>
			<motion.div initial={{ left: x, top: y }} animate={{ left: x, top: y }} className='absolute flex items-center gap-4'>
				<motion.button
					onClick={() => router.push('/write')}
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					style={{ boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.4)' }}
					className='brand-btn whitespace-nowrap'>
					<PenSVG />
					<span>写文章</span>
				</motion.button>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => setIsConfigOpen(true)}
					className='p-2 transition-opacity hover:opacity-70'>
					<DotsSVG className='text-brand h-6 w-6' />
				</motion.button>
				<ConfigDialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
			</motion.div>
		</HomeDraggableLayer>
	)
}
