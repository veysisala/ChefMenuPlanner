# MasterChef Planner — Geliştirme ve İyileştirme Önerileri

Projeyi daha iyi hale getirmek için **öncelikli ve uygulanabilir** öneriler. `IYILESTIRME_ONERILERI.md` ve `GELISTIRME_YOL_HARITASI.md` ile birlikte kullanılabilir.

---

## ✅ Zaten Yapılmış Olanlar (referans)

- AI önbellekleme (Püf, Sağlık, Eşleşme vb.) + Yenile butonu  
- Yazdırma (print CSS, menü + alışveriş Yazdır)  
- Klavye kısayolları (M, F, ?, Esc)  
- Onboarding (ilk kullanım turu)  
- Mevsimsel / pazar önceliği (menü ayarlarında)  
- Takvime ekle (.ics indir)  
- Haftalık besin özeti (Takip sekmesi)  
- Şef sohbeti sesli giriş (mikrofon)  
- PWA (manifest.json, theme-color)  
- Erişilebilirlik (aria-label ana butonlarda)  
- ESLint, Prettier, Vitest altyapısı  

---

## 1. Mimari ve Kod Kalitesi

### 1.1 Tek dosyayı bölme (öncelik: yüksek)

**Durum:** ~4000 satırlık tek `MasterChefPlanner.jsx`; bakım ve test zor.

**Öneri (adım adım):**
1. **Sabitler:** `C`, `FOOD_IMGS`, `OGUNLER`, `CUISINES`, `PAZAR_AY` vb. → `src/constants/` (colors, meals, cuisines, pazar.js).
2. **UI bileşenleri:** `Spinner`, `ErrBox`, `GoldBtn`, `ThemeToggle` → `src/components/ui/`.
3. **Sekmeler:** Her tab (MenuTab, KurTab, SaglikTab, ChatTab, TakipTab, …) → `src/tabs/`; App sadece import + `<Suspense>` ile lazy yüklesin.
4. **DishCard:** En büyük bileşen; `src/components/menu/DishCard.jsx` + ortak “lazy AI panel” (Püf/Sağlık/Eşleşme tek pattern).

**Fayda:** Merge çakışması azalır, test ve yeni özellik eklemek kolaylaşır.

### 1.2 DishCard’da tekrarları azaltma

**Durum:** Püf, Sağlık, Eşleşme, Hazırlık, Varyasyon, Tarih, Kimler, İkame için aynı pattern (open, data, loading, loadX).

**Öneri:** Tek hook veya bileşen:
- `useLazyAI({ key: 'puf', prompt: (dish) => '...', parse: (r) => r })` veya  
- `<LazyAIPanel title="Püf Noktaları" fetchKey="puf" dish={dish} />`

**Fayda:** Kod tekrarı ve bundle boyutu düşer.

### 1.3 Global state (Context / Zustand)

**Durum:** `user`, `favorites`, `lists`, `isDark`, `activeTab` App’te ve prop ile derinlere iniyor.

**Öneri:** Tek `AppContext` (veya Zustand):
- `user`, `isGuest`, `favorites`, `lists`, `isDark`, `activeTab` + setter’lar.
- Ayarlar (API key, modallar) isteğe bağlı aynı context veya küçük bir SettingsContext.

**Fayda:** Prop drilling azalır; ileride “favorileri senkronize et” gibi özellikler tek yerden yönetilir.

### 1.4 ESLint hatalarını temizleme

**Durum:** `npm run lint` 70+ uyarı/hata veriyor (kullanılmayan değişkenler, boş bloklar, tırnak kaçışları).

**Öneri:** Önce kritik olanları düzelt: `no-unused-vars`, `no-empty`, `react/no-unescaped-entities` (tırnakları `&quot;` veya `{"\""}` ile değiştir). Uzun vadede `--max-warnings 0` ile yeşil lint hedeflenebilir.

---

## 2. Kullanıcı Deneyimi (UX)

### 2.1 API anahtarı yoksa net mesaj

**Durum:** Anahtar yoksa veya geçersizse AI özellikleri sessizce veya 401 ile düşebiliyor.

