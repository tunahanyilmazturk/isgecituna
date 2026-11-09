import { useState } from 'react'
import { Pill } from '@/components/pill'
import { cn } from '@/lib/utils'
import {
  adSoyad,
  gorevTone,
  hesapDurumTone,
  initialsOf,
  personelDurumTone,
  type EkipUye,
  type GorevTuru,
  type HesapDurum,
  type PersonelDurum,
} from '@/data/ekip'

/**
 * Kişi avatarı. Öncelik: yüklenen fotoğraf → cinsiyete göre varsayılan avatar → baş harfler.
 * Görsel yüklenemezse baş harflere düşer.
 */
export function Avatar({
  uye,
  boyut = 'md',
}: {
  uye: Pick<EkipUye, 'ad' | 'soyad'> & Partial<Pick<EkipUye, 'cinsiyet' | 'fotograf'>>
  boyut?: 'sm' | 'md' | 'lg'
}) {
  const [hata, setHata] = useState(false)
  const kaynak = uye.fotograf || (uye.cinsiyet ? `/images/avatar-${uye.cinsiyet === 'Kadın' ? 'kadin' : 'erkek'}.png` : undefined)
  const boyutSinif = cn(
    'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    boyut === 'sm' && 'size-6 text-[10px]',
    boyut === 'md' && 'size-8 text-xs',
    boyut === 'lg' && 'size-12 text-sm',
  )

  if (kaynak && !hata) {
    return (
      <span className={cn(boyutSinif, 'bg-amber-500/15')}>
        <img
          src={kaynak}
          alt=""
          aria-hidden="true"
          onError={() => setHata(true)}
          className="size-full object-cover"
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        boyutSinif,
        'bg-amber-500/15 font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-400',
      )}
    >
      {initialsOf(uye)}
    </span>
  )
}

/** Personel adı + avatar — olay/firma detaylarında sorumlu gösterimi için */
export function PersonelChip({ uye, satir }: { uye: EkipUye; satir?: 'tek' | 'cift' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar uye={uye} boyut="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{adSoyad(uye)}</span>
        {satir === 'cift' && (
          <span className="block truncate text-xs text-muted-foreground">{uye.gorev}</span>
        )}
      </span>
    </span>
  )
}

export function GorevBadge({ gorev }: { gorev: GorevTuru }) {
  return <Pill tone={gorevTone[gorev]}>{gorev}</Pill>
}

export function SinifBadge({ sinif }: { sinif?: 'A' | 'B' | 'C' }) {
  if (!sinif) return <span className="text-muted-foreground">—</span>
  const tone = sinif === 'A' ? 'violet' : sinif === 'B' ? 'amber' : 'violet'
  return <Pill tone={tone}>{sinif} Sınıfı</Pill>
}

export function PersonelDurumBadge({ durum }: { durum: PersonelDurum }) {
  return <Pill tone={personelDurumTone[durum]}>{durum}</Pill>
}

export function HesapBadge({
  hesap,
  kullaniciAdi,
}: {
  hesap: HesapDurum | 'Hesap Yok'
  kullaniciAdi?: string
}) {
  return (
    <span className="inline-flex flex-col">
      <Pill tone={hesapDurumTone[hesap]}>{hesap}</Pill>
      {kullaniciAdi && (
        <span className="mt-0.5 text-[11px] text-muted-foreground">@{kullaniciAdi}</span>
      )}
    </span>
  )
}
