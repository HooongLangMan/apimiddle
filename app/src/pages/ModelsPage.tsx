import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Layers3, Shield, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getPricingRequest } from '../apiClient'
import {
  derivePricingGroupOptions,
  matchesPricingGroup,
  type PricingGroupOption,
} from '../pricingGroups'
import type { PricingItem, PricingSummary } from '../types'

type ModelFamily = 'all' | 'claude' | 'gpt' | 'gemini' | 'other'

type ModelSummary = {
  key: string
  primary: PricingItem
  variants: string[]
  groups: string[]
}

function formatMoney(value: number) {
  return `$${value.toFixed(value % 1 === 0 ? 0 : 2)} / 1M`
}

function getModelUseCase(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('opus')) return '适合复杂推理、长上下文和更重的代码工作流。'
  if (lower.includes('sonnet')) return '适合日常使用、内容任务和常规开发需求。'
  if (lower.includes('gpt')) return '适合 OpenAI 风格接入、产品功能和通用应用场景。'
  if (lower.includes('gemini')) return '适合多模态工作流和 Google 生态相关集成。'
  return '按当前账号和后台分组权限可访问。'
}

function getEndpointLabel(key: string) {
  if (key === 'anthropic') return 'Anthropic'
  if (key === 'openai') return 'OpenAI 兼容'
  if (key === 'gemini') return 'Gemini'
  return key
}

function inferFamily(name: string): ModelFamily {
  const lower = name.toLowerCase()
  if (lower.includes('claude')) return 'claude'
  if (
    lower.includes('gpt') ||
    lower.startsWith('o1') ||
    lower.startsWith('o3') ||
    lower.startsWith('o4')
  ) {
    return 'gpt'
  }
  if (lower.includes('gemini')) return 'gemini'
  return 'other'
}

function normalizeModelKey(name: string) {
  return name
    .replace(/-(max|xhigh|high|medium|low)$/i, '')
    .replace(/-\d{8}$/i, '')
    .replace(/-thinking$/i, '')
}

function getModelPriority(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('gpt-5.5')) return 0
  if (lower.includes('claude-opus-4-7')) return 1
  if (lower.includes('claude-opus-4-6')) return 2
  if (lower.includes('claude-sonnet-4-6')) return 3
  if (lower.includes('claude-sonnet')) return 4
  if (lower.includes('gpt-5.4')) return 5
  if (lower.includes('claude')) return 6
  if (lower.includes('gpt')) return 7
  if (lower.includes('gemini')) return 8
  return 99
}

function summarizeModels(items: PricingItem[]): ModelSummary[] {
  const grouped = new Map<string, PricingItem[]>()

  for (const item of items) {
    const key = normalizeModelKey(item.model_name)
    const bucket = grouped.get(key) ?? []
    bucket.push(item)
    grouped.set(key, bucket)
  }

  return Array.from(grouped.entries())
    .map(([key, variants]) => {
      const primary = [...variants].sort((a, b) => a.model_name.localeCompare(b.model_name))[0]
      const groups = Array.from(new Set(variants.flatMap((item) => item.enable_groups ?? []))).sort()
      return {
        key,
        primary,
        variants: variants.map((item) => item.model_name).sort(),
        groups,
      }
    })
    .sort((a, b) => {
      const priorityDiff = getModelPriority(a.primary.model_name) - getModelPriority(b.primary.model_name)
      if (priorityDiff !== 0) return priorityDiff
      return a.primary.model_name.localeCompare(b.primary.model_name)
    })
}

function pickDefaultGroup(modelGroups: PricingGroupOption[]) {
  return modelGroups[0]?.id ?? ''
}

