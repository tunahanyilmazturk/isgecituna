/*
 * İlk işe özgü eğitim paketi: “Yüksekte Güvenli Çalışma”.
 * İçerik: 5 bölüm, 20 içerik, eğitim öncesi ön sınav (10 soru), eğitim sonu sınavı (20 soru,
 * açıklamalı), eğitim tamamlama koşulları. Ön sınav sonucu eğitimi engellemez.
 */
import {
  varsayilanSinavAyarlari,
  varsayilanTamamlama,
  type Bolum,
  type Egitim,
  type EgitimSurum,
  type Icerik,
  type Sinav,
  type SinavSoru,
} from './egitimler'
import { TODAY } from './dashboard'

const EGITIM_ID = 'EGT-YUK'
const SURUM_ID = 'ES-YUK-02'

/** Slayt görselleri public/images altında tutulur; her slayt kendi konusuyla eşleşir. */
const gorselDosyalari: Record<string, string> = {
  'YUK-IC01': '/images/egitim-yuksekte-guvenli-calisma-02-yuksekte-calisma-nedir.png',
  'YUK-IC02': '/images/egitim-yuksekte-guvenli-calisma-03-dusme-tehlikeleri.png',
  'YUK-IC03': '/images/egitim-yuksekte-guvenli-calisma-03-dusme-tehlikeleri.png',
  'YUK-IC04': '/images/egitim-yuksekte-guvenli-calisma-04-guvensiz-davranis.png',
  'YUK-IC05': '/images/egitim-yuksekte-guvenli-calisma-05-risk-degerlendirmesi.png',
  'YUK-IC06': '/images/egitim-yuksekte-guvenli-calisma-06-toplu-korunma.png',
  'YUK-IC07': '/images/egitim-yuksekte-guvenli-calisma-07-guvenli-calisma-alani.png',
  'YUK-IC08': '/images/egitim-yuksekte-guvenli-calisma-08-iskele-guvenligi.png',
  'YUK-IC09': '/images/egitim-yuksekte-guvenli-calisma-09-merdiven-guvenligi.png',
  'YUK-IC10': '/images/egitim-yuksekte-guvenli-calisma-10-kisisel-koruyucular.png',
  'YUK-IC11': '/images/egitim-yuksekte-guvenli-calisma-11-kemer-kontrolu.png',
  'YUK-IC12': '/images/egitim-yuksekte-guvenli-calisma-12-ankraj-baglanti.png',
  'YUK-IC13': '/images/egitim-yuksekte-guvenli-calisma-13-dusus-durdurma.png',
  'YUK-IC14': '/images/egitim-yuksekte-guvenli-calisma-14-kurtarma-tatbikati.png',
  'YUK-IC15': '/images/egitim-yuksekte-guvenli-calisma-15-hava-kosullari.png',
  'YUK-IC16': '/images/egitim-yuksekte-guvenli-calisma-16-guvenli-gelecek.png',
  'YUK-IC18': '/images/egitim-yuksekte-guvenli-calisma-06-toplu-korunma.png',
  'YUK-IC19': '/images/egitim-yuksekte-guvenli-calisma-08-iskele-guvenligi.png',
  'YUK-IC20': '/images/egitim-yuksekte-guvenli-calisma-12-ankraj-baglanti.png',
}
const gorselYolu = (id: string) => gorselDosyalari[id] ?? ''

const slayt = (id: string, baslik: string, aciklama: string, slaytlar: { baslik: string; notlar: string[] }[], sureDakika = 6): Icerik => ({
  id,
  tur: 'slayt',
  baslik,
  aciklama,
  slaytlar: slaytlar.map((s) => ({ ...s, gorsel: gorselYolu(id), gorselAlt: s.baslik })),
  zorunlu: true,
  sureDakika,
})

const metin = (id: string, baslik: string, aciklama: string, metinIcerik: string, sureDakika = 4): Icerik => ({
  id,
  tur: 'metin',
  baslik,
  aciklama,
  metinIcerik,
  zorunlu: true,
  sureDakika,
})

const soru = (id: string, soruMetni: string, secenekler: string[], dogru: number, aciklama: string, puan = 10): SinavSoru => ({
  id,
  tur: 'tek',
  soru: soruMetni,
  secenekler,
  dogru: [dogru],
  puan,
  aciklama,
})

/* ------------------------------- Eğitim içeriği ------------------------------- */

