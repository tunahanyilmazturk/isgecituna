import type { CSSProperties } from 'react'
import { osgbLogoHarf, osgbLogoVeri } from '@/lib/osgb'

/** Kurum logosu; logo tanımlı değilse baş harf rozetini korur. */
export function OsgbLogoMark({ style }: { style: CSSProperties }) {
  const logo = osgbLogoVeri()
  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        style={{ ...style, display: 'block', objectFit: 'contain', background: '#fff', border: '1px solid #E4E4E7', padding: '0.7mm' }}
      />
    )
  }
  return <div style={style}>{osgbLogoHarf()}</div>
}
