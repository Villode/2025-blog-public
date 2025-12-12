// 用户状态 Hook（基于简单密码认证）
import { create } from 'zustand'
import { useEffect } from 'react'

export interface DbUser {
	id: string
	email: string
	role: 'admin' | 'user'
	createdAt?: string
	lastLoginAt?: string
}

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

			const token = localStorage.getItem('admin_token')
			if (!token) {
				set({ user: null, authenticated: false, loading: false })
				return
			}

			const res = await fetch('/api/auth/me', {
				headers: { Authorization: `Bearer ${token}` }
			})
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
