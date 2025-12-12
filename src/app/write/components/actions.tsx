import { motion } from 'motion/react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useWriteStore } from '../stores/write-store'
import { usePreviewStore } from '../stores/preview-store'
import { usePublish } from '../hooks/use-publish'

export function WriteActions() {
	const router = useRouter()
	const { loading, mode, form } = useWriteStore()
	const { openPreview } = usePreviewStore()
	const { isAuth, onChoosePrivateKey, onPublish, onDelete } = usePublish()
	const keyInputRef = useRef<HTMLInputElement>(null)

	const handleImportOrPublish = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
		} else {
			onPublish()
		}
	}

	const buttonText = isAuth ? (mode === 'edit' ? '更新' : '发布') : '导入密钥'

	const handleDelete = () => {
		if (!isAuth) {
			toast.info('请先导入密钥')
			return
		}
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前文章吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			onDelete()
		}
	}

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				className='hidden'
				onChange={async e => {
					const f = e.target.files?.[0]
					if (f) await onChoosePrivateKey(f)
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<ul className='absolute top-4 right-6 flex items-center gap-2 max-sm:fixed max-sm:bottom-6 max-sm:left-4 max-sm:right-4 max-sm:top-auto max-sm:z-50 max-sm:gap-2 max-sm:rounded-2xl max-sm:bg-white/95 max-sm:p-3 max-sm:shadow-lg max-sm:backdrop-blur-sm'>
				{/* 返回按钮 - 仅移动端显示 */}
				<motion.button
					onClick={() => router.push('/')}
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='hidden max-sm:flex max-sm:flex-1 max-sm:items-center max-sm:justify-center max-sm:gap-1 max-sm:rounded-xl max-sm:border max-sm:border-gray-300 max-sm:bg-white max-sm:px-4 max-sm:py-2.5 max-sm:text-sm max-sm:font-medium'>
					<span>← 返回</span>
				</motion.button>

				{mode === 'edit' && (
					<>
						<motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className='flex items-center gap-2 max-sm:hidden'>
							<div className='rounded-lg border bg-blue-50 px-4 py-2 text-sm text-blue-700'>编辑模式</div>
						</motion.div>
						<motion.button
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100 max-sm:flex-1 max-sm:rounded-xl max-sm:px-4 max-sm:py-2.5 max-sm:text-sm'
							disabled={loading}
							onClick={handleDelete}>
							删除
						</motion.button>
					</>
				)}

				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='rounded-xl border bg-white/60 px-6 py-2 text-sm max-sm:flex-1 max-sm:rounded-xl max-sm:border-gray-300 max-sm:bg-white max-sm:px-4 max-sm:py-2.5 max-sm:text-sm max-sm:font-medium'
					disabled={loading}
					onClick={openPreview}>
					预览
				</motion.button>
				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='brand-btn px-6 max-sm:flex-1 max-sm:rounded-xl max-sm:px-4 max-sm:py-2.5 max-sm:text-sm max-sm:font-medium'
					disabled={loading}
					onClick={handleImportOrPublish}>
					{buttonText}
				</motion.button>
			</ul>
		</>
	)
}
