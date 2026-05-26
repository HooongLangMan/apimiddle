import { useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Copy,
  KeyRound,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react'
import { publicApiBase, publicApiOrigin } from '../config'

const highlights = [
  {
    title: '兼容主流 SDK',
    description: '支持 OpenAI 兼容调用，便于接入脚本、应用和各类桌面客户端。',
    icon: Code2,
  },
  {
    title: 'Key 管理清晰',
    description: '支持创建、查看和调整 API Key，适合按设备、项目或成员拆分使用。',
    icon: KeyRound,
  },
  {
    title: '用量记录透明',
    description: '余额、日志、分组和近期调用都能在控制台里直接查看，减少对账成本。',
    icon: Shield,
  },
  {
    title: '接入更直接',
    description: '准备好 Base URL 和 API Key 后即可开始联调，不需要额外维护多套入口。',
    icon: Zap,
  },
]

const featuredModels = [
  {
    name: 'GPT 5.5',
    id: 'gpt-5.5',
    badge: '旗舰推理',
    badgeTone: 'orange',
    description: '适合高强度推理、复杂工具链调用和更高要求的产品级任务，是当前 GPT 体系里的高阶主力模型。',
    features: ['高阶推理', '复杂工作流', '产品集成', '主力模型'],
    pricing: 'GPT 主力',
  },
  {
    name: 'Claude Opus 4.7',
    id: 'claude-opus-4-7',
    badge: '旗舰模型',
    badgeTone: 'purple',
    description: '适合复杂推理、代码生成和高质量长文本任务，适用于对稳定性和输出质量要求更高的场景。',
    features: ['复杂推理', '代码能力', '长上下文', '高质量输出'],
    pricing: '高端主力',
  },
  {
    name: 'Claude Opus 4.6',
    id: 'claude-opus-4-6',
    badge: '推荐主力',
    badgeTone: 'blue',
    description: '综合表现更均衡，适合作为日常生产中的通用模型，适合大部分常见开发与内容场景。',
    features: ['通用主力', '稳定响应', '多任务处理', '生产可用'],
    pricing: '均衡选择',
  },
  {
    name: 'Gemini 2.5 Flash',
    id: 'gemini-2.5-flash',
    badge: '多模态优先',
    badgeTone: 'green',
    description: '适合高频生产调用，兼顾响应速度、成本控制和多模态能力，适合作为轻量主力模型。',
    features: ['多模态', '响应更快', '成本友好', '高频调用'],
    pricing: '效率优先',
  },
]

const codeExamples = [
  {
    language: 'Python',
    code: `from openai import OpenAI

client = OpenAI(
    api_key="your-api-key",
    base_url="${publicApiBase}"
)

resp = client.chat.completions.create(
    model="gpt-5.5",
    messages=[
        {"role": "user", "content": "你好，请简单介绍一下你自己。"}
    ]
)

print(resp.choices[0].message.content)`,
  },
  {
    language: 'JavaScript',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "your-api-key",
  baseURL: "${publicApiBase}"
});

const resp = await client.chat.completions.create({
  model: "gpt-5.5",
  messages: [
    { role: "user", content: "你好，请简单介绍一下你自己。" }
  ]
});

console.log(resp.choices[0].message.content);`,
  },
  {
    language: 'cURL',
    code: `curl ${publicApiBase}/chat/completions \\
  -H "Authorization: Bearer your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.5",
    "messages": [
      {"role": "user", "content": "你好，请简单介绍一下你自己。"}
    ]
  }'`,
  },
]

const faqs = [
  {
    q: '怎么开始使用？',
    a: '注册并登录后，在控制台创建 API Key，然后把 Base URL 和 API Key 配置到你的客户端或代码里即可。',
  },
  {
    q: '入口地址是什么？',
    a: `正式接口入口为 ${publicApiBase}。如果你使用 OpenAI 兼容 SDK，通常只需要设置这个地址和 API Key。`,
  },
  {
    q: '可用模型从哪里看？',
    a: '登录后进入“模型广场”即可查看当前账号可用的模型、分组和价格信息。',
  },
  {
    q: '余额和消耗怎么看？',
    a: '登录后在“余额与充值”和“使用记录”页面可以查看当前余额、累计消耗和最近调用情况。',
  },
]

