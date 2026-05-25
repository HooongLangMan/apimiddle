import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Layers3,
  Search,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { getPricingRequest } from '../apiClient'
import {
  derivePricingGroupOptions,
  matchesPricingGroup,
  type PricingGroupOption,
} from '../pricingGroups'
import type { PricingItem, PricingSummary, PricingVendor } from '../types'

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
  if (lower.includes('opus')) return '复杂推理、长上下文、重代码任务'
  if (lower.includes('sonnet')) return '日常生产、内容生成、通用开发'
  if (lower.includes('gpt-5.5')) return '旗舰推理、复杂代理、主力调用'
  if (lower.includes('gpt')) return 'OpenAI 兼容接入、产品功能、通用工作流'
  if (lower.includes('gemini-3.1')) return '大上下文、多模态探索、预览能力验证'
  if (lower.includes('gemini-3')) return 'Google 新系列预览、多模态实验'
  if (lower.includes('gemini-2.5-pro')) return '复杂问答、重质量输出、多模态场景'
  if (lower.includes('gemini-2.5-flash')) return '高性价比调用、快响应、轻量生产'
  if (lower.includes('gemini')) return '多模态工作流和 Google 生态集成'
  return '按当前账号和后台分组权限动态可用'
}

function getModelDescription(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('claude-opus-4-7')) {
    return '更偏旗舰质量，适合复杂代码、长推理链条和对输出稳定性要求高的任务。'
  }
  if (lower.includes('claude-opus-4-6')) {
    return '综合能力更均衡，适合作为日常生产里的通用高端模型。'
  }
  if (lower.includes('claude-sonnet-4-6')) {
    return '适合成本更敏感的文本处理和常规工作流，作为高频调用更稳。'
  }
  if (lower.includes('gpt-5.5')) {
    return '偏向复杂代理、工具调用和主力产品场景，适合高质量输出。'
  }
  if (lower.includes('gpt-5.4')) {
    return '更适合兼顾稳定性和成本的 OpenAI 系列常规调用。'
  }
  if (lower.includes('gemini-3.1-pro-preview')) {
    return '大上下文和新能力验证更突出，适合你先做预览性质的接入测试。'
  }
  if (lower.includes('gemini-3-pro-preview')) {
    return '更偏高质量输出的预览版本，适合多模态和复杂问答探索。'
  }
  if (lower.includes('gemini-3-flash-preview')) {
    return '强调响应速度和预览能力平衡，适合轻量多模态试跑。'
  }
  if (lower.includes('gemini-2.5-pro')) {
    return '更适合质量优先的 Gemini 路线，适合作为复杂任务的主力选择。'
  }
  if (lower.includes('gemini-2.5-flash')) {
    return '偏高频调用和性价比路线，适合轻量生产和快速接口接入。'
  }
  return '模型说明会根据当前系列和接入方式动态整理。'
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
  if (lower.includes('gpt-5.4')) return 4
  if (lower.includes('gemini-3.1-pro-preview')) return 5
  if (lower.includes('gemini-3-pro-preview')) return 6
  if (lower.includes('gemini-3-flash-preview')) return 7
  if (lower.includes('gemini-2.5-pro')) return 8
  if (lower.includes('gemini-2.5-flash')) return 9
  if (lower.includes('claude')) return 10
  if (lower.includes('gpt')) return 11
  if (lower.includes('gemini')) return 12
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

function getVendorName(vendors: PricingVendor[], vendorId?: number) {
  if (!vendorId) return '未标注供应商'
  return vendors.find((vendor) => vendor.id === vendorId)?.name ?? '未标注供应商'
}

function getModelBadgeTone(family: ModelFamily) {
  if (family === 'claude') return 'claude'
  if (family === 'gpt') return 'gpt'
  if (family === 'gemini') return 'gemini'
  return 'other'
}

function getModelBadgeText(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes('preview')) return '预览'
  if (lower.includes('flash')) return '高性价比'
  if (lower.includes('opus') || lower.includes('gpt-5.5') || lower.includes('pro')) return '旗舰'
  return '稳定可用'
}

