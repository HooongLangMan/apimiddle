import { ExternalLink, X } from 'lucide-react'
import { contactCard } from '../contactInfo'

type ContactModalProps = {
  onClose: () => void
}

export function ContactModal({ onClose }: ContactModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>联系管理员</h2>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body contact-modal-body">
          <div className="contact-card-block">
            <div className="contact-card-meta">
              <strong>{contactCard.name}</strong>
              <span>{contactCard.role}</span>
            </div>

            <div className="contact-qr-shell">
              <img
                className="contact-qr-image"
                src={contactCard.qrImagePath}
                alt={`${contactCard.telegramLabel} 二维码`}
              />
            </div>

            <div className="contact-card-info">
              <div className="contact-info-row">
                <span>Telegram</span>
                <code>{contactCard.telegramHandle}</code>
              </div>
              <div className="contact-info-row">
                <span>QQ 群</span>
                <code>{contactCard.qqGroup}</code>
              </div>
            </div>

            <a
              className="primary-button"
              href={`https://t.me/${contactCard.telegramHandle.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
            >
              <span>打开 Telegram</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
