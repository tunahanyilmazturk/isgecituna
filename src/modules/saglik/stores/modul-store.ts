import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { guvenliDepo } from '@saglik/lib/guvenli-depo'

export interface KayitBase {
  id: string
}

export interface ModulState<T extends KayitBase> {
  kayitlar: T[]
  /** Yeni kaydı ekler ve kimliğini döndürür */
  ekle: (k: Omit<T, 'id'>) => string
  guncelle: (id: string, patch: Partial<T>) => void
  sil: (id: string) => void
}

/**
 * Basit kayıt deposu: liste + ekle/güncelle/sil. Her modül kendi `osgbhub-*` anahtarında saklanır.
 * `onek` kimlik önekidir (ör. "TKL" → TKL-k3x9a).
 */
export function createModulStore<T extends KayitBase>(
  anahtar: string,
  onek: string,
  seed: T[],
  /** Demo verisi değiştiğinde eski kayıtları yeni sürüme taşıyan göç (kullanıcının eklediği kayıtlar korunur) */
  surum?: { version: number; migrate: (kayitlar: T[]) => T[] },
) {
  return create<ModulState<T>>()(
    persist(
      (set) => ({
        kayitlar: seed,
        ekle: (k) => {
          const id = `${onek}-${Date.now().toString(36)}`
          set((s) => ({ kayitlar: [{ ...k, id } as T, ...s.kayitlar] }))
          return id
        },
        guncelle: (id, patch) =>
          set((s) => ({
            kayitlar: s.kayitlar.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          })),
        sil: (id) => set((s) => ({ kayitlar: s.kayitlar.filter((x) => x.id !== id) })),
      }),
      {
        name: `osgbhub-${anahtar}`,
        storage: guvenliDepo,
        version: surum?.version ?? 1,
        migrate: (durum, eskiSurum) => {
          const kayitli = durum as ModulState<T>
          if (!surum || eskiSurum >= surum.version) return kayitli
          return { ...kayitli, kayitlar: surum.migrate(kayitli.kayitlar ?? []) }
        },
      },
    ),
  )
}
