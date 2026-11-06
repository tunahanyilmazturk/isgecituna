import type { Bolum, EgitimSurum, Icerik, Sinav, SinavSoru } from './egitimler'
import { TODAY } from './dashboard'

const image = {
  cover: '/images/temel-isg-egitimi-cover-2026.png',
  general: '/images/temel-isg-bolum-genel.png',
  health: '/images/temel-isg-bolum-saglik.png',
  technical: '/images/temel-isg-bolum-teknik.png',
  specific: '/images/temel-isg-bolum-ozel-riskler.png',
  lessons: Array.from({ length: 20 }, (_, index) => `/images/temel-isg-ders-${String(index + 1).padStart(2, '0')}.jpg`),
}

type DersTaslagi = {
  baslik: string
  aciklama: string
  sure: number
  bolum: number
  slaytlar: { baslik: string; notlar: string[] }[]
}

const bolumAdlari = [
  'Bölüm 1 — Güvenli Çalışmanın Temelleri',
  'Bölüm 2 — Sağlık, Hijyen ve İyi Oluş',
  'Bölüm 3 — Fiziksel, Kimyasal ve Ergonomik Riskler',
  'Bölüm 4 — Ekipman, Yangın ve Acil Durumlar',
  'Bölüm 5 — İşe Özgü ve Özel Riskler',
]

