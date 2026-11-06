import { TODAY } from '@/data/dashboard'
import { temelIsgSurum4, temelIsgGorselleri } from './egitim-temel-isg'

export const BUGUN = TODAY

/* ================================ Tipler ================================= */

export type EgitimDurum = 'Taslak' | 'Yayında' | 'Arşiv'
export type IcerikTur = 'video' | 'pdf' | 'slayt' | 'gorsel' | 'metin' | 'harici-video'
export type SinavSoruTur = 'tek' | 'coklu' | 'dy' // ileride: 'eslestirme' | 'bosluk'
export type IlerlemeDurum =
  | 'Başlamadı'
  | 'Devam Ediyor'
  | 'İçerikler Tamamlandı'
  | 'Sınav Bekleniyor'
  | 'Sınav Başarısız'
  | 'Sınav Başarılı'
  | 'Onay Bekliyor'
  | 'Tamamlandı'

/** İçerik dosyası — prototipte IndexedDB anahtarı, ileride backend storage anahtarı */
export interface IcerikDosya {
  ad: string
  boyut: string
  url?: string // isghub-asset: referansı veya legacy https:
  sayfaSayisi?: number // pdf/slayt sanal sayfa sayısı (mock içerikte)
}

export interface Icerik {
  id: string
  baslik: string
  aciklama: string
  tur: IcerikTur
  dosya?: IcerikDosya
  url?: string // harici video linki
  metinIcerik?: string // metin türünde gövde
  slaytlar?: { baslik: string; notlar: string[]; gorsel?: string; gorselAlt?: string }[] // slayt türünde sanal slaytlar; gorsel: public altındaki fotoğraf yolu
  sayfalar?: { baslik: string; metin: string }[] // pdf türünde sanal sayfalar
  zorunlu: boolean
  sureDakika: number
}

export interface Bolum {
  id: string
  baslik: string
  icerikler: Icerik[]
}

export interface SinavSoru {
  id: string
  tur: SinavSoruTur
  soru: string
  gorsel?: string
  secenekler: string[]
  dogru: number[] // doğru seçenek indeksleri (tek/dy için tek eleman)
  puan: number
  aciklama?: string
}

export interface SinavAyarlari {
  gecmePuani: number // 0-100
  sureDakika: number // 0 = sınırsız
  denemeHakki: number // 0 = sınırsız
  soruKaristir: boolean
  sikKaristir: boolean
  cevaplariGoster: boolean
  aciklamalariGoster: boolean
}

export interface Sinav {
  id: string
  baslik: string
  aciklama: string
  sorular: SinavSoru[]
  ayarlar: SinavAyarlari
}

export interface TamamlamaAyarlari {
  videoMinYuzde: number // 0-100
  zorunluBolumlerTumu: boolean
  sinavZorunlu: boolean
  manuelOnay: boolean
}

export interface EgitimSurum {
  id: string
  no: number
  bolumler: Bolum[]
  sinav?: Sinav
  /** Eğitimden önce alınan ön sınav (deneme niteliğinde; puan eğitimi engellemez) */
  onSinav?: Sinav
  tamamlama: TamamlamaAyarlari
  durum: 'taslak' | 'aktif' | 'eski'
  not: string
  tarih: string
}

export interface Egitim {
  id: string
  baslik: string
  aciklama: string
  kategori: string
  dil: string
  sureDakika: number
  hedefler: string[]
  etiketler: string[]
  kapakTon: string // gradient ton (kapak görseli yerine)
  kapakGorsel?: string
  durum: EgitimDurum
  aktifSurumId: string
  surumler: EgitimSurum[]
  guncelleme: string
  olusturan: string
}

/* ------------------------------ Soru bankası ------------------------------ */

export interface BankaSoru extends SinavSoru {
  kullanimSayisi: number
}

export const soruBankasiSeed: BankaSoru[] = [
  { id: 'SB-01', tur: 'tek', soru: 'İş güvenliği uzmanının temel görevi nedir?', secenekler: ['Riskleri tespit edip önlem önermek', 'Personel işe almak', 'Maaş hesaplamak', 'Üretim planlamak'], dogru: [0], puan: 10, aciklama: '6331 sayılı kanun kapsamında uzmanlar rehberlik ve risk değerlendirme yapar.', kullanimSayisi: 2 },
  { id: 'SB-02', tur: 'dy', soru: 'Yangın anında asansör kullanılmalıdır.', secenekler: ['Doğru', 'Yanlış'], dogru: [1], puan: 10, aciklama: 'Yangında asansör elektrik kesintisi ve duman riski nedeniyle kullanılmaz.', kullanimSayisi: 1 },
  { id: 'SB-03', tur: 'coklu', soru: 'Aşağıdakilerden hangileri kişisel koruyucu donanımdır?', secenekler: ['Baret', 'İş ayakkabısı', 'Yangın söndürücü', 'Koruyucu gözlük', 'İlk yardım çantası'], dogru: [0, 1, 3], puan: 15, aciklama: 'KKD kişinin üzerinde taşıdığı ekipmandır; söndürücü ve çanta ortak ekipmandır.', kullanimSayisi: 1 },
  { id: 'SB-04', tur: 'tek', soru: 'Yüksekte çalışmada emniyet kemeri hangi yükseklikten itibaren zorunludur?', secenekler: ['1 metre', '2 metre', '3 metre', '5 metre'], dogru: [1], puan: 10, aciklama: '2 metre ve üzeri çalışmalarda düşmeye karşı koruma zorunludur.', kullanimSayisi: 1 },
  { id: 'SB-05', tur: 'dy', soru: 'Ramak kala olaylar bildirilmek zorunda değildir.', secenekler: ['Doğru', 'Yanlış'], dogru: [1], puan: 10, aciklama: 'Ramak kala kayıtları kök neden analizi için kritik önemdedir.', kullanimSayisi: 0 },
  { id: 'SB-06', tur: 'coklu', soru: 'Kimyasal maddeyle çalışırken hangi belgelere başvurulur?', secenekler: ['Güvenlik Bilgi Formu (SDS)', 'Kullanım kılavuzu', 'Etiket bilgileri', 'Vardiya çizelgesi'], dogru: [0, 2], puan: 15, aciklama: 'SDS ve etiket kimyasalın tehlikelerini ve korunma yollarını gösterir.', kullanimSayisi: 0 },
]

