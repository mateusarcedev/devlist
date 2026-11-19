import { iconImage } from '@/lib/seo/icon-image'
export const revalidate = 604800
export function GET() { return iconImage(192) }
