/*
 * Modül kayıt kapsamı — hesabın izin kapsamı ayarına göre görünür firma
 * kümesini çözümler.
 *  - 'tumu'    → tüm firmalar
 *  - 'atanmis' → aktif görevlendirmesi olan firmalar (ekip görevlendirme kaydı)
 *  - 'secili'  → izin ekranından seçilen firmalar
 *  - 'kendi'   → firma kısıtı yok, yalnızca kullanıcının oluşturduğu kayıtlar
 *
 * ÖNEMLİ: UI tarafı yalnızca görünürlüğü kısar; üretimde aynı filtre
 * sunucu tarafında sorgu düzeyinde zorunlu olarak uygulanır.
 */
import { useMemo } from 'react'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { hesapGorunenAd } from '@/data/ekip'

export interface Kapsam {
  /** null → firma kısıtı yok; Set → yalnız bu firmaId'ler görünür */
  firmaIds: Set<string> | null
  /** 'kendi' kapsamı — yalnız kullanıcının oluşturduğu kayıtlar */
  sadeceKendi: boolean
  /** Oturum sahibinin görünen adı (sadeceKendi karşılaştırması için) */
  kullanici: string
}

export function useKapsam(modul: string): Kapsam {
  const { uyeler, hesaplar, gorevlendirmeler } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? '')

  return useMemo(() => {
    const k = hesap?.kapsam?.[modul]
    if (!k || k.tip === 'tumu') return { firmaIds: null, sadeceKendi: false, kullanici }
    if (k.tip === 'kendi') return { firmaIds: null, sadeceKendi: true, kullanici }
    if (k.tip === 'secili') return { firmaIds: new Set(k.firmalar ?? []), sadeceKendi: false, kullanici }
    // 'atanmis' — aktif görevlendirme kayıtlarından firma kümesi
    const ids = gorevlendirmeler
      .filter((g) => g.personelId === hesap?.personelId && g.durum === 'Aktif')
      .map((g) => g.firmaId)
    return { firmaIds: new Set(ids), sadeceKendi: false, kullanici }
  }, [hesap, gorevlendirmeler, kullanici, modul])
}

export const kapsamdaMi = (k: Kapsam, firmaId: string): boolean => !k.firmaIds || k.firmaIds.has(firmaId)

export const kapsamdaKayitMi = (k: Kapsam, firmaId: string | undefined, olusturan?: string): boolean => {
  if (firmaId && !kapsamdaMi(k, firmaId)) return false
  if (k.sadeceKendi && olusturan && olusturan !== k.kullanici) return false
  return true
}
