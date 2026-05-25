import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BookOpen,
  ExternalLink,
  KeyRound,
  Layers3,
  ReceiptText,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getDashboardRequest, getUsageRequest } from '../apiClient'
import { useAuth } from '../useAuth'
import type { DashboardSummary, UsageItem } from '../types'

type DashboardResponse = DashboardSummary & {
  source?: string
  message?: string
}

type DailyTrendItem = {
  label: string
  calls: number
  cost: number
  tokens: number
}

type HoveredTrendPoint = DailyTrendItem & {
  x: number
  y: number
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return `${value}`
}

function buildLinePath(values: number[], width: number, height: number, offsetX = 0, offsetY = 0) {
  if (values.length === 0) return ''
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? width / (values.length - 1) : width

  return values
    .map((value, index) => {
      const x = offsetX + index * step
      const y = offsetY + height - (value / max) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [usage, setUsage] = useState<UsageItem[]>([])
  const [error, setError] = useState('')
  const [hoveredPoint, setHoveredPoint] = useState<HoveredTrendPoint | null>(null)

  useEffect(() => {
    Promise.all([getDashboardRequest(), getUsageRequest()])
      .then(([dashboard, usageItems]) => {
        setData(dashboard)
        setUsage(usageItems)
      })
      .catch((err) => setError(err instanceof Error ? err.message : '获取概览数据失败'))
  }, [])

  const activeKeyCount = useMemo(() => data?.activeKeyCount ?? data?.keyCount ?? 0, [data])

  const allTokens = useMemo(
    () => usage.reduce((sum, item) => sum + item.tokens, 0),
    [usage],
  )

  const totalCalls = useMemo(() => usage.length, [usage])

  const successCount = useMemo(
    () => usage.filter((item) => item.status === 'success').length,
    [usage],
  )

  const successRate = useMemo(() => {
    if (!usage.length) return 0
    return (successCount / usage.length) * 100
  }, [successCount, usage])

  const todaySummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return usage.reduce(
      (acc, item) => {
        const parsed = new Date(item.time.replace(/-/g, '/'))
        if (Number.isNaN(parsed.getTime())) return acc
        if (parsed.toISOString().slice(0, 10) !== today) return acc
        acc.calls += 1
        acc.cost += item.costUsd
        acc.tokens += item.tokens
        return acc
      },
      { calls: 0, cost: 0, tokens: 0 },
    )
  }, [usage])

  const trend = useMemo<DailyTrendItem[]>(() => {
    const bucket = new Map<string, DailyTrendItem>()
    const now = new Date()

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now)
      date.setDate(now.getDate() - offset)
      const key = date.toISOString().slice(0, 10)
      bucket.set(key, {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        calls: 0,
        cost: 0,
        tokens: 0,
      })
    }

    for (const item of usage) {
      const parsed = new Date(item.time.replace(/-/g, '/'))
      if (Number.isNaN(parsed.getTime())) continue
      const key = parsed.toISOString().slice(0, 10)
      const current = bucket.get(key)
      if (!current) continue
      current.calls += 1
      current.cost += item.costUsd
      current.tokens += item.tokens
    }

    return Array.from(bucket.values())
  }, [usage])

  const callPath = useMemo(
    () => buildLinePath(trend.map((item) => item.calls), 640, 160, 30, 20),
    [trend],
  )

  const costPath = useMemo(
    () => buildLinePath(trend.map((item) => item.cost), 640, 160, 30, 20),
    [trend],
  )

  const usageRate = useMemo(() => {
    if (!data) return 0
    const total = data.balanceUsd + data.usedUsd
    if (total <= 0) return 0
    return Math.min(100, (data.usedUsd / total) * 100)
  }, [data])

  if (error) {
    return <div className="loading-card">{error}</div>
  }

  if (!data) {
    return <div className="loading-card">正在加载概览数据...</div>
  }

  return (
    <div className="page dashboard-page">
      <PageHeader
        title={`晚上好，${user?.name ?? '用户'}`}
        description="这里集中展示余额、今日概览和调用趋势，先把账号状态看清楚。"
      />

      <section className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-icon">
            <Wallet size={18} />
          </div>
          <div className="stat-content">
            <span>余额</span>
            <strong>${data.balanceUsd.toFixed(2)}</strong>
          </div>
          <div className="mini-chart">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
              <path className="mini-chart-path mini-chart-balance" d={costPath} />
            </svg>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Activity size={18} />
          </div>
          <div className="stat-content">
            <span>累计消耗</span>
            <strong>${data.usedUsd.toFixed(2)}</strong>
          </div>
          <div className="mini-chart">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
              <path className="mini-chart-path mini-chart-cost" d={costPath} />
            </svg>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <KeyRound size={18} />
          </div>
          <div className="stat-content">
            <span>API 密钥</span>
            <strong>{activeKeyCount}</strong>
          </div>
          <div className="stat-footnote">{totalCalls} 次累计调用</div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Sparkles size={18} />
          </div>
          <div className="stat-content">
            <span>成功率</span>
            <strong>{successRate.toFixed(1)}%</strong>
          </div>
          <div className="mini-chart">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true">
              <path className="mini-chart-path mini-chart-success" d={callPath} />
            </svg>
          </div>
        </article>
      </section>

      <section className="stats-grid compact">
        <article className="stat-card">
          <div className="stat-icon">
            <ReceiptText size={18} />
          </div>
          <div className="stat-content">
            <span>今日请求</span>
            <strong>{todaySummary.calls}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={18} />
          </div>
          <div className="stat-content">
            <span>今日消耗</span>
            <strong>${todaySummary.cost.toFixed(4)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Layers3 size={18} />
          </div>
          <div className="stat-content">
            <span>今日 Token</span>
            <strong>{formatCompactNumber(todaySummary.tokens)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <BookOpen size={18} />
          </div>
          <div className="stat-content">
            <span>累计 Token</span>
            <strong>{formatCompactNumber(allTokens)}</strong>
          </div>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <div className="section-head">
            <div>
              <h2>账户概览</h2>
              <p className="panel-description">把账户状态、配额消耗和基础入口集中到一起。</p>
            </div>
          </div>

          <div className="info-row">
            <span>Base URL</span>
            <code>{data.baseUrl}</code>
          </div>

          <div className="info-row">
            <span>服务状态</span>
            <code>{data.message ? data.message : '服务正常，可直接调用'}</code>
          </div>

          <div className="info-row">
            <span>请求总数</span>
            <code>{totalCalls}</code>
          </div>

          <div className="dashboard-progress-block">
            <div className="dashboard-progress-header">
              <strong>累计消耗占比</strong>
              <span>{usageRate.toFixed(1)}%</span>
            </div>
            <div className="dashboard-progress-track">
              <div className="dashboard-progress-bar" style={{ width: `${usageRate}%` }} />
            </div>
            <p className="panel-description">按当前余额和累计消耗估算你的用量节奏。</p>
          </div>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <div>
              <h2>常用入口</h2>
              <p className="panel-description">把最常用的操作放在这里，少跳页面。</p>
            </div>
          </div>

          <div className="quick-links">
            <a className="quick-link" href="/console/keys">
              <div className="quick-link-content">
                <KeyRound size={16} />
                <div>
                  <strong>管理 API Keys</strong>
                  <span>创建、查看和删除密钥</span>
                </div>
              </div>
              <ExternalLink size={14} />
            </a>

            <a className="quick-link" href="/console/models">
              <div className="quick-link-content">
                <Layers3 size={16} />
                <div>
                  <strong>进入模型广场</strong>
                  <span>看实时模型、Gemini 新系列和各分组价格</span>
                </div>
              </div>
              <ExternalLink size={14} />
            </a>

            <a className="quick-link" href="/console/usage">
              <div className="quick-link-content">
                <TrendingUp size={16} />
                <div>
                  <strong>查看日志栏</strong>
                  <span>最近调用、排行和分布都放到那边</span>
                </div>
              </div>
              <ExternalLink size={14} />
            </a>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>调用折线趋势</h2>
            <p className="panel-description">把请求次数和消耗拉成折线，变化会比单个条目更容易看清楚。</p>
          </div>
        </div>

        <div className="dashboard-line-chart">
          <div className="dashboard-line-legend">
            <span><i className="line-dot line-dot-blue" /> 请求次数</span>
            <span><i className="line-dot line-dot-green" /> 消耗金额</span>
          </div>
          {hoveredPoint ? (
            <div className="dashboard-line-tooltip">
              <strong>{hoveredPoint.label}</strong>
              <span>请求 {hoveredPoint.calls} 次</span>
              <span>消耗 ${hoveredPoint.cost.toFixed(4)}</span>
              <span>{formatCompactNumber(hoveredPoint.tokens)} tokens</span>
            </div>
          ) : null}
          <svg viewBox="0 0 700 220" preserveAspectRatio="none" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <line
                key={index}
                x1="0"
                x2="700"
                y1={20 + index * 50}
                y2={20 + index * 50}
                className="dashboard-line-grid"
              />
            ))}
            <path d={callPath} className="dashboard-line-series line-series-blue" />
            <path d={costPath} className="dashboard-line-series line-series-green" />
            {trend.map((item, index) => {
              const step = trend.length > 1 ? 640 / (trend.length - 1) : 640
              const x = 30 + step * index
              const maxCalls = Math.max(...trend.map((entry) => entry.calls), 1)
              const maxCost = Math.max(...trend.map((entry) => entry.cost), 1)
              const callsY = 20 + 160 - (item.calls / maxCalls) * 160
              const costY = 20 + 160 - (item.cost / maxCost) * 160
              return (
                <g key={item.label}>
                  <rect
                    x={x - 18}
                    y={12}
                    width={36}
                    height={182}
                    className="dashboard-line-column-hitbox"
                    onMouseEnter={() => setHoveredPoint({ ...item, x, y: Math.min(callsY, costY) })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle
                    cx={x}
                    cy={callsY}
                    r="5"
                    className="dashboard-line-hitbox"
                    onMouseEnter={() => setHoveredPoint({ ...item, x, y: callsY })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle
                    cx={x}
                    cy={costY}
                    r="5"
                    className="dashboard-line-hitbox"
                    onMouseEnter={() => setHoveredPoint({ ...item, x, y: costY })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <circle cx={x} cy={callsY} r="3.5" className="dashboard-line-point line-point-blue" />
                  <circle cx={x} cy={costY} r="3.5" className="dashboard-line-point line-point-green" />
                  <text x={x} y="210" textAnchor="middle" className="dashboard-line-label">
                    {item.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </section>
    </div>
  )
}
