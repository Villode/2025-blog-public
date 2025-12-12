export default function LoveLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* 预连接字体 CDN，加速后续字体分片下载 */}
			<link rel='preconnect' href='https://chinese-fonts-cdn.deno.dev' crossOrigin='anonymous' />
			{/* 加载字体 CSS（按需加载字体分片） */}
			<link
				href='https://chinese-fonts-cdn.deno.dev/packages/qtbfsxt/dist/%E5%8D%83%E5%9B%BE%E7%AC%94%E9%94%8B%E6%89%8B%E5%86%99%E4%BD%93/result.css'
				rel='stylesheet'
			/>
			{children}
		</>
	)
}
