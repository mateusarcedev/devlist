'use client'

import Link from 'next/link'
import { useI18n } from '@/contexts/i18n-context'

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className='border-t border-border'>
      <div className='mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-[clamp(16px,2.3vw,28px)] pb-10 pt-7 text-[11.5px] text-subtle'>
        <span>{t('footerDescription')}</span>
        <nav aria-label={t('footerLinks')} className='flex flex-wrap items-center gap-5'>
          <Link href='https://github.com/mateusarcedev/devlist' target='_blank' rel='noopener noreferrer' className='transition-colors hover:text-accent'>
            GitHub
          </Link>
          <Link href='/contributors' className='transition-colors hover:text-accent'>
            {t('contributors')}
          </Link>
          <Link href='https://mateusarce.dev' target='_blank' rel='noopener noreferrer' className='transition-colors hover:text-accent'>
            {t('madeBy')} <span className='text-[var(--pink)]'>Mateus Arce</span>
          </Link>
        </nav>
      </div>
    </footer>
  )
}