const dersler: DersTaslagi[] = [
  { bolum: 0, baslik: 'İSG’nin amacı ve güvenlik kültürü', aciklama: 'Güvenliğin günlük iş kararlarına nasıl yerleştiğini öğrenin.', sure: 7, slaytlar: [
    { baslik: 'Güvenli çalışma ortak sorumluluktur', notlar: ['Amaç, işten kaynaklanabilecek yaralanma ve sağlık sorunlarını önlemektir.', 'Güvenli iş; planlama, uygun ekipman, iletişim ve çalışan katılımıyla kurulur.', 'Güvenlik üretimin önünde engel değil, işin doğru yapılma koşuludur.'] },
    { baslik: 'Önce gör, sonra güvenli adım at', notlar: ['İşe başlamadan alanı, işi ve çevrendeki kişileri gözden geçir.', 'Bir şey değiştiğinde önceki güvenli varsayımları tekrar kontrol et.', 'Emin olmadığın işi durdur, sor ve doğru talimatı al.'] },
    { baslik: 'Güvenlik kültürü davranışta görünür', notlar: ['Tehlikeleri ve ramak kalaları zamanında paylaş.', 'Arkadaşını suçlamadan güvenli davranışa destek ol.', 'İyileştirme önerilerini işyeri kanallarına ilet.'] },
  ] },
  { bolum: 0, baslik: 'Haklar, görevler ve mevzuatın temel çerçevesi', aciklama: 'İşyerindeki İSG rollerini ve çalışan sorumluluklarını tanıyın.', sure: 8, slaytlar: [
    { baslik: 'İSG düzeni işyerine göre kurulur', notlar: ['İşveren eğitim programı, uygun koşullar ve işyeri tedbirlerini organize eder.', 'Çalışan, verilen eğitim ve talimatlara uygun hareket eder.', 'İşyeri riskleri, görevler ve çalışanların ihtiyaçları eğitim içeriğine yansıtılır.'] },
    { baslik: 'Çalışanın günlük sorumlulukları', notlar: ['Makine ve koruyucuları amacı dışında kullanma.', 'Kendinin ve davranışından etkilenebilecek kişilerin güvenliğini gözet.', 'Arızayı, uygunsuzluğu ve tehlikeyi ilgili kişiye bildir.'] },
    { baslik: 'Katılım ve bilgi alma', notlar: ['Anlaşılmayan talimatı işe başlamadan sor.', 'İSG bilgilendirmelerine ve işyeri uygulamalarına katıl.', 'Ciddi ve yakın tehlikede işyerinin güvenli durdurma ve bildirim yöntemini izle.'] },
  ] },
  { bolum: 0, baslik: 'Tehlike, risk ve kontrol yaklaşımı', aciklama: 'Tehlike kaynağını ve olası zararları ayırt edip önlemleri doğru sırada düşünün.', sure: 8, slaytlar: [
    { baslik: 'Tehlike kaynağı, risk olasılığı', notlar: ['Tehlike zarar verme potansiyeli olan kaynak, durum veya davranıştır.', 'Risk, zararın meydana gelme olasılığı ve olası sonucunun birlikte ele alınmasıdır.', 'Islak zemin tehlikedir; kayıp düşmek olası sonuçtur.'] },
    { baslik: 'Kim etkilenebilir, nasıl zarar görebilir?', notlar: ['Çalışanları, ziyaretçileri, bakım ekiplerini ve çevredeki kişileri düşün.', 'İşin normal ve olağan dışı koşullarını incele.', 'Tehlike değiştiğinde kontrolün yeterli olup olmadığını yeniden değerlendir.'] },
    { baslik: 'Kontrol önlemlerini kaynağından başlat', notlar: ['Önce tehlikeyi ortadan kaldırma veya daha güvenli yöntemle değiştirme seçeneğini ara.', 'Sonra mühendislik ve toplu koruma önlemlerini değerlendir.', 'Talimat, eğitim ve uygun KKD kalan riski yönetmeye yardımcı olur; tek başına her zaman yeterli değildir.'] },
  ] },
  { bolum: 0, baslik: 'Düzen, temizlik ve olaylardan öğrenme', aciklama: 'Düzenli çalışma alanı oluşturun ve ramak kala bildirimini iyileştirmeye dönüştürün.', sure: 7, slaytlar: [
    { baslik: 'Düzen günlük bir güvenlik kontrolüdür', notlar: ['Geçiş yollarını, çıkışları ve yangın ekipmanına erişimi açık tut.', 'Malzemeleri devrilmeyecek ve düşmeyecek şekilde düzenle.', 'Dökülme, kablo ve takılma risklerini güvenli bildirim yöntemiyle ele al.'] },
    { baslik: 'Kaza ve meslek hastalığı etkileri', notlar: ['Olaylar çalışanı, ailesini, iş arkadaşlarını ve işin sürekliliğini etkileyebilir.', 'Önleme, olay sonrası sonuçları yönetmekten daha etkilidir.', 'İşyeri kayıt ve inceleme süreçleri tekrar riskini azaltmaya yardım eder.'] },
    { baslik: 'Ramak kala da değerli bilgidir', notlar: ['Yaralanma olmaması tehlikenin önemsiz olduğu anlamına gelmez.', 'Ne olduğunu, nerede olduğunu ve riskin sürüp sürmediğini bildirin.', 'Amaç suçlamak değil; nedenleri bulup kontrolü güçlendirmektir.'] },
  ] },
  { bolum: 1, baslik: 'Meslek hastalıkları ve erken belirtiler', aciklama: 'İşe bağlı sağlık etkilerini, maruziyeti ve erken bildirim gereğini öğrenin.', sure: 8, slaytlar: [
    { baslik: 'Sağlık etkileri zamanla gelişebilir', notlar: ['Gürültü, toz, kimyasal, titreşim ve tekrarlı hareketler sağlığı etkileyebilir.', 'Bazı belirtiler hemen, bazıları uzun süreli maruziyet sonrasında ortaya çıkar.', 'Belirtiyi gizlemek yerine işyeri sağlık sürecine zamanında başvur.'] },
    { baslik: 'Maruziyet yolu ve kaynağı', notlar: ['Maddeler solunum, deri teması veya yutma yoluyla vücuda girebilir.', 'Gürültü ve titreşim gibi fiziksel etkenler iş ve çevre koşullarına bağlıdır.', 'Kişisel hassasiyetler ve yapılan iş birlikte değerlendirilir.'] },
    { baslik: 'Korunma iş tasarımıyla başlar', notlar: ['Maruziyet kaynağını azaltan teknik ve organizasyonel tedbirleri uygula.', 'Uygun havalandırma, bakım, güvenli süre ve doğru KKD önemlidir.', 'İşyeri sağlık gözetimi ve bildirim talimatlarına uy.'] },
  ] },
  { bolum: 1, baslik: 'Biyolojik riskler, hijyen ve bulaşın önlenmesi', aciklama: 'Biyolojik etkenlere karşı temel hijyen ve güvenli davranışları kavrayın.', sure: 7, slaytlar: [
    { baslik: 'Biyolojik etkenler nerede görülür?', notlar: ['Bazı işler mikroorganizma, vücut sıvısı, atık veya kirli yüzeylerle temas içerebilir.', 'Risk yapılan işe ve temas biçimine göre değişir.', 'Kontamine olabilecek alanları işyeri talimatına göre işaretle ve bildir.'] },
    { baslik: 'Hijyen zinciri teması azaltır', notlar: ['El hijyeni ve uygun temizlik malzemelerini doğru zamanda kullan.', 'Yemek ve içecekleri kimyasal ya da biyolojik kirlenme olabilecek alanlardan uzak tut.', 'Kirli iş kıyafetlerini ve ekipmanını belirlenen yöntemle ayır.'] },
    { baslik: 'Uygun bariyer ve bildirim', notlar: ['İşin gerektirdiği eldiven, gözlük ve diğer koruyucuları kullan.', 'Kesik, sıçrama veya beklenmeyen temasta işyeri prosedürünü uygula.', 'Belirti veya maruziyet şüphesini gecikmeden yetkili sağlık birimine aktar.'] },
  ] },
  { bolum: 1, baslik: 'Psikososyal riskler, iletişim ve iyi oluş', aciklama: 'İş organizasyonu ve iletişimin güvenli çalışma üzerindeki etkisini fark edin.', sure: 7, slaytlar: [
    { baslik: 'İşin düzeni sağlığı etkiler', notlar: ['Aşırı tempo, belirsiz görev, yetersiz dinlenme ve zayıf iletişim yük oluşturabilir.', 'Yorgunluk ve dikkat dağılması hata olasılığını artırabilir.', 'Riskleri kişisel kusur gibi görmeden işin nasıl düzenlendiğini de değerlendirin.'] },
    { baslik: 'Güvenli iletişim kur', notlar: ['Görev, değişiklik ve tehlike bilgisini açık ve zamanında paylaş.', 'Anlamadığını tekrar sor; varsayımla tehlikeli işe başlama.', 'Saygılı iletişim ve destek isteme güvenliğin parçasıdır.'] },
    { baslik: 'Yorgunlukta güvenli karar', notlar: ['Dikkatinde düşüş fark edersen güvenli mola ve destek yöntemini kullan.', 'Acele baskısı nedeniyle koruma adımlarını atlama.', 'İş yükü veya çalışma koşulu riski sürüyorsa yöneticine bildir.'] },
  ] },
  { bolum: 1, baslik: 'İlk yardım ve tütün dumanından korunma', aciklama: 'İlk yardımın sınırlarını ve tütün dumanına maruziyeti azaltmayı öğrenin.', sure: 7, slaytlar: [
    { baslik: 'Önce olay yeri güvenliği', notlar: ['Kendini ve çevredekileri tehlikeye atarak müdahale etme.', 'Acil yardım çağır ve işyerindeki ilk yardımcıya haber ver.', 'Eğitimli olmadığın müdahaleyi deneme; verilen talimatları izle.'] },
    { baslik: 'Yardım gelene kadar', notlar: ['Yaralıyı gereksiz yere hareket ettirme.', 'Acil durum ekibine yer, olay türü ve görülen tehlikeleri net anlat.', 'İşyerinin acil numaraları ve ekiplerin yerini önceden öğren.'] },
    { baslik: 'Tütün dumanı başkalarını da etkiler', notlar: ['Pasif etkilenim, çevredeki kişilerin sağlığını da olumsuz etkileyebilir.', 'İşyerinin dumansız alan kurallarına uy.', 'Duman veya uygunsuz kullanım alanı varsa belirlenmiş kanaldan bildir.'] },
  ] },
  { bolum: 2, baslik: 'Fiziksel etkenler: gürültü, titreşim ve çevre', aciklama: 'Fiziksel etkenleri fark edin; uygun ölçüm ve korunma tedbirlerine uyun.', sure: 7, slaytlar: [
    { baslik: 'Fiziksel etkenleri fark et', notlar: ['Gürültü, titreşim, sıcak-soğuk, aydınlatma ve radyasyon çalışma koşullarını etkileyebilir.', 'Etkenin şiddeti, süresi ve çalışana uzaklığı önem taşır.', 'Rahatsızlık veya kontrol eksikliği gördüğünde bildir.'] },
    { baslik: 'Kontrolü işyerinde doğrula', notlar: ['Ölçüm ve teknik değerlendirmeler yetkili süreçlerle yapılmalıdır.', 'Makine bakımı, izolasyon, havalandırma ve çalışma düzeni riski azaltabilir.', 'İşaretleri ve alana özgü maruziyet talimatlarını takip et.'] },
    { baslik: 'KKD talimatın parçasıdır', notlar: ['İşitme koruyucuyu doğru takmak ve uygun süre kullanmak gerekir.', 'Her koruyucu her etken için uygun değildir.', 'Hasar, uyumsuzluk veya rahatsızlık varsa değiştirilmesi için bildir.'] },
  ] },
  { bolum: 2, baslik: 'Kimyasal riskler, etiket ve güvenlik bilgi formu', aciklama: 'Kimyasalı tanımadan müdahale etmeyin; etiket ve SDS bilgisini takip edin.', sure: 8, slaytlar: [
    { baslik: 'Kimyasal tehlikeyi tanı', notlar: ['Ürün etiketi tehlike işaretlerini ve temel uyarıları gösterir.', 'Güvenlik Bilgi Formu güvenli kullanım, depolama ve acil durum bilgisi sunar.', 'İsimsiz veya etiketsiz maddeyi kullanma.'] },
    { baslik: 'Güvenli kullanım ve depolama', notlar: ['Ürünü yalnızca talimatına uygun ve belirlenen yerde kullan.', 'Uyumsuz kimyasalları karıştırma veya başka kaba etiketsiz aktarma.', 'Havalandırma ve uygun koruyucu gerekliliklerini kontrol et.'] },
    { baslik: 'Dökülme veya sıçramada', notlar: ['Maddeyi koklayıp tanımaya çalışma ve çıplak elle temizleme.', 'Alanı güvenli tut, çevrendekileri uyar ve yetkili ekibe haber ver.', 'SDS ve işyeri dökülme prosedüründeki talimatları izle.'] },
  ] },
  { bolum: 2, baslik: 'Ergonomi, ekranlı çalışma ve elle taşıma', aciklama: 'Duruşu, iş istasyonunu ve yükün taşınma biçimini iyileştirin.', sure: 8, slaytlar: [
    { baslik: 'İşi bedene uydur', notlar: ['Çalışma yüksekliğini ve sık kullanılan araçların erişimini düzenle.', 'Uzun süre aynı pozisyonda kalmaktan kaçın; işin elverdiği molaları kullan.', 'Ağrı ve zorlanmayı erken bildir.'] },
    { baslik: 'Ekranlı araçlarda', notlar: ['Ekran ve sandalye konumunu rahat ve nötr duruş sağlayacak şekilde ayarla.', 'Parlama ve yansımayı azalt; metnin rahat okunabildiğini kontrol et.', 'Görsel yükü azaltmak için düzenli kısa ara ve pozisyon değişikliği yap.'] },
    { baslik: 'Yük taşımadan önce planla', notlar: ['Yükün ağırlığını, tutuşunu, yolu ve görüşünü değerlendir.', 'Yükü vücuda yakın tut; kaldırırken ani dönme ve sarsılmadan kaçın.', 'Kontrol edemeyeceğin yükte mekanik yardım veya ekip desteği iste.'] },
  ] },
  { bolum: 2, baslik: 'Biyolojik, elektrik ve diğer çevresel tehlikeler', aciklama: 'Farklı tehlike kaynaklarını ayırt edip yetkinlik sınırında güvenli davranın.', sure: 7, slaytlar: [
    { baslik: 'Tehlike işaretleri bilgi verir', notlar: ['Uyarı işaretleri yaklaşma, temas ve kullanım risklerine dikkat çeker.', 'İşaret, fiziksel önlemin veya talimatın yerine geçmez.', 'Hasarlı veya görünmeyen işareti sorumlu kişiye bildir.'] },
    { baslik: 'Elektrikte yetkinlik sınırını koru', notlar: ['Açıkta iletken, hasarlı kablo veya ıslak ekipmanı kullanma.', 'Elektrik panosuna ve tesisata yetkisiz müdahale etme.', 'Elektrik tehlikesinde yaklaşmadan alanı uyar ve yetkili ekibe haber ver.'] },
    { baslik: 'Birden fazla risk birlikte olabilir', notlar: ['Kimyasal, elektrik, biyolojik ve ergonomik tehlikeler aynı alanda bulunabilir.', 'Bir işteki değişiklik diğer tehlikeleri artırabilir.', 'İşe özgü risk değerlendirmesi ve işyeri talimatlarını birlikte uygula.'] },
  ] },
  { bolum: 3, baslik: 'İş ekipmanları ve makine güvenliği', aciklama: 'Ekipman koruyucularını, güvenli kullanım sınırlarını ve arıza bildirimini öğrenin.', sure: 8, slaytlar: [
    { baslik: 'Kullanımdan önce kontrol et', notlar: ['Ekipmanın doğru iş için seçildiğini ve eğitim/izin gerekliliklerini doğrula.', 'Görünür hasar, koruyucu ve güvenlik tertibatına bak.', 'Kullanım kılavuzu ve işyeri talimatındaki kontrolleri uygula.'] },
    { baslik: 'Koruyucuyu devre dışı bırakma', notlar: ['Hareketli parçaya erişimi önleyen koruyucular ciddi yaralanmaları engeller.', 'Kısa süreli iş için bile koruyucu sökülmez veya köprülenmez.', 'Arıza varsa güvenli biçimde bırak ve yetkili kişiye bildir.'] },
    { baslik: 'Bakım ve müdahale yalnız yetkili kişiye', notlar: ['Enerjili ekipmanda bakım veya temizlik yapma.', 'İzolasyon, kilitleme ve yeniden devreye alma prosedürünü yetkili ekip uygular.', 'Ekipmanın güvenli olduğu doğrulanmadan çalıştırma.'] },
  ] },
  { bolum: 3, baslik: 'Elektrik güvenliği ve güvenli işaretler', aciklama: 'Elektrik kaynaklı risklerde uzaklaşma, bildirim ve işaretlere uygun hareket edin.', sure: 7, slaytlar: [
    { baslik: 'Elektrik görünmeden zarar verebilir', notlar: ['Hasarlı kablo, uygunsuz bağlantı ve yetkisiz müdahale tehlike oluşturur.', 'Islak ortam ve metal temas riski artırabilir.', 'Şüpheli ekipmanı kullanımdan çıkarma prosedürünü uygula.'] },
    { baslik: 'Güvenlik işaretlerini oku', notlar: ['Yasaklama, uyarı, zorunluluk ve acil durum işaretleri farklı mesajlar taşır.', 'Renk ve simgeyi işyeri eğitiminde öğrendiğin şekilde yorumla.', 'Güzergâh ve erişim işaretlerine uy.'] },
    { baslik: 'Acil elektrik olayında', notlar: ['Elektrik çarpması şüphesinde kişiye çıplak elle dokunma.', 'Enerjinin güvenli şekilde kesilmesini yetkili kişiden sağla ve acil yardım çağır.', 'Alanı boşalt, çevredekileri uzak tut ve talimat bekle.'] },
  ] },
  { bolum: 3, baslik: 'Yangın, parlama ve patlamadan korunma', aciklama: 'Yangın başlangıcında alarm, güvenli tahliye ve uzman müdahalesi önceliğini kavrayın.', sure: 8, slaytlar: [
    { baslik: 'Yangın için üç unsur gerekir', notlar: ['Yanıcı madde, oksijen ve ısı birlikte yanmayı sürdürür.', 'Sıcak çalışma, kıvılcım ve uygunsuz depolama riski artırabilir.', 'İşyerinin izin, gözetim ve yangın önleme kurallarına uy.'] },
    { baslik: 'Önleme ve hazırlık', notlar: ['Çıkışları ve söndürücü önlerini boş tut.', 'Yanıcı maddeleri belirlenmiş koşullarda depola.', 'Alarmı, tahliye yolunu ve toplanma alanını önceden öğren.'] },
    { baslik: 'Alarm ver, tahliye et', notlar: ['Yangın veya duman gördüğünde uyarı ve ihbar yöntemini hemen kullan.', 'Yangınla mücadele eğitimin ve güvenli koşul yoksa söndürmeye çalışma.', 'Asansör kullanma; eşyaları almadan toplanma alanına git.'] },
  ] },
  { bolum: 3, baslik: 'Acil durum, tahliye, kurtarma ve ilk adım', aciklama: 'İşyerinin acil durum planına göre haber verme ve toplanma adımlarını uygulayın.', sure: 8, slaytlar: [
    { baslik: 'Acil durumda görevini bil', notlar: ['Alarm türlerini, çıkış yollarını ve toplanma yerini öğren.', 'Görevlilerin ve acil durum ekiplerinin talimatını izle.', 'Ziyaretçi ve yeni çalışanların güvenli yönlendirilmesine destek ol.'] },
    { baslik: 'Tahliyede güvenli rota', notlar: ['İşi güvenli biçimde bırak ve belirlenmiş kaçış yoluna yönel.', 'Dumanlı alana girme, geri dönme ve asansör kullanma.', 'Toplanma alanında yoklama ve yeni talimat için bekle.'] },
    { baslik: 'Kurtarma uzman ekip işidir', notlar: ['Eğitim, ekipman ve yetkinlik olmadan tehlikeli kurtarma girişimi yapma.', 'Olay yerini, erişim yolunu ve devam eden tehlikeleri ekiplere bildir.', 'Acil yardım çağır ve güvenli alanı koru.'] },
  ] },
  { bolum: 4, baslik: 'Yüksekte çalışma ve düşmeye karşı koruma', aciklama: 'Düşme riski bulunan işlerde işe başlamadan planlama ve koruma gereğini kavrayın.', sure: 8, slaytlar: [
    { baslik: 'Düşme yalnız yüksek binalarda olmaz', notlar: ['Seviye farkı, açıklık, çatı, platform ve merdiven düşme riski doğurabilir.', 'Açık kenarlar ve kırılgan yüzeyler özel değerlendirme gerektirir.', 'İş başlamadan erişim ve düşmeye karşı koruma planlanır.'] },
    { baslik: 'Toplu korumaya öncelik ver', notlar: ['Uygun korkuluk, platform ve güvenli erişim ilk değerlendirilmesi gereken korumalardır.', 'Açıklıklar kapatılır ve güvenli olmayan alan sınırlandırılır.', 'Kişisel düşüş durdurma sistemleri ancak uygun tasarım, eğitim ve kurtarma planıyla kullanılır.'] },
    { baslik: 'Çalışmayı durdurma işaretleri', notlar: ['Hasarlı merdiven, iskele veya bağlantı ekipmanını kullanma.', 'Hava koşulu, zemin veya ankraj uygun değilse işe başlama.', 'İşe özgü yüksekte çalışma eğitimini ve yetkili talimatları tamamla.'] },
  ] },
  { bolum: 4, baslik: 'Kapalı alan, kaynak ve özel riskli işler', aciklama: 'İzin, atmosfer ölçümü, gözetim ve özel eğitim gerektiren işleri tanıyın.', sure: 8, slaytlar: [
    { baslik: 'Kapalı alan ciddi tehlike saklayabilir', notlar: ['Oksijen yetersizliği, zehirli gaz veya yanıcı atmosfer fark edilmeyebilir.', 'Görünüşe veya kokuya bakarak alanın güvenli olduğuna karar verme.', 'Giriş, izin, ölçüm, gözetim ve kurtarma planı gerekir.'] },
    { baslik: 'Kaynak ve sıcak çalışma', notlar: ['Kıvılcım, sıcak yüzey, duman ve yangın riski önceden kontrol edilir.', 'Yanıcı malzemeler ve çevredeki kişiler korunur.', 'Yetkilendirme, yangın gözcüsü ve uygun KKD işyeri planına göre sağlanır.'] },
    { baslik: 'Özel ekipman özel yetkinlik ister', notlar: ['Kaldırma, basınçlı sistem ve benzeri ekipmanlar talimatına göre kullanılır.', 'Yetkisiz ayar veya koruyucu iptali yapılmaz.', 'Eğitim ve izin yoksa işi üstlenme; sorumluya danış.'] },
  ] },
  { bolum: 4, baslik: 'Radyasyon, kanserojenler ve kişisel korunma', aciklama: 'Özel maruziyetlerde alan talimatını, süre ve erişim kontrollerini uygulayın.', sure: 7, slaytlar: [
    { baslik: 'Özel maruziyetler tanımlanmalıdır', notlar: ['Radyasyon ve kanserojen maddeler ciddi sağlık etkileri doğurabilir.', 'Riskin türü ve kontrol yöntemi işyerinde uzmanlarca belirlenir.', 'Kaynağı ve alan sınırlarını işaretler ile prosedürlerden öğren.'] },
    { baslik: 'Maruziyeti azaltan kurallar', notlar: ['Yetkisiz alana girme; belirlenen süre ve mesafe kurallarına uy.', 'Kapalı kap, lokal havalandırma ve uygun iş yöntemi kontrollerini bozma.', 'İş için verilen KKD ve ölçüm cihazını talimatına göre kullan.'] },
    { baslik: 'Şüphe, dökülme veya kontrol kaybı', notlar: ['Alanı terk et ve başkalarının girişini güvenli biçimde önle.', 'Maddeyi temizlemeye veya ekipmanı taşımaya çalışma.', 'İşyeri acil prosedürünü uygula ve uzman ekibe haber ver.'] },
  ] },
  { bolum: 4, baslik: 'KKD, güvenli davranış ve işe özel kontrol listesi', aciklama: 'Kişisel koruyucuyu doğru kullanın ve işe başlamadan son güvenlik kontrolü yapın.', sure: 7, slaytlar: [
    { baslik: 'Doğru KKD doğru riske göre seçilir', notlar: ['Risk değerlendirmesi ve işyeri talimatı hangi koruyucunun gerektiğini belirler.', 'Beden uyumu, sağlamlık ve başka ekipmanlarla uyum kontrol edilir.', 'KKD’yi kullanmadan önce üretici ve işyeri talimatını öğren.'] },
    { baslik: 'KKD bakım ve sınırları', notlar: ['Yıpranmış veya hasarlı koruyucuyu kullanma; değişim için bildir.', 'KKD’yi temizle ve belirlenmiş koşullarda sakla.', 'KKD, tehlikeyi kaynağında kontrol etmenin yerine geçmez.'] },
    { baslik: 'İşe başlamadan üç soru', notlar: ['Bu işte beni veya başkasını ne yaralayabilir?', 'Tehlikeyi hangi koruma ve güvenli yöntem kontrol ediyor?', 'Talimat, ekipman veya yetkinlik eksikse kime danışıp işi durduracağım?'] },
    { baslik: 'Genel anlatım, işyeri uygulamasıyla tamamlanır', notlar: ['Eğitim planı işyerinin tehlike sınıfı, faaliyetleri ve çalışanların görevlerine göre uyarlanmalıdır.', 'Bu dijital modül; işe ve işyerine özgü bilgilendirme, gereken uygulama ve özel risk eğitimlerinin yerine geçmez.', 'Eğitim süresi, katılım kaydı ve belgelendirme güncel yönetmelik ile işyeri programına göre yürütülmelidir.'] },
  ] },
]

