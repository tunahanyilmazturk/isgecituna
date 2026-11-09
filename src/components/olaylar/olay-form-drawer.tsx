import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import {
  AdimEkler,
  AdimIlkMudahale,
  AdimIlgiliKisiler,
  AdimOlayBilgileri,
  AdimSiniflandirma,
  Bolum,
} from '@/components/olaylar/olay-form'
import { bosForm, formdanOlaya, olaydanForm } from '@/components/olaylar/olay-form-utils'
import type { OlayFormSet } from '@/components/olaylar/olay-form-utils'
import { useAuthStore } from '@/stores/auth-store'
import { useOlaylarStore } from '@/stores/olaylar-store'
import { BUGUN, SORUMLULAR } from '@/data/olaylar'
import type { Olay } from '@/data/olaylar'

export function OlayFormDrawer({
  duzenle,
  open,
  onKapat,
}: {
  duzenle: Olay | null
  open: boolean
  onKapat: () => void
}) {
  const ekle = useOlaylarStore((s) => s.ekle)
  const guncelle = useOlaylarStore((s) => s.guncelle)
  const user = useAuthStore((s) => s.user)
  const dosyaRef = useRef<HTMLInputElement>(null)
  const bildirenAd = user?.name ?? 'Tunahan Yılmaztürk'

  // Drawer kapandığında içerik unmount olur — form her açılışta temiz/dolu başlar
  const [form, setForm] = useState(() =>
    duzenle ? olaydanForm(duzenle) : bosForm(bildirenAd),
  )

  const acik = open || !!duzenle

  const set: OlayFormSet = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const kaydet = () => {
    if (!form.baslik.trim()) {
      toast.error('Olay başlığı gerekli')
      return
    }
    const ortak = formdanOlaya(form, duzenle?.tc)

    if (duzenle) {
      guncelle(duzenle.id, ortak)
      toast.success(`${duzenle.id} güncellendi`)
    } else {
      const yeniAksiyonlar =
        form.aksiyonSorumlusu && form.duzelticiFaaliyet
          ? [
              {
                id: 'AKS-Y',
                aciklama: form.duzelticiFaaliyet.trim(),
                sorumlu: form.aksiyonSorumlusu,
                baslangic: BUGUN,
                hedefBitis: form.hedefTarih || BUGUN,
                tamamlandi: false,
              },
            ]
          : []
      const sorumlu = form.aksiyonSorumlusu || SORUMLULAR[0]
      const yeni = ekle({ ...ortak, sorumlu, aksiyonlar: yeniAksiyonlar })
      toast.success(`${yeni.id} oluşturuldu — durum: Yeni Bildirildi`)
    }
    onKapat()
  }

  return (
    <Sheet
      open={acik}
      onOpenChange={(a) => {
        if (!a) onKapat()
      }}
    >
      <SheetContent className="w-full max-w-2xl gap-0 p-0" aria-describedby={undefined}>
        <div className="border-b px-5 py-4">
          <SheetTitle className="text-lg">
            {duzenle ? `${duzenle.id} — Olayı Düzenle` : 'Yeni Olay Bildir'}
          </SheetTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            İş kazası, ramak kala veya tehlikeli durum kaydı oluşturun.
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
          <Bolum harf="A" baslik="Olay bilgileri">
            <AdimOlayBilgileri form={form} set={set} />
          </Bolum>
          <Bolum harf="B" baslik="İlgili kişiler">
            <AdimIlgiliKisiler form={form} set={set} />
          </Bolum>
          <Bolum harf="C" baslik="Sınıflandırma">
            <AdimSiniflandirma form={form} set={set} />
          </Bolum>
          <Bolum harf="D" baslik="Kanıt ve ekler">
            <AdimEkler form={form} set={set} dosyaRef={dosyaRef} />
          </Bolum>
          <Bolum harf="E" baslik="İlk müdahale ve aksiyon">
            <AdimIlkMudahale form={form} set={set} />
          </Bolum>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <Button variant="ghost" onClick={onKapat}>
            Vazgeç
          </Button>
          <Button onClick={kaydet}>{duzenle ? 'Kaydet' : 'Olayı Bildir'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
