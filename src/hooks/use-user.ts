// 用户状态 Hook
import { create } from 'zustand'
import { useEffect } from 'react'
import type { DbUser } from '@/lib/cf-auth'

interface UserState {
	user: DbUser | null
	authenticated: boolean
	loading: boolean
	error: string | null
	fetchUser: () => Promise<void>
	isAdmin: () => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
	user: null,
	authenticated: false,
	loading: true,
	error: null,
	
	fetchUser: async () => {
		try {
			set({ loading: true, error: null })
			
			// 开发环境检查本地模拟登录
			if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
				const devAuth = localStorage.getItem('dev_auth')
				if (devAuth === 'admin') {
					set({
						user: {
							id: 'dev-admin',
							email: 'admin@localhost',
							role: 'admin',
							createdAt: new Date().toISOString(),
							lastLoginAt: new Date().toISOString()
						},
						authenticated: true,
						loading: false
					})
					return
				}
			}
			
			const res = await fetch('/api/auth/me')
			const data = await res.json()
			
			set({
				user: data.user,
				authenticated: data.authenticated,
				loading: false
			})
		} catch (e) {
			set({
				user: null,
				authenticated: false,
				loading: false,
				error: 'Failed to fetch user'
			})
		}
	},
	
	isAdmin: () => {
		const { user } = get()
		return user?.role === 'admin'
	}
}))

// 自动获取用户的 Hook
export function useUser() {
	const store = useUserStore()
	
	useEffect(() => {
		if (store.loading && !store.user) {
			store.fetchUser()
		}
	}, [])
	
	return store
}

// 检查是否是管理员
export function useIsAdmin() {
	const { user, loading } = useUser()
	return { isAdmin: user?.role === 'admin', loading }
}
