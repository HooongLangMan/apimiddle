import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Filter,
  Layers3,
  Search,
  Timer,
  Zap,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { formatPricingGroupName } from '../pricingGroups'
import { getUsageRequest } from '../apiClient'
import type { UsageItem, UsageListResponse } from '../types'

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return `${value}`
}

function buildUniqueOptions(values: Array<string | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean))).sort()
}

function buildUsageSummary(item: UsageItem) {
  const groupLabel = item.group ? formatPricingGroupName(item.group) : '未分组'
  const tokenLabel = item.tokenName || '未命名 Token'
  return `${tokenLabel} · ${groupLabel}`
}

function buildUsageDetailLines(item: UsageItem) {
  const lines: string[] = []
  if (item.requestId) lines.push(`Request ID：${item.requestId}`)
  if (item.upstreamRequestId) lines.push(`上游 Request ID：${item.upstreamRequestId}`)
  if (item.requestPath) lines.push(`请求路径：${item.requestPath}`)
  if (item.useTimeSeconds !== undefined) lines.push(`耗时：${item.useTimeSeconds}s`)
  if (item.promptTokens !== undefined || item.completionTokens !== undefined) {
    lines.push(
      `Prompt / Completion：${Number(item.promptTokens ?? 0).toLocaleString()} / ${Number(item.completionTokens ?? 0).toLocaleString()}`,
    )
  }
  if (item.cacheTokens || item.cacheCreationTokens || item.cacheWriteTokens) {
    lines.push(
      `缓存：读 ${Number(item.cacheTokens ?? 0).toLocaleString()} · 建 ${Number(item.cacheCreationTokens ?? 0).toLocaleString()} · 写 ${Number(item.cacheWriteTokens ?? 0).toLocaleString()}`,
    )
  }
  return lines
}

