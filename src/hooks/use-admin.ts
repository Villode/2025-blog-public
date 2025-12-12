// GitHub OAuth 管理员认证 Hook
import { create } from 'zustand'
import { useEffect } from 'react'

interface AdminState {
	isAdmin: boolean
	loading: boolean
	username: string | null
	loginWithGitHub: () => void
	logout: () => Promise<void>
	checkAuth: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set) => ({
	isAdmin: false,
	loading: true,
	username: null,

	// 跳转到 GitHub 登录
	loginWithGitHub: () => {
		window.location.href = '/api/auth/github'
	},

	logout: async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		set({ isAdmin: false, username: null })
	},

	checkAuth: async () => {
		try {
			const res = await fetch('/api/auth/me')
			const data = await res.json()

			if (data.authenticated && data.user) {
				set({ isAdmin: true, loading: false, username: data.user.id })
			} else {
				set({ isAdmin: false, loading: false, username: null })
			}
		} catch {
			set({ isAdmin: false, loading: false, username: null })
		}
	}
}))

// 自动检查认证状态的 Hook
export function useAdmin() {
	const store = useAdminStore()

	useEffect(() => {
		if (store.loading) {
			store.checkAuth()
		}
	}, [])

	return store
}
