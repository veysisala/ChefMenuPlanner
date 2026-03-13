# MasterChef Planner — Geliştirme Yol Haritası

Bu dokümanda projeyi nasıl geliştirebileceğiniz, öncelik sırası ve somut adımlar özetleniyor.

---

## 1. Mimari ve Kod Kalitesi

### 1.1 Tek dosyayı parçalama (modülerleştirme)
Şu an tüm uygulama **~3900 satırlık tek bir JSX** dosyasında. Bu:
- Bakımı zorlaştırır
- Yeniden kullanımı azaltır
- Merge conflict riskini artırır

**Öneri:** Bileşenleri ve modülleri ayrı dosyalara taşıyın.

```
src/
├── main.jsx
├── App.jsx
├── api/
│   ├── anthropic.js      # callAI, callAIStream, callAIVision
│   └── storage.js        # stGet, stSet, localStorage polyfill
├── constants/
│   ├── colors.js
│   ├── cuisines.js
│   ├── meals.js
│   ├── healthSystems.js
│   └── tabs.js
├── utils/
│   ├── json.js            # parseJSON, repairJSON, sanitizeJ
│   └── macros.js
├── components/
│   ├── ui/
│   │   ├── Spinner.jsx
│   │   ├── GoldBtn.jsx
│   │   ├── ErrBox.jsx
│   │   └── ThemeToggle.jsx
│   ├── menu/
│   │   ├── MenuTab.jsx
│   │   ├── DishCard.jsx
│   │   ├── DetailPanel.jsx
│   │   └── ShoppingList.jsx
│   ├── auth/
│   │   └── Auth.jsx
│   └── ...
├── tabs/
│   ├── KurTab.jsx
│   ├── SaglikTab.jsx
│   ├── SmoothieTab.jsx
│   ├── ChatTab.jsx
│   └── ...
└── styles/
    └── theme.js           # makeCSS, C
```

**İlk adım:** Önce `api/` ve `constants/` klasörlerini çıkarın; sonra tek tek tab bileşenlerini taşıyın. Her taşımada uygulamanın çalıştığından emin olun.

### 1.2 API anahtarını güvenli kullanma
Anthropic çağrılarında şu an **API anahtarı gönderilmiyor**; bu yüzden menü üretme, şef sohbeti vb. özellikler 401 alıyor.

