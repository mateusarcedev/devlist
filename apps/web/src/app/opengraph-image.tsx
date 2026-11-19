import { ImageResponse } from 'next/og'
import { getSeoTools, groupByCategory } from '@/lib/seo/data'
import { site } from '@/lib/seo/site'

export const runtime = 'nodejs'
export const revalidate = 86400
export const alt = 'DevHub — developer tools curated by the community'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const C = {
  bg:'#151515', surface:'#1d1d1d', line:'#2c2c2c', fg:'#f4f4f4',
  muted:'#b0b0b0', faint:'#929292', mint:'#15f5ba',
}
const featured = [
  'UI Components & Design Systems','APIs & Backend','Fonts & Typography',
  'DevOps & Infrastructure','Animation & 3D',
]

export default async function OpenGraphImage() {
  const tools = await getSeoTools()
  const groups = groupByCategory(tools)
  const categoryNames = [...groups.keys()]
  const shortNames: Record<string,string> = {
    'UI Components & Design Systems':'UI Components',
    'Fonts & Typography':'Fonts',
    'DevOps & Infrastructure':'DevOps',
  }
  const labels = [
    ...featured.filter(name=>groups.has(name)),
    ...categoryNames.filter(name=>!featured.includes(name)),
  ].slice(0,5).map(name=>shortNames[name] ?? name)
  const remaining = Math.max(groups.size-labels.length,0)

  return new ImageResponse(
    (
      <div style={{
        width:'100%',height:'100%',display:'flex',flexDirection:'column',
        justifyContent:'space-between',padding:'60px 68px',background:C.bg,
        backgroundImage:'radial-gradient(circle at 92% 0%, rgba(21,245,186,0.13), transparent 52%)',
        color:C.fg,fontFamily:'sans-serif',
      }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:14 }}>
            <span style={{ width:14,height:14,background:C.mint,borderRadius:7 }} />
            <span style={{ fontWeight:700 }}>devhub</span>
            <span style={{ color:C.faint }}>/</span>
            <span style={{ color:C.muted }}>catalog</span>
          </div>
          <span style={{ color:C.faint,fontSize:20 }}>devhub.mateusarce.dev</span>
        </div>

        <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
          <div style={{ display:'flex',color:C.mint,fontSize:21 }}>
            {'// open catalog, maintained by the community'}
          </div>
          <div style={{
            display:'flex',flexDirection:'column',fontWeight:700,
            fontSize:72,lineHeight:1.06,letterSpacing:'-0.035em',
          }}>
            <span>Developer tools,</span>
            <span style={{ color:C.mint }}>curated by the community.</span>
          </div>
        </div>

        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:20 }}>
          <div style={{ display:'flex',flexWrap:'wrap',gap:9,maxWidth:840 }}>
            {[...labels,...(remaining>0 ? [`+${remaining} categories`] : [])].map(label=>(
              <span key={label} style={{
                display:'flex',border:`1px solid ${C.line}`,background:C.surface,
                borderRadius:999,padding:'8px 14px',fontSize:17,color:C.muted,
              }}>{label}</span>
            ))}
          </div>
          {tools.length>0 && (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,fontSize:19,color:C.muted }}>
              <span><strong style={{ color:C.fg,marginRight:8 }}>{tools.length}</strong>tools</span>
              <span><strong style={{ color:C.fg,marginRight:8 }}>{groups.size}</strong>categories</span>
            </div>
          )}
        </div>
      </div>
    ),
    size,
  )
}
