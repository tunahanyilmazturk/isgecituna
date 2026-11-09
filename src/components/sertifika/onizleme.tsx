/*
 * SertifikaOnizleme — eleman-tabanlı sertifika tasarımını A4 oranında DOM'a çizer.
 * Ekran önizlemesi ve PDF üretimi (html2canvas) aynı çıktıyı kullanır —
 * "gördüğün belge = indirilen belge" garantisi buradan gelir.
 */
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as PEV } from 'react'
import QRCode from 'qrcode'
import { fontCss, sureEtiketi, YON_MM, type TasarimEleman, type SertifikaVeri, type Yon } from '@/data/sertifika-tasarim'
import { cn } from '@/lib/utils'

const MM = 96 / 25.4 // 1mm ≈ 3.78px @96dpi

function QrImg({ url, renk }: { url: string; renk?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let live = true
    QRCode.toDataURL(url, { margin: 0, width: 512, color: { dark: renk ?? '#0F172A', light: '#00000000' } })
      .then((d) => live && setSrc(d))
      .catch(() => {})
    return () => { live = false }
  }, [url, renk])
  return src ? <img src={src} alt="" className="block size-full" /> : null
}

function ElemanGovde({ el, k, veri }: { el: TasarimEleman; k: number; veri: SertifikaVeri }) {
  const metin = el.tur === 'alan' ? (veri[el.alan!] || el.metin || '') : el.metin
  if (el.tur === 'alan' && el.gizleBos && !metin) return null
  if (el.tur === 'rozet' && !metin) return null
  const metinStil: CSSProperties = {
    fontFamily: fontCss(el.font),
    fontSize: (el.boyut ?? 3) * k,
    fontWeight: el.kalin ?? 400,
    color: el.renk ?? '#0F172A',
    textAlign: el.hiza === 'sag' ? 'right' : el.hiza === 'sol' ? 'left' : 'center',
    letterSpacing: el.harfAraligi ? el.harfAraligi * k : undefined,
    lineHeight: 1.25,
    display: 'flex',
    alignItems: 'center',
    justifyContent: el.hiza === 'sag' ? 'flex-end' : el.hiza === 'sol' ? 'flex-start' : 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }
  switch (el.tur) {
    case 'metin':
    case 'alan':
    case 'rozet':
      return <div style={metinStil}>{metin}</div>
    case 'filigran':
      return (
        <div style={{ ...metinStil, fontSize: (el.boyut ?? 40) * k, justifyContent: 'center' }}>{metin}</div>
      )
    case 'konuTablosu': {
      const konular = veri.training_topics ?? []
      const satirlar: ({ tur: 'bolum'; metin: string } | { tur: 'konu'; metin: string; sure: number })[] = []
      let sonBolum = ''
      for (const konu of konular) {
        if (konu.bolum !== sonBolum) {
          satirlar.push({ tur: 'bolum', metin: konu.bolum })
          sonBolum = konu.bolum
        }
        satirlar.push({ tur: 'konu', metin: konu.baslik, sure: konu.sureDakika })
      }
      const rowHeight = el.h * k / Math.max(1, satirlar.length + 2)
      const fontSize = Math.min(2.55 * k, rowHeight * 0.5)
      const sureToplam = konular.reduce((n, x) => n + Math.max(0, x.sureDakika || 0), 0)
      const satirStil: CSSProperties = { display: 'flex', alignItems: 'center', minHeight: rowHeight, borderBottom: `${0.15 * k}px solid #E4E4E7`, fontSize, lineHeight: 1.15 }
      let konuSira = 0
      return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', border: `${0.2 * k}px solid #D4D4D8`, borderRadius: 2.2 * k, color: '#27272A', background: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: fontCss(el.font) }}>
          <div style={{ ...satirStil, flexShrink: 0, minHeight: rowHeight, background: '#27272A', color: '#FFFFFF', fontWeight: 700 }}>
            <span style={{ width: 13 * k, flexShrink: 0, paddingLeft: 2 * k, color: '#FBBF24' }}>NO</span>
            <span style={{ flex: 1, padding: `0 ${1.5 * k}px` }}>EĞİTİM KONUSU</span>
            <span style={{ width: 25 * k, paddingRight: 2 * k, textAlign: 'right', color: '#FDE68A' }}>SÜRE</span>
          </div>
          {satirlar.length === 0 ? (
            <div style={{ ...satirStil, flex: 1, justifyContent: 'center', color: '#71717A' }}>Bu eğitim sürümünde konu kaydı bulunmuyor.</div>
          ) : satirlar.map((satir, i) => {
            if (satir.tur === 'bolum') return (
              <div key={`b-${i}`} style={{ ...satirStil, flexShrink: 0, minHeight: rowHeight * 0.82, padding: `0 ${2 * k}px`, background: '#FFF7E6', color: '#854D0E', fontSize: fontSize * 0.88, fontWeight: 750, letterSpacing: 0.28 * k }}>
                <span style={{ width: 11 * k, flexShrink: 0, color: '#B45309', fontVariantNumeric: 'tabular-nums' }}>BÖLÜM</span>
                <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{satir.metin}</span>
              </div>
            )
            const no = String(++konuSira).padStart(2, '0')
            return (
              <div key={`k-${i}`} style={{ ...satirStil, flexShrink: 0, background: konuSira % 2 === 0 ? '#FAFAF9' : '#FFFFFF' }}>
                <span style={{ width: 13 * k, flexShrink: 0, paddingLeft: 2 * k, color: '#A16207', fontSize: fontSize * 0.88, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{no}</span>
                <span style={{ flex: 1, paddingRight: 1.5 * k, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 500 }}>{satir.metin}</span>
                <span style={{ width: 25 * k, flexShrink: 0, paddingRight: 2 * k, textAlign: 'right', color: '#52525B', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{satir.sure > 0 ? sureEtiketi(satir.sure) : '—'}</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', flexShrink: 0, minHeight: rowHeight, alignItems: 'center', justifyContent: 'space-between', gap: 2 * k, padding: `0 ${2 * k}px`, background: '#F4F4F5', color: '#3F3F46', fontSize: fontSize * 0.88, fontWeight: 700 }}>
            <span>{konular.length} konu başlığı</span>
            <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>İçerik {sureEtiketi(sureToplam)} <span style={{ color: '#A1A1AA', padding: `0 ${1 * k}px` }}>·</span> Plan {veri.training_total_duration ?? '—'}</span>
          </div>
        </div>
      )
    }
    case 'qr':
      return <QrImg url={/^https?:\/\//i.test(veri.verification_url) ? veri.verification_url : new URL(veri.verification_url, window.location.origin).toString()} renk={el.renk} />
    case 'cizgi':
      return <div style={{ width: '100%', height: '100%', background: el.doldur ?? '#0F172A', borderRadius: 2 * k }} />
    case 'kutu':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: el.doldur && el.doldur !== 'transparent' ? el.doldur : 'transparent',
            border: el.kenar && el.kenar.kalinlik > 0 ? `${el.kenar.kalinlik * k}px solid ${el.kenar.renk}` : undefined,
            borderRadius: (el.kenar?.yaricap ?? 0) * k,
          }}
        />
      )
    case 'daire':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: el.doldur && el.doldur !== 'transparent' ? el.doldur : 'transparent',
            border: el.kenar && el.kenar.kalinlik > 0 ? `${el.kenar.kalinlik * k}px solid ${el.kenar.renk}` : undefined,
          }}
        />
      )
    case 'logo':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: el.doldur ?? '#16324F',
            borderRadius: (el.kenar?.yaricap ?? 2.2) * k,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: fontCss(el.font),
            fontWeight: 800,
            fontSize: (el.boyut ?? 4.5) * k,
          }}
        >
          {el.metin ?? 'HT'}
        </div>
      )
    case 'imza': {
      const ad = el.imzaAlan === 'approver_name' ? veri.approver_name : el.metin || veri.approver_name
      const sol = el.hiza === 'sol'
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ borderTop: `${0.5 * k}px solid ${el.renk ?? '#1E293B'}`, paddingTop: 1.6 * k }}>
            <div
              style={{
                fontFamily: fontCss(el.font),
                fontSize: (el.boyut ?? 3.4) * k,
                fontWeight: 600,
                color: el.renk ?? '#1E293B',
                textAlign: sol ? 'left' : 'center',
              }}
            >
              {ad}
            </div>
            <div
              style={{
                fontFamily: fontCss(el.font),
                fontSize: ((el.boyut ?? 3.4) * 0.72) * k,
                color: `${el.renk ?? '#64748B'}`,
                opacity: 0.75,
                textAlign: sol ? 'left' : 'center',
              }}
            >
              {el.imzaUnvan}
            </div>
          </div>
        </div>
      )
    }
    default:
      return null
  }
}

