import type {
  AnnouncementItem,
  ApiKeyItem,
  BillingSummary,
  DashboardSummary,
  UsageItem,
} from '../src/types'

export const dashboard: DashboardSummary = {
  balanceUsd: 0,
  usedUsd: 0,
  keyCount: 1,
  baseUrl: 'https://api.token688.cn/v1',
  defaultKey: '',
  availableModels: [
    {
      id: 'gpt-5.5',
      label: 'GPT 5.5',
      description: '适合高强度推理、复杂产品任务和主力调用场景。',
      status: 'available',
    },
    {
      id: 'claude-opus-4-7',
      label: 'Claude Opus 4.7',
      description: '适合复杂推理、代码和高质量内容生成。',
      status: 'available',
    },
    {
      id: 'claude-opus-4-6',
      label: 'Claude Opus 4.6',
      description: '稳定的主力模型，适合日常生产任务。',
      status: 'available',
    },
  ],
}

export const keys: ApiKeyItem[] = [
  {
    id: 'key_demo_1',
    name: '测试 Key',
    value: 'sk-demo-hidden',
    createdAt: '2026-05-15 00:48',
    lastUsedAt: '2026-05-15 01:41',
    status: 'active',
  },
]

export const usage: UsageItem[] = [
  {
    id: 'usage_1',
    time: '2026-05-15 01:41',
    model: 'claude-opus-4-7',
    costUsd: 0.01,
    tokens: 29,
    status: 'success',
  },
]

export const announcements: AnnouncementItem[] = [
  {
    id: 'ann_support_qq',
    title: '售后技术交流群',
    content: '售后技术交流群 QQ：109754573',
    createdAt: '2026-05-24 19:20',
  },
  {
    id: 'ann_usage',
    title: '使用说明',
    content: '当前站点主要用于统一接入和密钥管理，如需调整额度或权限请联系管理员。',
    createdAt: '2026-05-15 01:00',
  },
  {
    id: 'ann_models',
    title: '模型说明',
    content: '可用模型会根据账号权限和后端配置动态变化，请以控制台实时显示为准。',
    createdAt: '2026-05-15 01:05',
  },
]

export const billing: BillingSummary = {
  balanceUsd: 0,
  usedUsd: 0,
  note: '在线充值暂未开放，如需补充额度，请联系管理员处理。',
  contact: '联系管理员或售后技术交流群 QQ：109754573 获取支持。',
}
