import { useEffect, useState } from 'react'
import { CreditCard, Wallet } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getBillingRequest } from '../apiClient'
import type { BillingSummary } from '../types'

type BillingResponse = BillingSummary & {
  source?: string
  message?: string
}

export function BillingPage() {
  const [billing, setBilling] = useState<BillingResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getBillingRequest()
      .then(setBilling)
      .catch((err) => setError(err instanceof Error ? err.message : '获取余额信息失败'))
  }, [])

  if (error) return <div className="loading-card">{error}</div>
  if (!billing) return <div className="loading-card">正在加载余额信息...</div>

  return (
    <div className="page">
      <PageHeader
        title="余额与充值"
        description="查看当前余额、累计消耗和充值说明，方便对接管理员的额度补充流程。"
      />

      <section className="stats-grid compact">
        <article className="stat-card">
          <div className="stat-icon">
            <Wallet size={20} />
          </div>
          <div className="stat-content">
            <span>当前余额</span>
            <strong>${billing.balanceUsd.toFixed(2)}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <CreditCard size={20} />
          </div>
          <div className="stat-content">
            <span>累计消耗</span>
            <strong>${billing.usedUsd.toFixed(2)}</strong>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-content">
            <span>数据来源</span>
            <strong>{billing.source === 'fallback' ? '本地兜底' : '实时数据'}</strong>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>充值说明</h2>
            <p className="panel-description">当前充值仍以管理员通知和人工处理流程为准。</p>
          </div>
        </div>
        <p>{billing.note}</p>
        <div className="contact-box">{billing.contact}</div>
      </section>
    </div>
  )
}
