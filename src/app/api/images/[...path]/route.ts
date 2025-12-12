// R2 图片代理 API

export const runtime = 'edge'

// 动态导入 getCloudflareContext 避免构建时问题
async function getCloudflareContext() {
	const mod = await import('@opennextjs/cloudflare')
	return mod.getCloudflareContext()
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params
	const key = path.join('/')

	try {
		const ctx = await getCloudflareContext()
		const env = ctx.env as { BUCKET?: any }
		const bucket = env.BUCKET

		if (!bucket) {
			return Response.json({ error: 'Bucket not available' }, { status: 500 })
		}

		const object = await bucket.get(key)
		if (!object) {
			return Response.json({ error: 'Image not found' }, { status: 404 })
		}

		const headers = new Headers()
		headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
		headers.set('Cache-Control', 'public, max-age=31536000') // 1年缓存

		return new Response(object.body, { headers })
	} catch (error) {
		console.error('Get image error:', error)
		return Response.json({ error: 'Failed to get image' }, { status: 500 })
	}
}
