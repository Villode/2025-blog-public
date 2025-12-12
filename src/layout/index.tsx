'use client'
import { PropsWithChildren } from 'react'
import { useCenterInit } from '@/hooks/use-center'
import BlurredBubblesBackground from './backgrounds/blurred-bubbles'
import NavCard from '@/components/nav-card'
import { Toaster } from 'sonner'
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useSize, useSizeInit } from '@/hooks/use-size'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { ScrollTopButton } from '@/components/scroll-top-button'
import { usePathname } from 'next/navigation'

export default function Layout({ children }: PropsWithChildren) {
	useCenterInit()
	useSizeInit()
	const { siteContent, regenerateKey } = useConfigStore()
	const { maxSM, init } = useSize()
	const pathname = usePathname()
	
	// 在 /write 页面不显示回到顶部按钮
	const showScrollTopButton = maxSM && init && !pathname.startsWith('/write')

	return (
		<>
			<Toaster
				position='bottom-right'
				richColors
				icons={{
					success: <CircleCheckIcon className='size-4' />,
					info: <InfoIcon className='size-4' />,
					warning: <TriangleAlertIcon className='size-4' />,
					error: <OctagonXIcon className='size-4' />,
					loading: <Loader2Icon className='size-4 animate-spin' />
				}}
				style={
					{
						'--border-radius': '12px'
					} as React.CSSProperties
				}
			/>
			<BlurredBubblesBackground colors={siteContent.backgroundColors} regenerateKey={regenerateKey} />
			<main className='relative z-10 h-full'>
				{children}
				<NavCard />
			</main>

			{showScrollTopButton && <ScrollTopButton className='bg-brand/20 fixed right-6 bottom-8 z-50 shadow-md' />}
		</>
	)
}
