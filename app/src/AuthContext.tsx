import { useEffect, useMemo, useState } from 'react'
import { loginRequest } from './apiClient'
import {
  AuthContext,
  type AuthContextValue,
  type AuthProviderProps,
  type AuthUser,
} from './auth-context'
import { buildPortalApiUrl } from './config'

async function getCurrentUser(): Promise<AuthUser | null> {
  const resp = await fetch(buildPortalApiUrl('/me'), { credentials: 'include' })
  if (resp.status === 401) return null
  if (!resp.ok) throw new Error('获取当前登录状态失败')
  const data = await resp.json()
  return data.user ?? null
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    const currentUser = await getCurrentUser()
    setUser(currentUser)
  }

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (username, password) => {
        await loginRequest(username, password)
        await refreshUser()
      },
      logout: async () => {
        await fetch(buildPortalApiUrl('/auth/logout'), {
          method: 'POST',
          credentials: 'include',
        })
        setUser(null)
      },
      refreshUser,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
