import { createModulStore } from '@saglik/stores/modul-store'
import { ekipmanSeed, testSeed, taramaSeed, teklifSeed, testPaketiSeed } from '@saglik/data/saglik'
import type { Ekipman, Tarama, Teklif, Test, TestPaketi } from '@saglik/data/saglik'
import { firmalarSeed, type Firma } from '@saglik/data/firmalar'
import { personellerSeed, type FirmaPersonel } from '@saglik/data/personeller'

/** Demo kayıtları sürüm 2 ile güncellendi: eski demo kayıtları yenileriyle değiştirilir, kullanıcı kayıtları korunur */
const demoYenile = <T extends { id: string }>(seed: T[]) => (kayitlar: T[]) => [...seed, ...kayitlar.filter((k) => !seed.some((s) => s.id === k.id))]

export const useTeklifStore = createModulStore<Teklif>('teklifler', 'TKL', teklifSeed, { version: 2, migrate: demoYenile(teklifSeed) })
export const useTestStore = createModulStore<Test>('testler', 'TST', testSeed)
export const useEkipmanStore = createModulStore<Ekipman>('ekipmanlar', 'EKP', ekipmanSeed)
export const useTaramaStore = createModulStore<Tarama>('taramalar', 'TRM', taramaSeed, { version: 2, migrate: demoYenile(taramaSeed) })
export const useTestPaketiStore = createModulStore<TestPaketi>('test-paketleri', 'PKT', testPaketiSeed)
export const useFirmaStore = createModulStore<Firma>('firmalar-v2', 'FR', firmalarSeed)
export const usePersonelKayitStore = createModulStore<FirmaPersonel>('firma-personelleri', 'PRS', personellerSeed)
