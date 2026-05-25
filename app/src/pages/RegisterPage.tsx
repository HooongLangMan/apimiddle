import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAuthConfigRequest,
  registerRequest,
  sendEmailVerificationRequest,
} from '../apiClient'
import type { AuthConfig } from '../types'

const defaultAuthConfig: AuthConfig = {
  emailVerification: false,
  registerEnabled: true,
  passwordRegisterEnabled: true,
}

const resendCooldownSeconds = 60

export default function RegisterPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<AuthConfig>(defaultAuthConfig)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    getAuthConfigRequest()
      .then(setConfig)
      .catch(() => {
        setConfig(defaultAuthConfig)
      })
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function handleSendCode() {
    setError('')
    setInfo('')

    if (!email) {
      setError('请输入邮箱地址')
      return
    }

    setSendingCode(true)
    try {
      await sendEmailVerificationRequest(email)
      setInfo('验证码已发送，请检查邮箱。')
      setCountdown(resendCooldownSeconds)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败，请稍后重试')
    } finally {
      setSendingCode(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setInfo('')

    if (!config.registerEnabled) {
      setError('当前暂未开放新用户注册')
      return
    }

    if (!config.passwordRegisterEnabled) {
      setError('当前未开放密码注册，请联系管理员')
      return
    }

    if (!username || !password || !confirmPassword) {
      setError('请填写所有必填项')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 8) {
      setError('密码长度至少 8 位')
      return
    }

    if (config.emailVerification) {
      if (!email) {
        setError('当前注册要求填写邮箱地址')
        return
      }
      if (!verificationCode) {
        setError('请输入邮箱验证码')
        return
      }
    }

    setLoading(true)
    try {
      await registerRequest(username, password, email || undefined, verificationCode || undefined)
      navigate('/login', {
        state: { message: '注册成功，请登录' },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const sendButtonLabel = sendingCode
    ? '发送中...'
    : countdown > 0
      ? `${countdown}s 后重发`
      : '发送验证码'

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>创建账号</h1>
            <p>注册后即可进入控制台，管理 API Key、查看模型和跟踪用量。</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error ? <div className="error-message">{error}</div> : null}
            {info ? <div className="success-message">{info}</div> : null}

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
              <label htmlFor="email">
                邮箱{config.emailVerification ? '（必填）' : '（选填）'}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  config.emailVerification ? '请输入用于接收验证码的邮箱' : '可选，用于接收通知'
                }
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {config.emailVerification ? (
              <div className="form-group">
                <label htmlFor="verificationCode">邮箱验证码</label>
                <div className="verification-row">
                  <input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入验证码"
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                  <button
                    type="button"
                    className="btn-secondary verification-button"
                    onClick={handleSendCode}
                    disabled={sendingCode || loading || countdown > 0}
                  >
                    {sendButtonLabel}
                  </button>
                </div>
                <div className="form-group-hint">
                  验证码会发送到你填写的邮箱，请在有效期内完成验证。
                </div>
              </div>
            ) : null}

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入密码"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              已有账号？{' '}
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/login')
                }}
              >
                去登录
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
