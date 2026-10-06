import { cn } from '@/utils'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'dl-control min-h-24 w-full resize-y px-3 py-2.5 text-sm outline-none placeholder:text-faint focus:border-zinc-600',
        className,
      )}
      {...props}
    />
  )
}