type ModelDetailModalProps = {
  model: ModelSummary
  pricing: PricingSummary
  groupOptions: PricingGroupOption[]
  selectedGroupId?: string
  onSelectGroup: (groupId: string) => void
  onClose: () => void
}

function ModelDetailModal({
  model,
  pricing,
  groupOptions,
  selectedGroupId,
  onSelectGroup,
  onClose,
}: ModelDetailModalProps) {
  const availableGroups = groupOptions.filter((group) =>
    model.groups.some((groupId) => matchesPricingGroup(group, groupId)),
  )
  const selectedGroup =
    availableGroups.find((group) => group.id === selectedGroupId) ?? availableGroups[0]
  const primary = model.primary
  const isTokenBased = primary.quota_type === 0
  const baseInputPrice = isTokenBased ? primary.model_ratio * 2 : primary.model_price || 0
  const baseOutputPrice = isTokenBased
    ? primary.model_ratio * 2 * (primary.completion_ratio || 1)
    : primary.model_price || 0
  const actualInputPrice = selectedGroup ? baseInputPrice * selectedGroup.ratio : baseInputPrice
  const actualOutputPrice = selectedGroup ? baseOutputPrice * selectedGroup.ratio : baseOutputPrice
  const vendorName = getVendorName(pricing.vendors, primary.vendor_id)
  const family = inferFamily(primary.model_name)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content model-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header model-detail-header">
          <div>
            <div className="model-market-card-badges">
              <span className={`model-market-badge badge-${getModelBadgeTone(family)}`}>
                {getModelBadgeText(primary.model_name)}
              </span>
              <span className="model-market-badge subtle">{vendorName}</span>
            </div>
            <h2>{primary.model_name}</h2>
            <p>{primary.description || getModelDescription(primary.model_name)}</p>
          </div>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body model-detail-body">
          <section className="model-detail-section">
            <div className="model-detail-stat-grid">
              <article className="model-detail-stat">
                <span>输入价</span>
                <strong>{formatMoney(actualInputPrice)}</strong>
              </article>
              <article className="model-detail-stat">
                <span>输出价</span>
                <strong>{formatMoney(actualOutputPrice)}</strong>
              </article>
              <article className="model-detail-stat">
                <span>当前倍率</span>
                <strong>{selectedGroup ? selectedGroup.shortName : '基础价'}</strong>
              </article>
            </div>
          </section>

          <section className="model-detail-section">
            <div className="section-head compact">
              <div>
                <h3>模型定位</h3>
                <p className="panel-description">{getModelUseCase(primary.model_name)}</p>
              </div>
            </div>
            <p className="model-detail-copy">{getModelDescription(primary.model_name)}</p>
          </section>

          <section className="model-detail-section">
            <div className="section-head compact">
              <div>
                <h3>倍率分组</h3>
                <p className="panel-description">切换你想查看的实际售卖倍率。</p>
              </div>
            </div>
            <div className="model-group-toggle">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`model-group-button${group.id === selectedGroup?.id ? ' active' : ''}`}
                  onClick={() => onSelectGroup(group.id)}
                >
                  {group.shortName}
                </button>
              ))}
            </div>
            <div className="group-chip-row">
              {availableGroups.map((group) => (
                <span key={group.id} className="group-model-chip">
                  {group.name}
                </span>
              ))}
            </div>
          </section>

          <section className="model-detail-section">
            <div className="section-head compact">
              <div>
                <h3>接入信息</h3>
                <p className="panel-description">这里是当前模型实际开放的协议和变体。</p>
              </div>
            </div>
            <div className="model-detail-info-grid">
              <div className="model-detail-info-card">
                <span>供应商</span>
                <strong>{vendorName}</strong>
              </div>
              <div className="model-detail-info-card">
                <span>协议</span>
                <strong>{primary.supported_endpoint_types.map(getEndpointLabel).join(' · ')}</strong>
              </div>
              <div className="model-detail-info-card">
                <span>计费方式</span>
                <strong>{isTokenBased ? '按 Token' : '固定价'}</strong>
              </div>
            </div>
          </section>

          {model.variants.length > 1 ? (
            <section className="model-detail-section">
              <div className="section-head compact">
                <div>
                  <h3>模型变体</h3>
                  <p className="panel-description">这些变体已经被收拢到当前模型卡下。</p>
                </div>
              </div>
              <div className="model-variant-chips">
                {model.variants.map((variant) => (
                  <span key={variant} className="model-variant-chip">
                    {variant}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ModelsPage() {
  const [pricing, setPricing] = useState<PricingSummary | null>(null)
  const [error, setError] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<ModelFamily>('all')
  const [selectedVendor, setSelectedVendor] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedGroupByModel, setSelectedGroupByModel] = useState<Record<string, string>>({})
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(null)

  useEffect(() => {
    getPricingRequest()
      .then(setPricing)
      .catch((err) => setError(err instanceof Error ? err.message : '获取模型信息失败'))
  }, [])

  const groupOptions = useMemo(() => derivePricingGroupOptions(pricing), [pricing])

  const allModels = useMemo(() => {
    if (!pricing) return []
    return summarizeModels(pricing.data)
  }, [pricing])

  const supportedEndpoints = useMemo(() => {
    if (!pricing) return []
    return Object.entries(pricing.supported_endpoint)
  }, [pricing])

  const vendorOptions = useMemo(() => {
    if (!pricing) return []
    const usedVendorIds = new Set(
      allModels
        .map((item) => item.primary.vendor_id)
        .filter((value): value is number => typeof value === 'number'),
    )

    return pricing.vendors.filter((vendor) => usedVendorIds.has(vendor.id))
  }, [allModels, pricing])

  const familyCounts = useMemo(() => {
    if (!allModels.length) {
      return { all: 0, claude: 0, gpt: 0, gemini: 0, other: 0 }
    }

    return allModels.reduce(
      (acc, item) => {
        const family = inferFamily(item.primary.model_name)
        acc.all += 1
        acc[family] += 1
        return acc
      },
      { all: 0, claude: 0, gpt: 0, gemini: 0, other: 0 } as Record<ModelFamily, number>,
    )
  }, [allModels])

  const highlightedGroups = useMemo(() => {
    return groupOptions.filter(
      (group) => group.family === 'Claude' || group.family === 'GPT' || group.family === 'Gemini',
    )
  }, [groupOptions])

  const visibleModels = useMemo(() => {
    if (!pricing) return []

    const normalizedSearch = search.trim().toLowerCase()

    return allModels.filter((item) => {
      const family = inferFamily(item.primary.model_name)
      const vendorName = getVendorName(pricing.vendors, item.primary.vendor_id)
      const haystack = [
        item.primary.model_name,
        vendorName,
        item.primary.description ?? '',
        ...item.variants,
        ...item.groups,
      ]
        .join(' ')
        .toLowerCase()

      if (selectedFamily !== 'all' && family !== selectedFamily) return false
      if (selectedVendor !== 'all' && String(item.primary.vendor_id ?? '') !== selectedVendor) return false
      if (normalizedSearch && !haystack.includes(normalizedSearch)) return false

      return true
    })
  }, [allModels, pricing, search, selectedFamily, selectedVendor])

  useEffect(() => {
    if (!visibleModels.length || !groupOptions.length) return

    setSelectedGroupByModel((current) => {
      const next = { ...current }
      for (const model of visibleModels) {
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
  }, [groupOptions, visibleModels])

  const selectedModel = useMemo(() => {
    if (!selectedModelKey) return null
    return allModels.find((item) => item.key === selectedModelKey) ?? null
  }, [allModels, selectedModelKey])

  if (error) {
    return <div className="loading-card">{error}</div>
  }

  if (!pricing) {
    return <div className="loading-card">正在加载模型广场...</div>
  }

  return (
    <div className="page">
      <PageHeader
        title="模型广场"
        description="这里直接读取 new-api 的实时定价与分组配置。你新加的 Gemini 模型、当前可用倍率和协议入口，都会在这里同步展示。"
      />

      <section className="stats-grid compact">
        <article className="stat-card">
          <div className="stat-icon">
            <Layers3 size={20} />
          </div>
          <div className="stat-content">
            <span>模型系列</span>
            <strong>{allModels.length}</strong>
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
              已对齐你线上真实配置。这里不再写死旧文案，删掉某个上游分组后，页面会按后台实时结果更新。
            </p>
          </div>
        </div>

        <div className="group-overview-grid">
          {highlightedGroups.map((group) => (
            <article
              key={group.id}
              className={`group-overview-card family-${group.family.toLowerCase()}`}
            >
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
            <h2>筛选模型</h2>
            <p className="panel-description">先按家族、供应商或关键词筛选，再点进详情看具体倍率和变体。</p>
          </div>
        </div>

        <div className="model-market-toolbar">
          <label className="model-market-search">
            <Search size={16} />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索模型名、供应商、描述或分组"
            />
          </label>

          <div className="model-market-selects">
            <select value={selectedVendor} onChange={(event) => setSelectedVendor(event.target.value)}>
              <option value="all">全部供应商</option>
              {vendorOptions.map((vendor) => (
                <option key={vendor.id} value={String(vendor.id)}>
                  {vendor.name}
                </option>
              ))}
            </select>
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
              卡片先只保留核心信息，点“查看详情”后再展开介绍、倍率价格和模型变体。
            </p>
          </div>
        </div>

        {visibleModels.length === 0 ? (
          <div className="empty-state">当前筛选条件下没有匹配到模型，试试清空搜索或切换分组。</div>
        ) : (
          <div className="model-grid model-market-grid compact">
            {visibleModels.map((model) => {
              const availableGroups = groupOptions.filter((group) =>
                model.groups.some((groupId) => matchesPricingGroup(group, groupId)),
              )
              const selectedGroupId = selectedGroupByModel[model.key] || pickDefaultGroup(availableGroups)
              const selectedGroup =
                availableGroups.find((group) => group.id === selectedGroupId) ?? availableGroups[0]
              const isTokenBased = model.primary.quota_type === 0
              const baseInputPrice = isTokenBased
                ? model.primary.model_ratio * 2
                : model.primary.model_price || 0
              const actualInputPrice = selectedGroup
                ? baseInputPrice * selectedGroup.ratio
                : baseInputPrice
              const family = inferFamily(model.primary.model_name)
              const vendorName = getVendorName(pricing.vendors, model.primary.vendor_id)

              return (
                <article
                  key={model.key}
                  className={`model-card model-market-card compact tone-${getModelBadgeTone(family)}`}
                >
                  <div className="model-market-card-head">
                    <div className="model-market-card-badges">
                      <span className={`model-market-badge badge-${getModelBadgeTone(family)}`}>
                        {getModelBadgeText(model.primary.model_name)}
                      </span>
                      <span className="model-market-badge subtle">{vendorName}</span>
                    </div>
                    <span className="status-dot available">可用</span>
                  </div>

                  <div className="model-card-head compact">
                    <div>
                      <strong>{model.primary.model_name}</strong>
                      <div className="model-id">
                        {model.primary.supported_endpoint_types.map(getEndpointLabel).join(' · ')}
                      </div>
                    </div>
                  </div>

                  <p className="model-card-summary">{getModelUseCase(model.primary.model_name)}</p>

                  <div className="model-card-footer">
                    <div className="model-card-price-brief">
                      <span>起始输入价</span>
                      <strong>{formatMoney(actualInputPrice)}</strong>
                    </div>

                    <button
                      type="button"
                      className="model-detail-trigger"
                      onClick={() => setSelectedModelKey(model.key)}
                    >
                      <span>查看详情</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
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

      {selectedModel && pricing ? (
        <ModelDetailModal
          model={selectedModel}
          pricing={pricing}
          groupOptions={groupOptions}
          selectedGroupId={selectedGroupByModel[selectedModel.key]}
          onSelectGroup={(groupId) =>
            setSelectedGroupByModel((current) => ({
              ...current,
              [selectedModel.key]: groupId,
            }))
          }
          onClose={() => setSelectedModelKey(null)}
        />
      ) : null}
    </div>
  )
}
