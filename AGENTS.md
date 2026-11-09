# osgbhub — Mobil Sağlık Taraması Yönetim Paneli

React + TypeScript + Vite + Tailwind v4 frontend prototipi. Zustand + localStorage persist; backend yok.

Kapsam (yönetim paneli): İstatistikler (ana sayfa), Takvim, Firmalar, Teklif, Ekip, Personeller, Ekipmanlar, Taramalar, Testler, Ayarlar. Bu modül listesi `src/components/nav-items.ts` ve `src/App.tsx` içinde tanımlıdır.

Kaynak: isghub prototipinden (İSG yönetim sistemi) tasarım ve sayfa yapısı taşındı; İSG'ye özgü modüller kaldırıldı.

## Marka / kiracı ayrımı

- **Ürün adı `osgbhub`** — UI metinlerinde, belge altbilgilerinde ve dosya adlarında sabit.
- **OSGB kimliği kiracıya aittir** — `KurumBilgileri.kisaAd` (görünen ad) + `unvan` (ticari unvan), Ayarlar → Kurum Bilgileri'nden düzenlenir, `osgbhub-ayarlar` persist anahtarında saklanır. UI'da `useOsgb()`, React dışı kodda (PDF/Excel) `osgbAd()` / `osgbUnvan()` / `osgbLogoHarf()` (`src/lib/osgb.ts`) kullan; kurum adını hiçbir yerde sabit yazma.
- Müşteri `Firma` kayıtları OSGB kiracısına bağlıdır — firma liste/detay görünümlerinde sağlayıcı OSGB adı gösterilir.

## Tasarım kuralları

- **Tek sayfa kuralı:** Sayfalar görünüme sığmalı; dikey scroll çıkarmadan içerik tek ekranda sunulmalı (özellikle giriş/splash ekranları ve liste sayfaları). Yoğunluğu boşluk/tipografi küçülterek çöz, scroll ekleyerek değil.
- **Marka rengi:** Vurgu rengi amber/sarı (`amber-400`/`amber-500`, PDF'te `#F59E0B→#D97706`). Yeni ekranlarda sky/cyan/turkuaz vurgu kullanma; mevcut palet: emerald (başarı/tamam), amber (dikkat/aksiyon), orange (yüksek/bekleyen), violet (süreçte), red (kritik/hata), zinc (nötr).
- Icon seti `lucide-react`; kartlar `rounded-xl border bg-card`; tablolar kompakt, `tabular-nums` sayılar.

## Mimari notlar

- Persist anahtarları `osgbhub-*`.
- Yeni liste modülleri `ModulListesi` (`src/components/modul/modul-listesi.tsx`) ve `createModulStore` (`src/stores/modul-store.ts`) ile kurulur; tablo, arama, durum filtresi, ekle/düzenle/sil ve istatistik şeridi hazır gelir.
- Demo: giriş ekranındaki yönetim demosu, oturumu doğrudan açar (veri sıfırlama yok).