**Yapılacaklar:**
1. `.env` dosyası oluşturun (ve `.gitignore`'a ekleyin):
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-...
   ```
2. Tüm `fetch("https://api.anthropic.com/...")` çağrılarında header ekleyin:
   ```js
   headers: {
     "Content-Type": "application/json",
     "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
     "anthropic-version": "2023-06-01"
   }
   ```
3. Anahtar yoksa kullanıcıya “Ayarlardan API anahtarını girin” veya “AI özellikleri kapalı” mesajı gösterin; uygulama yine de çalışsın.

**Not:** `VITE_` ile başlayan değişkenler istemciye gömülür; production’da anahtarı kendi backend proxy’nizden geçirirseniz daha güvenli olur.

### 1.3 State yönetimi
Çok sayıda `useState` tek bir `App` içinde. Favoriler, listeler, kullanıcı, tema vb. birçok yerde kullanılıyor.

**Seçenekler:**
- **Context API:** Küçük ek yük; kullanıcı, tema, favoriler için bir `AppContext` yeterli olabilir.
- **Zustand / Jotai:** Hafif; sadece ihtiyaç duyan bileşenler abone olur.
- Redux şu anki ölçek için gerekli değil.

Önce tek bir `AppContext` (user, isGuest, theme, favorites, setFavorites) ile başlayıp, prop drilling’i azaltmak mantıklı.

---

## 2. Yeni Özellikler

### 2.1 Kısa vadede eklenebilecekler
- **API anahtarını ayarlardan girme:** Ayarlar sekmesi veya modal; anahtar `localStorage` veya sadece session’da tutulabilir (güvenlik için backend tercih edilir).
- **Menüyü PDF/indir:** Haftalık menüyü PDF veya düzenli metin olarak indirme (şu an PNG kart var; PDF eklenebilir).
- **Bildirimler:** “Öğle yemeği zamanı”, “Su iç” gibi tarayıcı bildirimleri (Notification API + izin).
- **PWA:** `manifest.json` + service worker ile “Ana ekrana ekle”, offline basit sayfa.

### 2.2 Orta vadede
- **Gerçek backend:** Kullanıcı/kayıt, favoriler, listeler için basit bir API (örn. Supabase, Firebase veya kendi Node/Go sunucunuz). Böylece cihaz değişince veri kaybolmaz.
- **Çoklu dil:** Türkçe/İngilizce (i18n); metinleri JSON veya modüllere taşıyın.
- **Paylaşılabilir menü linki:** Haftalık menüyü bir link ile paylaşma (backend’de kısa ömürlü kayıt veya şifreli payload).

### 2.3 Uzun vadede
- **Mobil uygulama:** React Native veya Capacitor ile aynı React mantığını mobilde kullanma.
- **Sesli asistan:** “Yarın için öğle yemeği öner” gibi sesli komutlar (mevcut Web Speech API ile genişletilebilir).
- **Market entegrasyonu:** Alışveriş listesini bir market zincirinin online siparişine aktarma (API varsa).

---

## 3. UX / UI İyileştirmeleri

- **Alt sekmeler (bottom tabs):** 13 sekme tek satırda; mobilde kaydırma veya iki satır / “daha fazla” menüsü ile gruplama.
- **Yükleme ve hata durumları:** AI yanıtı gelirken skeleton veya net “Şef düşünüyor…” mesajı; hata durumunda “Tekrar dene” butonu.
- **Erişilebilirlik:** Önemli butonlarda `aria-label`, form alanlarında `label`/`id` eşleşmesi, kontrast oranları (WCAG 2.1).
- **Klavye navigasyonu:** Sekmeler ve modallar arasında Tab/Enter/Escape ile gezinme.
- **Dark/Light tema:** Tercih `localStorage`’da kalıyor; kullanıcı deneyimi iyiyse sistem teması (prefers-color-scheme) ile varsayılan yapılabilir.

---

## 4. Performans

- **Code splitting:** Her tab’i `React.lazy` + `Suspense` ile yükleyin; ilk açılış sadece Menü + giriş ile hızlı olsun.
- **Görseller:** Emoji kullanımı hafif; ileride gerçek görsel kullanırsanız `loading="lazy"` ve uygun boyutlar.
- **Liste uzunluğu:** Favoriler / yemek listesi çok uzunsa sanal liste (react-window / react-virtuoso) ile sadece görünen öğeler render edilsin.

---

## 5. Test ve Kalite

- **Birim testleri:** `utils` (parseJSON, repairJSON) ve API wrapper fonksiyonları için Vitest veya Jest.
- **Bileşen testleri:** Kritik bileşenler (Auth, MenuTab filtreleri) için React Testing Library.
- **E2E (isteğe bağlı):** “Misafir girişi → Menü oluştur → Favorilere ekle” akışı için Playwright.
- **Lint:** ESLint + React kuralları; Prettier ile tutarlı format.

---

## 6. Deployment

- **Build:** `npm run build` → `dist/` çıktısı.
- **Hosting:** Vercel, Netlify, GitHub Pages (SPA için redirect kuralı: `index.html`).
- **Ortam değişkenleri:** Production’da `VITE_ANTHROPIC_API_KEY`’i platformun env ayarlarından verin; anahtarı asla repoya koymayın.

---

## Öncelik Sırası Özeti

| Öncelik | Konu | Neden |
|--------|------|--------|
| 1 | API anahtarını env + header’da kullanma | AI özelliklerinin çalışması |
| 2 | API ve constants’ı ayrı dosyalara taşıma | Bakım ve güvenlik |
| 3 | Ayarlar ekranı (API key, tema varsayılanı) | Kullanıcı kontrolü |
| 4 | Context ile global state | Prop drilling azaltma |
| 5 | Tab’leri lazy yükleme | İlk yükleme performansı |
| 6 | PWA + bildirimler | Mobil ve günlük kullanım |
| 7 | Backend / kalıcı hesap | Çok cihaz, veri kaybı önleme |

İlk adım olarak **API anahtarını** projeye ekleyip tüm Anthropic çağrılarında kullanmak en hızlı kazanımı sağlar. İsterseniz bir sonraki adımda birlikte env + header değişikliklerini satır satır yapabiliriz.
