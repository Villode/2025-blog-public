// 登出
import { SESSION_COOKIE } from '@/lib/session'

export const runtime = 'edge'

export async function POST() {
	const headers = new Headers({ 'Content-Type': 'application/json' })
	headers.append('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`)

	return new Response(JSON.stringify({ success: true }), { headers })
}