/* ------------------------------ Tamamlama -------------------------------- */

export const varsayilanTamamlama = (): TamamlamaAyarlari => ({
  videoMinYuzde: 90,
  zorunluBolumlerTumu: true,
  sinavZorunlu: true,
  manuelOnay: false,
})

export const varsayilanSinavAyarlari = (): SinavAyarlari => ({
  gecmePuani: 70,
  sureDakika: 15,
  denemeHakki: 3,
  soruKaristir: true,
  sikKaristir: false,
  cevaplariGoster: true,
  aciklamalariGoster: true,
})

/* -------------------------------- İlerleme -------------------------------- */

export interface IcerikIlerleme {
  izlenenSn?: number
  toplamSn?: number
  sonSayfa?: number
  gorulenSayfalar?: number[]
  tamamlandi: boolean
  tamamlanmaTarihi?: string
}

export interface SinavDeneme {
  no: number
  puan: number
  gecti: boolean
  sureSn: number
  tarih: string
  dogruSayisi: number
}

/** Ön sınav kaydı — eğitimden önce alınan, puanı eğitimi engellemeyen deneme. */
export interface OnSinavKayit {
  tarih: string
  toplam: number
  dogruSayisi: number
  /** 0-100 */
  puan: number
  /** soru id → doğru mu */
  soruSonuc: Record<string, boolean>
  /** soru id → işaretlenen seçenek indeksleri (yönetici incelemesi için) */
  cevaplar: Record<string, number[]>
}

export interface EgitimIlerleme {
  id: string
  hesapId: string
  egitimId: string
  surumId: string
  /** Eğitim atamasına bağlı ilerleme — aynı eğitim birden fazla kez atanabilir */
  atamaId?: string
  durum: IlerlemeDurum
  icerikler: Record<string, IcerikIlerleme>
  denemeler: SinavDeneme[]
  /** Eğitimden önce alınan ön sınav (varsa) */
  onSinav?: OnSinavKayit
  sonErisim: string
}

/* ------------------------------ Yardımcılar ------------------------------ */

export const turLabel: Record<IcerikTur, string> = {
  video: 'Video',
  'harici-video': 'Harici Video',
  pdf: 'PDF',
  slayt: 'Slayt',
  gorsel: 'Görsel',
  metin: 'Metin',
}

/** İçeriğin tamamlanma koşulunu değerlendirir — zorunlu değilse otomatik tamam */
export const icerikTamamMi = (i: Icerik, il: IcerikIlerleme | undefined) =>
  !i.zorunlu || !!il?.tamamlandi

export const surumIstatistik = (s: EgitimSurum) => {
  const icerikler = s.bolumler.flatMap((b) => b.icerikler)
  return {
    bolumSayisi: s.bolumler.length,
    icerikSayisi: icerikler.length,
    soruSayisi: s.sinav?.sorular.length ?? 0,
    turler: [...new Set(icerikler.map((i) => i.tur))],
  }
}

/* --------------------------------- Seed ---------------------------------- */

const ic = (
  id: string,
  tur: IcerikTur,
  baslik: string,
  ek: Partial<Icerik> = {},
): Icerik => ({ id, tur, baslik, aciklama: ek.aciklama ?? '', zorunlu: true, sureDakika: 8, ...ek })

const surum = (
  id: string,
  no: number,
  bolumler: Bolum[],
  sinav: Sinav | undefined,
  durum: EgitimSurum['durum'],
  not = '',
  onSinav?: Sinav,
): EgitimSurum => ({
  id,
  no,
  bolumler,
  sinav,
  tamamlama: varsayilanTamamlama(),
  durum,
  not,
  onSinav,
  tarih: TODAY,
})

const sinavTemel: Sinav = {
  id: 'SNV-01',
  baslik: 'Temel İSG Ölçme Sınavı',
  aciklama: 'Eğitim sonunda temel iş sağlığı ve güvenliği kavramlarını ölçer.',
  sorular: [
    soruBankasiSeed[0], soruBankasiSeed[2], soruBankasiSeed[4],
  ].map(({ kullanimSayisi: _k, ...s }) => s),
  ayarlar: varsayilanSinavAyarlari(),
}

const sinavYangin: Sinav = {
  id: 'SNV-02',
  baslik: 'Yangın Güvenliği Sınavı',
  aciklama: 'Yangın müdahale ve tahliye bilgisini ölçer.',
  sorular: [
    {
      id: 'SY-01',
      tur: 'dy',
      soru: 'Yangın anında asansör kullanılmalıdır.',
      secenekler: ['Doğru', 'Yanlış'],
      dogru: [1],
      puan: 20,
      aciklama: 'Yangında asansör kullanılmaz.',
    },
    {
      id: 'SY-02',
      tur: 'tek',
      soru: 'Yangın sınıflarından elektrikli ekipman yangını hangisidir?',
      secenekler: ['A sınıfı', 'B sınıfı', 'C sınıfı', 'E sınıfı'],
      dogru: [3],
      puan: 20,
      aciklama: 'E sınıfı elektrik tesisatı ve ekipman yangınlarını kapsar.',
    },
    {
      id: 'SY-03',
      tur: 'tek',
      soru: 'Tahliye sırasında ilk yapılması gereken nedir?',
      secenekler: ['Eşyaları toplamak', 'Sakin şekilde çıkışa yönelmek', 'Pencereden bakmak', 'Asansöre binmek'],
      dogru: [1],
      puan: 20,
    },
  ],
  ayarlar: varsayilanSinavAyarlari(),
}

