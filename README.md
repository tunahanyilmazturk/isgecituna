# osgbhub — İSG Yönetim Sistemi

React 19 + TypeScript + Vite + Tailwind v4 ile yazılmış İSG (iş sağlığı ve güvenliği) yönetim prototipi. Veriler Zustand ile tarayıcı `localStorage` alanında tutulur; sunucu tarafı yoktur.

Ayrıntılı mimari ve tasarım kuralları için [AGENTS.md](AGENTS.md) ve [PRODUCT.md](PRODUCT.md) dosyalarına bakın.

## Gereksinimler

- Node.js 20 veya üzeri
- npm

## Kurulum ve çalıştırma

```bash
npm ci
npm run dev
```

Geliştirme sunucusu varsayılan olarak `http://localhost:5173` adresinde açılır.

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip denetimi (`tsc -b`) ve production build |
| `npm run preview` | Build çıktısını yerelde çalıştırır |
| `npm run lint` | oxlint ile kod denetimi |
| `npm test` | Vitest birim testleri |

## Demo girişleri

Giriş ekranındaki "demo ile keşfedin" butonları üç portal için demo oturumu açar:

- OSGB Yönetim demosu
- Firma Portalı demosu
- Katılımcı demosu

Demo verileri gerçek kayıtlardan izole tutulur ve oturum kapandığında geri yüklenir.

Kullanıcı adı / şifre ile girişte demo yönetici hesabı `yilmazturk` kullanılabilir. Şifre kaynak kodda düz metin olarak tutulmaz; yalnızca PBKDF2 özeti saklanır (bkz. `src/data/sifre-seed.ts`).

## Güvenlik notları

- Şifreler `src/lib/sifre.ts` içinde PBKDF2-SHA256 (600.000 iterasyon, kullanıcı başına rastgele tuz) ile özetlenir. Eski FNV-1a kayıtları girişte otomatik olarak yeni biçime yükseltilir.
- Bu doğrulama istemci tarafındadır. Gerçek bir ortamda kimlik doğrulama, yetkilendirme ve demo izolasyonu sunucuda yapılmalıdır.
- Persist verisi tarayıcı kotasını (~5 MB) aşarsa kullanıcı bilgilendirilir; kalıcı çözüm sunucu tarafı depolamadır.

## Klasör yapısı

```
src/
  pages/        Route sayfaları (panel, firma portalı, katılımcı portalı, ayarlar)
  components/   Paylaşılan ve modüle özel bileşenler
  stores/       Zustand store'ları (persist anahtarları: osgbhub-*)
  data/         Demo/tohum verileri ve tipler
  lib/          PDF, Excel, şifre, depolama ve yardımcı modüller
```