export function ModelsPage() {
  const [pricing, setPricing] = useState<PricingSummary | null>(null)
  const [error, setError] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<ModelFamily>('all')
  const [selectedGroupByModel, setSelectedGroupByModel] = useState<Record<string, string>>({})

  useEffect(() => {
    getPricingRequest()
      .then(setPricing)
      .catch((err) => setError(err instanceof Error ? err.message : '获取模型信息失败'))
  }, [])

  const groupOptions = useMemo(() => derivePricingGroupOptions(pricing), [pricing])

  const summarizedModels = useMemo(() => {
    if (!pricing) return []
    const filtered = pricing.data.filter((item) => {
      if (selectedFamily === 'all') return true
      return inferFamily(item.model_name) === selectedFamily
    })
    return summarizeModels(filtered)
  }, [pricing, selectedFamily])

  const supportedEndpoints = useMemo(() => {
    if (!pricing) return []
    return Object.entries(pricing.supported_endpoint)
  }, [pricing])

  const familyCounts = useMemo(() => {
    if (!pricing) {
      return { all: 0, claude: 0, gpt: 0, gemini: 0, other: 0 }
    }

    return pricing.data.reduce(
      (acc, item) => {
        acc.all += 1
        acc[inferFamily(item.model_name)] += 1
        return acc
      },
      { all: 0, claude: 0, gpt: 0, gemini: 0, other: 0 } as Record<ModelFamily, number>,
    )
  }, [pricing])

  const highlightedGroups = useMemo(() => {
    return groupOptions.filter((group) => group.family === 'Claude' || group.family === 'GPT')
  }, [groupOptions])

  useEffect(() => {
    if (!summarizedModels.length || !groupOptions.length) return

    setSelectedGroupByModel((current) => {
      const next = { ...current }
      for (const model of summarizedModels) {
        const availableGroups = groupOptions.filter((group) =>
          model.groups.some((groupId) => matchesPricingGroup(group, groupId)),
        )
        if (!availableGroups.length) continue

        const currentSelected = next[model.key]
        const stillValid = availableGroups.some((group) => group.id === currentSelected)
        if (!stillValid) {
          next[model.key] = pickDefaultGroup(availableGroups)
        }
      }
      return next
    })
  }, [groupOptions, summarizedModels])

  if (error) {
    return <div className="loading-card">{error}</div>
  }

  if (!pricing) {
    return <div className="loading-card">正在加载模型信息...</div>
  }

  return (
    <div className="page">
      <PageHeader
        title="可用模型"
        description="现在可以直接在模型卡里切换倍率分组，实时看到对应分组下的输入价和输出价。"
      />

      <section className="stats-grid compact">
        <article className="stat-card">
          <div className="stat-icon">
            <Layers3 size={20} />
          </div>
          <div className="stat-content">
            <span>模型系列</span>
            <strong>{summarizedModels.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Shield size={20} />
          </div>
          <div className="stat-content">
            <span>倍率分组</span>
            <strong>{groupOptions.length}</strong>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-icon">
            <Sparkles size={20} />
          </div>
          <div className="stat-content">
            <span>支持协议</span>
            <strong>{supportedEndpoints.length}</strong>
          </div>
        </article>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>当前倍率分组</h2>
            <p className="panel-description">
              已按你最新的后台配置对齐到 Claude 0.45x、0.6x、0.85x 和 GPT 0.3x。
            </p>
          </div>
        </div>

        <div className="group-overview-grid">
          {highlightedGroups.map((group) => (
            <article key={group.id} className={`group-overview-card family-${group.family.toLowerCase()}`}>
              <div className="group-overview-head">
                <strong>{group.name}</strong>
                <span>{group.shortName}</span>
              </div>
              <p>{group.description}</p>
              <div className="group-chip-row">
                {group.modelNames.slice(0, 6).map((modelName) => (
                  <span key={modelName} className="group-model-chip">
                    {modelName}
                  </span>
                ))}
                {group.modelNames.length > 6 ? (
                  <span className="group-model-chip muted">+{group.modelNames.length - 6}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>模型分类</h2>
            <p className="panel-description">先按模型家族筛，再看每个模型在不同倍率下的实际价格。</p>
          </div>
        </div>

        <div className="model-family-tabs">
          {[
            { key: 'all', label: '全部' },
            { key: 'claude', label: 'Claude' },
            { key: 'gpt', label: 'GPT' },
            { key: 'gemini', label: 'Gemini' },
            { key: 'other', label: '其他' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              className={`model-family-tab${selectedFamily === item.key ? ' active' : ''}`}
              onClick={() => setSelectedFamily(item.key as ModelFamily)}
            >
              <span>{item.label}</span>
              <strong>{familyCounts[item.key as ModelFamily]}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card">
        <div className="section-head">
          <div>
            <h2>模型列表</h2>
            <p className="panel-description">
              点模型卡里的倍率按钮，就能直接看到该倍率下的输入价和输出价，不用自己心算。
            </p>
          </div>
        </div>

        <div className="model-grid">
          {summarizedModels.map(({ key, primary, variants, groups }) => {
            const availableGroups = groupOptions.filter((group) =>
              groups.some((groupId) => matchesPricingGroup(group, groupId)),
            )
            const selectedGroupId = selectedGroupByModel[key] || pickDefaultGroup(availableGroups)
            const selectedGroup =
              availableGroups.find((group) => group.id === selectedGroupId) ?? availableGroups[0]
            const isTokenBased = primary.quota_type === 0
            const baseInputPrice = isTokenBased ? primary.model_ratio * 2 : primary.model_price || 0
            const baseOutputPrice = isTokenBased
              ? primary.model_ratio * 2 * (primary.completion_ratio || 1)
              : primary.model_price || 0
            const actualInputPrice = selectedGroup ? baseInputPrice * selectedGroup.ratio : baseInputPrice
            const actualOutputPrice = selectedGroup ? baseOutputPrice * selectedGroup.ratio : baseOutputPrice

            return (
              <article key={key} className="model-card">
                <div className="model-card-head">
                  <div>
                    <strong>{primary.model_name}</strong>
                    <div className="model-id">
                      {primary.supported_endpoint_types.map(getEndpointLabel).join(' · ')}
                    </div>
                  </div>
                  <span className="status-dot available">可用</span>
                </div>

                <p>{primary.description || getModelUseCase(primary.model_name)}</p>

                {availableGroups.length > 0 ? (
                  <div className="model-group-section">
                    <span>查看倍率价格</span>
                    <div className="model-group-toggle">
                      {availableGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className={`model-group-button${group.id === selectedGroupId ? ' active' : ''}`}
                          onClick={() =>
                            setSelectedGroupByModel((current) => ({
                              ...current,
                              [key]: group.id,
                            }))
                          }
                        >
                          {group.shortName}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="model-price-box">
                  <div className="model-price-line">
                    <span>输入价</span>
                    <strong>{formatMoney(actualInputPrice)}</strong>
                  </div>
                  <div className="model-price-line">
                    <span>输出价</span>
                    <strong>{formatMoney(actualOutputPrice)}</strong>
                  </div>
                  <div className="model-price-line">
                    <span>当前倍率</span>
                    <strong>{selectedGroup ? selectedGroup.shortName : '基础价'}</strong>
                  </div>
                </div>

                <div className="model-meta-row">
                  <span className="model-meta-chip">{getModelUseCase(primary.model_name)}</span>
                </div>

                <div className="model-group-section">
                  <span>可用分组</span>
                  <div className="group-chip-row">
                    {availableGroups.map((group) => (
                      <span key={group.id} className="group-model-chip">
                        {group.name}
                      </span>
                    ))}
                  </div>
                </div>

                {variants.length > 1 ? (
                  <div className="model-variant-list">
                    <span>已折叠的变体</span>
                    <div className="model-variant-chips">
                      {variants
                        .filter((variant) => variant !== primary.model_name)
                        .map((variant) => (
                          <span key={variant} className="model-variant-chip">
                            {variant}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="panel-grid">
        <article className="panel-card">
          <div className="section-head">
            <div>
              <h2>支持协议</h2>
              <p className="panel-description">这里展示的是当前账号实际可走的上游协议入口。</p>
            </div>
          </div>
          <div className="protocol-simple-grid">
            {supportedEndpoints.map(([key, endpoint]) => (
              <article key={key} className="protocol-simple-card">
                <strong>{getEndpointLabel(key)}</strong>
                <code>
                  {endpoint.method} {endpoint.path}
                </code>
              </article>
            ))}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <div>
              <h2>全部倍率分组</h2>
              <p className="panel-description">这个区块继续直接读取后台返回，不再依赖前端手工维护。</p>
            </div>
          </div>
          <div className="pricing-group-list">
            {groupOptions.map((group) => (
              <div key={group.id} className="pricing-group-item">
                <div>
                  <strong>{group.name}</strong>
                  <span>
                    {group.family} · {group.shortName} · {group.modelCount} 个模型系列
                  </span>
                </div>
                <BookOpen size={16} />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
