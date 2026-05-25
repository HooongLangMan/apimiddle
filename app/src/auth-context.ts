import { createContext, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  name: string
}

export type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export type AuthProviderProps = {
  children: ReactNode
}
