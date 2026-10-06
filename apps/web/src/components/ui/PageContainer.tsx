import { cn } from '@/utils'
import type { HTMLAttributes } from 'react'

export function PageContainer({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <main className={cn('dl-page', className)} {...props} />
}
