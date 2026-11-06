/* Analiz widget'ları — tümü gerçek store verilerinden türetilen özetler */
import { Bos, CizgiGrafik, Donut, Widget, YatayBar } from './ortak'

export function TrendWidget({ trend }: { trend: { ay: string; etiket: string; aksiyon: number; olay: number; atama: number }[] }) {
  const toplam = trend.reduce((a, t) => a + t.aksiyon + t.olay + t.atama, 0)
  return (
    <Widget
      baslik="Aylık işlem trendi"
      aciklama="Tamamlanan risk aksiyonları, olay bildirimleri ve eğitim atamaları — son 6 ay"
    >
      {toplam === 0 ? (
        <Bos metin="Trend verisi yok" detay="Kayıtlar biriktikçe aylık işlem grafiği burada oluşur." />
      ) : (
        <CizgiGrafik
          etiketler={trend.map((t) => t.etiket)}
          seriler={[
            { ad: 'Tamamlanan aksiyon', renk: '#10B981', degerler: trend.map((t) => t.aksiyon) },
            { ad: 'Olay bildirimi', renk: '#F59E0B', degerler: trend.map((t) => t.olay) },
            { ad: 'Eğitim ataması', renk: '#F59E0B', degerler: trend.map((t) => t.atama) },
          ]}
        />
      )}
    </Widget>
  )
}

export function RiskAnalizWidget({
  riskDagilim, aksiyonDurum, firmaAcik,
}: {
  riskDagilim: { seviye: string; adet: number; renk: string }[]
  aksiyonDurum: { durum: string; adet: number; renk: string }[]
  firmaAcik: { ad: string; adet: number }[]
}) {
  const toplamTehlike = riskDagilim.reduce((a, r) => a + r.adet, 0)
  return (
    <Widget baslik="Risk analizi" aciklama="Tehlike seviyeleri, aksiyon durumları ve firmaya göre açık işler">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4">
          <Donut
            dilimler={riskDagilim.map((r) => ({ deger: r.adet, renk: r.renk, etiket: r.seviye }))}
            merkez={
              <>
                <span className="text-xl font-bold tabular-nums">{toplamTehlike}</span>
                <span className="text-[10px] text-muted-foreground">tehlike</span>
              </>
            }
          />
          <div className="space-y-1.5">
            {riskDagilim.map((r) => (
              <p key={r.seviye} className="flex items-center gap-2 text-[11px]">
                <span className="size-2 rounded-sm" style={{ background: r.renk }} />
                <span className="text-muted-foreground">{r.seviye}</span>
                <span className="ml-auto pl-3 font-semibold tabular-nums">{r.adet}</span>
              </p>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">Aksiyon durumları</p>
            <YatayBar ogeler={aksiyonDurum.map((a) => ({ etiket: a.durum, deger: a.adet, renk: a.renk }))} />
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">Firmaya göre açık aksiyon</p>
            {firmaAcik.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">Açık aksiyon yok</p>
            ) : (
              <YatayBar ogeler={firmaAcik.map((f) => ({ etiket: f.ad, deger: f.adet }))} renk="#F59E0B" />
            )}
          </div>
        </div>
      </div>
    </Widget>
  )
}

export function EgitimAnalizWidget({ egitim }: { egitim: { aktifAtama: number; gecikmis: number; ilerlemeToplam: number; tamamlanan: number; oran: number } }) {
  return (
    <Widget baslik="Eğitim analizi" aciklama="Atamalar ve personel ilerleme kayıtları">
      <div className="flex items-center gap-5">
        <Donut
          boyut={104}
          dilimler={[
            { deger: egitim.tamamlanan, renk: '#10B981', etiket: 'Tamamlanan' },
            { deger: Math.max(egitim.ilerlemeToplam - egitim.tamamlanan, 0), renk: '#3F3F46', etiket: 'Devam' },
          ]}
          merkez={
            <>
              <span className="text-lg font-bold tabular-nums">%{egitim.oran}</span>
              <span className="text-[10px] text-muted-foreground">tamamlanma</span>
            </>
          }
        />
        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
          {[
            { l: 'Aktif atama', v: egitim.aktifAtama },
            { l: 'Süresi geçen', v: egitim.gecikmis, vurgu: egitim.gecikmis > 0 },
            { l: 'İlerleme kaydı', v: egitim.ilerlemeToplam },
            { l: 'Tamamlanan', v: egitim.tamamlanan },
          ].map((x) => (
            <div key={x.l}>
              <p className={`text-xl font-semibold tabular-nums ${x.vurgu ? 'text-red-500' : ''}`}>{x.v}</p>
              <p className="text-[11px] text-muted-foreground">{x.l}</p>
            </div>
          ))}
        </div>
      </div>
    </Widget>
  )
}

export function FirmaAnalizWidget({ ozet }: { ozet: { aktif: number; pasif: number; yeni: number; personelTop5: { ad: string; adet: number }[] } }) {
  return (
    <Widget baslik="Firma analizi" aciklama="Portföy durumu ve personel yoğunluğu">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-4">
          <Donut
            boyut={104}
            dilimler={[
              { deger: ozet.aktif, renk: '#F59E0B', etiket: 'Aktif' },
              { deger: ozet.pasif, renk: '#3F3F46', etiket: 'Pasif' },
            ]}
            merkez={
              <>
                <span className="text-lg font-bold tabular-nums">{ozet.aktif + ozet.pasif}</span>
                <span className="text-[10px] text-muted-foreground">firma</span>
              </>
            }
          />
          <div className="space-y-1.5 text-[11px]">
            <p className="flex items-center gap-2"><span className="size-2 rounded-sm bg-amber-500" />Aktif <b className="tabular-nums">{ozet.aktif}</b></p>
            <p className="flex items-center gap-2"><span className="size-2 rounded-sm bg-zinc-600" />Pasif <b className="tabular-nums">{ozet.pasif}</b></p>
            <p className="flex items-center gap-2"><span className="size-2 rounded-sm bg-emerald-500" />Dönem içi yeni <b className="tabular-nums">{ozet.yeni}</b></p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">Personel yoğunluğu (aktif çalışan)</p>
          {ozet.personelTop5.length === 0 ? (
            <p className="text-xs text-muted-foreground/70">Personel kaydı yok</p>
          ) : (
            <YatayBar ogeler={ozet.personelTop5.map((f) => ({ etiket: f.ad, deger: f.adet }))} renk="#F59E0B" />
          )}
        </div>
      </div>
    </Widget>
  )
}
