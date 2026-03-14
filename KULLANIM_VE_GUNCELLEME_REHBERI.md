# Daha İyi Kullanım ve Güncelleme Rehberi

Bu dokümanda uygulamanın **günlük kullanımda daha faydalı** olması için eklenebilecek özellikler ve **güncellemeleri güvenli şekilde nasıl yapacağınız** anlatılıyor. `IYILESTIRME_ONERILERI.md` ve `GELISTIRME_YOL_HARITASI.md` ile birlikte kullanın.

---

## A. Daha faydalı kullanım için eklemeler

### A.1 Akıllı varsayılanlar ve hafıza
- **Son kullanılan ayarlar:** Kişi sayısı, mutfak seçimi, öğün türü, diyet (vejetaryen/keto vb.) bir kez seçildikten sonra `localStorage` veya kullanıcı profiliyle saklansın. Sonraki “Menü oluştur”da bu değerler önceden dolu gelsin.
- **Fayda:** Kullanıcı her seferinde aynı tercihleri tekrar seçmez; tek tıkla menü üretir.

### A.2 Boş ekranlar (empty states)
- **Favoriler boş:** “Henüz favori tarifin yok. Menüden bir yemeğe kalp basarak ekleyebilirsin.” + “Menüye git” butonu.
- **Liste boş:** “Alışveriş listesi henüz yok. Menü oluşturup tariflerden malzeme ekleyebilirsin.”
- **İlk menü:** “Hemen bir haftalık menü oluştur” büyük CTA; altında kısa “Nasıl çalışır?” (3 adım).
- **Fayda:** Yeni kullanıcı ne yapacağını anlar; ekran boş kalmaz.

### A.3 Günlük senaryolar**
- **“Bugün dışarıda yiyorum”:** Takip/plan ekranında belirli öğünü “Atla” veya “Dışarıda” işaretleme; o gün kalori/makro hesabına dahil edilmesin veya “tahmini” olarak işaretlensin.
- **“Artık yemekten yeni tarif”:** “Dünkü tavuk göğsü kaldı; bugün ne yapabilirim?” gibi kısa AI sorusu; 1–2 pratik öneri (çorba, salata, wrap).
- **“Hazırlık günü (meal prep)”:** Pazar/ Cumartesi için “Bu hafta önceden neleri pişirip saklayabilirim?” önerisi; mevcut menüdeki yemeklerden uygun olanları listele (örn. çorba, sos, haşlanmış bakliyat).
- **Fayda:** Uygulama günlük hayata (dışarıda yeme, artık malzeme, toplu hazırlık) daha iyi oturur.

### A.4 Tarif zorluk dengesi
- **Seçenek:** Menü oluştururken “Bu hafta: 2 kolay, 2 orta, 1 özenli” gibi denge seçeneği. AI prompt’una bu kısıtı ekleyin.
- **Fayda:** Hep zor ya da hep kolay tarif çıkmaz; hafta içi pratik, hafta sonu özenli yemek mümkün olur.

### A.5 Alışveriş listesini reyona göre gruplama
- **Öneri:** Listeyi “Meyve-sebze”, “Süt-yoğurt”, “Et-tavuk-balık”, “Bakliyat-makarna”, “Baharat” gibi reyonlara böl. Kullanıcı markette sırayla gezer.
- **Fayda:** Market gezisi kısalır; unutulan ürün azalır.

### A.6 Kişisel not alanı
- **Öneri:** Her tarifte “Notlarım” alanı: “Az tuz kullandım”, “Fırın 180° yeterli oldu” gibi kullanıcı notları. `stSet("note:${dishId}", text)` ile saklanabilir.
- **Fayda:** Aynı tarifi tekrar yaparken kullanıcı kendi deneyimini görür.

### A.7 Su / sıvı hatırlatıcısı
- **Öneri:** Takip veya bildirim sekmesinde isteğe bağlı “Su iç” hatırlatması; saat aralığı kullanıcı seçsin (örn. 2 saatte bir). Mevcut bildirim altyapısı genişletilebilir.
- **Fayda:** Beslenme ile birlikte sıvı alımı da takip edilir.

