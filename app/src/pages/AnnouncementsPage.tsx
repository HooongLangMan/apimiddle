import { useEffect, useState } from 'react'
import { AlertCircle, Clock, Info, Megaphone, Sparkles } from 'lucide-react'
import { contactCard } from '../contactInfo'
import { PageHeader } from '../components/PageHeader'
import { getAnnouncementsRequest } from '../apiClient'
import type { AnnouncementItem } from '../types'

function getAnnouncementType(title: string) {
  if (title.includes('维护') || title.includes('故障')) return 'maintenance'
  if (title.includes('功能') || title.includes('上线')) return 'feature'
  if (title.includes('重要') || title.includes('紧急')) return 'important'
  return 'info'
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'maintenance':
      return '维护通知'
    case 'feature':
      return '功能更新'
    case 'important':
      return '重要公告'
    default:
      return '普通通知'
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'maintenance':
      return <AlertCircle size={20} />
    case 'feature':
      return <Sparkles size={20} />
    case 'important':
      return <Megaphone size={20} />
    default:
      return <Info size={20} />
  }
}

export function AnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([])

  useEffect(() => {
    getAnnouncementsRequest().then(setItems)
  }, [])

  const recentCount = items.filter((item) => {
    const date = new Date(item.createdAt)
    const now = new Date()
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 7
  }).length

  return (
    <div className="page">
      <PageHeader
        title="系统公告"
        description="查看维护通知、功能更新和对账号使用有影响的重要消息。"
      />

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>售后与技术支持</h2>
            <p className="panel-description">如需协助处理额度、模型、密钥或调用问题，可以直接联系管理员或加入技术交流群。</p>
          </div>
        </div>
        <div className="doc-list">
          <div>
            <strong>Telegram 管理员</strong>
            <code>{contactCard.telegramHandle}</code>
          </div>
          <div>
            <strong>售后技术交流群 QQ</strong>
            <code>{contactCard.qqGroup}</code>
          </div>
        </div>
      </section>

      <section className="announcement-stats">
        <div className="announcement-stat-card">
          <Megaphone size={24} />
          <div>
            <strong>{items.length}</strong>
            <span>公告总数</span>
          </div>
        </div>
        <div className="announcement-stat-card">
          <Clock size={24} />
          <div>
            <strong>{recentCount}</strong>
            <span>近 7 天更新</span>
          </div>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="panel-card">
          <div className="empty-state-card">
            <div className="empty-icon">通知</div>
            <h3>暂无公告</h3>
            <p>目前没有新的系统通知，有更新时会显示在这里。</p>
          </div>
        </section>
      ) : (
        <div className="announcement-list">
          {items.map((item) => {
            const type = getAnnouncementType(item.title)
            return (
              <article key={item.id} className={`announcement-card ${type}`}>
                <div className="announcement-type-badge">
                  {getTypeIcon(type)}
                  <span>{getTypeLabel(type)}</span>
                </div>
                <div className="announcement-header">
                  <h3>{item.title}</h3>
                  <time>{item.createdAt}</time>
                </div>
                <div className="announcement-content">
                  <p>{item.content}</p>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
