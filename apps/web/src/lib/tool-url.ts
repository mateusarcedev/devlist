export function withReferral(
  link: string,
  referral = 'tools4.tech',
): string {
  const url = new URL(link)
  url.searchParams.set('ref', referral)
  return url.toString()
}
