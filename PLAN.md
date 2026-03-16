# Chef Network Platform — Entegrasyon Planı

## Genel Mimari Kararı

Mevcut **MasterChefPlanner.jsx** dosyası zaten 7720 satır ve daha fazla büyütmek
sürdürülemez. Bu nedenle Chef Network modülleri **ayrı dosyalarda** yazılacak,
sonra App()'a import edilip sekme olarak eklenecek.

```
MasterChefPlanner.jsx          ← Mevcut (dokunmuyoruz, sadece import + tab ekleme)
src/network/
  ├── ChefNetworkTab.jsx       ← Ana network hub (profil, feed, keşfet)
  ├── ChefProfileTab.jsx       ← Detaylı profil sistemi
  ├── ChefJobsTab.jsx          ← İş ilanları + başvuru
  ├── ChefFreelanceTab.jsx     ← Freelance/booking marketplace
  ├── ChefMessagesTab.jsx      ← Mesajlaşma sistemi
  ├── components/               ← Ortak küçük bileşenler
  │   ├── ChefCard.jsx
  │   ├── PostCard.jsx
  │   ├── JobCard.jsx
  │   ├── BookingCard.jsx
  │   ├── BadgeSystem.jsx
  │   ├── StarRating.jsx
  │   └── ImageUpload.jsx
  └── lib/
      ├── networkDB.js          ← Supabase CRUD fonksiyonları
      └── networkConstants.js   ← Sabitler ve enum'lar
```

## Backend: Supabase

Mevcut `src/lib/supabase.js`, `auth.js`, `storage.js` kullanılacak. Ek tablolar:

### Supabase Tabloları (SQL Migration)