const bolumler: Bolum[] = bolumAdlari.map((baslik, bolumNo) => ({
  id: `TISG-B${bolumNo + 1}`,
  baslik,
  icerikler: dersler.filter((ders) => ders.bolum === bolumNo).map((ders, dersNo) => {
    const id = `TISG-${String(bolumNo * 4 + dersNo + 1).padStart(2, '0')}`
    const gorsel = image.lessons[bolumNo * 4 + dersNo]
    const slaytlar = ders.slaytlar.map((slayt) => ({ ...slayt, gorsel, gorselAlt: `${ders.baslik} — ${slayt.baslik}` }))
    return {
      id,
      baslik: ders.baslik,
      aciklama: ders.aciklama,
      tur: 'slayt' as const,
      slaytlar,
      zorunlu: true,
      sureDakika: ders.sure,
    } satisfies Icerik
  }),
}))

const soru = (id: string, metin: string, secenekler: string[], dogru: number, aciklama: string): SinavSoru => ({
  id, tur: 'tek', soru: metin, secenekler, dogru: [dogru], puan: 5, aciklama,
})

const temelSorular = [
  soru('TISG4-S01', 'İSG çalışmalarının temel amacı nedir?', ['İşle ilgili yaralanma ve sağlık zararlarını önlemek', 'Yalnızca kaza sonrası işlem yapmak', 'Üretim hızını tek ölçüt yapmak', 'Tüm sorumluluğu çalışana bırakmak'], 0, 'İSG, tehlikeleri önceden kontrol ederek çalışanların sağlık ve güvenliğini korumayı amaçlar.'),
  soru('TISG4-S02', 'Tehlike ve risk ilişkisini en iyi hangi ifade anlatır?', ['Tehlike zarar potansiyelidir; risk olasılık ve olası sonucun birlikte değerlendirilmesidir.', 'İkisi tamamen aynı kavramdır.', 'Risk yalnızca kaza sonrası oluşur.', 'Tehlike sadece KKD eksikliğidir.'], 0, 'Tehlike zarar kaynağıdır; risk bu kaynaktan doğabilecek zararın değerlendirilmesidir.'),
  soru('TISG4-S03', 'Korunma önlemi seçerken ilk olarak ne düşünülmelidir?', ['Tehlikeyi ortadan kaldırma veya kaynağında kontrol etme', 'Sadece uyarı levhası asma', 'Her durumda KKD ile yetinme', 'Çalışanın daha dikkatli olmasını bekleme'], 0, 'Kaynağı ortadan kaldırmak ve toplu/teknik kontroller, KKD’ye güvenmekten önce değerlendirilir.'),
  soru('TISG4-S04', 'Koruyucusu çıkarılmış bir makineyle karşılaştığınızda ne yapmalısınız?', ['Kullanmayıp güvenli biçimde durdurma/bildirim prosedürünü uygulamak', 'Kısa süreli kullanmak', 'Makine çalışırken koruyucu takmak', 'Dikkatli çalışmaya devam etmek'], 0, 'Koruyucusuz ekipman kullanılmamalı, yetkili sorumluya bildirilmelidir.'),
  soru('TISG4-S05', 'Ramak kala olayın bildirilmesi neden yararlıdır?', ['Zarar oluşmadan önce nedenleri bulup tekrar riskini azaltır', 'Yalnızca evrak sayısını artırır', 'Sadece yaralanma olduğunda gerekir', 'Çalışanı cezalandırmayı sağlar'], 0, 'Ramak kala bildirimleri tehlikeleri zarar oluşmadan görmeye yardım eder.'),
  soru('TISG4-S06', 'Kimyasal bir ürünün güvenli kullanım bilgisi için hangisine bakılır?', ['Etiket ve Güvenlik Bilgi Formu (SDS)', 'Vardiya çizelgesi', 'Üretim hedefi', 'Personel listesi'], 0, 'Etiket ve SDS tehlike, korunma, depolama ve acil durum bilgisini verir.'),
  soru('TISG4-S07', 'Kimyasal dökülme gördüğünüzde ilk doğru davranış hangisidir?', ['Alanı güvenli tutup uyarı vermek ve yetkili ekibe haber vermek', 'Maddeyi koklayarak tanımak', 'Çıplak elle temizlemek', 'Başka kaba etiketsiz aktarmak'], 0, 'Yetkisiz müdahale maruziyeti artırabilir; prosedür ve yetkili ekip izlenmelidir.'),
  soru('TISG4-S08', 'Elle taşınacak yük çok ağır veya kontrolsüz görünüyorsa ne yapılmalı?', ['Mekanik yardım veya ekip desteği istemek', 'Görüş kapanmasına rağmen tek başına taşımak', 'Belden dönerek hızlıca kaldırmak', 'Yükü baş üstünde taşımak'], 0, 'Yük, güzergâh ve tutuş uygun değilse yardım/ekipman gerekir.'),
  soru('TISG4-S09', 'Ekranlı çalışmada göz ve beden yorgunluğunu azaltmaya ne yardımcı olur?', ['Uygun iş istasyonu ayarı ve düzenli kısa aralar', 'Ekrana sürekli daha yakından bakmak', 'Aynı pozisyonda uzun süre kalmak', 'Yansımayı artırmak'], 0, 'İş istasyonunu ayarlamak ve pozisyonu düzenli değiştirmek yükü azaltır.'),
  soru('TISG4-S10', 'İşyerindeki biyolojik risklere karşı temel önlem hangisidir?', ['Hijyen ve işe uygun koruyucu talimatlarını uygulamak', 'Kirli ekipmanı ortak kullanmak', 'Eller yıkanmadan yemek yemek', 'Temas şüphesini saklamak'], 0, 'Hijyen, uygun bariyer ve zamanında bildirim maruziyeti azaltır.'),
  soru('TISG4-S11', 'Elektrik panosuna kim müdahale etmelidir?', ['Yetkili ve görevlendirilmiş kişi', 'Her çalışan', 'Ziyaretçi', 'En yakındaki kişi'], 0, 'Elektrik tesisatına yetkisiz müdahale ciddi tehlike oluşturur.'),
  soru('TISG4-S12', 'Yangın alarmı duyulduğunda doğru davranış hangisidir?', ['Belirlenmiş tahliye yolunu izleyip toplanma alanına gitmek', 'Eşyaları toplamak için geri dönmek', 'Asansöre binmek', 'Yangının kaynağını araştırmak'], 0, 'Tahliye planı ve görevlilerin yönlendirmeleri izlenmelidir.'),
  soru('TISG4-S13', 'Yangına müdahale etmek için hangi koşul gerekir?', ['Eğitim, uygun ekipman ve güvenli kaçış koşullarının bulunması', 'Her durumda yangına yaklaşmak', 'Dumanı soluyarak kaynağı bulmak', 'Alarmı ertelemek'], 0, 'Can güvenliği ve tahliye önceliklidir; koşullar uygun değilse müdahale edilmez.'),
  soru('TISG4-S14', 'Güvenlik işaretleri ne sağlar?', ['Tehlike, yasak, zorunluluk veya acil durum hakkında uyarı verir', 'Tüm teknik önlemleri gereksiz kılar', 'Eğitim yerine geçer', 'Arızalı makineyi güvenli yapar'], 0, 'İşaretler bilgi ve yönlendirme sağlar; diğer kontrollerin yerine geçmez.'),
  soru('TISG4-S15', 'KKD nasıl seçilmelidir?', ['İşe ve belirlenen riske uygun, sağlam ve kullanıcıya uyumlu olmalı', 'Her işte aynı model kullanılmalı', 'Hasarlı olsa da kullanılmalı', 'Makine koruyucusunun yerine geçmeli'], 0, 'KKD riske ve kullanıcıya göre seçilir, sağlamlığı ve uyumu kontrol edilir.'),
  soru('TISG4-S16', 'Yüksekte çalışma öncesi hangi yaklaşım doğrudur?', ['Önce güvenli erişim ve toplu korumayı planlamak', 'Hava koşullarını önemsememek', 'Hasarlı merdiveni kullanmak', 'Ankrajı kontrol etmeden işe başlamak'], 0, 'İşe özgü planlama, güvenli erişim ve mümkün olan toplu koruma önce değerlendirilir.'),
  soru('TISG4-S17', 'Kapalı alana girişten önce ne gereklidir?', ['İzin, gerekli ölçüm, gözetim ve kurtarma planının doğrulanması', 'Yalnızca hızlıca içeri bakmak', 'Koku yoksa güvenli saymak', 'Tek başına girmek'], 0, 'Atmosfer tehlikeleri görünmeyebilir; işyeri prosedürü ve yetkili kontrol gerekir.'),
  soru('TISG4-S18', 'Özel risk taşıyan ekipmanla çalışma için ne yapılmalıdır?', ['Eğitim, yetki ve kullanım talimatı doğrulanmalı', 'Koruyucular devre dışı bırakılmalı', 'Kılavuz göz ardı edilmeli', 'Ekipman başkasına bırakılmalı'], 0, 'Özel ekipman doğru yetkinlik ve talimatla kullanılmalıdır.'),
  soru('TISG4-S19', 'Yaralıya yardım etmeden önce hangi noktaya dikkat edilmelidir?', ['Olay yerinin kendisi için güvenli olup olmadığını değerlendirmek', 'Eğitimsiz müdahale yapmak', 'Çevredekileri olay alanına toplamak', 'Acil yardım çağrısını geciktirmek'], 0, 'Önce olay yeri güvenliği sağlanır, yardım çağrılır ve eğitim sınırları korunur.'),
  soru('TISG4-S20', 'Talimatı veya korumayı anlamadığınız bir işe başlamadan ne yapmalısınız?', ['İşi başlatmayıp yetkili kişiden açıklama ve destek almak', 'Tahmin ederek devam etmek', 'Arkadaşını izleyip aynısını yapmak', 'Uyarıyı görmezden gelmek'], 0, 'Güvenli yöntem net değilse işe başlamadan sorumlu kişiye danışılmalıdır.'),
]