const temelIsgSinavi: Sinav = {
  id: 'SNV-0103',
  baslik: 'Temel İSG Bilgi Kontrolü',
  aciklama: 'Güvenli çalışma, riskleri fark etme, korunma ve acil durum davranışlarını ölçen 10 soruluk sınav.',
  sorular: [
    { id: 'TISG-01', tur: 'tek', soru: 'Tehlike ve risk arasındaki farkı en doğru hangi seçenek açıklar?', secenekler: ['Tehlike zarar verme potansiyelidir; risk bu zararın gerçekleşme olasılığı ve sonuçlarının birlikte değerlendirilmesidir.', 'Tehlike yalnızca kaza olduktan sonra oluşur; risk kazanın kendisidir.', 'İki kavram aynı anlama gelir.', 'Risk yalnızca kişisel koruyucu donanım eksikliğidir.'], dogru: [0], puan: 10, aciklama: 'Tehlike zarar kaynağını, risk ise tehlikeden doğabilecek sonucun olasılık ve etkisini ifade eder.' },
    { id: 'TISG-02', tur: 'tek', soru: 'Yerde uzanan bir kablo nedeniyle takılma tehlikesi gördünüz. İlk uygun davranış hangisidir?', secenekler: ['Kabloyu güvenli biçimde kaldırmak veya alanı işaretleyip sorumlu kişiye bildirmek; yetkiniz yoksa müdahale etmemek.', 'Tehlike başkasının işi olduğu için görmezden gelmek.', 'Üzerinden atlayıp çalışmaya devam etmek.', 'Kabloyu enerjiliyken çekerek kenara almak.'], dogru: [0], puan: 10, aciklama: 'Önce kendinizi riske atmadan alanı güvenli hale getirin ve tehlikeyi ilgili kişiye bildirin.' },
    { id: 'TISG-03', tur: 'tek', soru: 'Riskleri kontrol ederken önlemler için doğru yaklaşım hangisidir?', secenekler: ['Önce tehlikeyi ortadan kaldırmayı değerlendirmek; KKD’yi diğer kontrollerin yerine geçen tek çözüm saymamak.', 'Her durumda yalnızca baret dağıtmak.', 'Uyarı levhasını tüm teknik önlemlerin yerine kullanmak.', 'Çalışanın dikkatli olmasını tek önlem olarak kabul etmek.'], dogru: [0], puan: 10, aciklama: 'Kaynağında ortadan kaldırma ve toplu/teknik koruma önlemleri öncelikle değerlendirilir; KKD kalan riske karşı korumayı tamamlar.' },
    { id: 'TISG-04', tur: 'coklu', soru: 'Güvenli işe başlamadan önce hangileri kontrol edilmelidir?', secenekler: ['İşe ve alana özgü talimatlar ile bilinen riskler.', 'Kullanılacak ekipmanın koruyucuları ve güvenli durumu.', 'Gerekli ve işe uygun KKD’nin sağlamlığı.', 'Koruyucu tertibatı daha hızlı çalışmak için devre dışı bırakmak.'], dogru: [0, 1, 2], puan: 10, aciklama: 'İşe özgü riskleri, ekipmanı ve gerekli KKD’yi kontrol edin; koruyucuları devre dışı bırakmayın.' },
    { id: 'TISG-05', tur: 'tek', soru: 'Bir makinenin koruyucusunun çıkarıldığını fark ettiniz. Ne yapmalısınız?', secenekler: ['Makineyi kullanmamak, güvenli şekilde durdurmak/uzaklaşmak ve yetkili sorumluya bildirmek.', 'Kısa işlerde koruyucusuz kullanmak.', 'Koruyucuyu makine çalışırken takmaya çalışmak.', 'Arkadaşınız dikkat ederse çalışmaya devam etmek.'], dogru: [0], puan: 10, aciklama: 'Koruyucusuz ekipman kullanılmamalı; güvenli durdurma ve yetkili kişiye bildirim yapılmalıdır.' },
    { id: 'TISG-06', tur: 'tek', soru: 'KKD seçimiyle ilgili en doğru ifade hangisidir?', secenekler: ['İşin riskine, çalışana ve ekipmanın uygunluk/ kullanım talimatına göre seçilir; hasarlıysa kullanılmaz ve bildirilir.', 'Her iş için aynı eldiven uygundur.', 'KKD varken makine koruyucusu gereksizdir.', 'Başkasına ait uyumsuz KKD kullanılabilir.'], dogru: [0], puan: 10, aciklama: 'KKD, belirlenen riske ve kullanıcıya uygun olmalı; talimatına göre kullanılmalı ve hasarı bildirilmelidir.' },
    { id: 'TISG-07', tur: 'tek', soru: 'Acil durum alarmı duyulduğunda doğru davranış hangisidir?', secenekler: ['İşi güvenli biçimde bırakıp belirlenmiş tahliye yolunu izlemek, asansör kullanmamak ve toplanma alanına gitmek.', 'Eşyaları toplamak için işyerine geri dönmek.', 'Duman varsa asansöre binmek.', 'Kendi aracını almak için otoparka yönelmek.'], dogru: [0], puan: 10, aciklama: 'İşyerinin acil durum planı ve yönlendirmeleri izlenmeli; tahliye sonrası toplanma alanında yoklama beklenmelidir.' },
    { id: 'TISG-08', tur: 'tek', soru: 'Küçük bir yangın başlangıcı gördünüz. Müdahale kararı verirken öncelik nedir?', secenekler: ['Alarm vermek ve yardım çağırmak; yalnızca eğitimliyseniz, uygun söndürücü varsa ve kaçış yolunuz açıksa müdahale etmek.', 'Her koşulda yangına yaklaşmak.', 'Dumanı soluyarak kaynağı araştırmak.', 'Su dökerek elektrik ekipmanına müdahale etmek.'], dogru: [0], puan: 10, aciklama: 'Can güvenliği önceliklidir. Alarm/ihbar verin, acil durum talimatını izleyin; yalnızca eğitim ve koşullar uygunsa ilk müdahaleyi değerlendirin.' },
    { id: 'TISG-09', tur: 'dy', soru: 'Yaralanma oluşmayan ramak kala olayları da tekrarını önlemek için bildirilmelidir.', secenekler: ['Doğru', 'Yanlış'], dogru: [0], puan: 10, aciklama: 'Ramak kala bildirimleri, zarar oluşmadan önce tehlikelerin ve kök nedenlerin fark edilmesine yardımcı olur.' },
    { id: 'TISG-10', tur: 'tek', soru: 'Kimyasal madde sıçraması veya dökülmesiyle karşılaştığınızda ilk olarak ne yapmalısınız?', secenekler: ['Maddeyi koklayıp tanımaya çalışmak.', 'Alana yaklaşmayı sınırlamak, uyarı vermek ve işyeri talimatına/SDS’ye göre yetkili ekibe haber vermek.', 'Eğitim almadan maddeyi çıplak elle temizlemek.', 'Döküntüyü başka bir kaba süpürmek.'], dogru: [1], puan: 10, aciklama: 'Kimyasalı tanımaya çalışarak maruziyeti artırmayın. Alanı güvenli tutun ve güvenlik bilgi formu ile işyeri prosedürünü izleyin.' },
  ],
  ayarlar: { gecmePuani: 70, sureDakika: 20, denemeHakki: 3, soruKaristir: true, sikKaristir: false, cevaplariGoster: true, aciklamalariGoster: true },
}

