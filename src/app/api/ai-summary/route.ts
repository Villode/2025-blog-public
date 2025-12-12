import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.ZHIPU_API_KEY || ''
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'

export async function POST(request: NextRequest) {
	try {
		const { content, title } = await request.json()

		if (!API_KEY) {
			return NextResponse.json({ error: 'AI服务未配置' }, { status: 500 })
		}

		if (!content) {
			return NextResponse.json({ error: '缺少文章内容' }, { status: 400 })
		}

		// 截取前4000字符避免超出token限制
		const truncatedContent = content.slice(0, 4000)

		const requestBody = {
			model: 'glm-4-flash',
			messages: [
				{
					role: 'system',
					content:
						'你是一个专业的文章总结助手。请用简洁的中文总结文章，分2-3个要点，每个要点一行。控制在150字以内。直接输出内容，不要加标题或前缀。'
				},
				{
					role: 'user',
					content: `请总结这篇文章《${title}》的核心内容：\n\n${truncatedContent}`
				}
			]
		}

		const response = await fetch(API_URL, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestBody)
		})

		const responseText = await response.text()

		if (!response.ok) {
			console.error('AI API error:', response.status, responseText)
			return NextResponse.json({ error: `AI服务请求失败: ${response.status}` }, { status: 500 })
		}

		let data
		try {
			data = JSON.parse(responseText)
		} catch {
			console.error('Failed to parse response:', responseText)
			return NextResponse.json({ error: '解析响应失败' }, { status: 500 })
		}

		const summary = data.choices?.[0]?.message?.content || ''

		if (!summary) {
			console.error('Empty summary, response:', data)
			return NextResponse.json({ error: '未获取到总结内容' }, { status: 500 })
		}

		return NextResponse.json({ summary })
	} catch (error: any) {
		console.error('AI summary error:', error?.message || error)
		return NextResponse.json({ error: `生成总结失败: ${error?.message || '未知错误'}` }, { status: 500 })
	}
}
