# MasterChef Planner — İyileştirme Önerileri

Bu dokümanda programı daha iyi hale getirmek için **somut ve öncelikli** öneriler listeleniyor. `GELISTIRME_YOL_HARITASI.md` ile birlikte kullanılabilir.

---

## 1. Mimari ve Kod Kalitesi

### 1.1 Tek dosyayı parçalama (öncelik: yüksek)
- **Durum:** Tüm uygulama ~3800 satırlık tek `MasterChefPlanner.jsx` içinde; `DishCard` tek başına yüzlerce satır ve 15+ `useState` kullanıyor.
- **Öneri:**
  - Önce **sabitler ve tema** ayrı dosyalara: `src/constants/colors.js`, `cuisines.js`, `meals.js`, `healthSystems.js`, `tabs.js`.
  - Sonra **API + storage** zaten `src/api/` ve `src/utils/` altında; sadece ana dosyada import yolunu kontrol edin.
  - Ardından **bileşenleri** tek tek taşıyın: `Spinner`, `ErrBox`, `GoldBtn`, `TabHeader`, `ThemeToggle` → `src/components/ui/`. `DishCard`, `DetailPanel`, `PisirmeModu` → `src/components/menu/`. Her tab (MenuTab, KurTab, SaglikTab, …) → `src/tabs/`.
- **Fayda:** Merge conflict azalır, test yazmak kolaylaşır, yeni özellik eklemek hızlanır.

### 1.2 DishCard’daki tekrarları azaltma
- **Durum:** Her yemek kartında Püf, Sağlık, Eşleşme, Hazırlık, Varyasyon, Tarih, Kimler, İkame için aynı pattern: `open`, `data`, `loading`, `error` state + `loadX()` fonksiyonu. Bu 8+ kez tekrarlanıyor.
- **Öneri:** Tek bir **“lazy detail” hook** veya küçük bileşen kullanın:
  - Örn. `useLazyAI({ key: 'puf', prompt: (dish) => '...', parse: (r) => r })` gibi bir hook ile tüm bu paneller tek yerden yönetilsin.
  - Veya `<LazyAIPanel title="Püf Noktaları" fetchKey="puf" dish={dish} promptFn={...} />` gibi ortak bir bileşen.
- **Fayda:** Kod tekrarı ve bundle boyutu azalır, bakım kolaylaşır.

### 1.3 Global state (Context / hafif store)
- **Durum:** `user`, `isGuest`, `favorites`, `lists`, `isDark`, `activeTab` vb. ya doğrudan App’te ya da prop ile derinlere iniyor.
- **Öneri:** Tek bir `AppContext` (veya Zustand store) ile:
  - `user`, `setUser`, `isGuest`, `favorites`, `setFavorites`, `lists`, `setLists`, `isDark`, `toggleTheme`, `activeTab`, `setActiveTab`.
  - Ayarlar (API key test, modal) da bu context’e veya ayrı bir küçük context’e alınabilir.
- **Fayda:** Prop drilling azalır, ileride “favorileri senkronize et” gibi özellikler tek yerden yönetilir.

---

## 2. Kullanıcı Deneyimi (UX)

### 2.1 Alt sekmeler (bottom tabs)
- **Durum:** 13 sekme tek satırda; mobilde kaydırma gerekiyor.
- **Öneri:**
  - İlk 5–6 sekme görünsün, kalanı “Daha fazla” (⋮) menüsünde toplayın; veya
  - İki satırlık tab bar (ör. Menü / Kür / Kan / Vücut / Oruç üstte, Nefes / Sağlık / Smoothie / … altta).
- **Fayda:** Ana ekranda daha az kalabalık, erişim daha net.

### 2.2 Yükleme ve hata durumları
- **Durum:** Birçok yerde sadece `Spinner` veya “Yükleniyor…” metni var; bazı AI hatalarında sadece kırmızı kutu.
- **Öneri:**
  - Menü üretilirken: “Şef menüyü hazırlıyor…”, “Tarifler yazılıyor…” gibi adım adım mesajlar (zaten `MenuYuklemeEkrani` var; tüm akışta kullanılabilir).
  - Hata: Her yerde “Tekrar dene” butonu olsun; mümkünse “Neden olabilir?” (API anahtarı, ağ, limit) kısa açıklaması.
- **Fayda:** Kullanıcı ne olduğunu anlar, tekrar denemek için yönlendirilir.

