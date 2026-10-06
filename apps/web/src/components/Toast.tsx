'use client'

import {
  AlertCircle,
  CheckCircle2,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  message: string
  type: 'success' | 'error' | 'warning'
  onClose: () => void
}

export function Toast({ message, type, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const Icon =
    type === 'success'
      ? CheckCircle2
      : type === 'error'
        ? AlertCircle
        : TriangleAlert

  const iconClass =
    type === 'success'
      ? 'text-accent'
      : type === 'error'
        ? 'text-danger'
        : 'text-text'

  return (
    <div
      role='alert'
      className='dl-enter fixed bottom-5 right-5 z-[200] flex max-w-[min(320px,calc(100vw-40px))] items-center gap-2.5 rounded-[8px] border border-border-strong bg-surface px-4 py-3 text-[13px] text-text shadow-[0_8px_24px_rgba(0,0,0,.5)]'
    >
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <span className='flex-1'>{message}</span>
      <button
        type='button'
        onClick={() => {
          setIsVisible(false)
          onClose()
        }}
        aria-label='Close notification'
        className='-mr-1 rounded p-1 text-faint transition-colors hover:bg-border hover:text-text'
      >
        <X className='h-3.5 w-3.5' />
      </button>
    </div>
  )
}