### A.8 Hedef ve ilerleme (makro / kalori)
- **Öneri:** Ayarlar veya Takip sekmesinde “Günlük hedef kalori” (ve isteğe bağlı protein/karbonhidrat/yağ). Günlük tüketilenler `nutri:` verisinden toplanıp “Hedefin %70’i” gibi basit çubuk veya yüzde gösterilsin.
- **Fayda:** Diyet / kilo hedefi olan kullanıcı tek ekranda ilerlemesini görür.

### A.9 Tutarlı tarif alanları
- **Öneri:** AI’dan dönen tariflerde şu alanlar her zaman aynı formatta olsun: `sure` (dk), `porsiyon`, `kalori`, `malzemeler[]`, `adimlar[]`, `ogun`. Eksikse prompt’ta “Mutlaka doldur” veya istemci tarafında varsayılan (örn. “Süre belirtilmemiş”) gösterin.
- **Fayda:** Filtreleme, sıralama ve “kolay / orta” etiketleme tutarlı çalışır.

### A.10 Çift tıklama / tekrarlı gönderim engelleme
- **Öneri:** “Menü oluştur”, “Kür oluştur”, “Gönder” gibi API tetikleyen butonlarda: tıklanınca buton disable + “İşleniyor…” metni; yanıt gelene veya hataya kadar tekrar tıklanamasın. İsteğe bağlı 2–3 sn debounce.
- **Fayda:** Yanlışlıkla iki kez istek gitmez; API maliyeti ve karışıklık azalır.

---

## B. Güncellemeleri nasıl yapmalı?

### B.1 Kademeli (fazlı) güncelleme
- **Faz 1 (1–2 hafta):** Sadece hata düzeltmeleri ve “API anahtarı yoksa” mesajı, alt sekme gruplaması gibi küçük UX değişiklikleri. Yeni özellik ekleme.
- **Faz 2:** Modülerleştirme: sabitler ve 1–2 bileşen ayrı dosyaya. Her adımda `npm run build` ve manuel bir tur test.
- **Faz 3:** Yeni özellikler tek tek: önce boş ekranlar, sonra akıllı varsayılanlar, sonra porsiyon ölçekleme vb. Her biri ayrı commit/PR.
- **Fayda:** Bir şey bozulursa hangi değişikliğin etkisi olduğu kolay bulunur.

### B.2 Özellik bayrağı (feature flag)
- **Öneri:** Yeni ve riskli özellikler için `localStorage` ile basit bayrak: `feature_yenilikler_modal: true`. Kod içinde `if (localStorage.getItem('feature_xyz') === 'true') { ... }` ile yeni akışı açın. Canlıda başta kapalı; test edip sonra dokümantasyonla veya varsayılanı “açık” yaparak herkese açarsınız.
- **Fayda:** Yeni özelliği hemen herkese vermek zorunda kalmazsınız; sorun olursa bayrağı kapatırsınız.

### B.3 Sürüm ve “Yenilikler” modalı
- **Öneri:** `package.json` version veya sabit bir `APP_VERSION = '1.2.0'`. Uygulama açılışında `localStorage`'daki son görülen sürümla karşılaştırın; sürüm yükseldiyse kısa “Yenilikler” modalı (3–5 madde) gösterin, “Tamam” deyince sürümü kaydedin.
- **Fayda:** Kullanıcı ne değiştiğini bilir; “Uygulama güncellendi” hissi verir.

### B.4 Geri alınamaz değişikliklerden kaçınma
- **Veri:** `stGet`/`stSet` key’lerini değiştirirken eski key’den okuyup yeni key’e taşıyacak tek seferlik bir “migrasyon” yapın; sonra eski key’i kullanmayı bırakın.
- **API:** Anthropic API’de model veya parametre değişikliği yaparken eski davranışı kısa süre destekleyecek fallback yazın (örn. yeni model 404 verirse eski modele dön).
- **Fayda:** Mevcut kullanıcıların verisi veya alışkanlıkları kırılmaz.

