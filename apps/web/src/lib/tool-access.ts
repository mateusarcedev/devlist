/** Access model is a curated editorial label, not inferred from a URL at runtime.
 * Existing legacy records without reviewed metadata stay UNVERIFIED.
 * These legacy mappings are a small, provisional backfill of well-known resources;
 * administrators can correct them from /admin/catalog. */
export const accessModels = ['OPEN_SOURCE', 'FREE', 'FREEMIUM', 'PAID', 'UNVERIFIED'] as const
export type AccessModel = (typeof accessModels)[number]
export type PublishableAccessModel = Exclude<AccessModel, 'PAID' | 'UNVERIFIED'>

export const legacyKnownAccessByHost: Record<string, AccessModel> = {
  "anijs.github.io": "OPEN_SOURCE",
  "animate.style": "OPEN_SOURCE",
  "michalsnik.github.io": "OPEN_SOURCE",
  "ariakit.org": "OPEN_SOURCE",
  "astro.build": "OPEN_SOURCE",
  "goauthentik.io": "OPEN_SOURCE",
  "getbootstrap.com": "OPEN_SOURCE",
  "boringavatars.com": "OPEN_SOURCE",
  "chartdb.io": "OPEN_SOURCE",
  "daisyui.com": "OPEN_SOURCE",
  "dashy.to": "OPEN_SOURCE",
  "docmost.com": "OPEN_SOURCE",
  "dozzle.dev": "OPEN_SOURCE",
  "feathericons.com": "OPEN_SOURCE",
  "flyonui.com": "OPEN_SOURCE",
  "franken-ui.dev": "OPEN_SOURCE",
  "grapesjs.com": "OPEN_SOURCE",
  "headlessui.com": "OPEN_SOURCE",
  "heroicons.dev": "OPEN_SOURCE",
  "hyperui.dev": "OPEN_SOURCE",
  "iconoir.com": "OPEN_SOURCE",
  "listmonk.app": "OPEN_SOURCE",
  "matcha.mizu.sh": "OPEN_SOURCE",
  "mkdocs.org": "OPEN_SOURCE",
  "motioncanvas.io": "OPEN_SOURCE",
  "nezha.wiki": "OPEN_SOURCE",
  "ntfy.sh": "OPEN_SOURCE",
  "openwebui.com": "OPEN_SOURCE",
  "outstatic.com": "OPEN_SOURCE",
  "docs.paperless-ngx.com": "OPEN_SOURCE",
  "penpot.app": "OPEN_SOURCE",
  "phosphoricons.com": "OPEN_SOURCE",
  "radix-ui.com": "OPEN_SOURCE",
  "react.email": "OPEN_SOURCE",
  "react-icons.github.io": "OPEN_SOURCE",
  "rxresu.me": "OPEN_SOURCE",
  "remix.run": "OPEN_SOURCE",
  "remixicon.com": "OPEN_SOURCE",
  "select2.org": "OPEN_SOURCE",
  "shields.io": "OPEN_SOURCE",
  "simpleicons.org": "OPEN_SOURCE",
  "streamlit.io": "OPEN_SOURCE",
  "swapy.tahazsh.com": "OPEN_SOURCE",
  "sweetalert2.github.io": "OPEN_SOURCE",
  "swiperjs.com": "OPEN_SOURCE",
  "tablericons.com": "OPEN_SOURCE",
  "threejs.org": "OPEN_SOURCE",
  "getzola.org": "OPEN_SOURCE",
  "1001fonts.com": "FREE",
  "abstractfonts.com": "FREE",
  "color.adobe.com": "FREE",
  "avvvatars.com": "FREE",
  "colorhunt.co": "FREE",
  "freecodecamp.org": "FREE",
  "fonts.google.com": "FREE",
  "pexels.com": "FREE",
  "undraw.co": "FREE",
  "pokeapi.co": "FREE",
  "api.nasa.gov": "FREE",
  "getwaves.io": "FREE",
  "coolors.co": "FREEMIUM",
  "bannerify.co": "FREEMIUM",
  "flaticon.com": "FREEMIUM",
  "fontawesome.com": "FREEMIUM",
  "iconscout.com": "FREEMIUM",
  "lottiefiles.com": "FREEMIUM",
  "mobbin.com": "FREEMIUM",
  "mintlify.com": "FREEMIUM",
  "sanity.io": "FREEMIUM",
  "rapidapi.com": "FREEMIUM",
  "convertio.co": "FREEMIUM",
  "tailwindui.com": "PAID"
}

export function isAccessModel(value: unknown): value is AccessModel {
  return typeof value === 'string' && accessModels.some(model => model === value)
}

export function isPublishableAccessModel(value: unknown): value is PublishableAccessModel {
  return value === 'OPEN_SOURCE' || value === 'FREE' || value === 'FREEMIUM'
}

export function legacyAccessModel(link: string): AccessModel {
  try {
    const hostname = new URL(link).hostname.toLowerCase().replace(/^www\./, '')
    return legacyKnownAccessByHost[hostname] ?? 'UNVERIFIED'
  } catch {
    return 'UNVERIFIED'
  }
}

export function accessModelForTool(value: unknown, link: string): AccessModel {
  return isAccessModel(value) ? value : legacyAccessModel(link)
}
