import { cn } from '@/utils'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-white text-black border border-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:border-zinc-700 disabled:text-zinc-400',
  secondary:
    'bg-transparent text-text border border-border-strong hover:bg-surface-hover hover:border-zinc-700',
  ghost:
    'bg-transparent text-muted border border-transparent hover:bg-surface-hover hover:text-text',
  danger:
    'bg-transparent text-danger border border-red-950 hover:bg-red-950/30 hover:border-red-900',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[6px] font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
