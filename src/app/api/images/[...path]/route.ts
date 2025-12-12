// R2 图片代理 API
import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'edge'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params
	const key = path.join('/')

	try {
		const { env } = await getCloudflareContext()
		const bucket = (env as any).BUCKET

		if (!bucket) {
			return NextResponse.json({ error: 'Bucket not available' }, { status: 500 })
		}

		const object = await bucket.get(key)
		if (!object) {
			return NextResponse.json({ error: 'Image not found' }, { status: 404 })
		}

		const headers = new Headers()
		headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
		headers.set('Cache-Control', 'public, max-age=31536000') // 1年缓存

		return new NextResponse(object.body, { headers })
	} catch (error) {
		console.error('Get image error:', error)
		return NextResponse.json({ error: 'Failed to get image' }, { status: 500 })
	}
}
