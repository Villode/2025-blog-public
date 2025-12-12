import { useState } from 'react'

type TagInputProps = {
	tags: string[]
	onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
	const [tagInput, setTagInput] = useState<string>('')

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim())) {
			onChange([...tags, tagInput.trim()])
			setTagInput('')
		}
	}

	const handleRemoveTag = (index: number) => {
		onChange(tags.filter((_, i) => i !== index))
	}

	return (
		<div className='w-full rounded-lg border bg-white/70 px-3 py-2 max-sm:rounded-xl max-sm:border-0 max-sm:bg-white max-sm:px-4 max-sm:py-3'>
			{tags.length > 0 && (
				<div className='mb-2 flex flex-wrap gap-2'>
					{tags.map((tag, index) => (
						<span key={index} className='flex items-center gap-1.5 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-700 max-sm:text-base'>
							#{tag}
							<button type='button' onClick={() => handleRemoveTag(index)} className='text-secondary max-sm:text-lg'>
								×
							</button>
						</span>
					))}
				</div>
			)}
			<input
				type='text'
				placeholder='添加标签（按回车）'
				className='w-full bg-transparent text-sm outline-none max-sm:text-base'
				value={tagInput}
				onChange={e => setTagInput(e.target.value)}
				onKeyDown={e => {
					if (e.key === 'Enter') {
						e.preventDefault()
						handleAddTag()
					}
				}}
			/>
		</div>
	)
}
