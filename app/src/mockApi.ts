import type {
  AnnouncementItem,
  ApiKeyItem,
  BillingSummary,
  DashboardSummary,
  UsageItem,
} from './types'

const sleep = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

const dashboard: DashboardSummary = {
  balanceUsd: 99.99,
  usedUsd: 0.01,
  keyCount: 1,
  baseUrl: 'https://api.token688.cn/v1',
  defaultKey: '',
  availableModels: [
    {
      id: 'claude-opus-4-7',
      label: 'Claude Opus 4.7',
      description: '适合高质量写作、复杂推理和长文本生成。',
      status: 'available',
    },
    {
      id: 'claude-opus-4-6',
      label: 'Claude Opus 4.6',
      description: '稳定主力模型，适合日常高端任务。',
      status: 'available',
    },
    {
      id: 'gpt-5-5',
      label: 'GPT 5.5',
      description: '适合通用问答、代码与复杂任务处理。',
      status: 'maintenance',
    },
    {
      id: 'gpt-5-4',
      label: 'GPT 5.4',
      description: '高阶模型备用入口。',
      status: 'maintenance',
    },
  ],
}

let keys: ApiKeyItem[] = [
  {
    id: 'key_1',
    name: '测试 Key',
    value: 'sk-demo-hidden',
    createdAt: '2026-05-15 00:48',
    lastUsedAt: '2026-05-15 01:41',
    status: 'active',
  },
]

const usage: UsageItem[] = [
  {
    id: 'usage_1',
    time: '2026-05-15 01:41',
    model: 'claude-opus-4-7',
    costUsd: 0.01,
    tokens: 29,
    status: 'success',
  },
]

const announcements: AnnouncementItem[] = [
  {
    id: 'ann_1',
    title: '使用说明',
    content: '当前站点主要用于统一接入和密钥管理，如需调整额度或权限请联系管理员。',
    createdAt: '2026-05-15 01:00',
  },
  {
    id: 'ann_2',
    title: '模型说明',
    content: '可用模型会根据账号权限和后端配置动态变化，请以控制台实时显示为准。',
    createdAt: '2026-05-15 01:05',
  },
]

const billing: BillingSummary = {
  balanceUsd: 99.99,
  usedUsd: 0.01,
  note: '在线充值暂未开放，如需加额度请联系管理员处理。',
  contact: '交流群 / 管理员联系方式后续补充',
}

export async function login(username: string, password: string) {
  await sleep()
  if (!username || !password) {
    throw new Error('请输入账号和密码')
  }
  return {
    user: {
      id: 'user_1',
      name: 'svip-test',
    },
  }
}

export async function getDashboard() {
  await sleep()
  return dashboard
}

export async function getKeys() {
  await sleep()
  return keys
}

export async function createKey(name: string) {
  await sleep()
  const created: ApiKeyItem = {
    id: `key_${Date.now()}`,
    name: name.trim() || '新 Key',
    value: `sk-demo-${Date.now()}`,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    lastUsedAt: '-',
    status: 'active',
  }
  keys = [created, ...keys]
  return created
}

export async function deleteKey(id: string) {
  await sleep()
  keys = keys.filter((item) => item.id !== id)
  return true
}

export async function getUsage() {
  await sleep()
  return usage
}

export async function getAnnouncements() {
  await sleep()
  return announcements
}

export async function getBilling() {
  await sleep()
  return billing
}
