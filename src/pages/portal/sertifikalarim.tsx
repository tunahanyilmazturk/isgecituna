import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AwardIcon, ClockIcon, DownloadIcon, EyeIcon, RotateCwIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { bildirimGonder } from '@/stores/bildirim-store'
import { cn } from '@/lib/utils'
import { sertifikaGuncelDurum, durumRenkSertifika, basvuruDurumRenk } from '@/data/sertifikalar'
import { useSertifikaStore } from '@/stores/sertifikalar-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { sertifikaPdfIndirV2 } from '@/lib/sertifika-render'
import { useBen } from '@/pages/portal/portal-ortak'

/** Reddedilen bir başvuru: neden gösterilir, katılımcı düzeltmesini yazıp yeniden gönderir */
function RedBildirimi({
  id,
  egitimAd,
  neden,
  aciklama,
  tarih,
}: {
  id: string
  egitimAd: string
  neden?: string
  aciklama?: string
  tarih: string
}) {
  const tekrarGonder = useSertifikaStore((s) => s.tekrarGonder)
  const kullanici = useAuthStore((s) => s.user)?.name ?? 'Katılımcı'
  const [not, setNot] = useState('')
  return (
    <li className="rounded-2xl border border-red-500/30 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{egitimAd}</p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">Başvuru {tarih}</p>
        </div>
        <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500">Reddedildi</span>
      </div>
      <div className="mt-3 rounded-xl bg-red-500/5 p-3 text-xs">
        <p className="font-medium">Neden: {neden || '—'}</p>
        {aciklama && <p className="mt-1 leading-relaxed text-muted-foreground">{aciklama}</p>}
      </div>
      <div className="mt-3 space-y-2">
        <textarea
          rows={2}
          value={not}
          onChange={(e) => setNot(e.target.value)}
          placeholder="Yaptığınız düzeltmeyi kısaca yazın (ör. eksik belgeyi ekledim)"
          aria-label="Düzeltme notu"
          className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
        />
        <Button
          size="sm"
          disabled={not.trim().length < 5}
          onClick={() => {
            tekrarGonder(id, kullanici, not.trim())
            bildirimGonder({ hedef: 'osgb', ton: 'amber', baslik: 'Katılımcı başvurusunu yeniden gönderdi', detay: `${kullanici} · ${egitimAd} — ${not.trim()}`, to: '/panel/sertifika-onay' })
            toast.success('Başvurunuz yeniden incelemeye gönderildi')
          }}
        >
          <RotateCwIcon /> Yeniden incelemeye gönder
        </Button>
      </div>
    </li>
  )
}

/** Katılımcının sertifikaları, onay bekleyen başvuruları ve doğrulama bilgileri */
export default function PortalSertifikalar() {
  const navigate = useNavigate()
  const { pid } = useBen()
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)
  const basvurular = useSertifikaStore((s) => s.basvurular)
  const egitimler = useEgitimlerStore((s) => s.egitimler)

  const benim = sertifikalar.filter((s) => s.personelId === pid)
  const bekleyen = basvurular.filter(
    (b) => b.personelId === pid && (b.durum === 'İnceleme Bekliyor' || b.durum === 'İnceleniyor' || b.durum === 'Eksik Koşul'),
  )
  const reddedilen = basvurular.filter((b) => b.personelId === pid && b.durum === 'Reddedildi')
  const egitimAd = (id: string) => egitimler.find((e) => e.id === id)?.baslik ?? '—'
  const gecerli = benim.filter((s) => sertifikaGuncelDurum(s) === 'Aktif').length
  const suresiDolmus = benim.length - gecerli

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sertifikalarım</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tamamlanan eğitimlere ait belgeler ve doğrulama bilgileri</p>

      {benim.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          {(
            [
              [benim.length, 'Toplam belge'],
              [gecerli, 'Geçerli'],
              [suresiDolmus, 'Süresi dolmuş'],
            ] as const
          ).map(([v, l]) => (
            <div key={l} className="rounded-2xl border bg-card p-4">
              <p className="text-2xl leading-none font-semibold tabular-nums">{v}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      )}

      {bekleyen.length > 0 && (
        <section className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <ClockIcon className="size-4" /> Onay sürecinde ({bekleyen.length})
          </p>
          <ul className="mt-2 divide-y divide-amber-500/20">
            {bekleyen.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs">
                <span className="font-medium">{egitimAd(b.egitimId)}</span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="tabular-nums">{b.basvuruTarihi}</span>
                  <span className={cn('rounded-full px-2 py-0.5 font-medium', basvuruDurumRenk[b.durum])}>{b.durum}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reddedilen.length > 0 && (
        <section className="mt-5">
          <h2 className="text-sm font-semibold">Düzeltme gereken başvurular</h2>
          <ul className="mt-2 space-y-3">
            {reddedilen.map((b) => (
              <RedBildirimi
                key={b.id}
                id={b.id}
                egitimAd={egitimAd(b.egitimId)}
                neden={b.retNedeni}
                aciklama={b.retAciklama}
                tarih={b.basvuruTarihi}
              />
            ))}
          </ul>
        </section>
      )}

      {benim.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed py-16 text-center">
          <AwardIcon className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm font-medium">
            {bekleyen.length > 0 ? 'Sertifikanız onaylandığında burada görünecek' : 'Henüz sertifika yok'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Bir eğitimi tamamladığınızda sertifika başvurunuz otomatik oluşur; onaylandıktan sonra belgenizi buradan indirebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {benim.map((s) => {
            const d = sertifikaGuncelDurum(s)
            return (
              <article key={s.id} className="flex flex-col rounded-2xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${s.sablonSnap.anaRenk}, ${s.sablonSnap.vurguRenk})` }}
                  >
                    <AwardIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.egitimAd}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {s.sertifikaNo} · {s.duzenlenmeTarihi}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[d])}>{d}</span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Tamamlama</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{s.tamamlanmaTarihi}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Geçerlilik</dt>
                    <dd className="mt-0.5 font-medium tabular-nums">{s.gecerlilikTarihi ?? 'Süresiz'}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                  <Link
                    to={`/dogrula/${s.dogrulamaKodu}`}
                    className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <ShieldCheckIcon className="size-3.5 shrink-0" />
                    <span className="truncate">Doğrulama: {s.dogrulamaKodu}</span>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/portal/sertifikalar/${s.id}`)}>
                      <EyeIcon /> Görüntüle
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sertifikaPdfIndirV2(s)}>
                      <DownloadIcon /> PDF
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
