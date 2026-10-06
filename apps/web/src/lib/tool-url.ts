export function withReferral(
  link: string,
  referral = 'devlist.mateusarce.dev',
): string {
  const url = new URL(link)
  url.searchParams.set('ref', referral)
  return url.toString()
}
