import { PageHeader } from '../components/PageHeader'
import { publicApiBase, publicApiOrigin } from '../config'

const curlExample = `curl ${publicApiBase}/chat/completions \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-opus-4-7",
    "messages": [
      {
        "role": "user",
        "content": "你好，请简单介绍一下你自己。"
      }
    ]
  }'`

const powershellExample = `Invoke-RestMethod \`
  -Uri "${publicApiBase}/chat/completions" \`
  -Method Post \`
  -Headers @{
    Authorization = "Bearer your-api-key"
    "Content-Type" = "application/json"
  } \`
  -Body '{
    "model": "claude-opus-4-7",
    "messages": [
      {
        "role": "user",
        "content": "你好，请简单介绍一下你自己。"
      }
    ]
  }'`

export function DocsPage() {
  return (
    <div className="page">
      <PageHeader
        title="接入文档"
        description="保留最需要的接入信息，适合复制给开发者或直接粘贴进项目配置。"
      />

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>基本信息</h2>
            <p className="panel-description">先确认平台地址、兼容入口和鉴权方式。</p>
          </div>
        </div>
        <div className="doc-list">
          <div>
            <strong>平台地址</strong>
            <code>{publicApiOrigin}</code>
          </div>
          <div>
            <strong>OpenAI 兼容 Base URL</strong>
            <code>{publicApiBase}</code>
          </div>
          <div>
            <strong>鉴权方式</strong>
            <code>Authorization: Bearer your-api-key</code>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>如何获取 Key</h2>
            <p className="panel-description">控制台生成并保存密钥后，即可开始接入。</p>
          </div>
        </div>
        <ol className="ordered-list">
          <li>登录控制台后进入 API Keys 页面。</li>
          <li>创建新的 Key，并立即复制保存。</li>
          <li>将 Key 配置到你的 SDK、脚本或客户端里。</li>
        </ol>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>调用示例</h2>
            <p className="panel-description">以下示例适合用于快速联调或验证接口是否已经接通。</p>
          </div>
        </div>
        <div className="code-block">
          <div className="code-title">curl</div>
          <pre>{curlExample}</pre>
        </div>
        <div className="code-block">
          <div className="code-title">PowerShell</div>
          <pre>{powershellExample}</pre>
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>说明</h2>
            <p className="panel-description">上线前通常只需要确认下面三点。</p>
          </div>
        </div>
        <ul className="bullet-list">
          <li>支持通过控制台生成和管理 API Key。</li>
          <li>具体可用模型以当前账号的实时权限为准。</li>
          <li>如果你使用第三方客户端，通常只需要填入 Base URL 和 Key。</li>
        </ul>
      </section>
    </div>
  )
}
