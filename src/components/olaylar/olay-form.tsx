import { PaperclipIcon, XIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { textareaCls } from '@/components/olaylar/olay-form-utils'
import {
  BOLUMLER,
  FIRMALAR,
  ISYERLERI,
  RISKLER,
  SONUCLAR,
  SORUMLULAR,
  TURLER,
  VUCUT_BOLGELERI,
  YARALANMA_TURLERI,
} from '@/data/olaylar'
import { eklereCevir } from '@/components/olaylar/olay-form-utils'
import { Alan, Bolum, CheckAlan, EkIkon, Sec } from '@/components/form-bits'
import type { OlayFormSet, OlayFormState } from '@/components/olaylar/olay-form-utils'
import type { OlayTuru, RiskSeviyesi } from '@/data/olaylar'

export { Alan, Bolum, CheckAlan, EkIkon, Sec }

// ---------- Adım içerikleri (A–E) ----------

export function AdimOlayBilgileri({ form, set }: { form: OlayFormState; set: OlayFormSet }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Alan label="Firma *">
          <Sec value={form.firma} onChange={(v) => set('firma', v)} options={FIRMALAR} />
        </Alan>
        <Alan label="İşyeri / Şube">
          <Sec value={form.isyeri} onChange={(v) => set('isyeri', v)} options={ISYERLERI} />
        </Alan>
        <Alan label="Bölüm">
          <Sec value={form.bolum} onChange={(v) => set('bolum', v)} options={BOLUMLER} />
        </Alan>
        <Alan label="Olay tarihi *">
          <Input
            type="date"
            value={form.tarih}
            onChange={(e) => set('tarih', e.target.value)}
          />
        </Alan>
        <Alan label="Olay saati">
          <Input type="time" value={form.saat} onChange={(e) => set('saat', e.target.value)} />
        </Alan>
        <Alan label="Olay türü *">
          <Sec value={form.tur} onChange={(v) => set('tur', v as OlayTuru)} options={TURLER} />
        </Alan>
      </div>
      <Alan label="Olay başlığı *">
        <Input
          value={form.baslik}
          onChange={(e) => set('baslik', e.target.value)}
          placeholder="Örn: Pres operatörü parmak sıkışması"
        />
      </Alan>
      <Alan label="Açıklama">
        <textarea
          value={form.aciklama}
          onChange={(e) => set('aciklama', e.target.value)}
          rows={3}
          placeholder="Olayın nasıl gerçekleştiğini kısaca anlatın…"
          className={textareaCls}
        />
      </Alan>
    </>
  )
}

export function AdimIlgiliKisiler({ form, set }: { form: OlayFormState; set: OlayFormSet }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Alan label="Etkilenen çalışan">
        <Input
          value={form.calisan}
          onChange={(e) => set('calisan', e.target.value)}
          placeholder="Ad soyad"
        />
      </Alan>
      <Alan label="TC Kimlik No">
        <Input
          value={form.tc}
          onChange={(e) => set('tc', e.target.value)}
          placeholder="11 haneli (maskelenir)"
          maxLength={11}
          inputMode="numeric"
        />
      </Alan>
      <Alan label="Görevi / Departmanı">
        <Input
          value={form.gorev}
          onChange={(e) => set('gorev', e.target.value)}
          placeholder="Örn: Pres Operatörü"
        />
      </Alan>
      <Alan label="Bildiren">
        <Input value={form.bildiren} disabled />
      </Alan>
      <Alan label="Tanıklar" className="col-span-2">
        <Input
          value={form.taniklar}
          onChange={(e) => set('taniklar', e.target.value)}
          placeholder="Virgülle ayırın"
        />
      </Alan>
    </div>
  )
}

export function AdimSiniflandirma({ form, set }: { form: OlayFormState; set: OlayFormSet }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CheckAlan
          label="Yaralanma var"
          checked={form.yaralanma}
          onChange={(v) => set('yaralanma', v)}
        />
        <CheckAlan
          label="Maddi hasar var"
          checked={form.maddiHasar}
          onChange={(v) => set('maddiHasar', v)}
        />
        <CheckAlan
          label="İş kaybı oluştu"
          checked={form.isKaybi}
          onChange={(v) => set('isKaybi', v)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Alan label="Risk seviyesi *">
          <Sec
            value={form.risk}
            onChange={(v) => set('risk', v as RiskSeviyesi)}
            options={RISKLER}
          />
        </Alan>
        {form.yaralanma && (
          <>
            <Alan label="Yaralanma türü">
              <Sec
                value={form.yaralanmaTuru}
                onChange={(v) => set('yaralanmaTuru', v)}
                options={YARALANMA_TURLERI}
              />
            </Alan>
            <Alan label="Vücut bölgesi">
              <Sec
                value={form.vucutBolgesi}
                onChange={(v) => set('vucutBolgesi', v)}
                options={VUCUT_BOLGELERI}
              />
            </Alan>
            <Alan label="Olayın sonucu">
              <Sec value={form.sonuc} onChange={(v) => set('sonuc', v)} options={SONUCLAR} />
            </Alan>
          </>
        )}
      </div>
    </>
  )
}

export function AdimEkler({
  form,
  set,
  dosyaRef,
}: {
  form: OlayFormState
  set: OlayFormSet
  dosyaRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <>
      <input
        ref={dosyaRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          set('ekler', [...form.ekler, ...eklereCevir(e.target.files)])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => dosyaRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
      >
        <PaperclipIcon className="size-4" />
        Fotoğraf, belge veya video eklemek için tıklayın
      </button>
      {form.ekler.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {form.ekler.map((e, i) => (
            <li
              key={`${e.ad}-${i}`}
              className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
            >
              <EkIkon tur={e.tur} />
              <span className="font-medium">{e.ad}</span>
              <span className="text-muted-foreground">{e.boyut}</span>
              <button
                type="button"
                aria-label="Eki kaldır"
                onClick={() =>
                  set(
                    'ekler',
                    form.ekler.filter((_, j) => j !== i),
                  )
                }
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Alan label="Açıklama / Not">
        <Input
          value={form.notlar}
          onChange={(e) => set('notlar', e.target.value)}
          placeholder="Eklemek istediğiniz not…"
        />
      </Alan>
    </>
  )
}

export function AdimIlkMudahale({ form, set }: { form: OlayFormState; set: OlayFormSet }) {
  return (
    <>
      <Alan label="Alınan ilk önlemler">
        <textarea
          value={form.ilkOnlemler}
          onChange={(e) => set('ilkOnlemler', e.target.value)}
          rows={2}
          placeholder="Olay yerinde alınan acil önlemler…"
          className={textareaCls}
        />
      </Alan>
      <Alan label="Düzeltici faaliyet (DÖF)">
        <Input
          value={form.duzelticiFaaliyet}
          onChange={(e) => set('duzelticiFaaliyet', e.target.value)}
          placeholder="Yapılması gereken düzeltici faaliyet…"
        />
      </Alan>
      {form.duzelticiFaaliyet && (
        <div className="grid grid-cols-2 gap-3">
          <Alan label="Aksiyon sorumlusu">
            <Sec
              value={form.aksiyonSorumlusu || SORUMLULAR[0]}
              onChange={(v) => set('aksiyonSorumlusu', v)}
              options={SORUMLULAR}
            />
          </Alan>
          <Alan label="Hedef tamamlanma">
            <Input
              type="date"
              value={form.hedefTarih}
              onChange={(e) => set('hedefTarih', e.target.value)}
            />
          </Alan>
        </div>
      )}
    </>
  )
}
