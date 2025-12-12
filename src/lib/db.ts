// D1 数据库操作
// D1 ID: 69297e0b-6da4-4cb8-b349-80891d0fbb4a

import type { DbUser } from '@/hooks/use-user'

// 动态导入 getCloudflareContext 避免构建时问题
async function getCloudflareContext() {
	const mod = await import('@opennextjs/cloudflare')
	return mod.getCloudflareContext()
}

// D1 数据库类型
export interface D1Database {
	prepare(query: string): D1PreparedStatement
	batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
	exec(query: string): Promise<D1ExecResult>
}

interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement
	first<T = unknown>(colName?: string): Promise<T | null>
	run(): Promise<D1Result>
	all<T = unknown>(): Promise<D1Result<T>>
}

interface D1Result<T = unknown> {
	results?: T[]
	success: boolean
	error?: string
	meta?: object
}

interface D1ExecResult {
	count: number
	duration: number
}

// 获取 D1 数据库实例
export async function getDB(): Promise<D1Database | null> {
	try {
		const { env } = await getCloudflareContext()
		return (env as any).DB as D1Database | null
	} catch {
		// 本地开发或非 Cloudflare 环境
		return null
	}
}

// 初始化数据库表
export async function initDatabase(db: D1Database): Promise<void> {
	await db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			role TEXT DEFAULT 'user',
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			last_login_at TEXT DEFAULT CURRENT_TIMESTAMP
		);
		
		CREATE TABLE IF NOT EXISTS talks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			content TEXT NOT NULL,
			images TEXT,
			user_id TEXT NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id)
		);
	`)
}

// 获取或创建用户
export async function getOrCreateUser(db: D1Database, sub: string, email: string): Promise<DbUser> {
	// 先尝试获取用户
	const existing = await db.prepare('SELECT * FROM users WHERE id = ?').bind(sub).first<DbUser>()
	
	if (existing) {
		// 更新最后登录时间
		await db.prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sub).run()
		return {
			...existing,
			lastLoginAt: new Date().toISOString()
		}
	}
	
	// 创建新用户（第一个用户自动成为管理员）
	const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
	const role = userCount?.count === 0 ? 'admin' : 'user'
	
	await db.prepare(
		'INSERT INTO users (id, email, role) VALUES (?, ?, ?)'
	).bind(sub, email, role).run()
	
	return {
		id: sub,
		email,
		role: role as 'admin' | 'user',
		createdAt: new Date().toISOString(),
		lastLoginAt: new Date().toISOString()
	}
}

// 获取用户
export async function getUser(db: D1Database, sub: string): Promise<DbUser | null> {
	return db.prepare('SELECT * FROM users WHERE id = ?').bind(sub).first<DbUser>()
}

// 更新用户角色
export async function updateUserRole(db: D1Database, userId: string, role: 'admin' | 'user'): Promise<void> {
	await db.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, userId).run()
}

// 获取所有用户
export async function getAllUsers(db: D1Database): Promise<DbUser[]> {
	const result = await db.prepare('SELECT * FROM users ORDER BY created_at DESC').all<DbUser>()
	return result.results || []
}