### B.5 Basit “daha iyi” metrikleri
- **Takip edilebilecekler (isteğe bağlı):** İlk menü oluşturma süresi (sayfa açıldı → menü geldi), “Menü oluştur” hata oranı, favori ekleme sayısı. Bunlar için önce console.log veya basit bir analytics (privacy-friendly) yeterli.
- **Hedef:** “İlk menü 2 dakikadan kısa sürsün”, “API hata oranı %5’in altında kalsın” gibi kendinize hedef koyun.
- **Fayda:** Güncellemelerin gerçekten iyileştirme getirip getirmediği anlaşılır.

---

## C. Kullanıcı tipine göre iyileştirmeler

### C.1 “Hızlı menü isteyen” (meşgul)
- Tek tıkla menü: Son ayarlarla “Menü oluştur”; kişi sayısı ve gün sayısı varsayılan kalsın.
- Öne çıkan “Hızlı menü” butonu: 2 kişi, 5 gün, karışık mutfak, kolay–orta zorluk.

### C.2 “Diyet / sağlık odaklı”
- Diyet seçimi (vejetaryen, keto, düşük karbonhidrat) her menüde belirgin; oluşan menüde uyumsuz yemek varsa uyarı.
- Takip sekmesinde haftalık makro özeti ve hedefe yakınlık (A.8 ile uyumlu).

### C.3 “Aile ile plan yapan”
- Aile profilleri (alerji, diyet) zaten var; menü oluştururken “Tüm aile profillerine uygun olsun” seçeneği.
- Porsiyon ölçekleme (2 → 4 → 6 kişi) ve alışveriş listesinin buna göre güncellenmesi.

### C.4 “Öğrenmek isteyen”
- Akademi ve “Püf / Sağlık / Tarih” panelleri zaten var; bunlara “Bu konuyu favorilere ekle” veya “Daha sonra oku” listesi eklenebilir.
- İlk kullanımda “Akademi’de İbn-i Sina, Ayurveda gibi konular var” tooltip’i.

---

## D. Özet: Önce ne yapılsın?

| Öncelik | Ne yapılsın? | Neden |
|--------|---------------|--------|
| 1 | API anahtarı yoksa net mesaj + çift tıklama engelleme | Temel kullanım ve güvenilirlik |
| 2 | Son kullanılan ayarları hatırla (akıllı varsayılanlar) | Her seferinde aynı seçimleri yapmaz |
| 3 | Boş ekranlar (favoriler, liste, ilk menü) | Yeni kullanıcı ne yapacağını bilir |
| 4 | “Bugün dışarıda yiyorum” / “Artık yemekten tarif” | Günlük senaryolara uyum |
| 5 | Alışveriş listesi reyona göre + yazdır | Markette pratik kullanım |
| 6 | Güncellemeleri kademeli yap + sürüm / yenilikler modalı | Güvenli ve şeffaf güncelleme |

Bu sırayla ilerlerseniz hem kullanım hem de bakım kolaylaşır. Belirli bir madde için kod seviyesinde adım adım rehber isterseniz söylemeniz yeterli.

---

## E. Ek fikirler (daha fazla değer)

### E.1 Mobil deneyim
- **Dokunma alanları:** Butonlar en az 44x44 px; parmakla rahat tıklansın.
- **Kaydırarak yenile:** Menü veya favoriler listesinde aşağı çekince yenilensin (pull-to-refresh).
- **Paylaşım:** Alışveriş listesi veya menü metnini “WhatsApp’ta paylaş” ile doğrudan WhatsApp’a gidebilecek formatta kopyala (madde işaretli, kısa satırlar).

### E.2 Keşif ve tekrar
- **“Geçen haftaki menüyü tekrarla”:** Son oluşturulan menüyü aynen veya hafif varyasyonla tekrar oluşturma butonu.
- **“Bu hafta denemediğin mutfaklar”:** Sık seçilen mutfaklara göre “Bu hafta Japon / Meksika deneyebilirsin” önerisi.
- **Yerel “kaç kez yapıldı”:** Favori tarifte “Bu tarifi X kez menüne ekledin” (sadece cihazda sayacı artır); güven ve tekrar hissi.