const temelSinav: Sinav = {
  id: 'SNV-0104',
  baslik: 'Temel İSG — Eğitim Sonu Sınavı',
  aciklama: 'Eğitimde işlenen başlıklardan hazırlanmış 20 soruluk, açıklamalı bilgi kontrolü.',
  sorular: temelSorular,
  ayarlar: { gecmePuani: 70, sureDakika: 30, denemeHakki: 3, soruKaristir: true, sikKaristir: false, cevaplariGoster: true, aciklamalariGoster: true },
}

const onSinavSorulari = [
  soru('TISG4-ON01', 'İSG’nin amacı aşağıdakilerden hangisidir?', ['İşle ilgili zararları önlemeye yardımcı olmak', 'Yalnızca üretimi hızlandırmak', 'Sadece evrak hazırlamak', 'Kaza olduktan sonra işlem yapmak'], 0, 'Ön sınavdır; bu soru temel farkındalığı ölçer.'),
  soru('TISG4-ON02', 'Yerdeki dökülmüş sıvı neye örnektir?', ['Tehlike kaynağına', 'Tahliye alanına', 'KKD’ye', 'İlk yardım çantasına'], 0, 'Dökülme kayma ve düşme tehlikesi oluşturabilir.'),
  soru('TISG4-ON03', 'Bir iş ekipmanının koruyucusu eksikse ne yaparsınız?', ['Kullanmayıp sorumluya bildiririm', 'Dikkat ederek kullanırım', 'Koruyucuyu sökerim', 'Arızayı saklarım'], 0, 'Koruyucusu eksik ekipman kullanılmamalıdır.'),
  soru('TISG4-ON04', 'Yangın alarmında nereye gidilmelidir?', ['Belirlenmiş toplanma alanına', 'Asansöre', 'Otoparka', 'Eşyaları almaya'], 0, 'Tahliye planı izlenir ve toplanma alanına gidilir.'),
  soru('TISG4-ON05', 'Kimyasal ürünün tehlike bilgisi nerede bulunabilir?', ['Etiketinde ve SDS belgesinde', 'Yemekhane listesinde', 'Vardiya planında', 'Personel kartında'], 0, 'Etiket ve SDS güvenli kullanım hakkında bilgi verir.'),
  soru('TISG4-ON06', 'Hasarlı kişisel koruyucu donanım için ne yapılır?', ['Kullanmayı bırakıp değişim için bildirilir', 'Her durumda kullanılmaya devam edilir', 'Başkasına verilir', 'Tamir edilmeden saklanır'], 0, 'Hasarlı KKD koruma sağlamayabilir; bildirilmelidir.'),
  soru('TISG4-ON07', 'Ramak kala olayda yaralanma yoksa bildirim gerekir mi?', ['Evet, tekrarını önlemeye yardımcı olur', 'Hayır, yalnızca kaza bildirilir', 'Sadece vardiya sonunda', 'Yalnızca ekipman bozulursa'], 0, 'Ramak kala da tehlike hakkında erken uyarıdır.'),
  soru('TISG4-ON08', 'Ağır bir yükü tek başınıza güvenle kaldıramıyorsanız ne yaparsınız?', ['Yardım veya taşıma ekipmanı isterim', 'Hızlıca kaldırırım', 'Görüşüm kapanınca da taşırım', 'Belimden dönerek taşırım'], 0, 'Yük uygun değilse ekip veya mekanik destek gerekir.'),
  soru('TISG4-ON09', 'Elektrik panosuna kim müdahale etmelidir?', ['Yetkili kişi', 'Her çalışan', 'Ziyaretçi', 'Yakındaki herkes'], 0, 'Elektrik tesisatına yetkisiz müdahale edilmez.'),
  soru('TISG4-ON10', 'Bir işi güvenli yapma talimatını anlamadıysanız ne yapmalısınız?', ['İşe başlamadan sorumlu kişiye danışmalıyım', 'Tahmin ederek başlamalıyım', 'Uyarıları yok saymalıyım', 'Başkalarının da başlamasını beklemeliyim'], 0, 'Talimat net değilse açıklama alınmadan işe başlanmamalıdır.'),
]

const onSinav: Sinav = {
  id: 'SNV-0104-ON',
  baslik: 'Temel İSG — Başlangıç Değerlendirmesi',
  aciklama: 'Kolay düzeyde 10 soruluk ön değerlendirme. Sonuç eğitime katılımı veya ilerlemeyi engellemez.',
  sorular: onSinavSorulari,
  ayarlar: { gecmePuani: 0, sureDakika: 0, denemeHakki: 0, soruKaristir: false, sikKaristir: true, cevaplariGoster: false, aciklamalariGoster: false },
}

export const temelIsgSurum4: EgitimSurum = {
  id: 'ES-0104',
  no: 4,
  bolumler,
  sinav: temelSinav,
  onSinav,
  tamamlama: { videoMinYuzde: 90, zorunluBolumlerTumu: true, sinavZorunlu: true, manuelOnay: false },
  durum: 'aktif',
  not: 'Ek-1 konu alanlarına göre 5 bölüm, 20 görselli ders ve açıklamalı 20 soruluk sınavla yeniden oluşturuldu.',
  tarih: TODAY,
}

export { image as temelIsgGorselleri }
