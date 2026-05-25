import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { existsSync } from 'node:fs'
import path from 'node:path'
import {
  announcements,
  billing,
  dashboard,
} from './data'

const app = express()
const port = Number(process.env.PORTAL_API_PORT || 3001)
const upstreamBase = process.env.UPSTREAM_BASE_URL || 'http://127.0.0.1:3000'
const portalApiBase = process.env.PORTAL_API_BASE || '/portal-api'
const serveStatic = process.env.PORTAL_SERVE_STATIC !== 'false'
const distDir = path.resolve(process.cwd(), 'dist')
const sessionSecret = process.env.PORTAL_SESSION_SECRET || 'sub2api-secret-key-change-in-production'
const publicApiOrigin = (process.env.PUBLIC_API_ORIGIN || 'https://api.token688.cn').replace(/\/+$/, '')

if (!process.env.UPSTREAM_BASE_URL) {
  console.warn('UPSTREAM_BASE_URL is not set. Falling back to internal upstream http://127.0.0.1:3000')
}

type UpstreamSession = {
  username: string
  userId: number
  cookie: string
}

type UpstreamListResponse<T> = {
  data?: {
    items?: T[]
  } | T[]
}

type UpstreamKeyRecord = {
  id?: string | number
  name?: string
  key?: string
  status?: number
  group?: string | number
  created_time?: number
  accessed_time?: number
  remain_quota?: number
  used_quota?: number
  unlimited_quota?: boolean
  expired_time?: number
}

class HttpError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

declare module 'express-session' {
  interface SessionData {
    upstream?: UpstreamSession
  }
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json())
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
)

async function upstreamFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${upstreamBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    const message =
      data?.message ||
      data?.error?.message ||
      `Upstream request failed: ${response.status}`
    throw new Error(message)
  }
  return data
}