const bolumler: Bolum[] = [
  {
    id: 'YUK-B1',
    baslik: 'Bölüm 1 — Yüksekte Çalışmayı Tanıyalım',
    icerikler: [
      slayt('YUK-IC01', 'Yüksekte çalışma nedir?', 'Kapsamı ve düşme riskinin yükseklikle sınırlı olmadığını öğrenin.', [
        {
          baslik: 'Yüksekte çalışma nedir?',
          notlar: [
            'Yüksekte çalışma yalnızca yüksek binalarda yapılan işler değildir.',
            'Seviye farkı bulunan ve düşme sonucu yaralanma ihtimali olan her alandaki çalışma bu kapsamdadır.',
            'Örnekler: çatı ve teras, iskele, merdiven, makinelerin üst bölümü, platform ve yükseltilebilir araçlar, açık kenar, galeri ve şaft çevresi.',
            'Unutmayın: düşme riski yalnızca yüksekliğe bağlı değildir; zemin durumu, çalışma şekli ve çevre de belirleyicidir.',
            'Anlatıcı notu: Çalışanlara kendi işyerlerinden örnek verin. Birkaç basamaklı platformun ya da açık bir çukur kenarının da ciddi düşme riski oluşturabildiğini anlatın.',
          ],
        },
      ]),
      slayt('YUK-IC02', 'Yüksekten düşmeler neden tehlikelidir?', 'Düşmenin sonuçlarını ve çevredekilerin de etkilenebileceğini kavrayın.', [
        {
          baslik: 'Yüksekten düşmeler neden tehlikelidir?',
          notlar: [
            'Yüksekten düşmeler ağır yaralanmalara ve ölümcül kazalara neden olabilir.',
            'Olası sonuçlar: kafa ve beyin travması, omurga ve omurilik yaralanması, kemik kırığı, iç organ yaralanması, kalıcı sakatlık, ölüm.',
            'Düşen çalışanın altındaki alanda bulunan kişiler de düşen cisimlerden zarar görebilir.',
            'Bir anlık dikkatsizlik yaşam boyu sürecek sonuçlara yol açabilir.',
          ],
        },
      ]),
      slayt('YUK-IC03', 'Yüksekte çalışmada tehlikeler', 'Çalışma alanınızdaki başlıca düşme ve düşen cisim tehlikelerini tanıyın.', [
        {
          baslik: 'Başlıca tehlikeler',
          notlar: [
            'Korumasız kenarlardan düşme',
            'Kırılgan çatı veya yüzeylerden düşme',
            'Uygun olmayan merdiven kullanımı',
            'Hatalı kurulmuş veya hasarlı iskeleler',
            'Güvenli olmayan platformlar',
            'Elektrik hatlarına yaklaşma',
            'Düşen malzeme ve ekipmanlar',
            'Kaygan, ıslak veya dengesiz zeminler',
            'Olumsuz hava koşulları',
            'Uygun olmayan kişisel koruyucu donanım kullanımı',
            'Anlatıcı notu: Tehlikelerin işe başlamadan önce belirlenmesi gerektiğini vurgulayın.',
          ],
        },
      ]),
      slayt('YUK-IC04', 'Kazalara neden olan davranışlar', 'Kazaların önemli bölümü güvensiz davranıştan kaynaklanır.', [
        {
          baslik: 'Güvensiz davranışlar',
          notlar: [
            'Emniyet kemeri kullanmamak',
            'Korkulukları sökmek veya devre dışı bırakmak',
            'Merdivenin son basamaklarında çalışmak',
            'Uygun olmayan ekipmanla işe başlamak',
            'Yetkisiz şekilde iskeleye müdahale etmek',
            'Acele etmek ve kestirme yol kullanmak',
            'Cep telefonu gibi unsurlarla dikkatin dağılması',
            'Hava koşullarını dikkate almamak',
            'Güvenli olmayan platformda çalışmaya devam etmek',
            'Güvenlik ekipmanı bir formalite değil, hayat kurtaran bir korumadır.',
          ],
        },
      ]),
    ],
  },
  {
    id: 'YUK-B2',
    baslik: 'Bölüm 2 — İşe Başlamadan Önce',
    icerikler: [
      slayt('YUK-IC05', 'Risk değerlendirmesi ve çalışma planı', 'İşe başlamadan önce alanı, erişimi ve kurtarma imkânını değerlendirin.', [
        {
          baslik: 'Risk değerlendirmesi ve çalışma planı',
          notlar: [
            'Çalışmanın yapılacağı alan ve yükseklik',
            'Açık kenarlar ve düşme noktaları',
            'Zeminin taşıma kapasitesi ve sağlamlığı',
            'Çalışma alanına güvenli erişim',
            'Kullanılacak ekipmanların uygunluğu',
            'Hava koşulları ve aydınlatma',
            'Elektrik hatları ve diğer çevresel tehlikeler',
            'Çalışma alanının altında bulunan kişiler',
            'Kurtarma ve acil müdahale imkânları',
            'Önemli: Çalışma yöntemi ve güvenlik önlemleri işe başlamadan önce belirlenmelidir.',
          ],
        },
      ]),
      slayt('YUK-IC06', 'Önce düşmeyi önle: kontrol hiyerarşisi', 'Önlemleri doğru sırayla seçin; KKD en son savunma hattıdır.', [
        {
          baslik: 'Önlem öncelik sırası',
          notlar: [
            '1. Riski ortadan kaldır: mümkünse işi zeminden veya güvenli bir seviyeden yap.',
            '2. Toplu koruma sağla: korkuluk, güvenli platform, güvenlik ağı.',
            '3. Güvenli çalışma sistemi oluştur: erişim, çalışma ve ekipman kullanımını planla.',
            '4. Kişisel koruma kullan: uygun koşullarda düşüş durdurma veya hareket kısıtlama sistemi.',
            'Önemli: Toplu koruma önlemleri, yalnızca kişisel koruyucu donanıma güvenmeden önce değerlendirilmelidir.',
          ],
        },
      ]),
      slayt('YUK-IC07', 'Güvenli çalışma alanı nasıl hazırlanır?', 'Alan güvenli hâle gelmeden çalışmaya başlanmaz.', [
        {
          baslik: 'Alanı hazırlama',
          notlar: [
            'Çalışma alanının çevresi kontrol edilir.',
            'Açık kenarlar uygun korkuluklarla korunur.',
            'Geçiş yolları engellerden arındırılır.',
            'Çalışma alanının altında güvenlik bölgesi oluşturulur.',
            'Düşebilecek malzemeler sabitlenir.',
            'Uygun uyarı ve yönlendirme işaretleri kullanılır.',
            'Erişim ve tahliye yolları açık tutulur.',
            'Bir alan güvenli hâle getirilmeden çalışma başlatılmaz.',
          ],
        },
      ]),
      slayt('YUK-IC18', 'Kenarlar ve açıklıklar nasıl korunur?', 'Açık kenar ve boşluklara uygun toplu koruma uygulayın.', [
        {
          baslik: 'Kenar ve boşluk koruması',
          notlar: [
            'Açık kenar, döşeme boşluğu ve şaft çevresi işe başlamadan belirlenir.',
            'Öncelik sağlam korkuluk gibi toplu koruma sağlamaktır.',
            'Kapak kullanılan boşluklar sabitlenir ve kolayca yerinden oynamayacak şekilde korunur.',
            'Geçici olarak kaldırılan korumalar iş bitince hemen yerine takılır; korumasız alana erişim engellenir.',
            'Bir koruma eksik veya hasarlıysa çalışma başlatılmaz; sorumlu kişiye bildirilir.',
          ],
        },
      ]),
    ],
  },
  {
    id: 'YUK-B3',
    baslik: 'Bölüm 3 — İskele, Merdiven ve Platformlar',
    icerikler: [
      slayt('YUK-IC08', 'İskelelerde güvenli çalışma', 'İskelenin kurulumundan kullanımına kadar kontrol noktaları.', [
        {
          baslik: 'İskele kullanımı',
          notlar: [
            'İskele, yetkin kişilerce uygun plana göre kurulmuş olmalıdır.',
            'Kurulum ve kullanım öncesi gerekli kontroller yapılır.',
            'Platformlar sağlam ve uygun şekilde yerleştirilir.',
            'Korkuluk, ara korkuluk ve topuk levhası gibi korumalar bulunur.',
            'İskeleye güvenli erişim sağlanır; taşıma kapasitesi aşılmaz.',
            'Hasarlı veya uygunluğu doğrulanmamış iskele kullanılmaz.',
            'Tekerlekli iskelelerde çalışmadan önce hareket etmeleri önlenir.',
            'İskele üzerinde değişiklik veya sökme yetkisiz kişilerce yapılmaz.',
          ],
        },
      ]),
      slayt('YUK-IC09', 'Merdivenlerde güvenli çalışma', 'Merdiven her iş için uygun değildir.', [
        {
          baslik: 'Merdiven kullanımı',
          notlar: [
            'Önce daha güvenli çalışma ekipmanları değerlendirilir.',
            'Merdiven yapılacak işe uygun seçilir; hasarlı veya kırık merdiven kullanılmaz.',
            'Kayma ve devrilmeyi önleyecek şekilde sabitlenir, sağlam zemine yerleştirilir.',
            'Çalışan merdivende dengesini korur; yana aşırı uzanılmaz.',
            'Merdiven hareket ettirilmeden önce çalışan inmelidir.',
            'Merdiven, her zaman güvenli bir çalışma platformu yerine geçmez.',
          ],
        },
      ]),
      slayt('YUK-IC10', 'Kişisel koruyucu donanımlar', 'İşe ve risk değerlendirmesine uygun ekipman seçin.', [
        {
          baslik: 'Örnek donanımlar',
          notlar: [
            'Tam vücut emniyet kemeri',
            'Bağlantı halatı ve şok emicili bağlantı elemanı',
            'Geri sarımlı düşüş durdurucu',
            'Uygun ankraj ve yaşam hattı sistemi',
            'Baret ve uygun çene bağı',
            'Kaymaz tabanlı iş ayakkabısı; gerektiğinde eldiven ve diğer koruyucular',
            'Önemli: Her ekipman her çalışma için uygun değildir. Üretici talimatları ve sistem tasarımı dikkate alınır.',
          ],
        },
      ]),
      slayt('YUK-IC19', 'Yükseltilebilir çalışma platformları', 'Platformun güvenliğini ve kullanım talimatlarını kontrol edin.', [
        {
          baslik: 'Platformla güvenli çalışma',
          notlar: [
            'Platform işe uygun seçilir ve yalnızca kullanım eğitimi olan kişi tarafından kullanılır.',
            'Kullanım öncesi platform, kumandalar, kapılar ve çevresindeki zemin gözle kontrol edilir.',
            'Ekipman sağlam ve uygun zemine yerleştirilir; eğim ve yük sınırları aşılmaz.',
            'Korkuluk içinde çalışılır; platform üzerinde yükselmek veya korkuluğa tırmanmak tehlikelidir.',
            'Üretici talimatları ve sahaya özgü çalışma planı izlenir; arıza görülürse kullanım durdurulur.',
          ],
        },
      ]),
    ],
  },
  {
    id: 'YUK-B4',
    baslik: 'Bölüm 4 — Kişisel Koruma ve Düşüş Durdurma',
    icerikler: [
      slayt('YUK-IC11', 'Emniyet kemeri nasıl kontrol edilir?', 'Her kullanımdan önce üç dakikalık kontrol.', [
        {
          baslik: 'Kontrol noktaları',
          notlar: [
            'Dokuma ve dikişlerde kesik, yıpranma veya deformasyon var mı?',
            'Metal bağlantılarda çatlak, pas veya deformasyon var mı?',
            'Tokalar düzgün kapanıyor mu?',
            'Etiket ve ürün bilgileri okunabiliyor mu?',
            'Kullanım ömrü ve üretici talimatlarına uygun mu?',
            'Daha önce düşüş durdurma olayında yük almış mı?',
            'Hasarlı, bilgisi okunmayan veya uygunluğu doğrulanamayan ekipman kullanılmaz.',
          ],
        },
      ]),
      slayt('YUK-IC12', 'Ankraj ve bağlantı sistemleri', 'Her sağlam görünen yapı elemanı güvenli ankraj noktası değildir.', [
        {
          baslik: 'Ankraj',
          notlar: [
            'Ankraj noktası, düşüş durdurma sisteminin güvenle bağlandığı uygun noktadır.',
            'Ankraj noktası yapılan işe ve sisteme uygun olmalıdır.',
            'Yeterliliği doğrulanmamış noktalara bağlantı yapılmaz.',
            'Sistem üretici talimatlarına uygun kurulur.',
            'Bağlantı hattı keskin kenar ve hasardan korunur.',
            'Düşme mesafesi ve olası çarpma noktaları değerlendirilir.',
          ],
        },
      ]),
      slayt('YUK-IC13', 'Düşüş durdurma sistemi nasıl çalışır?', 'Sistem düşmeyi yakalamak için tasarlanır; düşmeyi baştan önlemek daha iyidir.', [
        {
          baslik: 'Düşüş durdurma',
          notlar: [
            'Düşüş durdurma sistemleri, düşen çalışanın zemine ya da bir yüzeye çarpmasını önlemek veya etkisini azaltmak için tasarlanır.',
            'Uygun tam vücut kemeri ve uyumlu bağlantı elemanı seçilir.',
            'Ankraj noktası uygun olmalı; düşme mesafesi hesaplanmalı.',
            'Altta çarpılabilecek engel bulunmamalı; kullanım konusunda eğitim alınmalıdır.',
            'Sistem düşmeyi her durumda önlemez; mümkünse düşmeyi baştan önleyen sistemler tercih edilir.',
          ],
        },
      ]),
      slayt('YUK-IC20', 'Bağlantı ve düşüş mesafesi kontrolü', 'Ekipman uyumunu ve aşağıdaki boşluğu işe başlamadan değerlendirin.', [
        {
          baslik: 'Bağlantıdan önce kontrol',
          notlar: [
            'Kemer, bağlantı elemanı ve ankraj birlikte çalışan uyumlu bir sistem oluşturmalıdır.',
            'Bağlantı doğru noktaya yapılır; sistem üretici talimatına göre takılır ve ayarlanır.',
            'Olası düşüşte çalışanın zemine veya yakındaki bir engele çarpmayacağı açıklık değerlendirilir.',
            'Bağlantı hattının keskin kenara sürtünmesi, dolaşması veya takılması önlenir.',
            'Sistemin uygunluğundan emin olunamıyorsa işe başlanmaz; yetkili kişiden destek alınır.',
          ],
        },
      ]),
    ],
  },
  {
    id: 'YUK-B5',
    baslik: 'Bölüm 5 — Acil Durumlar ve Güvenli Çalışma Alışkanlıkları',
    icerikler: [
      slayt('YUK-IC14', 'Askıda kalma ve kurtarma planı', 'Yakalanmak tehlikenin bittiği anlamına gelmez.', [
        {
          baslik: 'Askıda kalma',
          notlar: [
            'Emniyet kemeriyle düşüş durdurulan çalışan askıda kalabilir; bu acil müdahale gerektirir.',
            'Çalışmaya başlamadan önce kurtarma planı hazırlanır.',
            'Kurtarma ekipmanı hazır bulundurulur; acil müdahale görevlileri belirlenir.',
            'Haberleşme yöntemi oluşturulur; kurtarma süreci önceden planlanır.',
            '112 Acil Çağrı Merkezi’ne haber vermek, işyerindeki kurtarma planının ve uygun ekipmanla müdahalenin yerini tutmaz.',
            'Kurtarma girişimi yalnızca uygun eğitim ve ekipmana sahip kişilerce, planlı ve güvenli yapılmalıdır.',
          ],
        },
      ]),
      slayt('YUK-IC15', 'Hava koşulları ve çevresel riskler', 'Koşullar güvenli çalışmayı engelliyorsa çalışma durdurulur.', [
        {
          baslik: 'Hava ve çevre',
          notlar: [
            'Kuvvetli rüzgâr; yağmur ve kaygan yüzeyler; kar ve buzlanma',
            'Yıldırım ve fırtına; aşırı sıcak veya soğuk',
            'Yetersiz görüş ve aydınlatma',
            'Koşullar güvenli çalışmayı engelliyorsa çalışma durdurulur.',
            'Elektrik hatlarına yakın çalışmalarda yaklaşma mesafeleri ayrıca değerlendirilir.',
          ],
        },
      ]),
      slayt('YUK-IC16', 'Güvenli çalışmanın 10 altın kuralı', 'Eğitimin en kısa hatırlatma sayfası.', [
        {
          baslik: '10 altın kural',
          notlar: [
            '1. İşe başlamadan önce riskleri değerlendir.',
            '2. Mümkünse yüksekte çalışma ihtiyacını ortadan kaldır.',
            '3. Toplu koruma önlemlerini önceliklendir.',
            '4. Uygun ekipman kullan.',
            '5. Ekipmanını çalışmadan önce kontrol et.',
            '6. Güvenli ankraj ve bağlantı noktalarını kullan.',
            '7. Yetkisiz şekilde korkuluk ve korumaları sökme.',
            '8. Olumsuz hava koşullarında çalışma koşullarını yeniden değerlendir.',
            '9. Acil durum ve kurtarma planını bil.',
            '10. Güvensiz bir durum gördüğünde çalışmayı durdur ve yetkiliye bildir.',
          ],
        },
      ]),
      metin(
        'YUK-IC17',
        'Kapanış ve eğitim sonunda hatırlanacaklar',
        'Güvenlik tesadüfe bırakılmaz.',
        `## Yüksekte çalışırken güvenlik tesadüfe bırakılmaz\n\nDoğru planlama, uygun ekipman, güvenli çalışma yöntemi ve bilinçli davranış hayat kurtarır. Her çalışan güvenli çalışmayı hak eder ve güvenli ortamın korunmasında sorumluluk taşır.\n\n## Hatırlanacaklar\n- Yükseklik ölçüsüne tek başına güvenilmez; düşme riski değerlendirilir.\n- Toplu koruma önlemleri önceliklidir.\n- Merdiven her iş için uygun değildir.\n- Hasarlı ekipman kullanılmaz.\n- Emniyet kemeri, uygun ankraj ve bağlantı sistemiyle birlikte değerlendirilir.\n- Düşüş durdurma sonrası kurtarma planı gereklidir.\n- Eğitim, yapılan işe ve kullanılan ekipmana özgü olmalıdır.\n\n## Mevzuat ve kapsam notu\nBu içerik teorik eğitim materyalidir. Gerçek çalışma alanındaki ekipmanların uygulamalı tanıtımı, kullanımı ve kurtarma uygulamaları ayrıca planlanmalıdır. Bu çevrim içi sunum tek başına uygulamalı yeterlilik veya çalışma yetkisi belgesi yerine geçmez. Eğitimi verecek kişiler, kapsam ve belgelendirme yürürlükteki mevzuata göre ayrıca doğrulanmalıdır.`,
        5,
      ),
    ],
  },
]

