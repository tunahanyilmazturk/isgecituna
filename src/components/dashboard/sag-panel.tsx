/* Sağ panel — bildirimler, son aktiviteler ve hızlı erişim widget'ları */
import {
  ArrowRightIcon, Building2Icon, CheckCheckIcon, FileBadge2Icon, GraduationCapIcon,
  LandmarkIcon, ShieldCheckIcon, TriangleAlertIcon, UsersIcon, Settings2Icon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { Aktivite, Bildirim, HizliLink } from '@/lib/dashboard-data'
import { formatKisa } from '@/lib/date'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/stores/dashboard-store'
import { Bos, Widget } from './ortak'

const SEV_RENK = { kritik: 'bg-red-500', yuksek: 'bg-amber-500', orta: 'bg-zinc-400' } as const

export function BildirimlerWidget({ bildirimler }: { bildirimler: Bildirim[] }) {
  const nav = useNavigate()
  const { okundu, bildirimOku, tumunuOku } = useDashboardStore()
  const okunmamis = bildirimler.filter((b) => !okundu.includes(b.id))

  return (
    <div id="bildirimler">
      <Widget
        baslik="Bildirimler"
        aciklama={`${okunmamis.length} okunmamış`}
        sag={
          okunmamis.length > 0 && (
            <button
              onClick={() => tumunuOku(bildirimler.map((b) => b.id))}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheckIcon className="size-3.5" /> Tümünü okundu say
            </button>
          )
        }
      >
        {bildirimler.length === 0 ? (
          <Bos metin="Bildirim yok" detay="Yaklaşan terminler ve bekleyen işlemler burada görünür." />
        ) : (
          <div className="-mx-2 space-y-0.5">
            {bildirimler.slice(0, 8).map((b) => {
              const ok = okundu.includes(b.id)
              return (
                <button
                  key={b.id}
                  onClick={() => { bildirimOku(b.id); nav(b.link) }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted/50',
                    ok && 'opacity-55',
                  )}
                >
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', SEV_RENK[b.seviye], ok && 'bg-muted-foreground/40')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{b.baslik}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{b.detay}</span>
                    <span className="mt-1 block text-[10px] text-muted-foreground/60">{formatKisa(b.tarih)}</span>
                  </span>
                  {!ok && <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400" />}
                </button>
              )
            })}
          </div>
        )}
      </Widget>
    </div>
  )
}

export function AktivitelerWidget({ aktiviteler }: { aktiviteler: Aktivite[] }) {
  return (
    <Widget baslik="Son aktiviteler" aciklama="İşlem geçmişi kayıtlarından derlenen akış">
      {aktiviteler.length === 0 ? (
        <Bos metin="Aktivite yok" />
      ) : (
        <ol className="-mx-2 space-y-0.5">
          {aktiviteler.map((a) => {
            const ic = (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] leading-snug">
                    <b className="font-semibold">{a.kullanici}</b>{' '}
                    <span className="text-muted-foreground">{a.islem}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground/80">{a.kayit}</span>
                </span>
                <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">{a.zaman}</span>
              </>
            )
            return (
              <li key={a.id}>
                {a.link ? (
                  <Link to={a.link} className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50">{ic}</Link>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-xl px-2 py-2">{ic}</div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </Widget>
  )
}

const LINK_ICON: Record<HizliLink['icon'], typeof Building2Icon> = {
  firmalar: Building2Icon,
  personeller: UsersIcon,
  olaylar: TriangleAlertIcon,
  katip: LandmarkIcon,
  egitimler: GraduationCapIcon,
  sertifikalar: FileBadge2Icon,
  risk: ShieldCheckIcon,
  ayarlar: Settings2Icon,
}

export function HizliErisimWidget({ linkler }: { linkler: HizliLink[] }) {
  return (
    <Widget baslik="Hızlı erişim">
      <div className="grid grid-cols-2 gap-2">
        {linkler.map((l) => {
          const Icon = LINK_ICON[l.icon]
          return (
            <Link
              key={l.baslik}
              to={l.link}
              className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500/20">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[12px] leading-tight font-medium">{l.baslik}</span>
                <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{l.aciklama}</span>
              </span>
              <ArrowRightIcon className="ml-auto size-3 shrink-0 text-muted-foreground/0 transition-all group-hover:text-muted-foreground" />
            </Link>
          )
        })}
      </div>
    </Widget>
  )
}
