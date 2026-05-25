import { X } from 'lucide-react'
import { formatPricingGroupName } from '../pricingGroups'
import type { UsageItem } from '../types'

type UsageDetailModalProps = {
  item: UsageItem
  onClose: () => void
}

function renderValue(value: string | number | boolean | undefined) {
  if (value === undefined || value === '' || value === false) return '-'
  if (value === true) return '是'
  return String(value)
}

export function UsageDetailModal({ item, onClose }: UsageDetailModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>日志详情</h2>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="doc-list">
            <div>
              <strong>模型</strong>
              <code>{item.model}</code>
            </div>
            <div>
              <strong>时间</strong>
              <code>{item.time}</code>
            </div>
            <div>
              <strong>消费</strong>
              <code>${item.costUsd.toFixed(4)}</code>
            </div>
            <div>
              <strong>总 Tokens</strong>
              <code>{item.tokens.toLocaleString()}</code>
            </div>
            <div>
              <strong>Prompt Tokens</strong>
              <code>{renderValue(item.promptTokens?.toLocaleString())}</code>
            </div>
            <div>
              <strong>Completion Tokens</strong>
              <code>{renderValue(item.completionTokens?.toLocaleString())}</code>
            </div>
            <div>
              <strong>缓存 Tokens</strong>
              <code>{renderValue(item.cacheTokens?.toLocaleString())}</code>
            </div>
            <div>
              <strong>缓存创建 Tokens</strong>
              <code>{renderValue(item.cacheCreationTokens?.toLocaleString())}</code>
            </div>
            <div>
              <strong>缓存写入 Tokens</strong>
              <code>{renderValue(item.cacheWriteTokens?.toLocaleString())}</code>
            </div>
            <div>
              <strong>缓存倍率</strong>
              <code>{renderValue(item.cacheRatio)}</code>
            </div>
            <div>
              <strong>缓存创建倍率</strong>
              <code>{renderValue(item.cacheCreationRatio)}</code>
            </div>
            <div>
              <strong>Token 名称</strong>
              <code>{renderValue(item.tokenName)}</code>
            </div>
            <div>
              <strong>分组</strong>
              <code>{renderValue(item.group ? formatPricingGroupName(item.group) : undefined)}</code>
            </div>
            <div>
              <strong>流式响应</strong>
              <code>{renderValue(item.isStream)}</code>
            </div>
            <div>
              <strong>耗时（秒）</strong>
              <code>{renderValue(item.useTimeSeconds)}</code>
            </div>
            <div>
              <strong>请求路径</strong>
              <code>{renderValue(item.requestPath)}</code>
            </div>
            <div>
              <strong>Request ID</strong>
              <code>{renderValue(item.requestId)}</code>
            </div>
            <div>
              <strong>Upstream Request ID</strong>
              <code>{renderValue(item.upstreamRequestId)}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
