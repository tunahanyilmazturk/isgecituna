import {
  BOLUMLER,
  BUGUN,
  FIRMALAR,
  ISYERLERI,
  SONUCLAR,
  VUCUT_BOLGELERI,
  YARALANMA_TURLERI,
} from '@/data/olaylar'
import { firmaIdByAd, firmalarSeed } from '@/data/firmalar'
import type { Olay, OlayEk, OlayTuru, RiskSeviyesi } from '@/data/olaylar'

export const selectCls =
  'h-8 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-7 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export const textareaCls =
  'w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export interface OlayFormState {
  firma: string
  isyeri: string
  tarih: string
  saat: string
  bolum: string
  tur: OlayTuru
  baslik: string
  aciklama: string
  calisan: string
  tc: string
  gorev: string
  taniklar: string
  yaralanma: boolean
  maddiHasar: boolean
  isKaybi: boolean
  yaralanmaTuru: string
  vucutBolgesi: string
  sonuc: string
  risk: RiskSeviyesi
  ilkOnlemler: string
  duzelticiFaaliyet: string
  aksiyonSorumlusu: string
  hedefTarih: string
  notlar: string
  ekler: OlayEk[]
  bildiren: string
}

export type OlayFormSet = <K extends keyof OlayFormState>(k: K, v: OlayFormState[K]) => void

export const bosForm = (bildiren: string): OlayFormState => ({
  firma: FIRMALAR[0],
  isyeri: ISYERLERI[0],
  tarih: BUGUN,
  saat: '09:00',
  bolum: BOLUMLER[0],
  tur: 'Ramak Kala',
  baslik: '',
  aciklama: '',
  calisan: '',
  tc: '',
  gorev: '',
  taniklar: '',
  yaralanma: false,
  maddiHasar: false,
  isKaybi: false,
  yaralanmaTuru: YARALANMA_TURLERI[0],
  vucutBolgesi: VUCUT_BOLGELERI[0],
  sonuc: SONUCLAR[0],
  risk: 'Orta',
  ilkOnlemler: '',
  duzelticiFaaliyet: '',
  aksiyonSorumlusu: '',
  hedefTarih: '',
  notlar: '',
  ekler: [],
  bildiren,
})

export const olaydanForm = (o: Olay): OlayFormState => ({
  firma: o.firma,
  isyeri: o.isyeri,
  tarih: o.tarih,
  saat: o.saat,
  bolum: o.bolum,
  tur: o.tur,
  baslik: o.baslik,
  aciklama: o.aciklama,
  calisan: o.calisan ?? '',
  tc: '',
  gorev: o.gorev ?? '',
  taniklar: o.taniklar ?? '',
  yaralanma: o.yaralanma,
  maddiHasar: o.maddiHasar,
  isKaybi: o.isKaybi,
  yaralanmaTuru: o.yaralanmaTuru ?? YARALANMA_TURLERI[0],
  vucutBolgesi: o.vucutBolgesi ?? VUCUT_BOLGELERI[0],
  sonuc: o.sonuc ?? SONUCLAR[0],
  risk: o.risk,
  ilkOnlemler: o.ilkOnlemler ?? '',
  duzelticiFaaliyet: o.duzelticiFaaliyet ?? '',
  aksiyonSorumlusu: '',
  hedefTarih: '',
  notlar: o.notlar ?? '',
  ekler: o.ekler,
  bildiren: o.bildiren,
})

export const maskele = (tc: string) => {
  const d = tc.replace(/\D/g, '')
  return d.length === 11 ? `${d[0]}*********${d[10]}` : ''
}

export const eklereCevir = (files: FileList | null): OlayEk[] =>
  !files
    ? []
    : [...files].map((f) => ({
        ad: f.name,
        tur: f.type.startsWith('image/')
          ? 'Fotoğraf'
          : f.type.startsWith('video/')
            ? 'Video'
            : 'Belge',
        boyut:
          f.size > 1048576
            ? `${(f.size / 1048576).toFixed(1)} MB`
            : `${Math.max(1, Math.round(f.size / 1024))} KB`,
      }))

// Form → Olay kaydı (id/durum/gecmis/sorumlu/aksiyonlar hariç)
export const formdanOlaya = (form: OlayFormState, eskiTc?: string) => ({
  tarih: form.tarih,
  saat: form.saat,
  firma: form.firma,
  firmaId: firmaIdByAd(firmalarSeed, form.firma),
  isyeri: form.isyeri,
  bolum: form.bolum,
  tur: form.tur,
  baslik: form.baslik.trim(),
  aciklama: form.aciklama.trim() || '—',
  calisan: form.calisan.trim() || undefined,
  tc: maskele(form.tc) || eskiTc,
  gorev: form.gorev.trim() || undefined,
  bildiren: form.bildiren,
  taniklar: form.taniklar.trim() || undefined,
  yaralanma: form.yaralanma,
  maddiHasar: form.maddiHasar,
  isKaybi: form.isKaybi,
  yaralanmaTuru: form.yaralanma ? form.yaralanmaTuru : undefined,
  vucutBolgesi: form.yaralanma ? form.vucutBolgesi : undefined,
  sonuc: form.yaralanma ? form.sonuc : undefined,
  risk: form.risk,
  ekler: form.ekler,
  ilkOnlemler: form.ilkOnlemler.trim() || undefined,
  duzelticiFaaliyet: form.duzelticiFaaliyet.trim() || undefined,
  notlar: form.notlar.trim() || undefined,
})