export function LandingPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeCodeTab, setActiveCodeTab] = useState(0)

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(id)
    window.setTimeout(() => setCopiedCode(null), 2000)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="brand-mark">688</div>
          <div>
            <div className="brand-title">688 API Portal</div>
            <div className="brand-subtitle">统一 AI API 接入平台</div>
          </div>
        </div>

        <nav className="nav-links">
          <button onClick={() => scrollToSection('highlights')} className="nav-link">
            产品特点
          </button>
          <button onClick={() => scrollToSection('featured-models')} className="nav-link">
            模型介绍
          </button>
          <button onClick={() => scrollToSection('code-examples')} className="nav-link">
            接入示例
          </button>
          <button onClick={() => scrollToSection('faq')} className="nav-link">
            常见问题
          </button>
        </nav>

        <div className="landing-actions">
          <a className="landing-link" href="/console">
            控制台
          </a>
          <a className="landing-button" href="/login">
            登录使用
          </a>
        </div>
      </header>

      <section className="hero-minimal">
        <div className="hero-minimal-copy">
          <div className="hero-badge">
            <Sparkles size={14} />
            统一接入与用量管理
          </div>
          <h1>主流 AI 模型统一接入，密钥、模型和用量都在一个控制台里。</h1>
          <p>
            一个稳定入口，覆盖模型接入、API Key 管理、调用记录和接入示例，适合个人开发者、小团队和内部业务系统。
          </p>

          <div className="hero-stats">
            <div className="hero-stat">
              <strong>OpenAI</strong>
              <span>兼容风格调用</span>
            </div>
            <div className="hero-stat">
              <strong>HTTPS</strong>
              <span>统一对外入口</span>
            </div>
            <div className="hero-stat">
              <strong>Key</strong>
              <span>按需创建与管理</span>
            </div>
          </div>

          <div className="hero-buttons">
            <a className="landing-button" href="/login">
              进入控制台
              <ArrowRight size={16} />
            </a>
            <a className="landing-secondary" href="/console/docs">
              <BookOpen size={16} />
              <span>查看接入文档</span>
            </a>
          </div>

          <div className="hero-note">当前接入入口：{publicApiOrigin}</div>
        </div>
      </section>

      <section id="highlights" className="landing-section">
        <div className="section-header">
          <div className="section-kicker">产品特点</div>
          <h2 className="section-title">把接入、密钥和用量放到一个控制台里</h2>
          <p className="section-description">
            减少分散配置、来回切换和人工核对，让日常接入和维护更直接。
          </p>
        </div>

        <div className="feature-grid">
          {highlights.map(({ title, description, icon: Icon }) => (
            <div key={title} className="feature-card">
              <div className="feature-icon-wrapper">
                <Icon size={24} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="featured-models" className="landing-section">
        <div className="section-header">
          <div className="section-kicker">主推模型</div>
          <h2 className="section-title">主力模型推荐</h2>
          <p className="section-description">
            按能力定位和使用场景做了简要整理，方便你快速选型。
          </p>
        </div>

        <div className="model-cards">
          {featuredModels.map((model) => (
            <article key={model.id} className={`model-card model-card-${model.badgeTone}`}>
              <div className="model-card-header">
                <div>
                  <div className="model-badge">{model.badge}</div>
                  <h3 className="model-name">{model.name}</h3>
                  <p className="model-id">{model.id}</p>
                </div>
                <div className="model-pricing">{model.pricing}</div>
              </div>

              <p className="model-description">{model.description}</p>

              <div className="model-features">
                {model.features.map((feature) => (
                  <div key={feature} className="model-feature">
                    <div className="feature-icon">✓</div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="code-examples" className="landing-section code-section">
        <div className="section-header">
          <div className="section-kicker">
            <Code2 size={16} />
            接入示例
          </div>
          <h2 className="section-title">复制示例后即可开始联调</h2>
          <p className="section-description">
            提供最常见的调用方式，方便你快速确认客户端、脚本或项目配置是否已经接通。
          </p>
        </div>

        <div className="code-example-container">
          <div className="code-tabs">
            {codeExamples.map((example, index) => (
              <button
                key={example.language}
                className={`code-tab ${activeCodeTab === index ? 'active' : ''}`}
                onClick={() => setActiveCodeTab(index)}
              >
                {example.language}
              </button>
            ))}
          </div>

          <div className="code-content">
            <button
              className="code-copy-btn"
              onClick={() =>
                handleCopyCode(codeExamples[activeCodeTab].code, `code-${activeCodeTab}`)
              }
            >
              {copiedCode === `code-${activeCodeTab}` ? (
                <>
                  <Check size={16} />
                  已复制
                </>
              ) : (
                <>
                  <Copy size={16} />
                  复制代码
                </>
              )}
            </button>

            <pre className="code-block">
              <code>{codeExamples[activeCodeTab].code}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="landing-section compact">
        <div className="section-kicker">常用协议</div>
        <div className="protocol-simple-grid">
          <article className="protocol-simple-card">
            <strong>OpenAI 兼容</strong>
            <code>{publicApiBase}</code>
          </article>
          <article className="protocol-simple-card">
            <strong>Anthropic 协议</strong>
            <code>{publicApiOrigin}/v1/messages</code>
          </article>
        </div>
      </section>

      <section id="faq" className="landing-section compact">
        <div className="section-kicker">常见问题</div>
        <div className="faq-simple-list">
          {faqs.map((item) => (
            <article key={item.q} className="faq-simple-item">
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