export function UsagePage() {
  const [data, setData] = useState<UsageListResponse | null>(null)
  const [error, setError] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'failed'>('all')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedToken, setSelectedToken] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedWindow, setSelectedWindow] = useState<'all' | '24h' | '7d'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setPage(1)
  }, [selectedModel, selectedStatus, selectedGroup, selectedToken, search, selectedWindow, pageSize])

  useEffect(() => {
    let cancelled = false

    getUsageRequest({
      page,
      pageSize,
      model: selectedModel,
      token: selectedToken,
      group: selectedGroup,
      status: selectedStatus,
      search,
      window: selectedWindow,
    })
      .then((result) => {
        if (cancelled) return
        setData(result)
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '获取使用记录失败')
      })

    return () => {
      cancelled = true
    }
  }, [page, pageSize, search, selectedGroup, selectedModel, selectedStatus, selectedToken, selectedWindow])

  const usage = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const modelOptions = useMemo(() => buildUniqueOptions(usage.map((item) => item.model)), [usage])
  const groupOptions = useMemo(() => buildUniqueOptions(usage.map((item) => item.group)), [usage])
  const tokenOptions = useMemo(() => buildUniqueOptions(usage.map((item) => item.tokenName)), [usage])

  const totalCost = usage.reduce((sum, item) => sum + item.costUsd, 0)
  const totalTokens = usage.reduce((sum, item) => sum + item.tokens, 0)
  const successCount = usage.filter((item) => item.status === 'success').length
  const successRate = usage.length > 0 ? ((successCount / usage.length) * 100).toFixed(1) : '0.0'
  const averageLatency =
    usage.length > 0
      ? (usage.reduce((sum, item) => sum + Number(item.useTimeSeconds ?? 0), 0) / usage.length).toFixed(1)
      : '0.0'

  return (
    <div className="page dashboard-page">
      <PageHeader
        title="使用日志"
        description=""
      />

      {error ? <div className="alert error">{error}</div> : null}

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>日志筛选</h2>
          </div>
        </div>

        <div className="model-market-toolbar">
          <label className="model-market-search">
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索模型、Token、分组、请求 ID 或路径"
            />
          </label>
        </div>

        <div className="usage-filter-grid">
          <label className="log-filter-item">
            <span>时间范围</span>
            <select
              value={selectedWindow}
              onChange={(e) => setSelectedWindow(e.target.value as 'all' | '24h' | '7d')}
            >
              <option value="all">全部</option>
              <option value="24h">近 24 小时</option>
              <option value="7d">近 7 天</option>
            </select>
          </label>

          <label className="log-filter-item">
            <span>模型</span>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option value="all">全部模型</option>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="log-filter-item">
            <span>分组</span>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
              <option value="all">全部分组</option>
              {groupOptions.map((group) => (
                <option key={group} value={group}>
                  {formatPricingGroupName(group)}
                </option>
              ))}
            </select>
          </label>

          <label className="log-filter-item">
            <span>Token</span>
            <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)}>
              <option value="all">全部 Token</option>
              {tokenOptions.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </label>

          <label className="log-filter-item">
            <span>状态</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'success' | 'failed')}>
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </label>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card highlight">
          <div className="stat-icon">
            <DollarSign size={18} />
          </div>
          <div className="stat-content">
            <span>当前页消费</span>
            <strong>${totalCost.toFixed(4)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Zap size={18} />
          </div>
          <div className="stat-content">
            <span>当前页 Tokens</span>
            <strong>{formatCompactNumber(totalTokens)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Layers3 size={18} />
          </div>
          <div className="stat-content">
            <span>总记录数</span>
            <strong>{total}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Timer size={18} />
          </div>
          <div className="stat-content">
            <span>平均耗时</span>
            <strong>{averageLatency}s</strong>
          </div>
        </article>
      </section>

      <section className="stats-grid compact">
        <article className="stat-card">
          <div className="stat-icon">
            <Filter size={18} />
          </div>
          <div className="stat-content">
            <span>成功率</span>
            <strong>{successRate}%</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Calendar size={18} />
          </div>
          <div className="stat-content">
            <span>分页</span>
            <strong>
              {page} / {totalPages}
            </strong>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>日志列表</h2>
          </div>
        </div>

        {usage.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">日志</div>
            <h3>暂无匹配日志</h3>
            <p>换个筛选条件试试，或者等下一次 API 调用后再来看。</p>
          </div>
        ) : (
          <>
            <div className="usage-log-list">
              {usage.map((item) => {
                const expanded = expandedId === item.id
                const detailLines = buildUsageDetailLines(item)

                return (
                  <article key={item.id} className={`usage-log-row${expanded ? ' expanded' : ''}`}>
                    <button
                      type="button"
                      className="usage-log-summary"
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                    >
                      <div className="usage-log-main">
                        <span className={`usage-log-chevron${expanded ? ' expanded' : ''}`}>
                          <ChevronDown size={16} />
                        </span>
                        <strong>{item.time}</strong>
                        <span className="group-model-chip">{item.group ? formatPricingGroupName(item.group) : '未分组'}</span>
                        <span className="group-model-chip">{item.tokenName || '未命名 Token'}</span>
                        <span className="group-model-chip">{item.model || '-'}</span>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </span>
                      </div>

                      <div className="usage-log-metrics">
                        <span>{item.useTimeSeconds ? `${item.useTimeSeconds}s` : '-'}</span>
                        <span>{item.tokens.toLocaleString()}</span>
                        <strong>${item.costUsd.toFixed(6)}</strong>
                      </div>
                    </button>

                    {expanded ? (
                      <div className="usage-log-expanded">
                        <div className="usage-log-expanded-grid">
                          <div>
                            <span>摘要</span>
                            <strong>{buildUsageSummary(item)}</strong>
                          </div>
                          <div>
                            <span>Prompt / Completion</span>
                            <strong>
                              {Number(item.promptTokens ?? 0).toLocaleString()} / {Number(item.completionTokens ?? 0).toLocaleString()}
                            </strong>
                          </div>
                          <div>
                            <span>缓存读取</span>
                            <strong>{Number(item.cacheTokens ?? 0).toLocaleString()}</strong>
                          </div>
                          <div>
                            <span>请求路径</span>
                            <strong>{item.requestPath || '-'}</strong>
                          </div>
                        </div>

                        {detailLines.length ? (
                          <div className="usage-log-detail-lines">
                            {detailLines.map((line) => (
                              <code key={line}>{line}</code>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>

            <div className="usage-pagination">
              <span>
                显示第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 条
              </span>

              <div className="usage-pagination-controls">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  title="上一页"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="usage-page-indicator">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  title="下一页"
                >
                  <ChevronRight size={16} />
                </button>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={10}>每页 10 条</option>
                  <option value={20}>每页 20 条</option>
                  <option value={50}>每页 50 条</option>
                  <option value={100}>每页 100 条</option>
                </select>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
