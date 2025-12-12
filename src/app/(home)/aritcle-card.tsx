import Card from '@/components/card'
import { useCenterStore } from '@/hooks/use-center'
import { useLatestBlog, useBlogIndex } from '@/hooks/use-blog-index'
import { useConfigStore } from './stores/config-store'
import { CARD_SPACING } from '@/consts'
import dayjs from 'dayjs'
import Link from 'next/link'
import { HomeDraggableLayer } from './home-draggable-layer'
import { useSize } from '@/hooks/use-size'
import { motion } from 'motion/react'

export default function ArticleCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const { blog, loading: latestLoading } = useLatestBlog()
	const { items, loading: allLoading } = useBlogIndex()
	const { maxSM } = useSize()
	const styles = cardStyles.articleCard
	const hiCardStyles = cardStyles.hiCard
	const socialButtonsStyles = cardStyles.socialButtons

	// 移动端显示全部文章，桌面端只显示最新一篇
	const displayBlogs = maxSM ? items : (blog ? [blog] : [])
	const loading = maxSM ? allLoading : latestLoading

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x + hiCardStyles.width / 2 - socialButtonsStyles.width - CARD_SPACING - styles.width
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y + hiCardStyles.height / 2 + CARD_SPACING

	// 移动端直接显示文章卡片，不用外层Card
	if (maxSM) {
		return (
			<div className='w-[340px] space-y-4'>
				<div className='flex items-center justify-between px-2'>
					<h2 className='text-secondary text-sm font-medium'>最新文章</h2>
					<Link href='/blog' className='text-brand text-xs hover:underline'>
						查看全部 →
					</Link>
				</div>
				{loading ? (
					<div className='flex h-[120px] items-center justify-center rounded-2xl border bg-white/40 backdrop-blur-sm'>
						<span className='text-secondary text-xs'>加载中...</span>
					</div>
				) : displayBlogs.length > 0 ? (
					<div className='flex flex-col gap-6'>
						{displayBlogs.map((article, index) => (
							<Link 
								key={article.slug}
								href={`/blog/${article.slug}`}
								className='block'
							>
								<motion.div
									initial={{ opacity: 0, y: 50 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: false, margin: '-50px' }}
									whileTap={{ scale: 0.98 }}
									transition={{ 
										opacity: { duration: 0.5, ease: 'easeOut' },
										y: { duration: 0.5, ease: 'easeOut' },
										scale: { duration: 0.15 }
									}}
									className='group relative h-[220px] overflow-hidden rounded-2xl border shadow-md transition-shadow duration-300 hover:shadow-xl active:shadow-sm'
								>
									{article.cover ? (
										<>
											<motion.img 
												src={article.cover} 
												alt={article.title || article.slug}
												className='absolute inset-0 h-full w-full object-cover'
												whileHover={{ scale: 1.08 }}
												transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
											/>
											<div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent' />
										</>
									) : (
										<div className='absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-600' />
									)}
									{/* 底部毛玻璃效果 - 渐变羽化 */}
									<div 
										className='absolute inset-x-0 bottom-0 h-2/5 rounded-b-2xl backdrop-blur-sm'
										style={{ 
											WebkitMaskImage: 'linear-gradient(to top, black 60%, transparent)',
											maskImage: 'linear-gradient(to top, black 60%, transparent)'
										}}
									/>
									<div className='relative flex h-full flex-col justify-between p-4 text-white'>
										<div className='flex items-start justify-between gap-2'>
											<motion.h3 
												className='line-clamp-2 flex-1 text-base font-semibold leading-snug drop-shadow-lg'
												initial={{ x: 0 }}
												whileHover={{ x: 4 }}
												transition={{ duration: 0.3 }}
											>
												{article.title || article.slug}
											</motion.h3>
											{article.tags && article.tags.length > 0 && (
												<motion.span 
													className='shrink-0 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm'
													whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
													transition={{ duration: 0.2 }}
												>
													#{article.tags[0]}
												</motion.span>
											)}
										</div>
										<motion.div
											initial={{ y: 0 }}
											whileHover={{ y: -2 }}
											transition={{ duration: 0.3 }}
										>
											{article.summary && (
												<p className='mb-2 line-clamp-2 text-sm leading-relaxed text-white/95'>
													{article.summary}
												</p>
											)}
											<div className='flex items-center justify-between'>
												<p className='text-xs text-white/80'>{dayjs(article.date).format('YYYY年M月D日')}</p>
												<motion.span
													className='text-xs text-white/70'
													initial={{ opacity: 0, x: -10 }}
													whileHover={{ opacity: 1, x: 0 }}
													transition={{ duration: 0.3 }}
												>
													阅读 →
												</motion.span>
											</div>
										</motion.div>
									</div>
								</motion.div>
							</Link>
						))}
					</div>
				) : (
					<div className='flex h-[120px] items-center justify-center rounded-2xl border bg-white/40 backdrop-blur-sm'>
						<span className='text-secondary text-xs'>暂无文章</span>
					</div>
				)}
				
				{/* 底部提示 */}
				{!loading && displayBlogs.length > 0 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.4, delay: 0.3 }}
						className='text-secondary mt-6 text-center text-xs'
					>
						已显示全部 {items.length} 篇文章
					</motion.div>
				)}
			</div>
		)
	}

	// 桌面端保持原有样式
	return (
		<HomeDraggableLayer cardKey='articleCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card 
				order={styles.order} 
				width={styles.width} 
				height={styles.height} 
				x={x} 
				y={y} 
				className='space-y-2'
			>
				<h2 className='text-secondary text-sm'>最新文章</h2>

				{loading ? (
					<div className='flex h-[60px] items-center justify-center'>
						<span className='text-secondary text-xs'>加载中...</span>
					</div>
				) : displayBlogs.length > 0 ? (
					<Link href={`/blog/${displayBlogs[0].slug}`} className='flex transition-opacity hover:opacity-80'>
						{displayBlogs[0].cover && (
							<img src={displayBlogs[0].cover} alt='cover' className='mr-3 h-12 w-12 shrink-0 rounded-xl border object-cover' />
						)}
						<div className='flex-1'>
							<h3 className='line-clamp-1 text-sm font-medium'>{displayBlogs[0].title || displayBlogs[0].slug}</h3>
							{displayBlogs[0].summary && <p className='text-secondary mt-1 line-clamp-3 text-xs'>{displayBlogs[0].summary}</p>}
							<p className='text-secondary mt-3 text-xs'>{dayjs(displayBlogs[0].date).format('YYYY/M/D')}</p>
						</div>
					</Link>
				) : (
					<div className='flex h-[60px] items-center justify-center'>
						<span className='text-secondary text-xs'>暂无文章</span>
					</div>
				)}
			</Card>
		</HomeDraggableLayer>
	)
}
