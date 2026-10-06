import { cn } from '@/utils'
import type { InputHTMLAttributes } from 'react'

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'dl-control h-10 w-full px-3 text-sm outline-none placeholder:text-faint focus:border-zinc-600',
        className,
      )}
      {...props}
    />
  )
}