### 2.3 API anahtarı yoksa davranış
- **Durum:** Geliştirme modunda (localhost) ayarlardan anahtar giriliyor; canlıda Vercel env. Anahtar yoksa birçok AI özelliği sessizce veya 401 ile düşüyor.
- **Öneri:**
  - Anahtar yoksa veya geçersizse: Menü/Kür/Şef sohbeti vb. ekranlarda **tek bir net mesaj**: “AI özellikleri için API anahtarı gerekli. Ayarlardan girin veya yöneticinize sorun.” + isteğe bağlı “Ayarlar” linki.
  - Uygulama yine de açılsın; sadece AI gerektiren aksiyonlar bu mesajı göstersin.
- **Fayda:** Kullanıcı neden menü gelmediğini anlar.

### 2.4 Erişilebilirlik (a11y)
- **Öneri:**
  - Önemli butonlarda `aria-label` (örn. “Favorilere ekle”, “Tarifi kapat”).
  - Form alanlarında `<label>` + `htmlFor` / `id` eşleşmesi.
  - Modal açıldığında odak tuşla içeri kilitlensin, kapatınca tekrar dışarı dönsün (focus trap).
  - Kontrast: `C.muted`, `C.dim` ile metinlerin arka planla oranı WCAG 2.1 AA’ya yakın olsun.
- **Fayda:** Klavye ve ekran okuyucu kullanıcıları için kullanılabilirlik artar.

---

## 3. Performans

### 3.1 Code splitting (lazy loading)
- **Durum:** Tüm tab’ler tek bundle’da; ilk yüklemede hepsi indiriliyor.
- **Öneri:**
  - Her tab’i `React.lazy(() => import('./tabs/MenuTab'))` ile yükleyin; `App` içinde `<Suspense fallback={<Spinner />}>` ile sarmalayın.
  - İlk açılışta sadece **Menü** (ve giriş) yüklensin; Kür, Kan, Vücut, Akademi vb. sekmeye tıklanınca yüklensin.
- **Fayda:** İlk sayfa yüklemesi hızlanır, özellikle mobilde.

### 3.2 Liste performansı
- **Durum:** Favoriler veya yemek listesi çok uzunsa tüm kartlar DOM’da.
- **Öneri:** Liste 50+ öğe geçiyorsa `react-window` veya `@tanstack/react-virtual` ile sadece görünen öğeleri render edin.
- **Fayda:** Uzun listelerde scroll ve render süresi düzelir.

### 3.3 AI yanıtlarını önbellekleme
- **Durum:** Aynı yemek için “Püf”, “Sağlık”, “Eşleşme” her açılışta yeniden isteniyor.
- **Öneri:** `stGet`/`stSet` ile örn. `puf:${dishName}` key’inde sonuç saklansın; TTL (örn. 7 gün) veya “Yenile” butonu ile güncellenebilsin.
- **Fayda:** API çağrısı ve maliyet azalır, kullanıcı aynı bilgiyi anında görür.

---

## 4. Test ve Kalite

### 4.1 Birim testleri
- **Öneri:** `src/utils/json.js` (`parseJSON`, `repairJSON`) ve `src/api/anthropic.js` içindeki `getApiKey`, `sanitizeApiKey`, `apiUrl` için Vitest/Jest testleri.
- **Fayda:** JSON parse ve API konfigürasyonu değişince regresyon önlenir.

### 4.2 Bileşen testleri
- **Öneri:** Kritik akışlar için React Testing Library: Auth (giriş / misafir), MenuTab filtreleri (mutfak, öğün seçimi), favori ekleme/çıkarma.
- **Fayda:** Refactor ve yeni özellik eklerken mevcut davranış bozulmaz.

### 4.3 Lint ve format
- **Öneri:** ESLint (React + hooks kuralları) ve Prettier ekleyin; `package.json` scripts: `"lint": "eslint src MasterChefPlanner.jsx"`, `"format": "prettier --write ."`.
- **Fayda:** Tutarlı stil ve potansiyel hatalar (örn. exhaustive deps) yakalanır.

---

## 5. Yeni Özellikler (kısa / orta vadeli)