/* ------------------------------- Ön sınav (10) ------------------------------- */

const onSinavSorulari: SinavSoru[] = [
  soru('YON-01', 'Yüksekte çalışma için en doğru tanım hangisidir?', ['Yalnızca çok yüksek binalarda yapılan işler', 'Düşme sonucu yaralanma ihtimali olan seviye farkındaki işler', 'Sadece çatı işleri', 'Yalnızca dış mekânda yapılan işler'], 1, 'Düşme sonucu yaralanma ihtimali olan seviye farkları yüksekte çalışma riski oluşturabilir.'),
  soru('YON-02', 'Yüksekte çalışmaya başlamadan önce ne yapılır?', ['İşin riskleri ve çalışma alanı kontrol edilir', 'En yakın merdiven hemen alınır', 'Önce malzemeler yukarı taşınır', 'Çalışma alanı kontrol edilmeden işe başlanır'], 0, 'İşe başlamadan önce çalışma alanı ve riskler değerlendirilir.'),
  soru('YON-03', 'Açık bir kenarda düşmeyi önlemek için hangi önlem tercih edilir?', ['Korkuluk gibi toplu koruma', 'Yalnızca dikkatli olmak', 'Uyarıyı görmezden gelmek', 'Kenara daha yakın çalışmak'], 0, 'Korkuluk, alandaki birden fazla kişiyi koruyan toplu koruma önlemidir.'),
  soru('YON-04', 'Merdiven nasıl kullanılmalıdır?', ['Sağlam zemine yerleştirilip sabitlenerek', 'Kaygan zeminde serbest bırakılarak', 'En üst basamağa çıkılarak', 'Yan tarafa doğru uzanarak'], 0, 'Merdiven uygun ve sağlam zemine yerleştirilip kaymaya karşı sabitlenmelidir.'),
  soru('YON-05', 'Hasarlı emniyet kemeri görürseniz ne yaparsınız?', ['Kullanmayı bırakıp sorumluya bildirirsiniz', 'Bantlayıp kullanırsınız', 'Sadece kısa işte kullanırsınız', 'Başka çalışana verirsiniz'], 0, 'Hasarlı ekipman kullanılmaz; kullanımdan çıkarılıp bildirilir.'),
  soru('YON-06', 'İskeleye çıkmadan önce neyi kontrol etmek gerekir?', ['İskelenin sağlam ve kullanıma uygun olduğunu', 'Üzerinde gereğinden fazla malzeme olduğunu', 'Korkulukların çıkarıldığını', 'İskelenin hareket edebildiğini'], 0, 'İskele kullanımdan önce uygunluk ve güvenli durum açısından kontrol edilir.'),
  soru('YON-07', 'Gevşek el aletlerinin düşmesini önlemek için ne yapılır?', ['Aletler sabitlenir ve aşağıdaki alan korunur', 'Aletler platform kenarına bırakılır', 'Aşağıdaki kişiler uyarılmadan çalışılır', 'Aletler çalışma sırasında fırlatılır'], 0, 'Aletler düşmeyecek şekilde güvenceye alınmalı, alt bölge de korunmalıdır.'),
  soru('YON-08', 'Emniyet kemeri hangi durumda koruma sağlar?', ['Uygun bağlantı ve doğrulanmış ankrajla birlikte kullanıldığında', 'Herhangi bir yere bağlandığında', 'Sadece elde taşındığında', 'Korkuluk yerine kullanıldığında'], 0, 'Kemer, işe uygun bağlantı elemanı ve doğrulanmış ankrajla birlikte sistem oluşturur.'),
  soru('YON-09', 'Kuvvetli rüzgâr çalışmayı güvensiz hâle getiriyorsa ne yapılır?', ['Çalışma durdurulur ve koşullar yeniden değerlendirilir', 'Daha hızlı çalışılır', 'Platforma daha çok malzeme konur', 'Uyarı dikkate alınmaz'], 0, 'Güvenliği etkileyen hava koşullarında çalışma durdurulup yeniden değerlendirilir.'),
  soru('YON-10', 'Bir çalışan emniyet sistemiyle askıda kaldığında ne yapılır?', ['İşyerinin kurtarma planı uygulanır', 'Kemer kesilir', 'Çalışan kendi başına atlar', 'Herkes çalışmaya devam eder'], 0, 'Askıda kalma acil durumdur; önceden hazırlanan kurtarma planı uygun kişilerce uygulanır.'),
]