async function upstreamLogin(username: string, password: string) {
  const response = await fetch(`${upstreamBase}/api/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) {
    const message =
      data?.message ||
      data?.error?.message ||
      `Upstream login failed: ${response.status}`
    throw new Error(message)
  }

  const setCookieHeader = response.headers.get('set-cookie') || ''
  return {
    username: data.data?.username ?? username,
    userId: Number(data.data?.id ?? 0),
    cookie: setCookieHeader,
  }
}

function requireSession(req: express.Request) {
  if (!req.session.upstream) {
    throw new HttpError(401, 'Please log in again')
  }

  return {
    Cookie: req.session.upstream.cookie,
    'New-Api-User': String(req.session.upstream.userId),
  }
}

function formatTime(timestamp: unknown) {
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return '-'
  return new Date(value * 1000).toLocaleString('zh-CN', { hour12: false })
}

function listItems<T>(response: UpstreamListResponse<T>) {
  if (Array.isArray(response.data)) return response.data
  return response.data?.items ?? []
}

function getErrorStatus(error: unknown, fallback = 502) {
  if (error instanceof HttpError) return error.statusCode
  return fallback
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message
  return fallback
}

const router = express.Router()

router.get('/auth/config', (_req, res) => {
  ;(async () => {
    try {
      const data = await upstreamFetch('/api/status')
      res.json({
        emailVerification: Boolean(data.data?.email_verification),
        registerEnabled: Boolean(data.data?.register_enabled ?? true),
        passwordRegisterEnabled: Boolean(data.data?.password_register_enabled ?? true),
      })
    } catch {
      res.json({
        emailVerification: false,
        registerEnabled: true,
        passwordRegisterEnabled: true,
      })
    }
  })()
})

router.get('/auth/verification', (req, res) => {
  ;(async () => {
    try {
      const email = String(req.query.email ?? '').trim()
      if (!email) {
        res.status(400).json({ message: '请输入邮箱地址' })
        return
      }

      const params = new URLSearchParams({ email })
      const data = await upstreamFetch(`/api/verification?${params.toString()}`, {
        method: 'GET',
      })

      res.json({
        message: data.message || '验证码已发送',
        success: true,
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '发送验证码失败',
      })
    }
  })()
})

router.post('/auth/login', (req, res) => {
  ;(async () => {
    try {
      const { username, password } = req.body ?? {}
      if (!username || !password) {
        res.status(400).json({ message: '请输入用户名和密码' })
        return
      }

      const upstream = await upstreamLogin(username, password)
      req.session.upstream = upstream

      res.json({
        user: {
          id: String(upstream.userId),
          name: upstream.username,
        },
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '登录失败',
      })
    }
  })()
})

router.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: '退出登录失败' })
      return
    }

    res.status(204).end()
  })
})

router.post('/auth/register', (req, res) => {
  ;(async () => {
    try {
      const { username, password, email, verification_code } = req.body ?? {}
      if (!username || !password) {
        res.status(400).json({ message: '请输入用户名和密码' })
        return
      }

      const data = await upstreamFetch('/api/user/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          email: email || '',
          verification_code: verification_code || '',
        }),
      })

      res.json({
        message: data.message || '注册成功',
        success: true,
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '注册失败',
      })
    }
  })()
})

router.get('/me', (req, res) => {
  if (!req.session.upstream) {
    res.status(401).json({ message: '当前未登录' })
    return
  }

  res.json({
    user: {
      id: String(req.session.upstream.userId),
      name: req.session.upstream.username,
    },
  })
})

router.get('/dashboard', (req, res) => {
  ;(async () => {
    try {
      const headers = requireSession(req)
      const [userData, modelsData, keysData] = await Promise.all([
        upstreamFetch('/api/user/self', { headers }),
        upstreamFetch('/api/user/models', { headers }),
        upstreamFetch('/api/token/?p=0&size=20', { headers }),
      ])

      const quota = Number(userData.data?.quota ?? 0)
      const usedQuota = Number(userData.data?.used_quota ?? 0)
      const quotaPerUnit = 500000
      const availableModels = (modelsData.data ?? []).slice(0, 8).map((item: string) => ({
        id: item,
        label: item,
        description: 'Models available to this account',
        status: 'available' as const,
      }))
      const keyItems = listItems<UpstreamKeyRecord>(keysData)

      res.json({
        balanceUsd: quota / quotaPerUnit,
        usedUsd: usedQuota / quotaPerUnit,
        keyCount: keyItems.length,
        baseUrl: `${publicApiOrigin}/v1`,
        defaultKey: '',
        availableModels: availableModels.length > 0 ? availableModels : dashboard.availableModels,
        source: 'upstream',
      })
    } catch (error) {
      res.status(getErrorStatus(error)).json({
        message: getErrorMessage(error, 'Failed to load dashboard'),
      })
    }
  })()
})

router.get('/keys', (req, res) => {
  ;(async () => {
    try {
      const data = await upstreamFetch('/api/token/?p=0&size=100', {
        headers: requireSession(req),
      })

      const items = listItems<UpstreamKeyRecord>(data).map((item) => ({
        id: String(item.id),
        name: String(item.name ?? item.key?.slice(0, 8) ?? 'Key'),
        value: String(item.key ?? ''),
        createdAt: formatTime(item.created_time),
        lastUsedAt: formatTime(item.accessed_time),
        status: Number(item.status) === 1 ? 'active' : 'disabled',
        groupId: item.group ? String(item.group) : undefined,
        remainQuotaUsd: Number(item.remain_quota ?? 0) / 500000,
        usedQuotaUsd: Number(item.used_quota ?? 0) / 500000,
        unlimitedQuota: Boolean(item.unlimited_quota),
        expiredTime: Number(item.expired_time ?? -1),
      }))

      res.json(items)
    } catch (error) {
      res.status(getErrorStatus(error)).json({
        message: getErrorMessage(error, 'Failed to load API keys'),
      })
    }
  })()
})

router.post('/keys/:id/value', (req, res) => {
  ;(async () => {
    try {
      const data = await upstreamFetch(`/api/token/${req.params.id}/key`, {
        method: 'POST',
        headers: requireSession(req),
      })

      res.json({
        key: String(data.data?.key ?? ''),
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '获取完整 Key 失败',
      })
    }
  })()
})

router.post('/keys', (req, res) => {
  ;(async () => {
    try {
      const { name, models, unlimited_quota, remain_quota, expired_time, group_id } = req.body ?? {}
      const keyName = String(name ?? '').trim() || '新建 Key'

      const payload: Record<string, unknown> = {
        name: keyName,
        unlimited_quota: unlimited_quota !== false,
      }

      if (unlimited_quota === false && remain_quota) {
        payload.remain_quota = Number(remain_quota)
      } else {
        payload.remain_quota = 50000000
      }

      if (Array.isArray(models) && models.length > 0) {
        payload.models = models
      }

      if (group_id) {
        payload.group = String(group_id)
      }

      if (expired_time) {
        payload.expired_time = Number(expired_time)
      }

      const createResp = await upstreamFetch('/api/token/', {
        method: 'POST',
        headers: requireSession(req),
        body: JSON.stringify(payload),
      })

      const listData = await upstreamFetch('/api/token/?p=0&size=20', {
        headers: requireSession(req),
      })

      const items = listItems<UpstreamKeyRecord>(listData)
      const latestKey =
        items.find((item) => String(item.name ?? '') === keyName) ??
        items.find((item) => String(item.id ?? '') === String(createResp.data?.id ?? '')) ??
        items[0]

      let fullKey = ''
      if (latestKey?.id) {
        try {
          const keyData = await upstreamFetch(`/api/token/${latestKey.id}/key`, {
            method: 'POST',
            headers: requireSession(req),
          })
          fullKey = String(keyData.data?.key ?? '')
        } catch {
          fullKey = ''
        }
      }

      res.status(201).json({
        id: String(createResp.data?.id ?? latestKey?.id ?? Date.now()),
        name: keyName,
        value: fullKey,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        lastUsedAt: '-',
        status: 'active',
        groupId: latestKey?.group ? String(latestKey.group) : undefined,
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '创建 Key 失败',
      })
    }
  })()
})

router.put('/keys', (req, res) => {
  ;(async () => {
    try {
      const { id, name, unlimited_quota, remain_quota, expired_time, group_id, status } = req.body ?? {}

      if (!id) {
        res.status(400).json({ message: '缺少 Key id' })
        return
      }

      const payload: Record<string, unknown> = {
        id: Number(id),
        name: String(name ?? '').trim(),
        unlimited_quota: Boolean(unlimited_quota),
        remain_quota: Number(remain_quota ?? 0),
        expired_time: Number(expired_time ?? -1),
      }

      if (group_id !== undefined) {
        payload.group = String(group_id || '')
      }

      if (status !== undefined) {
        payload.status = Number(status)
      }

      const data = await upstreamFetch('/api/token/', {
        method: 'PUT',
        headers: requireSession(req),
        body: JSON.stringify(payload),
      })

      const item = data.data ?? {}

      res.json({
        id: String(item.id ?? id),
        name: String(item.name ?? name ?? ''),
        value: String(item.key ?? ''),
        createdAt: formatTime(item.created_time),
        lastUsedAt: formatTime(item.accessed_time),
        status: Number(item.status) === 1 ? 'active' : 'disabled',
        groupId: item.group ? String(item.group) : undefined,
        remainQuotaUsd: Number(item.remain_quota ?? 0) / 500000,
        usedQuotaUsd: Number(item.used_quota ?? 0) / 500000,
        unlimitedQuota: Boolean(item.unlimited_quota),
        expiredTime: Number(item.expired_time ?? -1),
      })
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '更新 Key 失败',
      })
    }
  })()
})

router.delete('/keys/:id', (req, res) => {
  ;(async () => {
    try {
      await upstreamFetch(`/api/token/${req.params.id}`, {
        method: 'DELETE',
        headers: requireSession(req),
      })
      res.status(204).end()
    } catch (error) {
      res.status(400).json({
        message: error instanceof Error ? error.message : '删除 Key 失败',
      })
    }
  })()
})

router.get('/usage', (req, res) => {
  ;(async () => {
    try {
      const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1)
      const pageSize = Math.min(
        100,
        Math.max(10, Number.parseInt(String(req.query.page_size ?? '20'), 10) || 20),
      )
      const model = String(req.query.model ?? '').trim()
      const token = String(req.query.token ?? '').trim()
      const group = String(req.query.group ?? '').trim()
      const status = String(req.query.status ?? '').trim()
      const keyword = String(req.query.search ?? '').trim()
      const window = String(req.query.window ?? 'all').trim()

      const now = Date.now()
      let startTimestamp = 0
      if (window === '24h') {
        startTimestamp = Math.floor((now - 24 * 60 * 60 * 1000) / 1000)
      } else if (window === '7d') {
        startTimestamp = Math.floor((now - 7 * 24 * 60 * 60 * 1000) / 1000)
      }

      const params = new URLSearchParams({
        p: String(page),
        page_size: String(pageSize),
        type: status === 'failed' ? '5' : '0',
        start_timestamp: String(startTimestamp),
        end_timestamp: '0',
        model_name: model,
        token_name: token,
      })

      if (group) params.set('group', group)

      const data = await upstreamFetch(`/api/log/self/?${params.toString()}`, {
        headers: requireSession(req),
      })

      let items = listItems<Record<string, unknown>>(data)
        .map((item) => ({
          other: (() => {
            try {
              return JSON.parse(String(item.other ?? '{}'))
            } catch {
              return {}
            }
          })(),
          id: String(item.id),
          time: formatTime(item.created_at),
          model: String(item.model_name ?? ''),
          costUsd: Number(item.quota ?? 0) / 500000,
          tokens: Number(item.prompt_tokens ?? 0) + Number(item.completion_tokens ?? 0),
          status: Number(item.type) === 5 ? 'failed' : 'success',
          promptTokens: Number(item.prompt_tokens ?? 0),
          completionTokens: Number(item.completion_tokens ?? 0),
          tokenName: String(item.token_name ?? ''),
          group: String(item.group ?? ''),
          requestId: String(item.request_id ?? ''),
          upstreamRequestId: String(item.upstream_request_id ?? ''),
          requestPath: '',
          useTimeSeconds: Number(item.use_time ?? 0),
          isStream: Boolean(item.is_stream),
          cacheTokens: 0,
          cacheCreationTokens: 0,
          cacheWriteTokens: 0,
          cacheRatio: 0,
          cacheCreationRatio: 0,
        }))
        .map((entry) => ({
          ...entry,
          requestPath: String((entry as { other: Record<string, unknown> }).other.request_path ?? ''),
          cacheTokens: Number((entry as { other: Record<string, unknown> }).other.cache_tokens ?? 0),
          cacheCreationTokens: Number((entry as { other: Record<string, unknown> }).other.cache_creation_tokens ?? 0),
          cacheWriteTokens: Number((entry as { other: Record<string, unknown> }).other.cache_write_tokens ?? 0),
          cacheRatio: Number((entry as { other: Record<string, unknown> }).other.cache_ratio ?? 0),
          cacheCreationRatio: Number((entry as { other: Record<string, unknown> }).other.cache_creation_ratio ?? 0),
        }))
        .map(({ other, ...rest }) => rest)

      if (keyword) {
        const lowered = keyword.toLowerCase()
        items = items.filter((item) =>
          [
            item.model,
            item.tokenName,
            item.group,
            item.requestId,
            item.upstreamRequestId,
            item.requestPath,
          ]
            .join(' ')
            .toLowerCase()
            .includes(lowered),
        )
      }

      res.json({
        items,
        total: Number(data.data?.total ?? items.length),
        page,
        pageSize,
      })
    } catch (error) {
      res.status(getErrorStatus(error)).json({
        message: getErrorMessage(error, 'Failed to load usage logs'),
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
      })
    }
  })()
})

router.get('/announcements', (_req, res) => {
  res.json(announcements)
})

router.get('/billing', (req, res) => {
  ;(async () => {
    try {
      const headers = requireSession(req)
      const userData = await upstreamFetch('/api/user/self', { headers })

      const quota = Number(userData.data?.quota ?? 0)
      const usedQuota = Number(userData.data?.used_quota ?? 0)
      const quotaPerUnit = 500000

      res.json({
        balanceUsd: quota / quotaPerUnit,
        usedUsd: usedQuota / quotaPerUnit,
        note: billing.note,
        contact: billing.contact,
        source: 'upstream',
      })
    } catch (error) {
      res.status(getErrorStatus(error)).json({
        message: getErrorMessage(error, 'Failed to load billing data'),
      })
    }
  })()
})

router.get('/pricing', (req, res) => {
  ;(async () => {
    try {
      const headers = requireSession(req)
      const data = await upstreamFetch('/api/pricing', { headers })
      res.json(data)
    } catch (error) {
      res.status(502).json({
        success: false,
        message: error instanceof Error ? error.message : '获取模型定价失败',
      })
    }
  })()
})

app.use(portalApiBase, router)

if (serveStatic && existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith(portalApiBase)) {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Portal API listening on http://localhost:${port}${portalApiBase}`)
})
