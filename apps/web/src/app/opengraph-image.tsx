import { ImageResponse } from 'next/og'

export const alt = 'Tools4.tech — Curated developer tools'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#111111',
          color: '#ffffff',
          padding: '72px 84px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            letterSpacing: '-1px',
            opacity: 0.75,
          }}
        >
          developer tools / curated by the community
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 92,
              fontWeight: 700,
              letterSpacing: '-6px',
            }}
          >
            Tools4.tech
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: 900,
              fontSize: 38,
              lineHeight: 1.25,
              color: '#d4d4d8',
            }}
          >
            Discover, save, and suggest useful tools for software development.
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 28, opacity: 0.6 }}>
          github.com/mateusarcedev/devlist
        </div>
      </div>
    ),
    size,
  )
}