/** Eğitim öncesi başlangıç seviyesini ölçer; sonucu eğitime devamı engellemez. */
export const temelIsgOnSinavi: Sinav = {
  ...temelIsgSinavi,
  id: 'SNV-0103-ON',
  baslik: 'Temel İSG — Ön Sınav',
  aciklama: 'Eğitim öncesi mevcut bilgi düzeyini ölçer. Sonuç yalnızca başlangıç değerlendirmesidir; eğitime devamı engellemez.',
  sorular: temelIsgSinavi.sorular.slice(0, 5),
  ayarlar: {
    ...temelIsgSinavi.ayarlar,
    gecmePuani: 0,
    sureDakika: 0,
    denemeHakki: 0,
    cevaplariGoster: false,
    aciklamalariGoster: false,
  },
}

const temelIsgSurum3: EgitimSurum = surum('ES-0103', 3, [
  { id: 'B-0104', baslik: 'İSG’ye Giriş ve Sorumluluklar', icerikler: [
    ic('IC-0106', 'harici-video', 'Güvenli çalışmanın temeli: KKD', { url: 'https://www.youtube.com/watch?v=_fAmxkypeiA', aciklama: 'T.C. Çalışma ve Sosyal Güvenlik Bakanlığı — Güven Usta Karavan: Kişisel Koruyucu Donanımlar. İzlerken KKD’nin hangi riske karşı seçildiğini ve neden diğer önlemlerin yerini tutmadığını düşünün.', sureDakika: 8 }),
    ic('IC-0107', 'metin', 'İSG kültürü, haklar ve sorumluluklar', { aciklama: 'İş sağlığı ve güvenliğini günlük çalışma kararlarına bağlayın.', metinIcerik: `## Bu bölümün amacı\nİSG, yalnızca kaza olduktan sonra yapılan müdahale değil; işle ilgili tehlikeleri önceden fark edip zarar oluşmasını önleme yaklaşımıdır. Güvenli çalışma; işveren, çalışanlar, çalışan temsilcisi ve İSG profesyonellerinin işbirliğiyle yürütülür.\n\n## Temel çerçeve\n6331 sayılı İş Sağlığı ve Güvenliği Kanunu işyerlerinde sağlık ve güvenliğin sağlanması ve mevcut durumun iyileştirilmesi için genel çerçeveyi belirler. İşverenin riskleri önleme, bilgilendirme ve gerekli organizasyonu kurma sorumlulukları bulunur. Çalışanlar da aldıkları eğitim ve talimatlar doğrultusunda kendi sağlık ve güvenliklerini ve davranışlarından etkilenebilecek kişileri gözetir.\n\n## Çalışırken senden beklenenler\n- Eğitim ve talimatlara uygun çalış; anlamadığın noktayı iş başlamadan sor.\n- Makine, ekipman ve güvenlik tertibatını amacı dışında kullanma; koruyucuları çıkarma veya etkisizleştirme.\n- Verilen KKD’yi talimatına uygun kullan; kayıp, hasar veya uyumsuzluğu bildir.\n- Tehlikeli durum, ramak kala, yaralanma ve ekipman arızasını gecikmeden işyerindeki bildirim kanalına ilet.\n- Ciddi ve yakın tehlike gördüğünde kendini ve başkalarını tehlikeye atmadan çalışmayı durdurma/uzaklaşma ve amirine haber verme prosedürünü uygula.\n\n## Unutma\nBu çevrimiçi içerik genel farkındalık sağlar. İşe başlama bilgilendirmesinin, işyerine özgü risklerin, uygulamalı talimatların ve yetkili kişilerce verilmesi gereken eğitimlerin yerine geçmez. İçerik işyerinin faaliyet alanı ve riskleriyle tamamlanmalıdır.`, sureDakika: 9 }),
  ] },
  { id: 'B-0105', baslik: 'Tehlikeyi Gör, Riski Kontrol Et', icerikler: [
    ic('IC-0108', 'metin', 'Tehlike, risk ve risk değerlendirmesi', { aciklama: 'İşyerindeki tehlikeyi tanımayı ve olası sonucu düşünmeyi öğrenin.', metinIcerik: `## İki temel kavram\n**Tehlike**, zarar verme potansiyeli olan kaynak, durum veya davranıştır. **Risk**, bu tehlikeden kaynaklanabilecek zarar veya olumsuz sonucun gerçekleşme olasılığı ve etkisinin değerlendirilmesidir. Örnek: yerdeki yağlı yüzey tehlikedir; birinin kayıp düşmesi ve yaralanması bu tehlikenin doğurabileceği risktir.\n\n## Tehlike kaynaklarına örnekler\n- Fiziksel: gürültü, titreşim, sıcak yüzey, hareketli parça, kayma/düşme.\n- Kimyasal ve biyolojik: buhar, toz, sıçrama, mikroorganizma ve temas.\n- Ergonomik: uygunsuz çalışma yüksekliği, tekrarlı hareket, elle taşıma.\n- Organizasyonel/psikososyal: yetersiz bilgilendirme, yoğun tempo, belirsiz görev ve iletişim sorunları.\n\n## Sahada basit kontrol\n1. İşe ve çalışma alanına bak: ne zarar verebilir, kim etkilenebilir?\n2. Mevcut korumaları ve eksikleri belirle.\n3. Tehlikeyi kaldırma veya kaynağında azaltma seçeneğini sorumluya ilet.\n4. Kalan risk için güvenli çalışma yöntemi, uyarı, eğitim ve uygun KKD’yi uygula.\n5. Değişiklik, arıza veya ramak kala sonrası alanı tekrar değerlendir.\n\nRisk değerlendirmesi işyerine özgü ve ekip çalışmasıyla yürütülür; bu kısa örnek, resmi değerlendirmenin yerine geçmez.`, sureDakika: 8 }),
    ic('IC-0109', 'metin', 'Kontrol önlemleri: kaynağından başla', { aciklama: 'Önlemlerin birlikte ve doğru sırada düşünülmesini öğrenin.', metinIcerik: `## Önlem seçerken\nEn etkili seçenek çoğu durumda tehlikeyi ortadan kaldırmaktır. Bu mümkün değilse daha az tehlikeli seçenekle değiştirme, mühendislik/toplu koruma önlemleri, güvenli iş yöntemi ve organizasyonel düzenlemeler değerlendirilir. Kişisel koruyucu donanım, kalan risklere karşı uygun seçilip doğru kullanıldığında korumayı tamamlar.\n\n## Örnek: zeminde kablo\nÖnce kablo güzergâhını ortadan kaldırmak veya güvenli biçimde düzenlemek düşünülür. Geçiş gerekiyorsa kablo kanalı, sabitleme ve alanın işaretlenmesi gibi önlemler uygulanır. Sadece “dikkat et” uyarısına güvenmek yeterli kontrol değildir.\n\n## Çalışan olarak\nYetkin olmadığın teknik müdahaleyi yapma. Alanı güvenli tut, tehlikeyi görünür kıl ve sorumlu kişiye bildir. Kontrolün işe yarayıp yaramadığını gözlemle; sorun sürüyorsa tekrar bildir.`, sureDakika: 7 }),
  ] },
  { id: 'B-0106', baslik: 'Günlük İşte Güvenli Çalışma', icerikler: [
    ic('IC-0110', 'metin', 'İşyeri düzeni, ekipman ve ergonomi', { aciklama: 'Düzenli alan ve güvenli ekipman kullanımını günlük rutine katın.', metinIcerik: `## Düzen ve hareket alanı\nYürüme yollarını, acil çıkışları, yangın ekipmanını ve elektrik panolarının önünü kapatma. Dökülme, takılma, açıkta kablo, istif dengesizliği veya hasarlı ekipman görürsen alanı güvenli hale getirme prosedürünü uygula ve bildir. Temizlik ve düzeni yalnızca vardiya sonuna bırakma.\n\n## Ekipman\nEkipmanı yalnızca yetkin olduğun işte ve talimatına göre kullan. İşe başlamadan görünür hasar, koruyucu tertibat ve acil durdurma düzeneklerini kontrol et. Arızalı ekipmanı kullanma; güvenli biçimde devre dışı bırakma/etiketleme işyeri yetkililerinin prosedürüne göre yapılmalıdır.\n\n## Ergonomi ve elle taşıma\nYükün ağırlığını ve tutuşunu değerlendir; görüşünü kapatan veya kontrol edemeyeceğin yükü tek başına taşıma. Yükü vücuda yakın tut, ani dönme hareketinden kaçın ve gerektiğinde mekanik yardımcı ya da ekip desteği iste. Ağrı veya zorlanma olduğunda işyeri bildirim kanalını kullan.`, sureDakika: 7 }),
    ic('IC-0111', 'metin', 'KKD: doğru seçim, kontrol ve kullanım', { aciklama: 'KKD’nin sınırlarını ve güvenli kullanımı pekiştirin.', metinIcerik: `## KKD ne zaman kullanılır?\nİşyerindeki risk değerlendirmesi ve talimatlar, hangi işte hangi koruyucunun gerektiğini belirler. Baret, göz/yüz koruyucu, işitme koruyucu, eldiven, uygun iş ayakkabısı ve solunum koruyucu farklı risklere yöneliktir; her ürün her tehlikeye karşı koruma sağlamaz.\n\n## Kullanım kontrol listesi\n- İşe ve kullanıcıya uygun modeli seç; işyeri talimatını ve üretici bilgisini izle.\n- İşe başlamadan çatlak, yırtık, bağlantı ve uyum kontrolü yap.\n- Kullanım sırasında doğru tak ve başka ekipmanla uyumunu kontrol et.\n- Hasarlı, kirlenmiş veya koruma özelliğini kaybetmiş KKD’yi kullanma; değişim için bildir.\n- KKD’yi temiz, kuru ve belirlenen koşullarda sakla.\n\nKKD makine koruyucusu, havalandırma, bariyer veya güvenli iş organizasyonunun yerine geçmez.`, sureDakika: 7 }),
  ] },
  { id: 'B-0107', baslik: 'Acil Durum ve Olaylardan Öğrenme', icerikler: [
    ic('IC-0112', 'metin', 'Alarm, tahliye ve ilk güvenli davranış', { aciklama: 'Acil durumlarda önceliği ve toplanma adımlarını öğrenin.', metinIcerik: `## Alarm duyduğunda\nİşyerinin acil durum planını ve görevli yönlendirmelerini izle. İşi güvenli biçimde bırak, belirlenmiş kaçış yoluna yönel, asansör kullanma ve toplanma alanına git. Dumanlı alanda geri dönme; eşyalarını almak veya görüntü kaydetmek için tahliyeyi geciktirme. Toplanma alanında yoklamaya katıl ve yeni talimat bekle.\n\n## Yangın başlangıcı\nAlarm ver, çevrendekileri uyar ve işyerinin acil durum iletişim yöntemini kullan. Yangınla mücadele eğitimin yoksa müdahale etme. Eğitimli olsan bile uygun ekipman, güvenli kaçış yolu ve yetki yoksa yaklaşma; tahliye önceliklidir. Elektrik veya kimyasal kaynaklı yangında yanlış söndürücü kullanımı tehlikeyi büyütebilir.\n\n## Yaralanma veya sağlık olayı\nAlanı güvenli hale getir, yardım çağır ve işyerinin ilk yardım/acil durum prosedürünü uygula. Eğitimli olmadığın bir müdahaleyi deneme; acil durumda 112’yi ara veya görevlilerin aramasını sağla.`, sureDakika: 7 }),
    ic('IC-0113', 'metin', 'Ramak kala ve olay bildirimi', { aciklama: 'Olaylardan öğrenerek benzer durumların tekrarını önleyin.', metinIcerik: `## Hangi olaylar bildirilir?\nYaralanma olmasa da düşen cisim, kayma tehlikesi, koruyucusu çıkarılmış ekipman, kimyasal dökülme veya tehlikeli yakınlaşma gibi ramak kala ve güvensiz durumlar bildirilmelidir. Erken bildirim, tekrarın ve daha ağır sonucun önlenmesine destek olur.\n\n## Bildirimde aktar\nNe oldu, nerede ve ne zaman oldu? Hangi iş veya ekipman vardı? Kimler etkilenmiş olabilir? Tehlike şu anda devam ediyor mu? Gördüğün bilgiyi açıkça aktar; tahminleri gerçek gibi sunma. Önce acil tehlike ve yaralı varsa yardım/alan güvenliği adımlarını uygula.\n\nBildirim suçlama amacı taşımaz; nedenleri anlamak ve önlemleri geliştirmek için kullanılır. İşyerinin resmi kayıt ve bildirim usullerine uy.`, sureDakika: 6 }),
  ] },
], temelIsgSinavi, 'aktif', 'İçerik, resmi kaynaklı video ve sınavla kapsamlı biçimde yenilendi', temelIsgOnSinavi)

