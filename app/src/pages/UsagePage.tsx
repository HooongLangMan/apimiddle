import { useEffect, useState } from 'react'
import { Calendar, DollarSign, Eye, TrendingUp, Zap } from 'lucide-react'
import { UsageDetailModal } from '../components/UsageDetailModal'
import { PageHeader } from '../components/PageHeader'
import { getUsageRequest } from '../apiClient'
import type { UsageItem } from '../types'

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return `${value}`
}

export function UsagePage() {
  const [usage, setUsage] = useState<UsageItem[]>([])
  const [error, setError] = useState('')
  const [selectedModel, setSelectedModel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedWindow, setSelectedWindow] = useState<'all' | '24h' | '7d'>('all')
  const [referenceNow] = useState(() => Date.now())
  const [selectedDetail, setSelectedDetail] = useState<UsageItem | null>(null)

  useEffect(() => {
    getUsageRequest()
      .then(setUsage)
      .catch((err) => setError(err instanceof Error ? err.message : '获取使用记录失败'))
  }, [])

  const modelOptions = ['all', ...Array.from(new Set(usage.map((item) => item.model).filter(Boolean)))]

  const filteredUsage = usage.filter((item) => {
    if (selectedModel !== 'all' && item.model !== selectedModel) return false
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false

    if (selectedWindow !== 'all') {
      const parsed = new Date(item.time.replace(/-/g, '/')).getTime()
      if (Number.isNaN(parsed)) return false
      const range = selectedWindow === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
      if (referenceNow - parsed > range) return false
    }

    return true
  })

  const totalCost = filteredUsage.reduce((sum, item) => sum + item.costUsd, 0)
  const totalTokens = filteredUsage.reduce((sum, item) => sum + item.tokens, 0)
  const successCount = filteredUsage.filter((item) => item.status === 'success').length
  const successRate =
    filteredUsage.length > 0 ? ((successCount / filteredUsage.length) * 100).toFixed(1) : '0.0'

  const recentActivity = filteredUsage.slice(0, 8)

  return (
    <div className="page dashboard-page">
      <PageHeader
        title="使用记录"
        description="保留概览统计，同时支持查看每一次调用的更详细信息。"
      />

      {error ? <div className="alert error">{error}</div> : null}

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>筛选</h2>
            <p className="panel-description">先把范围缩小，再看消费、模型和详细日志会更清楚。</p>
          </div>
        </div>
        <div className="log-filter-grid">
          <label className="log-filter-item">
            <span>时间范围</span>
            <select value={selectedWindow} onChange={(e) => setSelectedWindow(e.target.value as 'all' | '24h' | '7d')}>
              <option value="all">全部</option>
              <option value="24h">近 24 小时</option>
              <option value="7d">近 7 天</option>
            </select>
          </label>
          <label className="log-filter-item">
            <span>模型</span>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {modelOptions.map((model) => (
                <option key={model} value={model}>
                  {model === 'all' ? '全部模型' : model}
                </option>
              ))}
            </select>
          </label>
          <label className="log-filter-item">
            <span>状态</span>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
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
            <span>累计消费</span>
            <strong>${totalCost.toFixed(4)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Zap size={18} />
          </div>
          <div className="stat-content">
            <span>总 Tokens</span>
            <strong>{formatCompactNumber(totalTokens)}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={18} />
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
            <span>记录数</span>
            <strong>{filteredUsage.length}</strong>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>最近活动</h2>
            <p className="panel-description">最近几次调用直接看，并支持一键打开详情。</p>
          </div>
        </div>

        <div className="dashboard-rank-list">
          {recentActivity.length === 0 ? (
            <div className="empty-state">还没有最近调用记录。</div>
          ) : (
            recentActivity.map((item) => (
              <article key={item.id} className="dashboard-rank-item">
                <div className="dashboard-rank-head">
                  <div>
                    <strong>{item.model || '未知模型'}</strong>
                    <span>{item.time}</span>
                  </div>
                </div>
                <div className="dashboard-rank-metrics">
                  <div>
                    <span>状态</span>
                    <strong>{item.status === 'success' ? '成功' : '失败'}</strong>
                  </div>
                  <div>
                    <span>消费</span>
                    <strong>${item.costUsd.toFixed(4)}</strong>
                  </div>
                </div>
                <div className="table-actions">
                  <button className="icon-button" onClick={() => setSelectedDetail(item)} title="详情">
                    <Eye size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>最近调用记录</h2>
            <p className="panel-description">支持查看模型、消费、Tokens 以及每条记录的详细信息。</p>
          </div>
        </div>
        {filteredUsage.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">记录</div>
            <h3>暂无使用记录</h3>
            <p>开始调用 API 之后，这里会展示最近的用量明细。</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>模型</th>
                  <th>消费 (USD)</th>
                  <th>Tokens</th>
                  <th>状态</th>
                  <th>详情</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsage.map((item) => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td className="model-name">{item.model}</td>
                    <td className="cost-cell">${item.costUsd.toFixed(4)}</td>
                    <td className="tokens-cell">{item.tokens.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${item.status}`}>
                        {item.status === 'success' ? '成功' : '失败'}
                      </span>
                    </td>
                    <td>
                      <button className="icon-button" onClick={() => setSelectedDetail(item)} title="详情">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedDetail ? (
        <UsageDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
      ) : null}
    </div>
  )
}
