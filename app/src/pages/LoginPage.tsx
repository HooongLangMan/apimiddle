import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../useAuth'

type LocationState = {
  message?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const successMessage = (location.state as LocationState | null)?.message

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      await login(username, password)
      navigate('/console')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>登录控制台</h1>
            <p>登录后可查看余额、创建 API Key，并获取接入地址。</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {successMessage ? <div className="success-message">{successMessage}</div> : null}
            {error ? <div className="error-message">{error}</div> : null}

            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              还没有账号？{' '}
              <a
                href="/register"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/register')
                }}
              >
                立即注册
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