- **Menüyü PDF indir:** Haftalık menüyü PDF veya düzenli metin olarak indirme (şu an PNG kart var; jsPDF veya benzeri ile PDF eklenebilir).
- **PWA:** `manifest.json` + service worker; “Ana ekrana ekle”, offline basit sayfa (örn. son görüntülenen menü cache’lenebilir).
- **Bildirimler:** Zaten `BildirimPanel` var; öğün saatlerinde “Yemek zamanı” hatırlatması kullanıcıya açık şekilde sunulsun (izin + zaman seçimi).
- **Çoklu dil (i18n):** Türkçe/İngilizce; metinleri `src/locales/tr.json` / `en.json` veya modüllere taşıyıp dil seçimi ekleyin.

---

## 6. Güvenlik ve Deployment

- **API anahtarı:** Canlıda anahtar **asla** istemci bundle’ında olmamalı; Vercel env (`ANTHROPIC_API_KEY` veya `VITE_ANTHROPIC_API_KEY`) + proxy (`api/anthropic-proxy.js`) kullanımı doğru. İstemcide sadece “Test et & Kaydet” localhost’ta kalsın.
- **Ortam değişkenleri:** Production build’de `VITE_*` sadece build zamanında gömülür; runtime’da hassas bilgi göstermeyin.

---

## Öncelik Sırası (özet)

| Sıra | Konu | Neden |
|------|------|--------|
| 1 | API anahtarı yoksa net mesaj + Ayarlar | Kullanıcı AI’ın neden çalışmadığını anlasın |
| 2 | Alt sekmeleri grupla / “Daha fazla” menüsü | Mobilde kullanım kolaylaşır |
| 3 | DishCard için ortak “lazy AI panel” | Tekrar azalır, bakım kolaylaşır |
| 4 | Sabitler + UI bileşenlerini ayrı dosyaya taşıma | Modülerlik ve test |
| 5 | Tab’leri lazy yükleme (React.lazy) | İlk yükleme hızı |
| 6 | AI yanıtlarını cache’leme (stGet/stSet) | Maliyet ve hız |
| 7 | Context (veya Zustand) ile global state | Prop drilling azalır |
| 8 | PWA + bildirimleri öne çıkarma | Mobil ve günlük kullanım |

İlk adım olarak **“API anahtarı yoksa”** mesajını ve **alt sekme gruplamasını** yapmak hem hızlı hem de kullanıcıyı doğrudan etkiler. İsterseniz bir sonraki adımda bu iki madde için doğrudan kod değişikliği önerisi de yazabilirim.

---

## 7. Başka Öneriler

### 7.1 İlk kullanım (onboarding)
- **Öneri:** İlk girişte kısa bir tur veya tooltip'ler: “Menü oluştur” butonu, “Favorilere ekle”, “Şef sohbeti” nedir. İsteğe bağlı “Bir daha gösterme” ile `localStorage`'da saklayın.
- **Fayda:** Yeni kullanıcı ana özellikleri hemen keşfeder.

### 7.2 Global arama
- **Öneri:** Üstte veya Ayarlar yakınında bir arama kutusu: yemek adı, malzeme, akademi konusu (İbn-i Sina, Ayurveda vb.) üzerinden tek yerden arama. Sonuçlar sekmelere göre gruplanabilir.
- **Fayda:** “Zerdeçal nerede geçiyor?”, “Dosha konusu nerede?” gibi sorular tek tıkla yanıtlanır.

### 7.3 Pazar / mevsim vurgusu
- **Durum:** `PAZAR_AY` zaten var; aylık pazarda hangi ürünlerin olduğu bilgisi kullanılıyor.
- **Öneri:** Menü oluştururken “Bu hafta pazarda ne var?” filtresi veya filtrelerin yanında “Mevsimsel / pazar ürünlerine öncelik ver” seçeneği. Rehber sekmesinde “Bu ay pazarda” kartını daha görünür yapın.
- **Fayda:** Mevsimsel beslenme ve pazar alışverişi teşvik edilir.

### 7.4 Alışveriş listesi çıktısı
- **Öneri:** Alışveriş listesini “Metin olarak kopyala”, “Yazdır” (print-friendly CSS) veya “PDF indir” ile dışa aktarma. İsteğe bağlı: kategorilere göre (süt ürünleri, sebze, baharat) veya market reyonuna göre gruplama.
- **Fayda:** Kullanıcı listeyi markette veya başka uygulamada kullanabilir.

### 7.5 Porsiyon ölçekleme
- **Öneri:** Tarif detayında “2 kişi → 4 kişi” gibi porsiyon seçimi; malzeme miktarları otomatik güncellensin (AI’dan gelen miktarlar parse edilip çarpan uygulanabilir veya AI’a “4 kişilik ver” diye tekrar sorulabilir).
- **Fayda:** Aile büyüdüğünde veya tek kişiye indirgendiğinde tarif aynı kalır, sadece miktar değişir.

