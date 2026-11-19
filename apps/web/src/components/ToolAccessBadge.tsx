'use client'

import { useI18n } from '@/contexts/i18n-context'
import type { AccessModel } from '@/lib/tool-access'

const styles: Record<AccessModel, string> = {
  OPEN_SOURCE: 'border-[var(--mint-edge)] bg-[var(--mint-dim)] text-accent',
  FREE: 'border-[var(--mint-edge)] bg-[var(--mint-dim)] text-accent',
  FREEMIUM: 'border-border-strong bg-surface-hover text-text',
  PAID: 'border-[var(--pink)] bg-[var(--pink-dim)] text-[var(--pink)]',
  UNVERIFIED: 'border-border-strong bg-surface-hover text-subtle',
}

export default function ToolAccessBadge({ model }: { model: AccessModel }) {
  const { t } = useI18n()
  const label = {
    OPEN_SOURCE: t('accessOpenSource'),
    FREE: t('accessFree'),
    FREEMIUM: t('accessFreemium'),
    PAID: t('accessPaid'),
    UNVERIFIED: t('accessUnverified'),
  }[model]

  return (
    <span title={model === 'UNVERIFIED' ? t('accessUnverifiedHint') : undefined}
      className={'inline-flex w-fit items-center rounded-full border px-2 py-[3px] text-[10.5px] font-medium leading-none ' + styles[model]}>
      {label}
    </span>
  )
}
