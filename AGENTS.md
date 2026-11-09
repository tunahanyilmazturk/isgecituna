# isghub — İSG Yönetim Sistemi

React + TypeScript + Vite + Tailwind v4 frontend prototipi. Zustand + localStorage persist; backend yok.

## Marka / kiracı ayrımı

- **Ürün adı `isghub`** — UI metinlerinde, belge altbilgilerinde ve dosya adlarında sabit.
- **OSGB kimliği kiracıya aittir** — `KurumBilgileri.kisaAd` (görünen ad) + `unvan` (ticari unvan), Ayarlar → Kurum Bilgileri'nden düzenlenir, `isghub-ayarlar` persist anahtarında saklanır. UI'da `useOsgb()`, React dışı kodda (PDF/Excel) `osgbAd()` / `osgbUnvan()` / `osgbLogoHarf()` (`src/lib/osgb.ts`) kullan; kurum adını hiçbir yerde sabit yazma.
- Müşteri `Firma` kayıtları OSGB kiracısına bağlıdır — firma liste/detay görünümlerinde sağlayıcı OSGB adı gösterilir.

## Tasarım kuralları

- **Tek sayfa kuralı:** Sayfalar görünüme sığmalı; dikey scroll çıkarmadan içerik tek ekranda sunulmalı (özellikle giriş/splash ekranları ve liste sayfaları). Yoğunluğu boşluk/tipografi küçülterek çöz, scroll ekleyerek değil.
- **Marka rengi:** Vurgu rengi amber/sarı (`amber-400`/`amber-500`, PDF'te `#F59E0B→#D97706`). Yeni ekranlarda sky/cyan/turkuaz vurgu kullanma; mevcut palet: emerald (başarı/tamam), amber (dikkat/aksiyon), orange (yüksek/bekleyen), violet (süreçte), red (kritik/hata), zinc (nötr).
- Icon seti `lucide-react`; kartlar `rounded-xl border bg-card`; tablolar kompakt, `tabular-nums` sayılar.

## Mimari notlar

- Persist anahtarları `isghub-*`; demo oturumu `src/lib/demo-session.ts` snapshot/restore ile izole edilir.
- PDF üretimi `src/lib/risk-pdf.tsx` / `denetim-pdf.tsx` — `html2canvas` `oklch/lab/color-mix` parse edemediği için klon DOM stilleri sanitize edilir (mevcut yardımcıları kullan).
- Denetimler modülü: `src/data/denetimler.ts` + `src/stores/denetimler-store.ts`; bulgu→aksiyon entegrasyonu `RiskAksiyon.kaynak` üzerinden.