/* ------------------------ Eğitim sonu sınavı (20, açıklamalı) ------------------------ */

const sonSinavSorulari: SinavSoru[] = [
  soru('SON-01', 'Bir çalışan çatı üzerinde çalışacaktır. İşe başlamadan önce en doğru yaklaşım hangisidir?', ['Doğrudan kemer takıp işe başlamak', 'Riskleri, erişimi, kenar korumalarını ve kurtarma planını değerlendirmek', 'Çalışma alanına yalnızca uyarı levhası koymak', 'İşi mümkün olduğunca hızlı tamamlamak'], 1, 'Doğru: Önce riskler, erişim, kenar koruması ve kurtarma planı değerlendirilir. Kemer tek başına yeterli değildir; diğerleri ise kontrol değil yalnızca uyarıdır ya da hız riski artırır.'),
  soru('SON-02', 'Bir çatının yüzeyi kırılgan olabilir. Nasıl davranılmalıdır?', ['Yüzeyin sağlam olduğu varsayılır', 'Yalnızca yavaş yürünür', 'Yüzeyin taşıma kapasitesi ve uygun koruma/erişim yöntemi belirlenmeden üzerine çıkılmaz', 'Baret takmak yeterlidir'], 2, 'Kırılgan yüzeyde taşıma kapasitesi ve erişim yöntemi belirlenmeden çıkılmaz; yavaş yürümek ya da baret kırılmayı önlemez.'),
  soru('SON-03', 'Çalışma alanında korkuluk bulunmuyor. En doğru karar hangisidir?', ['Dikkatli olunarak işe devam edilir', 'Uygun koruma önlemleri sağlanana kadar çalışma başlatılmaz', 'Yalnızca bir çalışan görevlendirilir', 'Çalışan kendi kararına göre devam eder'], 1, 'Korkuluk gibi toplu koruma olmadan düşme riski kabul edilemez; önlem sağlanana kadar çalışma başlatılmaz.'),
  soru('SON-04', 'İskele platformunda çatlak ve hasarlı bir eleman fark edildi. Ne yapılmalıdır?', ['Üzerine yük konulmadan kullanılır', 'Hasarlı bölüm kullanılmaz, alan güvenli hâle getirilip yetkiliye bildirilir', 'Üzerine tahta yerleştirilir', 'Yalnızca kısa süreli kullanılır'], 1, 'Hasarlı eleman yük konulmadan bile kullanılmaz; bölüm ayrılır ve bildirilir. Tahta ile onarım yetkisiz müdahaledir.'),
  soru('SON-05', 'Merdivende çalışan kişinin ulaşmak için yana aşırı uzanması neden sakıncalıdır?', ['İşi yavaşlatır', 'Denge kaybı ve merdivenin devrilme riskini artırır', 'Merdivenin rengini bozar', 'Sadece kıyafeti kirletir'], 1, 'Yana aşırı uzanma dengeyi bozar ve merdiveni devirebilir. Diğer seçenekler güvenlikle ilgili değildir.'),
  soru('SON-06', 'Bir çalışan emniyet kemerini takmış ancak uygun ankraja bağlanmamıştır. Bu sistem güvenli midir?', ['Evet, kemer tek başına yeterlidir', 'Hayır, uygun bağlantı ve ankraj olmadan sistem tamamlanmış değildir', 'Yalnızca kısa işlerde güvenlidir', 'Baret varsa güvenlidir'], 1, 'Emniyet kemeri ancak uygun ankrajla birlikte koruma sağlar; kemerin takılı olması tek başına yeterli değildir.'),
  soru('SON-07', 'Düşüş durdurma sisteminde düşüş mesafesinin değerlendirilmesinin amacı nedir?', ['Çalışanın çalışma süresini belirlemek', 'Çalışanın zemine veya engele çarpmasını önleyecek açıklığı değerlendirmek', 'Ekipmanın rengini seçmek', 'İşin maliyetini hesaplamak'], 1, 'Düşüş mesafesi, altta engel olup olmadığını ve çarpma riskini belirler.'),
  soru('SON-08', 'Çalışan düşüş durdurma sistemi tarafından yakalandı ve askıda kaldı. Öncelik nedir?', ['Kendi başına kemeri çıkarması', 'Önceden hazırlanmış kurtarma planının uygun kişilerce uygulanması', 'Çalışanın bir süre beklemesi', 'Ekipmanın kesilmesi'], 1, 'Askıda kalma acil bir durumdur; önceden planlanmış ve eğitimli kişilerce kurtarma uygulanır.'),
  soru('SON-09', 'İskele üzerinde çalışanların altında başka çalışanlar bulunuyor. Hangi önlem önemlidir?', ['Aşağıdaki çalışanların baret takması tek başına yeterlidir', 'Düşen cisimlere karşı alanın kontrol edilmesi, güvenlik bölgesi ve uygun önlemlerin oluşturulması', 'İşin hızlandırılması', 'Malzemelerin platform kenarına bırakılması'], 1, 'Altta çalışanlar için güvenlik bölgesi ve düşen cisim önlemi gerekir; baret tek başına yeterli değildir.'),
  soru('SON-10', 'Şiddetli rüzgâr nedeniyle çalışma platformunda dengeyi korumak zorlaşıyor. Ne yapılmalıdır?', ['Çalışmaya devam edilmelidir', 'Koşullar değerlendirilerek güvenli değilse çalışma durdurulmalıdır', 'Daha fazla malzeme taşınmalıdır', 'Yalnızca kemer bağlantısı değiştirilmelidir'], 1, 'Dengenin zorlaştığı rüzgârda çalışma koşullar güvenli hâle gelene kadar durdurulur.'),
  soru('SON-11', 'Bir çalışanın kullandığı emniyet kemerinin dikişlerinde yırtılma görülüyor. Ne yapılmalıdır?', ['Yırtık bölge dikilir ve kullanılır', 'Kullanımdan çıkarılır ve yetkiliye bildirilir', 'Yalnızca düşük yükseklikte kullanılır', 'Bir başkasına verilir'], 1, 'Dikişi yırtılmış kemer güvenliği sağlayamaz; kullanımdan çıkarılır ve bildirilir.'),
  soru('SON-12', 'Aşağıdakilerden hangisi toplu koruma örneğidir?', ['Tam vücut emniyet kemeri', 'Korkuluk sistemi', 'Bağlantı halatı', 'Şok emici'], 1, 'Toplu koruma birden fazla kişiyi korur ve çalışandan bağımsızdır; korkuluk örnektir. Diğerleri kişisel koruyucu donanımdır.'),
  soru('SON-13', 'Bir çalışan güvenli olmayan bir çalışma koşulu fark ettiğinde ne yapmalıdır?', ['Kimseye söylemeden çalışmaya devam etmelidir', 'Durumu yetkiliye bildirmeli ve güvenli hâle gelene kadar çalışmaya devam etmemelidir', 'Yalnızca arkadaşını uyarmalıdır', 'İşi hızlıca bitirmelidir'], 1, 'Güvensiz durumda çalışma durdurulur ve yetkili bilgilendirilir; sessizce devam etmek ya da yalnızca uyarmak yeterli değildir.'),
  soru('SON-14', 'Düşüş durdurma ekipmanı daha önce bir düşüşte yük almış. Nasıl kullanılmalıdır?', ['Görünür hasar yoksa hemen tekrar kullanılmalıdır', 'Üretici talimatları ve yetkili inceleme süreci tamamlanmadan yeniden kullanılmamalıdır', 'Yalnızca başka bir çalışan kullanabilir', 'Yıkanıp tekrar kullanılabilir'], 1, 'Yük almış ekipman görünür hasar olmasa da iç yapısı zarar görmüş olabilir; inceleme tamamlanmadan kullanılmaz.'),
  soru('SON-15', 'Yüksekte güvenli çalışmanın en doğru yaklaşımı hangisidir?', ['Yalnızca çalışanların dikkatli olması', 'Yalnızca emniyet kemeri kullanılması', 'Riskin planlanması, uygun toplu koruma, doğru ekipman ve kurtarma hazırlığının birlikte sağlanması', 'İşin mümkün olduğunca kısa tutulması'], 2, 'Güvenlik tek bir önleme bağlı değildir; planlama, toplu koruma, ekipman ve kurtarma birlikte sağlanır.', 10),
  soru('SON-16', 'Döşemede korumasız bir açıklık fark edildi. Çalışma öncesi ne yapılmalıdır?', ['Açıklık görünür olduğu için olduğu gibi bırakılmalıdır', 'Uygun kapak veya korkulukla korunmalı ve alana erişim kontrol edilmelidir', 'Üzerine birkaç malzeme bırakılmalıdır', 'Çalışanlar dikkatli olmaları için uyarılıp işe devam edilmelidir'], 1, 'Açıklık sabit kapak veya korkuluk gibi uygun bir önlemle korunur; yalnızca sözlü uyarı yeterli değildir.'),
  soru('SON-17', 'Yükseltilebilir çalışma platformunu kim kullanmalıdır?', ['Ekipmanı daha önce görmüş herkes', 'Kullanım eğitimi olan ve yetkilendirilmiş çalışan', 'Platformun altındaki çalışan', 'Yalnızca gözcü olarak görevlendirilen kişi'], 1, 'Platformu kullanım eğitimi ve yetkisi olan çalışan, talimatlara uygun biçimde kullanmalıdır.'),
  soru('SON-18', 'Kullanım öncesi emniyet kemerinin dokumasında kesik fark edildi. Ne yapılır?', ['Kesik küçükse çalışmaya devam edilir', 'Ekipman kullanımdan çıkarılır ve sorumluya bildirilir', 'Kesik bantla kapatılır', 'Kemer başka çalışana verilir'], 1, 'Dokuma hasarı ekipmanın güvenliğini etkileyebilir; ekipman kullanılmaz ve bildirilir.'),
  soru('SON-19', 'Yüksekte kullanılan el aletlerinin aşağı düşme riskini azaltmak için ne yapılmalıdır?', ['Aletleri kenarda toplamak', 'Aletleri uygun biçimde sabitlemek ve aşağıdaki alanı korumak', 'Aletleri çalışanlar arasında atmak', 'Aşağıdaki alanı açık bırakmak'], 1, 'Aletler sabitlenir; düşen cisimlerin ulaşabileceği alan da güvenli şekilde sınırlandırılır.'),
  soru('SON-20', 'Düşüş durdurma sistemine bağlanmadan önce hangi iki konu birlikte değerlendirilmelidir?', ['Ekipmanın rengi ve çalışma süresi', 'Ekipmanların birbiriyle uyumu ve olası düşüşte yeterli boşluk bulunması', 'Çalışanın ayakkabı numarası ve hava sıcaklığı', 'Platformun rengi ve çalışan sayısı'], 1, 'Sistem bileşenleri uyumlu olmalı ve olası düşüşte çalışanın zemine ya da engele çarpmaması için yeterli açıklık bulunmalıdır.'),
]