### E.3 Veri güvenliği ve taşınabilirlik
- **Verilerimi dışa aktar:** Tüm favoriler, listeler ve (varsa) menü geçmişi tek JSON dosyası olarak indirilsin. Yedek ve “verim bende” hissi.
- **İçe aktar:** Daha sonra aynı formatta JSON yükleyerek verileri geri yükleme (aynı cihaz veya yeni cihaz).

### E.4 Yardım ve öğrenme
- **Yardım / SSS:** Ayarlar veya footer’da “Sıkça sorulanlar”: “Menü nasıl oluşturulur?”, “API anahtarı nereden alınır?”, “Favoriler nerede saklanıyor?”
- **Şef’e uygulama sorusu:** Chat sekmesinde “Uygulama nasıl kullanılır?” gibi hazır soru butonları; Şef kısa adım adım anlatsın.

### E.5 Erişilebilirlik ve tercihler
- **Yazı boyutu:** Ayarlarda “Küçük / Normal / Büyük” metin; CSS değişkeni ile tüm sayfada uygulansın.
- **Hareketi azalt:** `prefers-reduced-motion: reduce` ile animasyonları kısaltma veya kapatma.

### E.6 Hız ve performans hissi
- **Sekme ön yükleme:** Menü sekmesi açıkken diğer sekmelere hover/focus olunca arka planda o sekmenin modülünü yükle (lazy load ile birlikte); tıklanınca anında açılsın.
- **Menü önizleme:** API yanıtı gelirken ilk günün yemekleri gelir gelmez gösterilsin; diğer günler sırayla dolsun (streaming varsa).

---

## F. Haftalık / aylık güncelleme planı (nasıl ilerleyeceğiniz)

Aşağıdaki plan, “ne zaman ne yapayım?” sorusuna somut cevap verir. Kendi hızınıza göre sıkıştırıp genişletebilirsiniz.

### Hafta 1 – Temel sağlamlık
- [ ] API anahtarı yoksa tek bir net mesaj göster (Menü, Kür, Chat ekranlarında).
- [ ] “Menü oluştur” / “Kür oluştur” / Chat “Gönder” butonlarında çift tıklama engelle (disable + “İşleniyor…”).
- [ ] Build al, manuel test: menü oluştur, favori ekle, bir tab’e gir-çık.

### Hafta 2 – Hatırlama ve boş ekranlar
- [ ] Son kullanılan menü ayarlarını kaydet (kişi sayısı, gün, mutfak, diyet); bir sonraki açılışta formu bunlarla doldur.
- [ ] Favoriler boşken “Henüz favori yok” + “Menüye git” mesajı ve butonu.
- [ ] İlk kez menü oluşturmamış kullanıcı için büyük “Hemen menü oluştur” CTA + 3 adımlık kısa açıklama.

### Hafta 3 – Günlük kullanım
- [ ] Takip veya menü görünümünde “Bu öğünü atla / Dışarıda” işaretleme (veri yapısına alan ekleyip kaydedin).
- [ ] Şef sohbetinde veya ayrı kısa alanda “Artık yemekten ne yapabilirim?” hazır sorusu; AI’dan 1–2 pratik tarif isteyin.

### Hafta 4 – Liste ve çıktı
- [ ] Alışveriş listesini reyona göre grupla (en az 3–4 kategori).
- [ ] Liste sayfasında “Metni kopyala” ve “Yazdır” butonu; yazdırma için `@media print` ile gereksiz UI’ı gizleyin.

### Ay 2 – İsteğe bağlı büyük adımlar
- [ ] Sürüm numarası + “Yenilikler” modalı (ilk açılışta veya sürüm değişince).
- [ ] Porsiyon ölçekleme (2→4 kişi) veya tahmini maliyet (AI veya sabit tablo).
- [ ] Verilerimi dışa aktar (JSON indir).

Her hafta sonunda `npm run build` çalıştırıp en az bir kez uçtan uca test edin. Bir özellik sorun çıkarırsa feature flag ile kapatıp sonra düzeltin.
