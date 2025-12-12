import { useCenterStore } from '@/hooks/use-center'
import Card from '@/components/card'
import { useConfigStore } from './stores/config-store'
import { HomeDraggableLayer } from './home-draggable-layer'
import { useSize } from '@/hooks/use-size'
import FloatingCards from './floating-cards'

function getGreeting() {
	const hour = new Date().getHours()

	if (hour >= 6 && hour < 12) {
		return 'Good Morning'
	} else if (hour >= 12 && hour < 18) {
		return 'Good Afternoon'
	} else if (hour >= 18 && hour < 22) {
		return 'Good Evening'
	} else {
		return 'Good Night'
	}
}

export default function HiCard() {
	const center = useCenterStore()
	const { cardStyles } = useConfigStore()
	const { maxSM } = useSize()
	const greeting = getGreeting()
	const styles = cardStyles.hiCard

	const x = styles.offsetX !== null ? center.x + styles.offsetX : center.x - styles.width / 2
	const y = styles.offsetY !== null ? center.y + styles.offsetY : center.y - styles.height / 2

	return (
		<HomeDraggableLayer cardKey='hiCard' x={x} y={y} width={styles.width} height={styles.height}>
			<Card order={styles.order} width={styles.width} height={styles.height} x={x} y={y} className='text-center max-sm:static max-sm:translate-0 max-sm:!bg-transparent max-sm:!border-0 max-sm:!shadow-none'>
				<div className='relative'>
					<img src='/images/avatar.png' className='mx-auto rounded-full' style={{ width: 120, height: 120, boxShadow: ' 0 16px 32px -5px #E2D9CE' }} />
					{maxSM && (
						<div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'>
							<FloatingCards />
						</div>
					)}
				</div>
				<h1 className='font-averia mt-3 text-2xl'>
					{greeting} <br /> I'm <span className='text-linear text-[32px]'>Suni</span> , Nice to <br /> meet you!
				</h1>
			</Card>
		</HomeDraggableLayer>
	)
}