export interface SertifikaOnizlemeProps {
  elemanlar: TasarimEleman[]
  yon: Yon
  zemin?: string
  veri: SertifikaVeri
  /** px/mm çarpanı — 1 = 96dpi gerçek boyut */
  olcek?: number
  iptal?: boolean
  seciliId?: string | null
  onSec?: (id: string | null) => void
  /** Sürükleme — mm cinsinden yeni x,y döner */
  onTasi?: (id: string, x: number, y: number) => void
  onHazir?: () => void
  className?: string
}

export function SertifikaOnizleme({ elemanlar, yon, zemin = '#fff', veri, olcek = 1, iptal, seciliId, onSec, onTasi, onHazir, className }: SertifikaOnizlemeProps) {
  const k = MM * olcek
  const { w, h } = YON_MM[yon]
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const qrSayisi = elemanlar.filter((e) => e.tur === 'qr').length
  const [qrHazir, setQrHazir] = useState(qrSayisi === 0)
  useEffect(() => {
    if (qrSayisi === 0) return
    const t = setTimeout(() => { setQrHazir(true); onHazir?.() }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (qrSayisi === 0) onHazir?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const basla = (ev: PEV, el: TasarimEleman) => {
    if (!onTasi) { onSec?.(el.id); return }
    ev.preventDefault(); ev.stopPropagation()
    onSec?.(el.id)
    const box = ref.current!.getBoundingClientRect()
    drag.current = { id: el.id, dx: (ev.clientX - box.left) / k - el.x, dy: (ev.clientY - box.top) / k - el.y }
    const move = (me: globalThis.PointerEvent) => {
      const d = drag.current
      if (!d) return
      const nx = Math.max(0, Math.min(w - 2, (me.clientX - box.left) / k - d.dx))
      const ny = Math.max(0, Math.min(h - 2, (me.clientY - box.top) / k - d.dy))
      onTasi(d.id, Math.round(nx * 10) / 10, Math.round(ny * 10) / 10)
    }
    const up = () => {
      drag.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  void qrHazir
  return (
    <div
      ref={ref}
      onPointerDown={() => onSec?.(null)}
      className={cn('relative shrink-0 overflow-hidden', className)}
      style={{ width: w * k, height: h * k, background: zemin }}
    >
      {elemanlar.map((el) => (
        <div
          key={el.id}
          onPointerDown={(ev) => basla(ev, el)}
          className={cn('absolute', onTasi && 'cursor-move', seciliId === el.id && 'outline-2 outline-sky-500 outline-dashed')}
          style={{
            left: el.x * k,
            top: el.y * k,
            width: el.w * k,
            height: el.h * k,
            opacity: el.opaklik ?? 1,
            transform: el.dondurme ? `rotate(${el.dondurme}deg)` : undefined,
          }}
        >
          <ElemanGovde el={el} k={k} veri={veri} />
        </div>
      ))}
      {iptal && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(-20deg)` }}
        >
          <div
            style={{
              border: `${1 * k}px solid #DC2626AA`,
              color: '#DC2626AA',
              fontWeight: 800,
              fontSize: 11 * k,
              padding: `${2 * k}px ${8 * k}px`,
              letterSpacing: 2 * k,
              fontFamily: 'system-ui',
            }}
          >
            İPTAL EDİLDİ
          </div>
        </div>
      )}
    </div>
  )
}
