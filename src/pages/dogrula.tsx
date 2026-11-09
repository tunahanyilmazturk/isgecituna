import { useParams } from 'react-router'
import { BanIcon, CheckCircle2Icon, FileQuestionIcon, ShieldCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { adMaske, sertifikaGuncelDurum, durumRenkSertifika } from '@/data/sertifikalar'
import { useSertifikaStore } from '@/stores/sertifikalar-store'

/**
 * Herkese açık sertifika doğrulama ekranı — QR kod bu sayfaya yönlendirir.
 * Yalnızca doğrulama için gerekli alanlar gösterilir: TCKN, telefon,
 * e-posta, sicil ve hesap bilgileri hiçbir şekilde yer almaz.
 */
export default function DogrulaPage() {
  const { kod } = useParams()
  const s = useSertifikaStore((st) => st.sertifikalar.find((x) => x.dogrulamaKodu === kod))
  const durum = s ? sertifikaGuncelDurum(s) : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 p-6 dark:from-zinc-950 dark:to-zinc-900">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-sm font-extrabold text-zinc-950">
            iH
          </span>
          <div>
            <p className="text-sm font-bold">isghub</p>
            <p className="text-xs text-muted-foreground">Sertifika Doğrulama</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xl">
          {!s ? (
            <div className="py-8 text-center">
              <FileQuestionIcon className="mx-auto size-10 text-muted-foreground/40" />
              <p className="mt-3 font-semibold">Kayıt bulunamadı</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bu doğrulama kodu geçersiz veya bağlantı hatalı kopyalanmış olabilir.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl',
                    durum === 'Aktif'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-500',
                  )}
                >
                  {durum === 'Aktif' ? <CheckCircle2Icon className="size-6" /> : <BanIcon className="size-6" />}
                </span>
                <div>
                  <p className={cn('text-lg font-bold', durum === 'Aktif' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                    {durum === 'Aktif' ? 'Sertifika Geçerli' : durum === 'İptal Edildi' ? 'İptal Edilmiş' : 'Süresi Dolmuş'}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">{s.sertifikaNo}</p>
                </div>
              </div>

              <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Belge sahibi</dt>
                  <dd className="font-medium">{adMaske(s.personelAd)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Eğitim</dt>
                  <dd className="text-right font-medium">{s.egitimAd}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Belge türü</dt>
                  <dd className="font-medium">{s.belgeTuru === 'resmi' ? 'Resmî belge' : 'Katılım belgesi'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Düzenlenme</dt>
                  <dd className="font-medium tabular-nums">{s.duzenlenmeTarihi}</dd>
                </div>
                {s.gecerlilikTarihi && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Geçerlilik</dt>
                    <dd className="font-medium tabular-nums">{s.gecerlilikTarihi}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Durum</dt>
                  <dd>
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', durumRenkSertifika[durum!])}>
                      {durum}
                    </span>
                  </dd>
                </div>
              </dl>

              {s.durum === 'İptal Edildi' && (
                <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  Bu belge {s.iptalTarihi} tarihinde iptal edilmiştir.
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheckIcon className="size-3.5" /> isghub sertifika doğrulama servisi
        </p>
      </div>
    </div>
  )
}
