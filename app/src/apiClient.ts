import type {
  AnnouncementItem,
  ApiKeyItem,
  AuthConfig,
  BillingSummary,
  DashboardSummary,
  PricingSummary,
  UsageListResponse,
} from './types'
import { buildPortalApiUrl } from './config'

const REQUEST_FAILED_MESSAGE = '请求失败，请稍后重试'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(buildPortalApiUrl(path), {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ message: REQUEST_FAILED_MESSAGE }))
    throw new Error(data.message ?? REQUEST_FAILED_MESSAGE)
  }

  if (resp.status === 204) {
    return undefined as T
  }

  return resp.json() as Promise<T>
}

export async function loginRequest(username: string, password: string) {
  return request<{ user: { id: string; name: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function registerRequest(
  username: string,
  password: string,
  email?: string,
  verificationCode?: string,
) {
  return request<{ message: string; success: boolean }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      email,
      verification_code: verificationCode,
    }),
  })
}

export async function getAuthConfigRequest() {
  return request<AuthConfig>('/auth/config', {
    method: 'GET',
    headers: {},
  })
}

export async function sendEmailVerificationRequest(email: string) {
  const search = new URLSearchParams({ email })
  return request<{ message: string; success: boolean }>(
    `/auth/verification?${search.toString()}`,
    {
      method: 'GET',
      headers: {},
    },
  )
}

export async function getDashboardRequest() {
  return request<DashboardSummary & { source?: string; message?: string }>('/dashboard')
}

export async function getKeysRequest() {
  return request<ApiKeyItem[]>('/keys')
}

export async function createKeyRequest(
  name: string,
  params?: {
    models?: string[]
    unlimited_quota?: boolean
    remain_quota?: number
    expired_time?: number
    group_id?: string
  },
) {
  return request<ApiKeyItem>('/keys', {
    method: 'POST',
    body: JSON.stringify({ name, ...params }),
  })
}

export async function updateKeyRequest(
  params: {
    id: string
    name: string
    status?: number
    unlimited_quota: boolean
    remain_quota: number
    expired_time: number
    group_id?: string
  },
) {
  return request<ApiKeyItem & { message?: string }>('/keys', {
    method: 'PUT',
    body: JSON.stringify(params),
  })
}

export async function deleteKeyRequest(id: string) {
  return request<void>(`/keys/${id}`, { method: 'DELETE' })
}

export async function getKeyValueRequest(id: string) {
  return request<{ key: string }>(`/keys/${id}/value`, { method: 'POST' })
}

export async function getUsageRequest(params?: {
  page?: number
  pageSize?: number
  model?: string
  token?: string
  group?: string
  status?: 'all' | 'success' | 'failed'
  search?: string
  window?: 'all' | '24h' | '7d'
}) {
  const search = new URLSearchParams()
  if (params?.page) search.set('page', String(params.page))
  if (params?.pageSize) search.set('page_size', String(params.pageSize))
  if (params?.model && params.model !== 'all') search.set('model', params.model)
  if (params?.token && params.token !== 'all') search.set('token', params.token)
  if (params?.group && params.group !== 'all') search.set('group', params.group)
  if (params?.status && params.status !== 'all') search.set('status', params.status)
  if (params?.search?.trim()) search.set('search', params.search.trim())
  if (params?.window && params.window !== 'all') search.set('window', params.window)

  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request<UsageListResponse>(`/usage${suffix}`)
}

export async function getAnnouncementsRequest() {
  return request<AnnouncementItem[]>('/announcements')
}

export async function getBillingRequest() {
  return request<BillingSummary & { source?: string; message?: string }>('/billing')
}

export async function getPricingRequest() {
  return request<PricingSummary>('/pricing')
}