const onSinav: Sinav = {
  id: 'SNV-YUK-ON',
  baslik: 'Yüksekte Çalışma — Ön Sınav',
  aciklama: 'Eğitim öncesi mevcut bilgi düzeyini ölçer. Sonuç bir deneme niteliğindedir; eğitime erişimi engellemez.',
  sorular: onSinavSorulari,
  ayarlar: {
    gecmePuani: 0,
    sureDakika: 0,
    denemeHakki: 0,
    soruKaristir: true,
    sikKaristir: true,
    cevaplariGoster: false,
    aciklamalariGoster: false,
  },
}

const sonSinav: Sinav = {
  id: 'SNV-YUK-SON',
  baslik: 'Yüksekte Güvenli Çalışma — Eğitim Sonu Sınavı',
  aciklama: 'Gerçek çalışma koşullarında doğru karar verme becerisini ölçer. Geçme notu %70; yanlış cevaplarda açıklama gösterilir.',
  sorular: sonSinavSorulari,
  ayarlar: {
    ...varsayilanSinavAyarlari(),
    gecmePuani: 70,
    sureDakika: 30,
    denemeHakki: 3,
    soruKaristir: true,
    sikKaristir: true,
    cevaplariGoster: true,
    aciklamalariGoster: true,
  },
}

