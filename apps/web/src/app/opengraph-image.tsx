import { ImageResponse } from 'next/og'

export const alt = 'Devlist — Curated developer tools'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

const tags = ['Frontend', 'Testing', 'APIs', 'DevOps']
const cards = [
  ['Vite', 'Frontend'],
  ['Playwright', 'Testing'],
  ['Postman', 'APIs'],
  ['Docker', 'DevOps'],
]

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#000000',
          color: '#fafafa',
          padding: '56px 64px',
          fontFamily: 'monospace',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #27272a',
            borderRadius: 22,
            overflow: 'hidden',
            background: '#09090b',
          }}
        >
          <div
            style={{
              height: 74,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 28px',
              borderBottom: '1px solid #27272a',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: '#00dc82',
                }}
              />
              Devlist
            </div>
            <div
              style={{
                display: 'flex',
                gap: 24,
                color: '#a1a1aa',
                fontSize: 18,
              }}
            >
              Discover
              <span style={{ color: '#71717a' }}>Favorites</span>
              <span style={{ color: '#71717a' }}>Contributors</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              padding: '44px 48px',
              gap: 48,
            }}
          >
            <div
              style={{
                width: '54%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  marginBottom: 18,
                  color: '#00dc82',
                  fontSize: 17,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                community-curated
              </div>

              <div
                style={{
                  display: 'flex',
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1.06,
                  letterSpacing: -3,
                }}
              >
                Useful developer tools, without the noise.
              </div>

              <div
                style={{
                  display: 'flex',
                  marginTop: 22,
                  color: '#a1a1aa',
                  fontSize: 22,
                  lineHeight: 1.35,
                }}
              >
                Discover, save, and suggest tools for software development.
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginTop: 28,
                }}
              >
                {tags.map(tag => (
                  <div
                    key={tag}
                    style={{
                      display: 'flex',
                      padding: '8px 13px',
                      border: '1px solid #27272a',
                      borderRadius: 999,
                      color: '#d4d4d8',
                      fontSize: 15,
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                width: '46%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {cards.map(([name, category], index) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 20px',
                    border: '1px solid #27272a',
                    borderRadius: 12,
                    background: index === 0 ? '#111113' : '#0a0a0a',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        display: 'flex',
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      {name}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        marginTop: 5,
                        fontSize: 14,
                        color: '#71717a',
                      }}
                    >
                      {category}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      color: '#00dc82',
                      fontSize: 18,
                    }}
                  >
                    ↗
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
