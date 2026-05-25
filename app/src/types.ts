export type ModelItem = {
  id: string
  label: string
  description: string
  status: 'available' | 'maintenance'
}

export type PricingItem = {
  model_name: string
  icon?: string
  tags?: string
  description?: string
  vendor_id?: number
  quota_type: number
  model_ratio: number
  model_price: number
  completion_ratio: number
  enable_groups: string[]
  supported_endpoint_types: string[]
  billing_mode?: string
  billing_expr?: string
  pricing_version?: string
}

export type PricingVendor = {
  id: number
  name: string
  icon?: string
}

export type PricingGroupInfo = string | { desc?: string; ratio?: number }

export type PricingEndpointInfo = {
  path: string
  method: string
}

export type PricingSummary = {
  data: PricingItem[]
  vendors: PricingVendor[]
  group_ratio: Record<string, number>
  usable_group: Record<string, PricingGroupInfo>
  supported_endpoint: Record<string, PricingEndpointInfo>
}

export type PricingGroupSnapshot = {
  group_ratio: Record<string, number>
  usable_group: Record<string, PricingGroupInfo>
  data: PricingItem[]
}

export type AuthConfig = {
  emailVerification: boolean
  registerEnabled: boolean
  passwordRegisterEnabled: boolean
}

export type DashboardSummary = {
  balanceUsd: number
  usedUsd: number
  keyCount: number
  baseUrl: string
  defaultKey: string
  availableModels: ModelItem[]
  activeKeyCount?: number
  availableModelCount?: number
}

export type ApiKeyItem = {
  id: string
  name: string
  value: string
  createdAt: string
  lastUsedAt: string
  status: 'active' | 'disabled'
  groupId?: string
  remainQuotaUsd?: number
  usedQuotaUsd?: number
  unlimitedQuota?: boolean
  expiredTime?: number
}

export type UsageItem = {
  id: string
  time: string
  model: string
  costUsd: number
  tokens: number
  status: 'success' | 'failed'
  promptTokens?: number
  completionTokens?: number
  tokenName?: string
  group?: string
  requestId?: string
  upstreamRequestId?: string
  requestPath?: string
  useTimeSeconds?: number
  isStream?: boolean
  cacheTokens?: number
  cacheCreationTokens?: number
  cacheWriteTokens?: number
  cacheRatio?: number
  cacheCreationRatio?: number
}

export type AnnouncementItem = {
  id: string
  title: string
  content: string
  createdAt: string
}

export type BillingSummary = {
  balanceUsd: number
  usedUsd: number
  note: string
  contact: string
}

export type ContactCard = {
  name: string
  role: string
  telegramHandle: string
  telegramLabel: string
  qqGroup: string
  qrImagePath: string
}
