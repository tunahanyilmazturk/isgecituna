import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Dialog } from '@base-ui/react/dialog'
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  ListChecksIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatKisa } from '@/lib/date'
import { ONEMLER, type DenetimSablon, type Onem, type SablonKategori, type SablonMadde } from '@/data/denetimler'
import { useDenetimlerStore } from '@/stores/denetimler-store'
import { useEkipStore } from '@/stores/ekip-store'
import { useAuthStore } from '@/stores/auth-store'
import { hesapGorunenAd } from '@/data/ekip'
import { useIzin } from '@/lib/izin'

let tmpSeq = 0
const tmpId = (p: string) => `${p}-yeni-${++tmpSeq}`

const inp = 'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring dark:bg-input/30'
const lbl = 'mb-1 block text-xs font-medium text-muted-foreground'

export default function DenetimSablonlarPage() {
  const nav = useNavigate()
  const st = useDenetimlerStore()
  const { uyeler, hesaplar } = useEkipStore()
  const user = useAuthStore((s) => s.user)
  const hesap = hesaplar.find((h) => h.kullaniciAdi === user?.username)
  const kullanici = hesap ? hesapGorunenAd(hesap, uyeler) : (user?.name ?? 'Kullanıcı')
  const duzenleIzni = useIzin('gorevlendirmeler.duzenle')
  const olusturIzni = useIzin('gorevlendirmeler.olustur')

  const [editor, setEditor] = useState<DenetimSablon | 'yeni' | null>(null)
  const [turlerAcik, setTurlerAcik] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button type="button" onClick={() => nav('/panel/denetimler')} className="mb-1 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeftIcon className="size-3.5" /> Denetimler
          </button>
          <h1 className="text-xl font-semibold tracking-tight">Kontrol listesi şablonları</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-muted-foreground">
            Denetimlerde kullanılacak kontrol listelerini oluşturun ve versiyonlayın. Maddeler denetime snapshot olarak kopyalanır — şablon sonradan değişse bile geçmiş denetimler etkilenmez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTurlerAcik(true)}><TagIcon /> Denetim Türleri</Button>
          {olusturIzni && <Button size="sm" onClick={() => setEditor('yeni')}><PlusIcon /> Yeni Şablon</Button>}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {st.sablonlar.map((s) => {
          const n = s.kategoriler.reduce((a, k) => a + k.maddeler.length, 0)
          const kullanim = st.denetimler.filter((d) => d.sablonlar.some((x) => x.sablonId === s.id)).length
          return (
            <div key={s.id} className={cn('rounded-xl border bg-card p-4', s.durum === 'Arşiv' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{s.ad}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{s.aciklama}</p>
                </div>
                <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium', s.durum === 'Aktif' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground')}>
                  {s.durum}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>v{s.surum}</span>
                <span>{s.kategoriler.length} kategori</span>
                <span>{n} madde</span>
                <span>{kullanim} denetimde kullanıldı</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Son güncelleme: {formatKisa(s.guncelleme)} · {s.olusturan}</p>
              <div className="mt-3 flex items-center gap-1.5 border-t pt-2.5">
                {duzenleIzni && s.durum === 'Aktif' && (
                  <Button variant="outline" size="xs" onClick={() => setEditor(s)}><PencilIcon /> Düzenle</Button>
                )}
                {olusturIzni && (
                  <Button variant="ghost" size="xs" onClick={() => { const y = st.sablonKopyala(s.id, kullanici); if (y) toast.success(`Kopyalandı: ${y.ad}`) }}><CopyIcon /> Kopyala</Button>
                )}
                {duzenleIzni && (
                  <Button variant="ghost" size="xs" onClick={() => st.sablonArsiv(s.id)}>
                    {s.durum === 'Aktif' ? <><ArchiveIcon /> Arşivle</> : <><ArchiveRestoreIcon /> Etkinleştir</>}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Şablon maddeleri örnek başlangıç içeriğidir — mevzuata uygunluk iddiası taşıyan maddeler uzman incelemesine açıktır; işyerine özgü listeler oluşturun.
      </p>

      {editor && <SablonEditor sablon={editor === 'yeni' ? undefined : editor} onKapat={() => setEditor(null)} onKaydet={(g) => {
        if (editor === 'yeni') {
          st.sablonOlustur(g, kullanici)
          toast.success('Şablon oluşturuldu')
        } else {
          st.sablonGuncelle(editor.id, { ...g, not: 'Düzenleme' }, kullanici)
          toast.success(`Şablon güncellendi — v${editor.surum + 1}`)
        }
        setEditor(null)
      }} />}

      {turlerAcik && <TurlerDialog onKapat={() => setTurlerAcik(false)} kullanici={kullanici} duzenleIzni={duzenleIzni} />}
    </div>
  )
}

/* ------------------------------- Şablon editörü ---------------------------- */

function SablonEditor({ sablon, onKapat, onKaydet }: { sablon?: DenetimSablon; onKapat: () => void; onKaydet: (g: { ad: string; aciklama?: string; kategoriler: SablonKategori[] }) => void }) {
  const [ad, setAd] = useState(sablon?.ad ?? '')
  const [aciklama, setAciklama] = useState(sablon?.aciklama ?? '')
  const [kategoriler, setKategoriler] = useState<SablonKategori[]>(() =>
    sablon ? JSON.parse(JSON.stringify(sablon.kategoriler)) : [{ id: tmpId('DSK'), ad: 'Genel', maddeler: [] }],
  )

  const maddeSayisi = kategoriler.reduce((a, k) => a + k.maddeler.length, 0)

  const katGuncelle = (id: string, patch: Partial<SablonKategori>) =>
    setKategoriler((l) => l.map((k) => (k.id === id ? { ...k, ...patch } : k)))
  const maddeGuncelle = (katId: string, maddeId: string, patch: Partial<SablonMadde>) =>
    setKategoriler((l) => l.map((k) => (k.id === katId ? { ...k, maddeler: k.maddeler.map((m) => (m.id === maddeId ? { ...m, ...patch } : m)) } : k)))

  return (
    <Dialog.Root open onOpenChange={(a) => !a && onKapat()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[92vh] w-[min(96vw,52rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-popover shadow-2xl">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <Dialog.Title className="text-base font-semibold">{sablon ? `Şablonu düzenle — v${sablon.surum} → v${sablon.surum + 1}` : 'Yeni kontrol listesi'}</Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">
                Kayıt yeni sürüm oluşturur; geçmiş denetimler kendi snapshot'larını korur.
              </Dialog.Description>
            </div>
            <Dialog.Close className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat">
              <XIcon className="size-4" />
            </Dialog.Close>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={lbl}>Şablon adı *</label>
                <input value={ad} onChange={(e) => setAd(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Açıklama</label>
                <input value={aciklama} onChange={(e) => setAciklama(e.target.value)} className={inp} />
              </div>
            </div>

            {kategoriler.map((k) => (
              <div key={k.id} className="rounded-xl border bg-card">
                <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
                  <input
                    value={k.ad}
                    onChange={(e) => katGuncelle(k.id, { ad: e.target.value })}
                    className="h-8 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm font-medium outline-none focus:border-input dark:bg-input/30"
                    placeholder="Kategori adı"
                  />
                  <span className="text-xs text-muted-foreground">{k.maddeler.length} madde</span>
                  <button
                    type="button"
                    onClick={() => setKategoriler((l) => l.filter((x) => x.id !== k.id))}
                    aria-label="Kategoriyi sil"
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
                <div className="divide-y">
                  {k.maddeler.map((m) => (
                    <div key={m.id} className="px-3.5 py-2.5">
                      <div className="flex items-start gap-2">
                        <input
                          value={m.soru}
                          onChange={(e) => maddeGuncelle(k.id, m.id, { soru: e.target.value })}
                          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring dark:bg-input/30"
                          placeholder="Kontrol sorusu…"
                        />
                        <select value={m.onem} onChange={(e) => maddeGuncelle(k.id, m.id, { onem: e.target.value as Onem })} className="h-8 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none dark:bg-input/30" aria-label="Önem">
                          {ONEMLER.map((o) => <option key={o}>{o}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => katGuncelle(k.id, { maddeler: k.maddeler.filter((x) => x.id !== m.id) })}
                          aria-label="Maddeyi sil"
                          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0.5 text-[11px]">
                        <label className="flex items-center gap-1 text-muted-foreground">
                          <input type="checkbox" checked={m.zorunlu} onChange={(e) => maddeGuncelle(k.id, m.id, { zorunlu: e.target.checked })} className="size-3.5 accent-amber-500" /> Zorunlu
                        </label>
                        <label className="flex items-center gap-1 text-muted-foreground">
                          <input type="checkbox" checked={m.fotografGerekli ?? false} onChange={(e) => maddeGuncelle(k.id, m.id, { fotografGerekli: e.target.checked })} className="size-3.5 accent-amber-500" /> Fotoğraf gerekli
                        </label>
                        <label className="flex items-center gap-1 text-muted-foreground">
                          <input type="checkbox" checked={m.aksiyonKurali ?? false} onChange={(e) => maddeGuncelle(k.id, m.id, { aksiyonKurali: e.target.checked })} className="size-3.5 accent-amber-500" /> Uygunsuzsa aksiyon öner
                        </label>
                        <input
                          value={m.mevzuatRef ?? ''}
                          onChange={(e) => maddeGuncelle(k.id, m.id, { mevzuatRef: e.target.value || undefined })}
                          placeholder="Mevzuat ref. (doğrulanmışsa)"
                          className="h-6 min-w-40 flex-1 rounded border border-transparent bg-transparent px-1.5 text-[11px] text-muted-foreground outline-none focus:border-input dark:bg-input/30"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => katGuncelle(k.id, { maddeler: [...k.maddeler, { id: tmpId('SM'), soru: '', onem: 'Orta', zorunlu: true, aksiyonKurali: true }] })}
                    className="flex w-full items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/5 dark:text-amber-400"
                  >
                    <PlusIcon className="size-3.5" /> Madde ekle
                  </button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setKategoriler((l) => [...l, { id: tmpId('DSK'), ad: `Kategori ${l.length + 1}`, maddeler: [] }])}
            >
              <PlusIcon /> Kategori ekle
            </Button>
          </div>
          <div className="flex items-center justify-between border-t px-5 py-3.5">
            <p className="text-xs text-muted-foreground">{kategoriler.length} kategori · {maddeSayisi} madde</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onKapat}>Vazgeç</Button>
              <Button
                size="sm"
                disabled={!ad.trim() || maddeSayisi === 0}
                onClick={() => onKaydet({ ad: ad.trim(), aciklama: aciklama.trim() || undefined, kategoriler: kategoriler.map((k) => ({ ...k, maddeler: k.maddeler.filter((m) => m.soru.trim()) })) })}
              >
                <CheckIcon /> Kaydet {sablon ? `(v${sablon.surum + 1})` : ''}
              </Button>
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ------------------------------ Tür diyaloğu ------------------------------- */

function TurlerDialog({ onKapat, kullanici, duzenleIzni }: { onKapat: () => void; kullanici: string; duzenleIzni: boolean }) {
  const turler = useDenetimlerStore((s) => s.turler)
  const st = useDenetimlerStore()
  const [yeni, setYeni] = useState('')

  return (
    <Dialog.Root open onOpenChange={(a) => !a && onKapat()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border bg-popover shadow-2xl">
          <div className="border-b px-5 py-4">
            <Dialog.Title className="text-base font-semibold">Denetim türleri</Dialog.Title>
            <Dialog.Description className="mt-0.5 text-xs text-muted-foreground">Yapılandırılabilir denetim türü listesi — pasif türler yeni denetimlerde gösterilmez.</Dialog.Description>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3">
            <div className="divide-y">
              {turler.map((t) => (
                <div key={t.id} className={cn('flex items-center justify-between gap-2 py-2', !t.aktif && 'opacity-50')}>
                  <span className="text-sm">{t.ad}</span>
                  {duzenleIzni && (
                    <button type="button" onClick={() => st.turArsiv(t.id)} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      {t.aktif ? 'Pasifleştir' : 'Etkinleştir'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {duzenleIzni && (
            <div className="flex gap-2 border-t px-5 py-3.5">
              <input value={yeni} onChange={(e) => setYeni(e.target.value)} placeholder="Yeni tür adı…" className={inp} />
              <Button
                size="sm"
                disabled={!yeni.trim()}
                onClick={() => {
                  st.turEkle(yeni.trim(), undefined, kullanici)
                  setYeni('')
                }}
              >
                <ListChecksIcon /> Ekle
              </Button>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