export const egitimSeed: Egitim[] = [
  {
    id: 'EGT-01',
    baslik: 'Temel İş Sağlığı ve Güvenliği Eğitimi',
    aciklama: 'PDF’deki temel İSG konu alanlarını kapsayan 5 bölümlü görsel öğrenme paketi. Resmî eğitim planı işyerinin tehlike sınıfı, faaliyetleri ve özgün risklerine göre yetkili kişilerce tamamlanmalıdır.',
    kategori: 'Temel İSG',
    dil: 'Türkçe',
    sureDakika: 150,
    hedefler: ['Tehlikeleri ve riskleri iş başında fark etmek', 'Sağlık, hijyen ve ergonomi ilkelerini uygulamak', 'Ekipman ve acil durumlarda güvenli davranmak', 'İşe özgü özel riskleri ve KKD sınırlarını tanımak'],
    etiketler: ['zorunlu', 'temel', '20 ders', 'görselli'],
    kapakTon: 'from-amber-500 to-orange-600',
    kapakGorsel: temelIsgGorselleri.cover,
    durum: 'Yayında',
    aktifSurumId: 'ES-0104',
    surumler: [
      surum(
        'ES-0101',
        1,
        [
          {
            id: 'B-0101',
            baslik: 'Giriş ve Kavramlar',
            icerikler: [
              ic('IC-0101', 'metin', 'İSG nedir? Temel kavramlar', {
                metinIcerik:
                  'İş sağlığı ve güvenliği; işin yürütülmesi sırasında çeşitli nedenlerden kaynaklanan sağlığa zarar verebilecek koşullardan korunmak amacıyla yapılan sistemli ve bilimsel çalışmalardır.\n\nTemel kavramlar:\n• Tehlike: zarar verme potansiyeli\n• Risk: tehlikenin gerçekleşme olasılığı ve şiddeti\n• KKD: çalışanın kişisel koruyucu donanımı\n\n6331 sayılı İş Sağlığı ve Güvenliği Kanunu tüm çalışanlara eğitim yükümlülüğü getirir.',
                sureDakika: 5,
              }),
            ],
          },
        ],
        undefined,
        'eski',
        'İlk sürüm',
      ),
      surum(
        'ES-0102',
        2,
        [
          {
            id: 'B-0102',
            baslik: 'Giriş ve Temel Kavramlar',
            icerikler: [
              ic('IC-0102', 'video', 'İSG’ye giriş — kavramlar ve yasal çerçeve', {
                dosya: {
                  ad: 'isg-giris.mp4',
                  boyut: '18 MB',
                  url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                },
                aciklama: 'Demo video içerik — üretimde kendi medyanız yüklenir.',
                sureDakika: 10,
              }),
              ic('IC-0103', 'metin', 'İSG nedir? Temel kavramlar', {
                metinIcerik:
                  'İş sağlığı ve güvenliği; işin yürütülmesi sırasında oluşabilecek sağlığa zarar verebilecek koşullardan korunmak amacıyla yapılan sistemli çalışmalardır.\n\nTemel kavramlar:\n• Tehlike: zarar verme potansiyeli taşıyan durum\n• Risk: tehlikenin gerçekleşme olasılığı ile sonucunun şiddeti\n• KKD: çalışanın üzerinde taşıdığı koruyucu donanım\n\n6331 sayılı İş Sağlığı ve Güvenliği Kanunu tüm çalışanlara periyodik eğitim yükümlülüğü getirir. Tehlike sınıfına göre eğitim süreleri değişir.',
                sureDakika: 6,
              }),
            ],
          },
          {
            id: 'B-0103',
            baslik: 'Riskler ve Korunma',
            icerikler: [
              ic('IC-0104', 'pdf', 'Risk değerlendirme rehberi', {
                sayfalar: [
                  { baslik: 'Risk Değerlendirme', metin: 'Risk değerlendirmesi, işyerinde tehlikelerin tespiti ve önlem planının oluşturulmasıdır. 5 adım: hazırlık, tehlike tespiti, risk değerlendirme, önlem planı, izleme.' },
                  { baslik: 'Tehlike Tespiti', metin: 'Fiziksel, kimyasal, biyolojik, ergonomik ve psikososyal tehlike kaynakları gözden geçirilir. Çalışan görüşleri alınır.' },
                  { baslik: 'Puanlama', metin: 'Olasılık × Şiddet matrisiyle riskler sınıflandırılır; kabul edilemez riskler için acil önlem planlanır.' },
                  { baslik: 'Önlem Hiyerarşisi', metin: '1) Ortadan kaldırma 2) İkame 3) Mühendislik önlemi 4) İdari önlem 5) KKD — son çare kişisel koruma.' },
                ],
                dosya: { ad: 'risk-rehberi.pdf', boyut: '2,1 MB', sayfaSayisi: 4 },
                sureDakika: 12,
              }),
              ic('IC-0105', 'slayt', 'KKD kullanımı sunumu', {
                slaytlar: [
                  { baslik: 'Kişisel Koruyucu Donanım', notlar: ['KKD son savunma hattıdır', 'Doğru seçim ve kullanım şart'] },
                  { baslik: 'Baş Koruma', notlar: ['Baret: çene kayışı takılı olmalı', 'Darbe sonrası değiştirilir'] },
                  { baslik: 'Göz ve İşitme', notlar: ['Koruyucu gözlük: parçacık ve kimyasal riskinde', '85 dB üzeri kulak koruyucu zorunlu'] },
                  { baslik: 'Ayak ve El', notlar: ['Çelik burun ayakkabı', 'Kimyasala uygun eldiven seçimi'] },
                ],
                dosya: { ad: 'kkd-sunum.pptx', boyut: '4,8 MB', sayfaSayisi: 4 },
                sureDakika: 9,
              }),
            ],
          },
        ],
        sinavTemel,
        'aktif',
        'Video ve sınav eklendi',
        temelIsgOnSinavi,
      ),
      temelIsgSurum3,
      temelIsgSurum4,
    ],
    guncelleme: '2026-10-28',
    olusturan: 'Tunahan Yılmaztürk',
  },
  {
    id: 'EGT-02',
    baslik: 'Yangın Güvenliği ve Tahliye Eğitimi',
    aciklama: 'Yangın sınıfları, söndürme ekipmanı kullanımı ve tahliye prosedürleri.',
    kategori: 'Yangın',
    dil: 'Türkçe',
    sureDakika: 60,
    hedefler: ['Yangın sınıflarını ayırt etmek', 'Söndürücü kullanabilmek', 'Tahliye kurallarını uygulamak'],
    etiketler: ['zorunlu', 'yangın'],
    kapakTon: 'from-red-500 to-rose-600',
    durum: 'Yayında',
    aktifSurumId: 'ES-0201',
    surumler: [
      surum(
        'ES-0201',
        1,
        [
          {
            id: 'B-0201',
            baslik: 'Yangına Giriş',
            icerikler: [
              ic('IC-0201', 'slayt', 'Yangın sınıfları ve yayılma', {
                slaytlar: [
                  { baslik: 'Yangın Üçgeni', notlar: ['Yakıt + Oksijen + Isı = Yanma', 'Birini kaldırmak söndürür'] },
                  { baslik: 'Sınıflar', notlar: ['A: katı · B: sıvı · C: gaz · D: metal · E: elektrik', 'Sınıfa göre söndürücü seçilir'] },
                  { baslik: 'Yayılma', notlar: ['Konveksiyon, kondüksiyon, radyasyon', 'Kapıları kapatmak yayılımı yavaşlatır'] },
                ],
                dosya: { ad: 'yangin-siniflari.pptx', boyut: '3,2 MB', sayfaSayisi: 3 },
                sureDakika: 8,
              }),
              ic('IC-0202', 'pdf', 'Tahliye planı ve toplanma alanı', {
                sayfalar: [
                  { baslik: 'Tahliye Planı', metin: 'Her işyerinde kat bazlı tahliye planı görünür konumda olmalıdır. Kaçış yolları işaretli ve açık tutulur.' },
                  { baslik: 'Toplanma Alanı', metin: 'Tahliye sonrası tüm çalışanlar belirlenen toplanma alanında sayılır. Eksik personel itfaiyeye bildirilir.' },
                ],
                dosya: { ad: 'tahliye-plani.pdf', boyut: '1,1 MB', sayfaSayisi: 2 },
                sureDakika: 6,
              }),
            ],
          },
        ],
        sinavYangin,
        'aktif',
        'İlk yayın',
      ),
    ],
    guncelleme: '2026-10-15',
    olusturan: 'Tunahan Yılmaztürk',
  },
  {
    id: 'EGT-03',
    baslik: 'Yüksekte Çalışma Güvenliği',
    aciklama: 'Yüksekte çalışmada düşme riskleri, emniyet kemeri ve iskele güvenliği.',
    kategori: 'Yüksekte Çalışma',
    dil: 'Türkçe',
    sureDakika: 75,
    hedefler: ['Düşme risklerini tanımak', 'Emniyet kemerini doğru kullanmak'],
    etiketler: ['çok tehlikeli'],
    kapakTon: 'from-violet-500 to-purple-600',
    durum: 'Taslak',
    aktifSurumId: 'ES-0301',
    surumler: [
      surum(
        'ES-0301',
        1,
        [
          {
            id: 'B-0301',
            baslik: 'Düşme Riskleri',
            icerikler: [
              ic('IC-0301', 'metin', 'Yüksekte çalışma tanımı ve riskler', {
                metinIcerik: '2 metre ve üzeri yükseklikte yapılan çalışmalar yüksekte çalışma sayılır. Düşme, iş kazaları arasında ölümcül sonuçlar açısından ilk sıradadır.\n\nTemel kurallar:\n• Emniyet kemeri zorunlu\n• Çalışma izni alınmadan başlanmaz\n• Rüzgarlı havalarda açık alan çalışması durdurulur',
                sureDakika: 7,
              }),
            ],
          },
        ],
        undefined,
        'taslak',
        'İçerik hazırlanıyor',
      ),
    ],
    guncelleme: '2026-11-02',
    olusturan: 'Ahmet Kaya',
  },
  {
    id: 'EGT-04',
    baslik: 'Kimyasal Madde Güvenliği',
    aciklama: 'SDS okuma, kimyasal depolama ve dökülme müdahalesi.',
    kategori: 'Kimyasal Güvenlik',
    dil: 'Türkçe',
    sureDakika: 50,
    hedefler: ['SDS bölümlerini okuyabilmek', 'Dökülme müdahalesini bilmek'],
    etiketler: [],
    kapakTon: 'from-emerald-500 to-green-600',
    durum: 'Arşiv',
    aktifSurumId: 'ES-0401',
    surumler: [
      surum(
        'ES-0401',
        1,
        [
          {
            id: 'B-0401',
            baslik: 'SDS Kullanımı',
            icerikler: [
              ic('IC-0401', 'pdf', 'Güvenlik bilgi formu rehberi', {
                sayfalar: [
                  { baslik: 'SDS Nedir?', metin: 'Güvenlik Bilgi Formu, kimyasal maddenin tehlikelerini ve güvenli kullanımını anlatan 16 bölümlü standart belgedir.' },
                  { baslik: 'Kritik Bölümler', metin: 'Bölüm 2 tehlike tanımı, Bölüm 4 ilk yardım, Bölüm 7 kullanım-depolama, Bölüm 8 maruziyet kontrolü.' },
                ],
                dosya: { ad: 'sds-rehberi.pdf', boyut: '1,8 MB', sayfaSayisi: 2 },
                sureDakika: 8,
              }),
            ],
          },
        ],
        undefined,
        'eski',
        '2024 içeriği — güncellemesi bekleniyor',
      ),
    ],
    guncelleme: '2026-08-20',
    olusturan: 'Tunahan Yılmaztürk',
  },
]

