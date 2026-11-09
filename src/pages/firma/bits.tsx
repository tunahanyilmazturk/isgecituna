import { useAuthStore } from '@/stores/auth-store'
import { useFirmaPortalStore } from '@/stores/firma-portal-store'
import { fIzinVar, type FirmaYetkili } from '@/data/firma-portal'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'
import { useFirmalarStore } from '@/stores/firmalar-store'
import { useSertifikaStore } from '@/stores/sertifikalar-store'

/** Aktif oturumun firma yetkilisi hesabı — RequireAuth Aktif durumu zaten zorunlu kılar */
export const useYetkili = (): FirmaYetkili | undefined => {
  const user = useAuthStore((s) => s.user)
  return useFirmaPortalStore((s) =>
    user?.tip === 'firma' ? s.yetkililer.find((y) => y.id === user.yetkiliId) : undefined,
  )
}

/** Firma kapsamlı izin — UI katmanı; backend her istekte tekrarlar */
export const useFIzin = (key: string): boolean => {
  const y = useYetkili()
  return fIzinVar(y, key)
}

/** Oturumdaki yetkilinin firma kapsamı — istemciden gelen firma id'sine güvenilmez */
export const useFirmaKapsam = () => {
  const y = useYetkili()
  const firmaId = y?.firmaId
  const personeller = usePersonelStore((s) => s.personeller)
  const atamalar = usePersonelStore((s) => s.atamalar)
  const hesaplar = usePersonelStore((s) => s.hesaplar)
  const ilerlemeler = useEgitimlerStore((s) => s.ilerlemeler)
  const sertifikalar = useSertifikaStore((s) => s.sertifikalar)
  const basvurular = useSertifikaStore((s) => s.basvurular)
  const firma = useFirmalarStore((s) => s.firmalar.find((f) => f.id === firmaId))

  const calisanlar = personeller.filter((p) => p.firmaId === firmaId)
  const pidSet = new Set(calisanlar.map((p) => p.id))
  const atamalarim = atamalar.filter((a) => a.firmaId === firmaId && a.durum !== 'İptal')
  const ilSet = ilerlemeler.filter((i) => pidSet.has(i.hesapId))
  const sertifikalarim = sertifikalar.filter((s) => s.firmaId === firmaId)
  const basvurularim = basvurular.filter((b) => pidSet.has(b.personelId))

  return {
    yetkili: y,
    firma,
    firmaId,
    calisanlar,
    pidSet,
    atamalarim,
    ilSet,
    sertifikalarim,
    basvurularim,
    hesaplar,
  }
}

/**
 * Personelin bir atamadaki ilerlemesi — çalışan portalıyla aynı ilerleme kaynağı:
 * hesapId = personelId, atamaId eşleşmesi.
 */
export const ilerlemeGetir = (
  ilerlemeler: ReturnType<typeof useEgitimlerStore.getState>['ilerlemeler'],
  personelId: string,
  atamaId: string,
) => ilerlemeler.find((i) => i.hesapId === personelId && i.atamaId === atamaId)

/** (atama × personel) çiftinin takip satırı — Eğitim Takibi ve özetler buradan beslenir */
export interface TakipSatiri {
  atamaId: string
  egitimId: string
  personelId: string
  atamaTarihi: string
  sonTarih: string
  icerikOran: number // 0–1
  sinavPuan?: number
  sinavGecti?: boolean
  denemeSayisi: number
  sonErisim?: string
  durum: string
}

export const takipSatirlari = (kapsam: ReturnType<typeof useFirmaKapsam>): TakipSatiri[] => {
  const { atamalarim, ilSet } = kapsam
  const egitimler = useEgitimlerStore.getState().egitimler
  const satirlar: TakipSatiri[] = []
  for (const a of atamalarim) {
    const e = egitimler.find((x) => x.id === a.egitimId)
    const sv = e?.surumler.find((s) => s.id === a.surumId)
    const zorunlular = sv?.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu) ?? []
    for (const pid of a.personelIds) {
      const il = ilSet.find((i) => i.hesapId === pid && i.atamaId === a.id)
      const son = il?.denemeler[il.denemeler.length - 1]
      const tamam = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
      satirlar.push({
        atamaId: a.id,
        egitimId: a.egitimId,
        personelId: pid,
        atamaTarihi: a.atamaTarihi,
        sonTarih: a.sonTarih,
        icerikOran: zorunlular.length ? tamam / zorunlular.length : il ? 1 : 0,
        sinavPuan: son?.puan,
        sinavGecti: son?.gecti,
        denemeSayisi: il?.denemeler.length ?? 0,
        sonErisim: il?.sonErisim,
        durum: il?.durum ?? 'Atanmış',
      })
    }
  }
  return satirlar
}
