import type { PricingSummary } from './types'

export type PricingGroupFamily = 'Claude' | 'GPT' | 'Gemini' | 'Other'

export type PricingGroupOption = {
  id: string
  sourceIds: string[]
  name: string
  shortName: string
  family: PricingGroupFamily
  description: string
  ratio: number
  modelCount: number
  modelNames: string[]
}

const fallbackGroupRatios: Record<string, number> = {
  'claude 0.45x': 0.45,
  'claude 0.6x': 0.6,
  'claude 0.85x': 0.85,
  'gpt 0.3x': 0.3,
}

const hiddenGroupIds = new Set(['default', 'vip', 'svip'])

const legacyGroupDisplayNames: Record<string, string> = {
  default: '默认分组',
  vip: 'VIP 分组',
  svip: 'SVIP 分组',
  '测试': '测试分组',
  test: '测试分组',
  '25': '历史分组',
}

function inferPricingGroupFamily(groupName: string): PricingGroupFamily {
  const lower = groupName.toLowerCase()
  if (lower.includes('claude')) return 'Claude'
  if (lower.includes('gpt')) return 'GPT'
  if (lower.includes('gemini')) return 'Gemini'
  return 'Other'
}

function normalizeModelSeriesName(modelName: string) {
  return modelName
    .replace(/-(max|xhigh|high|medium|low)$/i, '')
    .replace(/-\d{8}$/i, '')
    .replace(/-thinking$/i, '')
}

function extractRatio(groupName: string) {
  const matched = groupName.match(/(\d+(?:\.\d+)?)x/i)
  return matched ? Number.parseFloat(matched[1]) : 1
}

function buildGroupDescription(modelCount: number) {
  if (modelCount <= 0) return '按当前后台分组配置创建密钥'
  return `覆盖 ${modelCount} 个模型系列`
}

function getGroupSortPriority(group: PricingGroupOption) {
  const familyOrder: Record<PricingGroupFamily, number> = {
    Claude: 0,
    GPT: 1,
    Gemini: 2,
    Other: 3,
  }
  return familyOrder[group.family]
}

export function normalizePricingGroupId(groupName: string) {
  const normalized = String(groupName || '').trim().toLowerCase()
  if (normalized === 'claude 0.8x') return 'claude 0.85x'
  return normalized
}

function shouldDisplayPricingGroup(groupId: string) {
  return !hiddenGroupIds.has(groupId)
}

export function formatPricingGroupName(groupName: string) {
  const raw = String(groupName || '').trim()
  if (!raw) return '未分组'

  const normalized = normalizePricingGroupId(raw)
  if (legacyGroupDisplayNames[raw]) return legacyGroupDisplayNames[raw]
  if (legacyGroupDisplayNames[normalized]) return legacyGroupDisplayNames[normalized]

  return raw
    .replace(/^claude\b/i, 'Claude')
    .replace(/^gpt\b/i, 'GPT')
    .replace(/^gemini\b/i, 'Gemini')
}

export function formatPricingGroupRatio(ratio: number) {
  return `${ratio.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}x`
}

export function formatPricingGroupShortName(groupName: string) {
  const ratio = extractRatio(groupName)
  return formatPricingGroupRatio(ratio)
}

export function matchesPricingGroup(option: PricingGroupOption, groupId: string) {
  const normalized = normalizePricingGroupId(groupId)
  return option.id === normalized || option.sourceIds.includes(normalized)
}

export function derivePricingGroupOptions(pricing?: PricingSummary | null): PricingGroupOption[] {
  const modelsByGroup = new Map<string, Set<string>>()
  const sourceIdsByGroup = new Map<string, Set<string>>()
  const displayNames = new Map<string, string>()
  const ratioByGroup = new Map<string, number>()

  const knownGroups =
    pricing && Object.keys(pricing.group_ratio ?? {}).length > 0
      ? Object.keys(pricing.group_ratio ?? {})
      : Object.keys(fallbackGroupRatios)

  for (const rawGroupName of knownGroups) {
    const normalizedId = normalizePricingGroupId(rawGroupName)
    displayNames.set(normalizedId, formatPricingGroupName(rawGroupName))
    ratioByGroup.set(
      normalizedId,
      pricing?.group_ratio?.[rawGroupName] ?? fallbackGroupRatios[normalizedId] ?? extractRatio(rawGroupName),
    )
    const sourceBucket = sourceIdsByGroup.get(normalizedId) ?? new Set<string>()
    sourceBucket.add(String(rawGroupName).trim().toLowerCase())
    sourceIdsByGroup.set(normalizedId, sourceBucket)
  }

  for (const item of pricing?.data ?? []) {
    for (const rawGroupName of item.enable_groups ?? []) {
      const normalizedId = normalizePricingGroupId(rawGroupName)
      const sourceBucket = sourceIdsByGroup.get(normalizedId) ?? new Set<string>()
      sourceBucket.add(String(rawGroupName).trim().toLowerCase())
      sourceIdsByGroup.set(normalizedId, sourceBucket)

      if (!displayNames.has(normalizedId)) {
        displayNames.set(normalizedId, formatPricingGroupName(rawGroupName))
      }

      if (!ratioByGroup.has(normalizedId)) {
        ratioByGroup.set(
          normalizedId,
          pricing?.group_ratio?.[String(rawGroupName).trim()] ??
            fallbackGroupRatios[normalizedId] ??
            extractRatio(rawGroupName),
        )
      }

      const modelBucket = modelsByGroup.get(normalizedId) ?? new Set<string>()
      modelBucket.add(normalizeModelSeriesName(item.model_name))
      modelsByGroup.set(normalizedId, modelBucket)
    }
  }

  const groupIds = Array.from(new Set([...displayNames.keys(), ...modelsByGroup.keys()]))

  return groupIds
    .filter((groupId) => shouldDisplayPricingGroup(groupId))
    .map((groupId) => {
      const modelNames = Array.from(modelsByGroup.get(groupId) ?? []).sort()
      const ratio = ratioByGroup.get(groupId) ?? extractRatio(groupId)
      const name = displayNames.get(groupId) ?? formatPricingGroupName(groupId)

      return {
        id: groupId,
        sourceIds: Array.from(sourceIdsByGroup.get(groupId) ?? [groupId]),
        name,
        shortName: formatPricingGroupShortName(name),
        family: inferPricingGroupFamily(name),
        description: buildGroupDescription(modelNames.length),
        ratio,
        modelCount: modelNames.length,
        modelNames,
      }
    })
    .sort((left, right) => {
      const familyDiff = getGroupSortPriority(left) - getGroupSortPriority(right)
      if (familyDiff !== 0) return familyDiff
      if (left.ratio !== right.ratio) return left.ratio - right.ratio
      return left.name.localeCompare(right.name)
    })
}

export const fallbackPricingGroupOptions = derivePricingGroupOptions()
