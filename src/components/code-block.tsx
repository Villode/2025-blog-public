'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

type CodeBlockProps = {
	children: React.ReactNode
	code: string
}

// 折叠阈值：视口高度的50%
const COLLAPSE_THRESHOLD_RATIO = 0.5

export function CodeBlock({ children, code }: CodeBlockProps) {
	const [copied, setCopied] = useState(false)
	const [collapsed, setCollapsed] = useState(false)
	const [shouldCollapse, setShouldCollapse] = useState(false)
	const contentRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!contentRef.current) return

		const checkHeight = () => {
			const el = contentRef.current
			if (!el) return

			const threshold = window.innerHeight * COLLAPSE_THRESHOLD_RATIO
			const contentHeight = el.scrollHeight

			if (contentHeight > threshold) {
				setShouldCollapse(true)
				setCollapsed(true)
			} else {
				setShouldCollapse(false)
				setCollapsed(false)
			}
		}

		// 延迟检测，等待内容渲染
		const timer = setTimeout(checkHeight, 100)
		return () => clearTimeout(timer)
	}, [children])

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (error) {
			console.error('Failed to copy code:', error)
		}
	}

	const collapsedMaxHeight = typeof window !== 'undefined' ? window.innerHeight * COLLAPSE_THRESHOLD_RATIO : 300

	return (
		<div className='code-block-wrapper relative'>
			<button type='button' onClick={handleCopy} className='code-block-copy-btn' aria-label='Copy code'>
				{copied ? <Check size={16} /> : <Copy size={16} />}
			</button>
			<div
				ref={contentRef}
				style={{
					maxHeight: collapsed ? `${collapsedMaxHeight}px` : undefined,
					overflow: collapsed ? 'hidden' : undefined
				}}>
				{children}
			</div>
			{/* 折叠时底部渐变遮罩和展开箭头 */}
			{shouldCollapse && collapsed && (
				<div
					onClick={() => setCollapsed(false)}
					className='absolute right-0 bottom-0 left-0 flex cursor-pointer items-end justify-center rounded-b-xl bg-gradient-to-t from-gray-200/95 to-transparent pb-2 pt-12'>
					<span className='flex items-center gap-1 text-xs text-gray-500'>
						展开 <ChevronDown size={16} />
					</span>
				</div>
			)}
			{/* 展开时显示收起箭头 */}
			{shouldCollapse && !collapsed && (
				<div onClick={() => setCollapsed(true)} className='-mt-2 flex cursor-pointer items-center justify-center'>
					<span className='flex items-center gap-1 text-xs text-gray-400'>
						收起 <ChevronUp size={16} />
					</span>
				</div>
			)}
		</div>
	)
}