```sql
-- 1. Chef Profiller
CREATE TABLE chef_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  city TEXT,
  country TEXT,
  title TEXT,  -- executive_chef, sous_chef, pastry_chef, line_cook...
  cuisine_specializations TEXT[], -- italian, french, japanese...
  skills TEXT[],  -- pastry, sushi, grill, fermentation...
  experience_years INT DEFAULT 0,
  education JSONB DEFAULT '[]',  -- [{school, year, degree}]
  certifications JSONB DEFAULT '[]',  -- [{name, issuer, year}]
  work_history JSONB DEFAULT '[]',  -- [{place, role, city, country, start, end}]
  signature_dishes JSONB DEFAULT '[]',  -- [{name, photo_url, description}]
  availability TEXT DEFAULT 'none', -- seeking_job, freelance, private_chef, catering, none
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}',
  rating_avg NUMERIC(2,1) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Portfolio (Fotoğraf + Video)
CREATE TABLE chef_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('photo','video','menu','event')),
  title TEXT,
  description TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Social: Posts (Feed)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[],
  post_type TEXT DEFAULT 'general', -- general, recipe, technique, story, question
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Post Yorumları
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Post Beğeniler
CREATE TABLE post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

-- 6. Takip Sistemi
CREATE TABLE follows (
  follower_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 7. Bağlantı İstekleri (Connection)
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

-- 8. Mesajlaşma
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[],
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. İş İlanları
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  job_type TEXT, -- full_time, part_time, contract, seasonal
  category TEXT, -- restaurant, hotel, catering, cruise, private
  cuisine_required TEXT[],
  skills_required TEXT[],
  experience_min INT DEFAULT 0,
  city TEXT,
  country TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'TRY',
  is_active BOOLEAN DEFAULT TRUE,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 10. İş Başvuruları
CREATE TABLE job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied', -- applied, reviewing, interview, accepted, rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- 11. Freelance/Booking Hizmetleri
CREATE TABLE chef_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  service_type TEXT, -- private_chef, catering, cooking_class, event_chef, consultation
  title TEXT,
  description TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  price_currency TEXT DEFAULT 'TRY',
  price_unit TEXT DEFAULT 'event', -- hour, event, person, day
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Booking (Rezervasyon)
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES chef_services(id) ON DELETE CASCADE,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  event_date DATE,
  event_time TIME,
  guest_count INT,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  total_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Değerlendirmeler (Reviews)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  review_type TEXT DEFAULT 'booking', -- booking, collaboration, job
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Gruplar
CREATE TABLE chef_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  description TEXT,
  cover_url TEXT,
  category TEXT, -- technique, cuisine, regional, general
  creator_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES chef_groups(id) ON DELETE CASCADE,
  member_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- admin, moderator, member
  PRIMARY KEY (group_id, member_id)
);

-- 15. Bildirimler
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  type TEXT, -- follow, like, comment, connection, job_application, booking, message
  actor_id UUID REFERENCES chef_profiles(id),
  entity_type TEXT, -- post, job, booking, connection
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Collaboration
CREATE TABLE collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  collab_type TEXT, -- popup, event, recipe, video
  status TEXT DEFAULT 'proposed', -- proposed, active, completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 5 Yeni Sekme — Detaylı Özellik Listesi

### SEKME 1: 🌐 Network (`network` tab) → `ChefNetworkTab.jsx`
Bu ana hub sekmesi. İçinde alt modlar var:

| # | Özellik | Açıklama | Kaynak İlham |
|---|---------|----------|--------------|
| 1 | Chef Feed | Takip ettiklerin paylaşımları (yemek foto, video, teknik, hikaye) | Mastodon feed |
| 2 | Keşfet | Popüler şefler, trend paylaşımlar, öne çıkan portfolyolar | Instagram explore |
| 3 | Chef Arama | İsim, şehir, mutfak, beceri ile arama (fuzzy) | Meilisearch konsepti |
| 4 | Takip/Bağlantı | Follow + Connection request sistemi | LinkedIn |
| 5 | Gruplar | Teknik gruplar (Pastacılık, Sushi, Fermentasyon vb.) | HumHub groups |
| 6 | Forum/Tartışma | Grup içi teknik paylaşım ve tartışmalar | Discourse konsepti |
| 7 | Collaboration | Chef + Chef işbirliği (pop-up, event, ortak tarif) | LinkedIn collab |
| 8 | Post Oluştur | Fotoğraf/video/metin paylaşımı, post_type seçimi | Instagram post |
| 9 | Beğeni/Yorum | Post etkileşim sistemi | Sosyal medya standart |
| 10 | Bildirimler | Takip, beğeni, yorum, mesaj, iş bildirimleri | Novu konsepti |

### SEKME 2: 👤 Profil (`profil` tab) → `ChefProfileTab.jsx`
Detaylı profesyonel profil sayfası:

| # | Özellik | Açıklama |
|---|---------|----------|
| 11 | Temel Bilgiler | İsim, foto, şehir, ülke, biyografi |
| 12 | Profesyonel Ünvan | Executive Chef, Sous Chef, Pastry Chef, Line Cook vb. |
| 13 | Mutfak Uzmanlığı | Türk, Fransız, İtalyan, Japon, Vegan vb. (çoklu seçim) |
| 14 | Beceri Listesi | Pastry, Sushi, Grill, Fermentasyon, Plating vb. |
| 15 | Deneyim Yılı | Slider veya input |
| 16 | Eğitim Geçmişi | Culinary school, kurslar |
| 17 | Sertifikalar | Sertifika adı, kurum, yıl |
| 18 | Çalışma Geçmişi | Restoranlar, oteller, şehirler, ülkeler, roller |
| 19 | Signature Dishes | İmza yemekler (foto + açıklama) |
| 20 | Portfolio Galerisi | Yemek foto/video galerisi, menü örnekleri, etkinlik portfolyosu |
| 21 | Uygunluk Durumu | İş arıyor / Freelance / Private Chef / Catering |
| 22 | Rating & Yorumlar | Ortalama puan, müşteri/restoran yorumları |
| 23 | Badge Sistemi | Top Chef, Michelin Deneyimi, Master Pastry, Verified vb. |
| 24 | Verification | Profil doğrulama işareti |
| 25 | Profil Paylaşma | Profil linki oluşturma |

### SEKME 3: 💼 İş (`isler` tab) → `ChefJobsTab.jsx`
İş ilanları ve başvuru marketplace:

| # | Özellik | Açıklama | Kaynak İlham |
|---|---------|----------|--------------|
| 26 | İlan Listesi | Restoran, otel, catering, cruise ship ilanları | Indeed/Jobskee |
| 27 | İlan Filtreleme | Şehir, ülke, tür, mutfak, deneyim, maaş aralığı | Job board filtre |
| 28 | İlan Detay | Tam açıklama, gereksinimler, maaş, konum | Indeed detay |
| 29 | İş Kategorileri | Restoran / Otel / Catering / Cruise / Private | Sektör bazlı |
| 30 | İlan Oluşturma | Restoran sahipleri ilan verebilir | Hiring dashboard |
| 31 | Online Başvuru | Profil + cover letter ile başvuru | LinkedIn Easy Apply |
| 32 | Başvuru Durumu | applied → reviewing → interview → accepted/rejected | ATS tracking |
| 33 | Aday Filtreleme | İlan sahipleri adayları filtreler | Hiring dashboard |
| 34 | Skill Eşleştirme | AI ile chef skill ↔ iş gereksinimi eşleştirme | AI matching |
| 35 | İlan Kaydetme | İlgilenilen ilanları kaydetme | Indeed saved |
| 36 | CV/Portfolio Gönder | Başvuruyla birlikte portfolio ekleme | |
| 37 | Chef Discovery | AI: "sushi chef istiyorum" → filtreleyip öner | AI recommendation |

### SEKME 4: 🎯 Freelance (`freelance` tab) → `ChefFreelanceTab.jsx`
Freelance hizmet ve booking marketplace:

| # | Özellik | Açıklama | Kaynak İlham |
|---|---------|----------|--------------|
| 38 | Hizmet Listesi | Private chef, catering, cooking class, event chef | Sharetribe |
| 39 | Hizmet Oluşturma | Kendi hizmetini tanımla (fiyat, açıklama, tür) | Freelancer profil |
| 40 | Hizmet Kategorileri | Private Chef / Catering / Cooking Class / Event / Consultation | |
| 41 | Fiyatlandırma | Min-max fiyat, birim (saat/etkinlik/kişi/gün) | |
| 42 | Chef Booking | Tarih seçimi + misafir sayısı + notlar | Sharetribe booking |
| 43 | Booking Durumu | pending → confirmed → completed / cancelled | Booking tracking |
| 44 | Gig System | Spesifik etkinlikler (doğum günü, düğün, private sushi) | Upwork gig |
| 45 | Chef Arama | Hizmet türü, şehir, fiyat aralığı ile arama | Marketplace search |
| 46 | Değerlendirme | Booking sonrası 1-5 yıldız + yorum | Airbnb review |
| 47 | Takvim | Müsaitlik takvimi | Cal.com konsepti |

### SEKME 5: 💬 Mesajlar (`mesajlar` tab) → `ChefMessagesTab.jsx`
Profesyonel mesajlaşma:

| # | Özellik | Açıklama | Kaynak İlham |
|---|---------|----------|--------------|
| 48 | Sohbet Listesi | Aktif konuşmalar listesi | RocketChat |
| 49 | 1:1 Mesajlaşma | Chef ↔ Chef direkt mesaj | DM |
| 50 | Medya Gönderme | Fotoğraf paylaşımı mesajda | Chat standart |
| 51 | Okundu Bilgisi | Mesaj okundu/okunmadı | WhatsApp |
| 52 | Okunmamış Sayacı | Tab üzerinde badge | Bildirim |

## Ek Özellikler (Mevcut Sekmelere Entegre)

| # | Özellik | Nereye | Açıklama |
|---|---------|--------|----------|
| 53 | AI Chef Discovery | Network tab | "Sushi chef bul" → AI filtreler |
| 54 | Skill Graph Görsel | Profil tab | Chef → cuisine/skill/restaurant ilişki grafiği |
| 55 | Chef Karşılaştırma | Network tab | 2 chef'i yan yana karşılaştır |
| 56 | Trend Tarifler | Network feed | En çok paylaşılan tarifler |
| 57 | Haftalık Digest | Bildirimler | Haftalık öne çıkan özet |
| 58 | Chef Ranking | Keşfet | Şehir/ülke bazlı chef sıralaması |
| 59 | İşbirliği Panosu | Network tab | Aktif collab fırsatları |
| 60 | Etkinlik Takvimi | Freelance tab | Yaklaşan food event'ler |
| 61 | Mutfak Hikayeleri | Network feed | Uzun form içerik (blog/makale) |
| 62 | Teknik Paylaşım | Gruplar | Sos teknikleri, fermentasyon ipuçları |
| 63 | Cooking Video | Portfolio | Video galeri desteği |
| 64 | Menü Tasarımı | Portfolio | Menü oluşturma örnekleri |
| 65 | Restoran Projeleri | Portfolio | Geçmiş restoran projeleri |
| 66 | Plating Gallery | Portfolio | Tabak sunum galerisi |
| 67 | Event Portfolio | Portfolio | Etkinlik portfolyosu |

## GitHub Repo'lardan Alınacak Kavramlar

| Repo | Ne Alıyoruz | Nerede Kullanılıyor |
|------|-------------|---------------------|
| **HumHub** | Profil sistemi, grup yapısı, community feed | Network + Profil |
| **Mastodon** | Sosyal feed, takip, timeline algoritması | Network feed |
| **Jobskee** | İş ilanı CRUD, arama, kategori yapısı | İş tab |
| **Sharetribe** | Marketplace listeleme, booking flow, review sistemi | Freelance tab |
| **RocketChat** | Mesaj modeli, konuşma listesi, gerçek zamanlı | Mesajlar tab |
| **Surprise (NicolasHug)** | Collaborative filtering mantığı → AI öneri | Chef Discovery |
| **Meilisearch** | Fuzzy arama konsepti (Supabase FTS ile) | Tüm arama |
| **Discourse** | Forum/tartışma yapısı, threading | Gruplar |
| **Novu** | Bildirim tipleri, bildirim merkezi | Bildirimler |

> **Not:** Bu repo'ların kodunu direkt kopyalamıyoruz. Bunlar farklı dillerde
> (PHP, Ruby, Go). Konseptlerini ve veri modellerini React + Supabase ile
> yeniden implement ediyoruz.

## Teknik Implementasyon Detayları

### Supabase Kullanımı
- **Auth**: Mevcut `src/lib/auth.js` — zaten signUp, signIn, Google OAuth hazır
- **Database**: PostgreSQL tablolar (yukarıdaki SQL)
- **Storage**: Supabase Storage — profil foto, portfolio medya, mesaj ekleri
- **Realtime**: Supabase Realtime — mesajlaşma, bildirimler, feed güncellemeleri
- **RLS**: Row Level Security — her tablo için kullanıcı izolasyonu

### Dosya Yapısı ve Import
```javascript
// MasterChefPlanner.jsx'e eklenecek (sadece 5 satır import + 5 satır tab render)
import ChefNetworkTab from './src/network/ChefNetworkTab.jsx';
import ChefProfileTab from './src/network/ChefProfileTab.jsx';
import ChefJobsTab from './src/network/ChefJobsTab.jsx';
import ChefFreelanceTab from './src/network/ChefFreelanceTab.jsx';
import ChefMessagesTab from './src/network/ChefMessagesTab.jsx';

