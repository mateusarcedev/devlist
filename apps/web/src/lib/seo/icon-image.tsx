import { ImageResponse } from 'next/og'

/** Serves PNG derivatives of the supplied mint terminal favicon without binary artifacts. */
export function iconImage(dimension: number, maskable = false): ImageResponse {
  const inset = maskable ? dimension * 0.18 : dimension * 0.045
  const inner = dimension - inset*2
  return new ImageResponse(
    (
      <div style={{ width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'#151515' }}>
        <svg width={inner} height={inner} viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'>
          <rect width='64' height='64' rx='14' fill='#151515'/>
          <rect x='.75' y='.75' width='62.5' height='62.5' rx='13.25' fill='none' stroke='#2c2c2c' strokeWidth='1.5'/>
          <path d='M18 22l10 10-10 10' fill='none' stroke='#15f5ba' strokeWidth='6' strokeLinecap='round' strokeLinejoin='round'/>
          <path d='M33 44h13' fill='none' stroke='#15f5ba' strokeWidth='6' strokeLinecap='round'/>
        </svg>
      </div>
    ),
    { width:dimension,height:dimension },
  )
}