**Öneri:** Menü / Kür / Şef sohbeti gibi AI kullanan ekranlarda tek bir net blok:
- “AI özellikleri için API anahtarı gerekli. Ayarlardan girin veya yöneticinize sorun.” + “Ayarlar” butonu.
- Uygulama açık kalsın; sadece AI gerektiren aksiyonlar bu mesajı göstersin.

### 2.2 Alt sekmeleri gruplama

**Durum:** 13+ sekme tek satırda; mobilde kaydırma gerekiyor (zaten “Daha fazla” kısmen var).

**Öneri:** Görünen sekme sayısını 5–6’da sabitle; kalanı “⋮ Daha fazla” menüsünde topla. `BOTTOM_TABS_VISIBLE` ve `showMoreTabs` ile mevcut yapı genişletilebilir.

### 2.3 Yükleme ve hata deneyimi

**Öneri:**
- Menü üretilirken: “Şef menüyü hazırlıyor…”, “Tarifler yazılıyor…” gibi adım mesajları (varsa tüm akışta kullan).
- Her AI hata kutusunda: “Tekrar dene” + kısa “Neden olabilir?” (API anahtarı, ağ, limit).

### 2.4 Erişilebilirlik ilerletme

**Öneri:**
- Form alanlarında `<label htmlFor={id}>` + `id` eşleşmesi.
- Modal açıldığında odak tuşla içeride kalsın (focus trap), kapatınca önceki elemana dönsün.
- Kontrast: `C.muted` / `C.dim` ile WCAG 2.1 AA’ya yakın oranlar.

### 2.5 Global arama

**Öneri:** Üstte veya ayarlar yakınında arama: yemek adı, malzeme, akademi konusu (İbn-i Sina, Ayurveda vb.). Sonuçlar sekmelere göre gruplanabilir. “Zerdeçal nerede geçiyor?” tek tıkla yanıtlanır.

---

## 3. Performans

### 3.1 Sekmeleri lazy yükleme

**Durum:** Tüm tab’ler tek bundle’da; ilk yüklemede hepsi indiriliyor.

**Öneri:** Her tab’i `React.lazy(() => import('./tabs/MenuTab'))` ile yükle; App’te `<Suspense fallback={<Spinner />}>` kullan. İlk açılışta sadece Menü (ve giriş) yüklensin.

### 3.2 Uzun listelerde sanal liste

**Durum:** Favoriler veya yemek listesi çok uzunsa tüm kartlar DOM’da.

**Öneri:** Liste 50+ öğe geçiyorsa `react-window` veya `@tanstack/react-virtual` ile sadece görünen satırları render et.

### 3.3 Görsel optimizasyon

**Öneri:** Menü kartlarındaki görseller varsa lazy load (`loading="lazy"`); PNG/emoji yerine gerekiyorsa WebP; gereksiz re-render’lar için `memo` (zaten bazı yerlerde var, tutarlı kullan).

---

## 4. Yeni Özellikler (kısa / orta vade)

| Özellik | Açıklama | Zorluk |
|--------|----------|--------|
| **Menüyü PDF indir** | Haftalık menüyü jsPDF (veya benzeri) ile PDF olarak indirme. | Orta |
| **Bildirimler** | “Öğle yemeği zamanı”, “Su iç” (Notification API + izin + zaman seçimi). | Orta |
| **Porsiyon ölçekleme** | Tarifte “2 kişi → 4 kişi”; malzeme miktarları çarpanla güncellensin. | Orta |
| **Tahmini maliyet** | Alışveriş listesi için “Yaklaşık 250–350 TL” (AI veya sabit birim fiyat). | Orta |
| **Çoklu dil (i18n)** | Türkçe / İngilizce; `src/locales/tr.json`, `en.json` + dil seçimi. | Orta |
| **Paylaşılabilir menü linki** | “Menüyü paylaş” → kısa ömürlü link (backend/Vercel serverless gerekir). | Yüksek |
| **Diyet tutarlılığı** | Vejetaryen/Keto seçiliyse menüde uymayan yemek varsa uyarı veya AI prompt vurgusu. | Düşük |
| **Geri bildirim** | Ayarlar/footer: “Öneri / hata bildir” (mailto veya Formspree). | Düşük |
| **Sistem teması** | İlk açılışta `prefers-color-scheme` ile dark/light varsayılan. | Düşük |

