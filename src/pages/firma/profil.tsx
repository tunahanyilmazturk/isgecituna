import { useState } from 'react'
import { toast } from 'sonner'
import { Building2Icon, FileEditIcon, SaveIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alan } from '@/components/form-bits'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useAyarlarStore } from '@/stores/ayarlar-store'
import { useOsgb } from '@/lib/osgb'
import { useFirmaKapsam, useFIzin, useYetkili } from './bits'
import { FirmaAvatar } from '@/components/firmalar/firma-avatar'

const Bilgi = ({ l, v }: { l: string; v?: React.ReactNode }) => (
  <div>
    <p className="text-[11px] text-muted-foreground">{l}</p>
    <p className="mt-0.5 text-[13px] font-medium">{v || '—'}</p>
  </div>
)

/** Firma Profilim — iletişim alanları izinliyse düzenlenir; kritik alanlar değişiklik talebiyle gider */
export default function FirmaProfilPage() {
  const k = useFirmaKapsam()
  const yetkili = useYetkili()
  const duzenle = useFIzin('firma.duzenle')
  const { firmaGuncelle } = useFirmalarStore()
  const logEkle = useAyarlarStore((s) => s.logEkle)
  const osgb = useOsgb().kisaAd || 'OSGB'
  const f = k.firma
  const [d, setD] = useState({ telefon: '', eposta: '', adres: '', basladi: false })
  const [talep, setTalep] = useState('')
  const [talepAcik, setTalepAcik] = useState(false)

  if (!f) return <div className="p-8 text-sm text-muted-foreground">Firma kaydı bulunamadı.</div>
  const kim = `${yetkili?.ad} ${yetkili?.soyad}`
  const form = d.basladi ? d : { telefon: f.telefon, eposta: f.eposta, adres: f.adres, basladi: true }

  const kaydet = () => {
    firmaGuncelle(f.id, { telefon: form.telefon, eposta: form.eposta, adres: form.adres }, `${kim} — firma portalı`)
    logEkle({ tarih: new Date().toISOString(), kullanici: kim, islem: 'Firma iletişim bilgileri güncellendi (firma portalı)', kayit: f.unvan })
    toast.success('İletişim bilgileri güncellendi')
    setD({ ...form, basladi: false })
  }

  const talepGonder = () => {
    if (!talep.trim()) return
    // Kritik alanlar (vergi/unvan/sicil) doğrudan değişmez — talep geçmişe ve audit log'a yazılır
    firmaGuncelle(f.id, {}, `${kim} değişiklik talebi iletti: ${talep.trim()}`)
    logEkle({ tarih: new Date().toISOString(), kullanici: kim, islem: 'Firma değişiklik talebi (firma portalı)', kayit: `${f.unvan} — ${talep.trim()}` })
    toast.success(`Değişiklik talebiniz ${osgb} yönetimine iletildi`)
    setTalep('')
    setTalepAcik(false)
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <FirmaAvatar ad={f.kisaAd || f.unvan} logo={f.logo} className="size-12 rounded-2xl text-base" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{f.unvan}</h1>
          <p className="text-sm text-muted-foreground">{f.kod} · {f.tehlikeSinifi || '—'} tehlike sınıfı</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Building2Icon className="size-4 text-amber-500" /> Kurumsal bilgiler
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">
            <Bilgi l="Unvan" v={f.unvan} />
            <Bilgi l="Firma kodu" v={f.kod} />
            <Bilgi l="Vergi dairesi / no" v={`${f.vergiDairesi} / ${f.vergiNo}`} />
            <Bilgi l="SGK sicil" v={f.sgkSicil} />
            <Bilgi l="NACE" v={f.nace} />
            <Bilgi l="Çalışan sayısı" v={String(f.calisanSayisi)} />
            <Bilgi l="İl / İlçe" v={`${f.il} / ${f.ilce}`} />
            <Bilgi l="Firma yetkilisi" v={f.yetkili} />
            <Bilgi l="Hizmet dönemi" v={`${f.hizmetBaslangic} → ${f.hizmetBitis}`} />
            <Bilgi l="OSGB uzmanı" v={f.uzman} />
          </div>
          <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
            Vergi, unvan ve sicil bilgileri bu portaldan değiştirilemez — değişiklik talebi {osgb}
            yönetimine iletilir.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setTalepAcik(true)}>
            <FileEditIcon /> Değişiklik talebi oluştur
          </Button>
        </section>

        <section className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">İletişim bilgileri</h2>
          {duzenle ? (
            <div className="mt-4 space-y-3">
              <Alan label="Telefon">
                <input value={form.telefon} onChange={(e) => setD({ ...form, telefon: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="E-posta">
                <input value={form.eposta} onChange={(e) => setD({ ...form, eposta: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <Alan label="Adres">
                <textarea rows={3} value={form.adres} onChange={(e) => setD({ ...form, adres: e.target.value })} className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30" />
              </Alan>
              <div className="flex justify-end">
                <Button size="sm" onClick={kaydet}>
                  <SaveIcon /> Kaydet
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-y-4">
              <Bilgi l="Telefon" v={f.telefon} />
              <Bilgi l="E-posta" v={f.eposta} />
              <Bilgi l="Adres" v={f.adres} />
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                İletişim bilgilerini düzenleme yetkiniz yok.
              </p>
            </div>
          )}
        </section>
      </div>

      {talepAcik && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setTalepAcik(false)}>
          <div className="w-full max-w-md rounded-2xl border bg-popover p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold">Değişiklik Talebi</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Unvan, vergi, sicil gibi kritik alanlardaki değişiklik talebiniz {osgb} yönetimine iletilir ve işlem geçmişine yazılır.
            </p>
            <textarea
              rows={4}
              value={talep}
              onChange={(e) => setTalep(e.target.value)}
              placeholder="Ör. Unvanımız … olarak değişti, yeni vergi levhası ektedir."
              className="mt-3 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTalepAcik(false)}>Vazgeç</Button>
              <Button disabled={!talep.trim()} onClick={talepGonder}>Talebi gönder</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