### 7.6 Haftalık besin özeti
- **Durum:** `nutri:` ile günlük veriler saklanıyor; `buildMemoryCtx` içinde kullanılıyor.
- **Öneri:** Takip sekmesinde veya ayrı bir “Bu hafta özeti” kartı: toplam kalori, ortalama protein/karbonhidrat/yağ, “Hedefine ne kadar yakınsın?” gibi basit bir özet. Görsel olarak küçük çubuklar veya yüzde ile gösterilebilir.
- **Fayda:** Makro takibi yapan kullanıcı tek ekranda haftalık resmi görür.

### 7.7 Tahmini maliyet
- **Öneri:** Menü veya alışveriş listesi için “Tahmini market maliyeti” (AI’dan “Bu listeye göre Türkiye ortalaması tahmini TL” isteyebilir veya sabit birim fiyat tablosu kullanılabilir). “Yaklaşık 250–350 TL” gibi aralık yeterli olabilir.
- **Fayda:** Bütçe planlaması yapan kullanıcıya referans olur.

### 7.8 Takvime ekle
- **Öneri:** “Bu menüyü takvimime ekle” butonu: Google Calendar veya Apple Calendar için .ics indir veya web linki. Seçilen günler için “Öğle: Mercimek çorbası” gibi etkinlikler oluşturulabilir.
- **Fayda:** Menü günlük plana entegre olur.

### 7.9 Yazdırma (print) stilleri
- **Öneri:** Menü ve alışveriş listesi sayfaları için `@media print` CSS: gereksiz navigasyon gizlensin, arka plan beyaz, font okunaklı. “Yazdır” butonu `window.print()` çağırsın.
- **Fayda:** Kullanıcı buzdolabına veya cebe listeyi basabilir.

### 7.10 Geri bildirim
- **Öneri:** Ayarlar veya footer’da “Öneri / hata bildir” linki: mailto veya basit bir form (Formspree, Google Form). İsteğe bağlı: “Bu özellik işime yaradı” / “Bir sorun var” gibi kısa seçenekler.
- **Fayda:** Kullanıcı sesini duyurur; öncelik belirlemede yardımcı olur.

### 7.11 Klavye kısayolları
- **Öneri:** Power user’lar için: `M` → Menü sekmesi, `F` → Favoriler, `?` → Kısayolları göster, `Esc` → Açık modalı kapat. `useEffect` ile `keydown` dinleyip `activeTab` ve modalleri yönetin.
- **Fayda:** Klavye ile hızlı gezinme.

### 7.12 Yenilikler / sürüm notları
- **Öneri:** Yeni sürümde “Yenilikler” badge’i veya ilk girişte “Son güncelleme: PWA eklendi, bildirimler iyileşti…” gibi kısa modal. Versiyon `localStorage`'da saklanıp sadece yeni sürümde gösterilebilir.
- **Fayda:** Kullanıcı ne değiştiğini bilir.

### 7.13 Şef sohbetinde sesli soru
- **Durum:** Pişirme modunda sesli komut ve sesli okuma zaten var.
- **Öneri:** Şef (Chat) sekmesinde “Mikrofon” butonu: kullanıcı sesli soru sorsun, Speech-to-Text ile metne çevrilsin, AI yanıtı yazılı (ve isteğe bağlı sesli) gelsin.
- **Fayda:** Mutfakta elleri meşgulken soru sormak kolaylaşır.

### 7.14 Paylaşılabilir menü linki
- **Öneri:** “Menüyü paylaş” ile haftalık menüyü kısa ömürlü bir linke dönüştürme. Backend’de (örn. Vercel serverless) ID → JSON menü kaydı; link tıklanınca salt okunur menü sayfası açılsın. Link 7 gün sonra geçersiz olabilir.
- **Fayda:** Aile veya arkadaşla menü paylaşımı.

### 7.15 Diyet tutarlılığı
- **Öneri:** Kullanıcı “Vejetaryen” veya “Keto” seçtiyse, oluşan menüde bu diyete uymayan yemek varsa uyarı: “Bu öğünde et var; vejetaryen seçeneği ister misin?” veya AI prompt’una diyet kısıtını daha sıkı vurgulayın.
- **Fayda:** Diyet tercihi menüde tutarlı yansır.