// App() return içinde:
{activeTab==="network"&&<ChefNetworkTab user={user} />}
{activeTab==="profil"&&<ChefProfileTab user={user} />}
{activeTab==="isler"&&<ChefJobsTab user={user} />}
{activeTab==="freelance"&&<ChefFreelanceTab user={user} />}
{activeTab==="mesajlar"&&<ChefMessagesTab user={user} />}
```

### constants.js'e Eklenecekler
```javascript
// BOTTOM_TABS'a 5 yeni sekme:
{ id: "network", icon: "🌐", label: "Network" },
{ id: "profil", icon: "👤", label: "Profil" },
{ id: "isler", icon: "💼", label: "İş" },
{ id: "freelance", icon: "🎯", label: "Freelance" },
{ id: "mesajlar", icon: "💬", label: "Mesajlar" },
```

### Supabase Dependency
```bash
npm install @supabase/supabase-js
# (zaten package.json'da yok ama supabase.js import ediyor — eklenecek)
```

## Uygulama Sırası

1. **Altyapı**: `src/network/lib/networkDB.js` + `networkConstants.js` + SQL şeması
2. **Profil**: `ChefProfileTab.jsx` — profil CRUD (temel)
3. **Network**: `ChefNetworkTab.jsx` — feed, keşfet, takip, arama
4. **İş**: `ChefJobsTab.jsx` — ilan CRUD, başvuru, filtreleme
5. **Freelance**: `ChefFreelanceTab.jsx` — hizmet, booking, review
6. **Mesajlar**: `ChefMessagesTab.jsx` — konuşma, mesaj, realtime
7. **Entegrasyon**: MasterChefPlanner.jsx'e import + constants.js güncelleme
8. **AI**: Chef Discovery, Skill eşleştirme, öneriler
9. **Build & Test**

## Toplam: 67 Özellik, 5 Yeni Sekme, 16 DB Tablosu
