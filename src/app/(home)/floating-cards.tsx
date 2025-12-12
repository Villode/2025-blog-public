'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const cards = [
	{ label: '相册', href: '/pictures', icon: '📷' },
	{ label: '恋爱', href: '/love', icon: '💕' },
	{ label: '关于', href: '/about', icon: '✨' },
	{ label: '说说', href: '/talks', icon: '💬' }
]

export default function FloatingCards() {
	const [show, setShow] = useState(false)

	useEffect(() => {
		setTimeout(() => setShow(true), 500)
	}, [])

	if (!show) return null

	// 计算每个卡片的位置（围绕中心点）
	const radius = 100 // 距离中心的半径
	const positions = [
		{ x: -radius, y: -radius * 0.4 }, // 左上
		{ x: radius, y: -radius * 0.4 }, // 右上
		{ x: -radius, y: radius * 0.4 }, // 左下
		{ x: radius, y: radius * 0.4 } // 右下
	]

	return (
		<div className='relative h-0 w-0'>
			{cards.map((card, index) => {
				const pos = positions[index]
				return (
					<Link key={card.href} href={card.href}>
						<motion.div
							initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
							animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y }}
							transition={{
								duration: 0.6,
								delay: index * 0.1,
								type: 'spring',
								stiffness: 200,
								damping: 15
							}}
							whileTap={{ scale: 0.85 }}
							className='absolute left-0 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full'>
							<span className='text-3xl'>{card.icon}</span>
						</motion.div>
					</Link>
				)
			})}
		</div>
	)
}
