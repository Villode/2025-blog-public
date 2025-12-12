// GitHub OAuth 管理员认证 Hook
import { create } from 'zustand'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface AdminState {
	isAdmin: boolean
	loading: boolean
	username: string | null
	loginWithGitHub: () => void
	logout: () => Promise<void>
	checkAuth: () => Promise<boolean>
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
				return true
			} else {
				set({ isAdmin: false, loading: false, username: null })
				return false
			}
		} catch {
			set({ isAdmin: false, loading: false, username: null })
			return false
		}
	}
}))

// 自动检查认证状态的 Hook
export function useAdmin() {
	const store = useAdminStore()
	const hasShownToast = useRef(false)

	useEffect(() => {
		if (store.loading) {
			store.checkAuth().then((isLoggedIn) => {
				// 只在首次加载且已登录时显示欢迎提示
				if (isLoggedIn && !hasShownToast.current) {
					hasShownToast.current = true
					toast.success(`欢迎回来，${store.username || '管理员'}！`)
				}
			})
		}
	}, [])

	return store
}
