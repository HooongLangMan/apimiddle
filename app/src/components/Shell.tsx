import {
  Bell,
  BookOpen,
  ContactRound,
  CreditCard,
  Gauge,
  KeyRound,
  Layers3,
  LogOut,
  ReceiptText,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'
import { ContactModal } from './ContactModal'

const navItems = [
  { to: '/console', label: '概览', icon: Gauge },
  { to: '/console/keys', label: 'API Keys', icon: KeyRound },
  { to: '/console/models', label: '可用模型', icon: Layers3 },
  { to: '/console/usage', label: '使用记录', icon: ReceiptText },
  { to: '/console/docs', label: '接入文档', icon: BookOpen },
  { to: '/console/announcements', label: '公告', icon: Bell },
  { to: '/console/billing', label: '余额与充值', icon: CreditCard },
]

export function Shell() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">688</div>
          <div>
            <div className="brand-title">688 API Portal</div>
            <div className="brand-subtitle">用户控制台</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/console'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">688 API Portal</div>
            <div className="topbar-subtitle">管理你的额度、密钥和接入信息</div>
          </div>

          <div className="topbar-actions">
            <button className="ghost-button" onClick={() => setShowContactModal(true)}>
              <ContactRound size={16} />
              <span>联系管理员</span>
            </button>

            <button
              className="ghost-button"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <span>{user?.name ?? '当前用户'}</span>
              <LogOut size={16} />
              <span>退出登录</span>
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      {showContactModal ? <ContactModal onClose={() => setShowContactModal(false)} /> : null}
    </div>
  )
}
