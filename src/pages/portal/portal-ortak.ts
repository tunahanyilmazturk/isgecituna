import { useMemo } from 'react'
import { ilerlemedenKisi, type EgitimAtama, type KisiDurum } from '@/data/personeller'
import type { Egitim, EgitimIlerleme } from '@/data/egitimler'
import { kalanSureDakika, siradakiIcerik, type SiradakiIcerik, type SurumYapisi } from '@/lib/katilimci'
import { useAuthStore } from '@/stores/auth-store'
import { usePersonelStore } from '@/stores/personeller-store'
import { useEgitimlerStore } from '@/stores/egitimler-store'

/** Giriş yapan çalışanın personel kimliği — atamalar ve ilerleme buna bağlı */
export const useBen = () => {
  const user = useAuthStore((s) => s.user)
  const personeller = usePersonelStore((s) => s.personeller)
  const p = personeller.find((x) => x.id === user?.personelId)
  return { user, p, pid: user?.personelId ?? '' }
}

/** Katılımcının bir atamasına ait görünüm satırı */
export interface AtamaSatiri {
  a: EgitimAtama
  eg: Egitim | undefined
  sv: SurumYapisi | undefined
  il: EgitimIlerleme | undefined
  kd: KisiDurum
  /** Zorunlu içeriklerin tamamlanma yüzdesi */
  yuzde: number
  siradaki: SiradakiIcerik | null
  kalanDk: number
}

export const useAtamalarim = (pid: string): AtamaSatiri[] => {
  const atamalar = usePersonelStore((s) => s.atamalar)
  const { egitimler, ilerlemeler } = useEgitimlerStore()
  return useMemo(
    () =>
      atamalar
        .filter((a) => a.durum !== 'İptal' && a.personelIds.includes(pid))
        .map((a) => {
          const eg = egitimler.find((e) => e.id === a.egitimId)
          const sv = eg?.surumler.find((s) => s.id === a.surumId)
          const il = ilerlemeler.find((i) => i.hesapId === pid && i.atamaId === a.id)
          const kd = ilerlemedenKisi(il?.durum, a.sonTarih)
          const zorunlular = sv?.bolumler.flatMap((b) => b.icerikler).filter((i) => i.zorunlu) ?? []
          const tam = zorunlular.filter((i) => il?.icerikler[i.id]?.tamamlandi).length
          return {
            a,
            eg,
            sv,
            il,
            kd,
            yuzde: zorunlular.length ? Math.round((tam / zorunlular.length) * 100) : 0,
            siradaki: siradakiIcerik(sv, il),
            kalanDk: kalanSureDakika(sv, il),
          }
        })
        .sort((x, y) => x.a.sonTarih.localeCompare(y.a.sonTarih)),
    [atamalar, egitimler, ilerlemeler, pid],
  )
}

/** Katılımcıya gösterilen durum etiketi: "Onay Bekliyor" İSG tarafındaki onayı ifade eder */
export const kdEtiket = (kd: KisiDurum): string => (kd === 'Onay Bekliyor' ? 'İSG onayı bekleniyor' : kd)

/** Eğitim oynatıcı rotası */
export const oynatYolu = (egitimId: string, atamaId: string) => `/portal/egitimler/${egitimId}/oynat?atama=${atamaId}`