const tamamlama = { ...varsayilanTamamlama(), videoMinYuzde: 0, zorunluBolumlerTumu: true, sinavZorunlu: true, manuelOnay: false }

const surum: EgitimSurum = {
  id: SURUM_ID,
  no: 2,
  bolumler: bolumler,
  sinav: sonSinav,
  onSinav,
  tamamlama,
  durum: 'aktif',
  not: 'Güncelleme: 5 bölüm / 20 içerik, kolay düzeyli ön sınav (10 soru), eğitim sonu sınavı (20 soru).',
  tarih: TODAY,
}

/** HanTech’in ilk işe özgü eğitimi. */
export const yuksekteEgitim: Egitim = {
  id: EGITIM_ID,
  baslik: 'Yüksekte Güvenli Çalışma',
  aciklama: 'Düşme risklerini tanıma, önleme yöntemleri, güvenli erişim ekipmanları ve acil durumlarda doğru davranış.',
  kategori: 'İşe Özgü İSG',
  dil: 'Türkçe',
  sureDakika: 60,
  hedefler: [
    'Yüksekte çalışmanın ne anlama geldiğini ve düşme tehlikelerini tanıyabilmek',
    'İşe başlamadan önce riskleri değerlendirebilmek',
    'Toplu koruma önlemlerinin önceliğini kavramak',
    'İskele, merdiven, platform ve kişisel düşüş durdurma sistemlerinin temel kullanım kurallarını bilmek',
    'Emniyet kemeri, bağlantı elemanı ve ankraj sistemlerini tanıyabilmek',
    'Hatalı ve güvensiz çalışma koşullarında işi durdurabilmek',
    'Düşme veya askıda kalma durumunda acil müdahale sürecini bilmek',
  ],
  etiketler: ['yüksekte çalışma', 'işe özgü', 'ilk eğitim'],
  kapakTon: 'from-amber-500 to-orange-600',
  kapakGorsel: '/images/egitim-yuksekte-guvenli-calisma-01-kapak.png',
  durum: 'Yayında',
  aktifSurumId: SURUM_ID,
  surumler: [surum],
  guncelleme: TODAY,
  olusturan: 'HanTech İSG Ekibi',
}