---

## 5. Altyapı ve Güvenlik

### 5.1 API anahtarı güvenliği

**Öneri:** Production’da anahtar **istemci bundle’ında olmamalı**. Backend proxy (`/api/anthropic-proxy`) ile istekler sunucudan gitsin; istemci sadece kendi session’ını kullansın. Ayarlardaki “API anahtarı gir” sadece geliştirme veya self-host senaryosunda kalsın.

### 5.2 Gerçek backend (orta/uzun vade)

**Öneri:** Kullanıcı, favoriler, listeler için Supabase / Firebase / kendi API. Böylece cihaz değişince veri kaybolmaz; çoklu cihaz senkronu mümkün olur.

### 5.3 Service worker (PWA)

**Durum:** `manifest.json` ve theme-color var; tam offline deneyimi için service worker yok (veya minimal).

**Öneri:** Vite PWA plugin (`vite-plugin-pwa`) ile cache-first stratejisi: shell + son menü/statik sayfalar cache’lensin; API çağrıları network-first.

---

## 6. Test ve Kalite

### 6.1 Birim testleri genişletme

**Öneri:** `src/utils/json.js` testleri var; ekle:
- `anthropic.js`: `getApiKey`, `sanitizeApiKey`, `apiUrl` (mock env).
- `constants.js` veya pazar/meals: sabit yapılarının tutarlı olduğu testler.

### 6.2 Bileşen / entegrasyon testleri

**Öneri:** React Testing Library ile:
- Auth: giriş / misafir / hatalı şifre.
- Menü: mutfak/öğün seçimi, “Menü oluştur” tıklanınca loading.
- Favori ekleme/çıkarma (mock storage).

### 6.3 E2E (isteğe bağlı)

**Öneri:** Playwright veya Cypress ile “giriş yap → menü oluştur → favori ekle” gibi tek akış. CI’da periyodik çalıştırılabilir.

---

## 7. Öncelik Sırası (özet)

| Sıra | Konu | Neden |
|------|------|--------|
| 1 | API anahtarı yoksa net mesaj + Ayarlar linki | Kullanıcı AI’ın neden çalışmadığını anlasın |
| 2 | Alt sekmeleri 5–6 + “Daha fazla” | Mobilde kullanım kolaylaşır |
| 3 | DishCard için ortak lazy AI panel | Tekrar azalır, bakım kolaylaşır |
| 4 | Sabitler + UI bileşenlerini ayrı dosyaya taşıma | Modülerlik ve test |
| 5 | Tab’leri React.lazy ile yükleme | İlk yükleme hızı |
| 6 | AppContext (veya Zustand) | Prop drilling azalır |
| 7 | ESLint hatalarını azaltma | Tutarlı kod, CI’da lint yeşil |
| 8 | PWA service worker (vite-plugin-pwa) | Offline ve “Ana ekrana ekle” deneyimi |
| 9 | Bildirimler (izin + zaman) | Günlük kullanımda hatırlatma |
| 10 | Menü PDF + porsiyon ölçekleme | Kullanıcı talebi yüksek özellikler |

---

## 8. Hemen Uygulanabilecek Küçük İyileştirmeler

- **Sistem teması:** `useEffect` ile `prefers-color-scheme` okuyup ilk `isDark` değerini ona göre ver (kullanıcı henüz seçmemişse).
- **Geri bildirim:** Ayarlar modalında “Öneri / hata bildir” → `mailto:` veya basit form linki.
- **Diyet uyarısı:** Menü sonucunda beslenme tercihi (vejetaryen/vegan/keto) ile karşılaştır; uymayan yemek varsa kısa uyarı metni.
- **Lint:** En azından yeni eklenen dosyalarda `no-unused-vars` ve `no-empty` temizlensin; büyük dosyada parça parça ilerlenebilir.

---

Bu doküman, projeyi adım adım geliştirmek için tek referans olarak kullanılabilir. Belirli bir madde için doğrudan kod değişikliği isterseniz söylemeniz yeterli.
