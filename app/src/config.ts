function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function normalizeApiBase(value: string) {
  const normalized = trimTrailingSlash(value.trim())
  if (!normalized) return '/portal-api'
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

export const portalApiBase = normalizeApiBase(
  import.meta.env.VITE_PORTAL_API_BASE || '/portal-api',
)

export const publicApiOrigin = trimTrailingSlash(
  import.meta.env.VITE_PUBLIC_API_ORIGIN || 'https://api.token688.cn',
)

export const publicApiBase = `${publicApiOrigin}/v1`

export function buildPortalApiUrl(path: string) {
  return `${portalApiBase}${path.startsWith('/') ? path : `/${path}`}`
}