/* ------------------------------- İlerleme seed ---------------------------- */

export const ilerlemeSeed: EgitimIlerleme[] = [
  {
    id: 'ILR-01',
    hesapId: 'yilmazturk',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    durum: 'Devam Ediyor',
    icerikler: {
      'IC-0102': { izlenenSn: 248, toplamSn: 600, tamamlandi: false },
      'IC-0103': { tamamlandi: true, tamamlanmaTarihi: '2026-11-02' },
    },
    denemeler: [],
    sonErisim: '2026-11-03T14:00:00',
  },
  {
    id: 'ILR-02',
    hesapId: 'FP-02',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    atamaId: 'ATM-01',
    durum: 'Tamamlandı',
    icerikler: {
      'IC-0102': { izlenenSn: 612, toplamSn: 600, tamamlandi: true, tamamlanmaTarihi: '2026-11-01' },
      'IC-0103': { tamamlandi: true, tamamlanmaTarihi: '2026-11-01' },
      'IC-0104': { gorulenSayfalar: [1, 2, 3, 4], tamamlandi: true, tamamlanmaTarihi: '2026-11-02' },
      'IC-0105': { gorulenSayfalar: [1, 2, 3, 4], tamamlandi: true, tamamlanmaTarihi: '2026-11-02' },
    },
    denemeler: [{ no: 1, puan: 85, gecti: true, sureSn: 412, tarih: '2026-11-03T18:20:00', dogruSayisi: 4 }],
    sonErisim: '2026-11-03T18:20:00',
  },
  {
    id: 'ILR-03',
    hesapId: 'FP-03',
    egitimId: 'EGT-01',
    surumId: 'ES-0102',
    atamaId: 'ATM-01',
    durum: 'Sınav Başarısız',
    icerikler: {
      'IC-0102': { izlenenSn: 600, toplamSn: 600, tamamlandi: true, tamamlanmaTarihi: '2026-10-30' },
      'IC-0103': { tamamlandi: true, tamamlanmaTarihi: '2026-10-30' },
      'IC-0104': { gorulenSayfalar: [1, 2, 3, 4], tamamlandi: true, tamamlanmaTarihi: '2026-10-31' },
      'IC-0105': { gorulenSayfalar: [1, 2, 3, 4], tamamlandi: true, tamamlanmaTarihi: '2026-10-31' },
    },
    denemeler: [
      { no: 1, puan: 55, gecti: false, sureSn: 380, tarih: '2026-11-01T10:00:00', dogruSayisi: 2 },
      { no: 2, puan: 61, gecti: false, sureSn: 355, tarih: '2026-11-02T09:30:00', dogruSayisi: 3 },
      { no: 3, puan: 64, gecti: false, sureSn: 402, tarih: '2026-11-03T15:45:00', dogruSayisi: 3 },
    ],
    sonErisim: '2026-11-03T15:45:00',
  },
  {
    id: 'ILR-04',
    hesapId: 'FP-04',
    egitimId: 'EGT-02',
    surumId: 'ES-0201',
    atamaId: 'ATM-02',
    durum: 'Tamamlandı',
    icerikler: {
      'IC-0201': { gorulenSayfalar: [1, 2, 3], tamamlandi: true, tamamlanmaTarihi: '2026-11-02' },
      'IC-0202': { gorulenSayfalar: [1, 2], tamamlandi: true, tamamlanmaTarihi: '2026-11-03' },
    },
    denemeler: [{ no: 1, puan: 80, gecti: true, sureSn: 505, tarih: '2026-11-04T08:10:00', dogruSayisi: 4 }],
    sonErisim: '2026-11-04T08:10:00',
  },
]
