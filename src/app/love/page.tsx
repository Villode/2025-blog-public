'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const quotes = [
	{ zh: '主动亦有故事', en: 'Initiative writes its own story' },
	{ zh: '双向奔赴才有意义', en: 'Only mutual effort makes sense' },
	{ zh: '慢慢来 比较快', en: 'Slow down to speed up' },
	{ zh: '值得等待的 都会如期而至', en: "What's worth waiting for will come in time" },
	{ zh: '不期而遇 正是最好的安排', en: 'Unexpected encounters are the best arrangements' }
]

// 验证问题（后续可以修改）
const question = {
	text: '请回答问题以查看联系方式',
	placeholder: '输入答案...'
}

// 打码的联系方式
const contacts = [
	{ label: '微信', value: 'wx_****_abc', icon: '💬' },
	{ label: '邮箱', value: '***@****.com', icon: '📧' },
	{ label: 'QQ', value: '12****89', icon: '🐧' }
]

type Stage = 'quotes' | 'question' | 'contacts'

export default function LovePage() {
	const [stage, setStage] = useState<Stage>('quotes')
	const [answer, setAnswer] = useState('')
	const [error, setError] = useState('')

	const handleLight = () => {
		setStage('question')
	}

	const handleSubmit = () => {
		// TODO: 后续实现验证逻辑
		// 目前先显示提示
		setError('验证功能待开发...')
	}

	const handleBack = () => {
		setStage('quotes')
		setAnswer('')
		setError('')
	}

	return (
		<div className='relative flex min-h-screen flex-col items-center justify-center px-6'>
				<AnimatePresence mode='wait'>
					{stage === 'quotes' && (
						<>
							{/* 意境文字列表 */}
							<motion.div
								key='quotes'
								className='flex max-w-md flex-col gap-10'
								exit={{ opacity: 0 }}
								transition={{ duration: 0.5 }}>
								{quotes.map((quote, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
										animate={{ opacity: 1, x: 0 }}
										exit={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
										transition={{ delay: 0.3 + index * 0.15, duration: 0.6 }}
										className={`flex flex-col gap-1 ${index % 2 === 0 ? 'items-start' : 'items-end text-right'}`}>
										<p className='text-primary text-2xl' style={{ fontFamily: "'qiantubifengshouxieti', cursive" }}>
											{quote.zh}
										</p>
										<p className='text-secondary/60 text-sm italic tracking-wider' style={{ fontFamily: 'Georgia, cursive' }}>
											{quote.en}
										</p>
									</motion.div>
								))}
							</motion.div>

							{/* 底部爱心和点亮文字 */}
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, y: 20 }}
								transition={{ delay: 1.2, duration: 0.8 }}
								className='absolute bottom-16 flex flex-col items-center gap-2 sm:bottom-12'>
								<motion.div
									onClick={handleLight}
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									className='text-brand/20 cursor-pointer text-3xl transition-colors hover:text-pink-400'
									style={{ fontFamily: 'Georgia, serif' }}>
									♡
								</motion.div>
								<motion.p onClick={handleLight} whileHover={{ color: '#f472b6' }} className='text-secondary cursor-pointer text-sm'>
									点亮爱心
								</motion.p>
							</motion.div>
						</>
					)}

					{stage === 'question' && (
						<motion.div
							key='question'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ duration: 0.5 }}
							className='flex w-full max-w-sm flex-col items-center gap-6'>
							{/* 点亮的爱心 */}
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: 'spring', duration: 0.8 }}
								className='text-5xl text-pink-400'
								style={{ fontFamily: 'Georgia, serif' }}>
								♥
							</motion.div>

							{/* 问题文字 */}
							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className='text-primary text-center text-lg'
								style={{ fontFamily: "'qiantubifengshouxieti', cursive" }}>
								{question.text}
							</motion.p>

							{/* 输入框 */}
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className='w-full'>
								<input
									type='text'
									value={answer}
									onChange={e => {
										setAnswer(e.target.value)
										setError('')
									}}
									placeholder={question.placeholder}
									className='text-primary placeholder:text-secondary/40 w-full border-b border-gray-200 bg-transparent px-2 py-3 text-center text-sm outline-none transition-colors focus:border-pink-300'
								/>
							</motion.div>

							{/* 错误提示 */}
							{error && (
								<motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='text-xs text-pink-400'>
									{error}
								</motion.p>
							)}

							{/* 提交按钮 */}
							<motion.button
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.7 }}
								onClick={handleSubmit}
								disabled={!answer.trim()}
								className='rounded-full bg-pink-100 px-8 py-2 text-sm text-pink-500 transition-colors hover:bg-pink-200 disabled:cursor-not-allowed disabled:opacity-50'>
								验证
							</motion.button>

							{/* 返回按钮 */}
							<motion.button
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.9 }}
								onClick={handleBack}
								className='text-secondary/40 mt-4 text-xs hover:text-pink-400'>
								← 返回
							</motion.button>
						</motion.div>
					)}

					{stage === 'contacts' && (
						<motion.div
							key='contacts'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.6 }}
							className='flex flex-col items-center gap-8'>
							{/* 点亮的爱心 */}
							<motion.div
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{ type: 'spring', duration: 0.8 }}
								className='text-5xl text-pink-400'
								style={{ fontFamily: 'Georgia, serif' }}>
								♥
							</motion.div>

							<motion.p
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.3 }}
								className='text-primary text-xl'
								style={{ fontFamily: "'qiantubifengshouxieti', cursive" }}>
								很高兴遇见你
							</motion.p>

							{/* 联系方式列表 */}
							<div className='flex flex-col gap-4'>
								{contacts.map((contact, index) => (
									<motion.div
										key={contact.label}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.5 + index * 0.1 }}
										className='flex items-center gap-3'>
										<span className='text-xl'>{contact.icon}</span>
										<span className='text-secondary text-sm'>{contact.label}</span>
										<span className='text-primary font-mono tracking-wider'>{contact.value}</span>
									</motion.div>
								))}
							</div>

							{/* 返回按钮 */}
							<motion.button
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 1 }}
								onClick={handleBack}
								className='text-secondary/40 mt-6 text-xs hover:text-pink-400'>
								← 返回
							</motion.button>
						</motion.div>
					)}
				</AnimatePresence>
		</div>
	)
}
