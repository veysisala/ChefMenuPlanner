// Chef Network Platform — Constants & Enums

export var CHEF_TITLES = [
  { id: "executive_chef", label: "Executive Chef", emoji: "👨‍🍳" },
  { id: "head_chef", label: "Head Chef", emoji: "👨‍🍳" },
  { id: "sous_chef", label: "Sous Chef", emoji: "🧑‍🍳" },
  { id: "pastry_chef", label: "Pastry Chef", emoji: "🧁" },
  { id: "line_cook", label: "Line Cook", emoji: "🍳" },
  { id: "prep_cook", label: "Prep Cook", emoji: "🔪" },
  { id: "saucier", label: "Saucier", emoji: "🥘" },
  { id: "garde_manger", label: "Garde Manger", emoji: "🥗" },
  { id: "rotisseur", label: "Rôtisseur", emoji: "🍖" },
  { id: "poissonnier", label: "Poissonnier", emoji: "🐟" },
  { id: "patissier", label: "Pâtissier", emoji: "🎂" },
  { id: "boulanger", label: "Boulanger", emoji: "🍞" },
  { id: "private_chef", label: "Private Chef", emoji: "🏠" },
  { id: "catering_chef", label: "Catering Chef", emoji: "🎪" },
  { id: "food_stylist", label: "Food Stylist", emoji: "📸" },
  { id: "culinary_instructor", label: "Culinary Instructor", emoji: "📚" },
  { id: "food_consultant", label: "Food Consultant", emoji: "💡" },
  { id: "restaurant_owner", label: "Restaurant Owner", emoji: "🏪" },
];

export var CUISINE_SPECS = [
  { id: "turkish", label: "Türk", emoji: "🫕" },
  { id: "french", label: "Fransız", emoji: "🥐" },
  { id: "italian", label: "İtalyan", emoji: "🍕" },
  { id: "japanese", label: "Japon", emoji: "🍱" },
  { id: "chinese", label: "Çin", emoji: "🥟" },
  { id: "indian", label: "Hint", emoji: "🍛" },
  { id: "thai", label: "Tayland", emoji: "🍲" },
  { id: "korean", label: "Kore", emoji: "🥘" },
  { id: "mexican", label: "Meksika", emoji: "🌮" },
  { id: "spanish", label: "İspanyol", emoji: "🥘" },
  { id: "greek", label: "Yunan", emoji: "🫒" },
  { id: "lebanese", label: "Lübnan", emoji: "🫔" },
  { id: "moroccan", label: "Fas", emoji: "🥘" },
  { id: "american", label: "Amerikan", emoji: "🍔" },
  { id: "brazilian", label: "Brezilya", emoji: "🥩" },
  { id: "persian", label: "İran", emoji: "🍚" },
  { id: "vietnamese", label: "Vietnam", emoji: "🍜" },
  { id: "mediterranean", label: "Akdeniz", emoji: "🐟" },
  { id: "vegan", label: "Vegan", emoji: "🌱" },
  { id: "fusion", label: "Fusion", emoji: "🔮" },
  { id: "molecular", label: "Moleküler", emoji: "🔬" },
  { id: "nordic", label: "İskandinav", emoji: "❄️" },
];

export var CHEF_SKILLS = [
  { id: "pastry", label: "Pastacılık", emoji: "🧁" },
  { id: "sushi", label: "Sushi", emoji: "🍣" },
  { id: "grill", label: "Izgara", emoji: "🔥" },
  { id: "fermentation", label: "Fermentasyon", emoji: "🫙" },
  { id: "baking", label: "Fırıncılık", emoji: "🍞" },
  { id: "plating", label: "Plating/Sunum", emoji: "🎨" },
  { id: "sauce", label: "Sos Yapımı", emoji: "🥄" },
  { id: "butchery", label: "Kasaplık", emoji: "🥩" },
  { id: "seafood", label: "Deniz Ürünleri", emoji: "🦐" },
  { id: "chocolate", label: "Çikolata", emoji: "🍫" },
  { id: "wine_pairing", label: "Şarap Eşleştirme", emoji: "🍷" },
  { id: "menu_design", label: "Menü Tasarımı", emoji: "📋" },
  { id: "food_photography", label: "Yemek Fotoğrafçılığı", emoji: "📸" },
  { id: "cost_control", label: "Maliyet Kontrolü", emoji: "💰" },
  { id: "team_management", label: "Ekip Yönetimi", emoji: "👥" },
  { id: "molecular_gastronomy", label: "Moleküler Gastronomi", emoji: "🔬" },
  { id: "catering", label: "Catering", emoji: "🎪" },
  { id: "vegan_cooking", label: "Vegan Mutfak", emoji: "🌿" },
  { id: "bread_making", label: "Ekmek Yapımı", emoji: "🥖" },
  { id: "ice_cream", label: "Dondurma", emoji: "🍦" },
  { id: "knife_skills", label: "Bıçak Becerileri", emoji: "🔪" },
  { id: "preservation", label: "Konserve/Saklama", emoji: "🫙" },
  { id: "nutrition", label: "Beslenme", emoji: "🥗" },
  { id: "food_safety", label: "Gıda Güvenliği", emoji: "✅" },
];

export var AVAILABILITY_TYPES = [
  { id: "none", label: "Belirtilmemiş", emoji: "⚪", color: "#888" },
  { id: "seeking_job", label: "İş Arıyor", emoji: "🔍", color: "#5BA3D0" },
  { id: "freelance", label: "Freelance", emoji: "💼", color: "#9B7FD4" },
  { id: "private_chef", label: "Private Chef", emoji: "🏠", color: "#4CAF7A" },
  { id: "catering", label: "Catering", emoji: "🎪", color: "#F97316" },
  { id: "not_available", label: "Müsait Değil", emoji: "🔴", color: "#E05252" },
];

export var JOB_TYPES = [
  { id: "full_time", label: "Tam Zamanlı", emoji: "🕐" },
  { id: "part_time", label: "Yarı Zamanlı", emoji: "⏰" },
  { id: "contract", label: "Sözleşmeli", emoji: "📄" },
  { id: "seasonal", label: "Sezonluk", emoji: "🌤️" },
  { id: "internship", label: "Stajyer", emoji: "🎓" },
];

export var JOB_CATEGORIES = [
  { id: "restaurant", label: "Restoran", emoji: "🍽️" },
  { id: "hotel", label: "Otel", emoji: "🏨" },
  { id: "catering", label: "Catering", emoji: "🎪" },
  { id: "cruise", label: "Cruise Ship", emoji: "🚢" },
  { id: "private", label: "Private Chef", emoji: "🏠" },
  { id: "cafe", label: "Kafe/Bistro", emoji: "☕" },
  { id: "bakery", label: "Fırın/Pastane", emoji: "🧁" },
  { id: "food_truck", label: "Food Truck", emoji: "🚚" },
  { id: "school", label: "Okul/Kurum", emoji: "🏫" },
  { id: "hospital", label: "Hastane", emoji: "🏥" },
];

export var APPLICATION_STATUSES = [
  { id: "applied", label: "Başvuruldu", emoji: "📩", color: "#5BA3D0" },
  { id: "reviewing", label: "İnceleniyor", emoji: "👁️", color: "#F59E0B" },
  { id: "interview", label: "Mülakat", emoji: "🤝", color: "#9B7FD4" },
  { id: "accepted", label: "Kabul Edildi", emoji: "✅", color: "#4CAF7A" },
  { id: "rejected", label: "Reddedildi", emoji: "❌", color: "#E05252" },
];

export var SERVICE_TYPES = [
  { id: "private_chef", label: "Private Chef", emoji: "🏠", desc: "Özel yemek hazırlama" },
  { id: "catering", label: "Catering", emoji: "🎪", desc: "Etkinlik yemek servisi" },
  { id: "cooking_class", label: "Cooking Class", emoji: "📚", desc: "Yemek kursu verme" },
  { id: "event_chef", label: "Event Chef", emoji: "🎉", desc: "Etkinlik şefi" },
  { id: "consultation", label: "Danışmanlık", emoji: "💡", desc: "Menü ve mutfak danışmanlığı" },
  { id: "meal_prep", label: "Meal Prep", emoji: "📦", desc: "Haftalık yemek hazırlama" },
  { id: "popup", label: "Pop-up Restaurant", emoji: "🎭", desc: "Geçici restoran deneyimi" },
];

export var PRICE_UNITS = [
  { id: "hour", label: "Saat" },
  { id: "event", label: "Etkinlik" },
  { id: "person", label: "Kişi Başı" },
  { id: "day", label: "Gün" },
  { id: "week", label: "Hafta" },
];

export var BOOKING_STATUSES = [
  { id: "pending", label: "Bekliyor", emoji: "⏳", color: "#F59E0B" },
  { id: "confirmed", label: "Onaylandı", emoji: "✅", color: "#4CAF7A" },
  { id: "completed", label: "Tamamlandı", emoji: "🎉", color: "#5BA3D0" },
  { id: "cancelled", label: "İptal", emoji: "❌", color: "#E05252" },
];

export var POST_TYPES = [
  { id: "general", label: "Genel", emoji: "💬" },
  { id: "recipe", label: "Tarif", emoji: "📖" },
  { id: "technique", label: "Teknik", emoji: "🔬" },
  { id: "story", label: "Hikaye", emoji: "📜" },
  { id: "question", label: "Soru", emoji: "❓" },
  { id: "photo", label: "Fotoğraf", emoji: "📸" },
  { id: "video", label: "Video", emoji: "🎬" },
];

export var CHEF_BADGES = [
  { id: "verified", label: "Doğrulanmış", emoji: "✅", color: "#5BA3D0" },
  { id: "top_chef", label: "Top Chef", emoji: "⭐", color: "#D4A843" },
  { id: "michelin_exp", label: "Michelin Deneyimi", emoji: "🌟", color: "#E05252" },
  { id: "master_pastry", label: "Master Pastry", emoji: "🧁", color: "#EC4899" },
  { id: "master_sushi", label: "Master Sushi", emoji: "🍣", color: "#F97316" },
  { id: "master_grill", label: "Master Grill", emoji: "🔥", color: "#E05252" },
  { id: "rising_star", label: "Rising Star", emoji: "🚀", color: "#9B7FD4" },
  { id: "community_hero", label: "Community Hero", emoji: "🏆", color: "#4CAF7A" },
  { id: "mentor", label: "Mentor", emoji: "🎓", color: "#2DD4BF" },
  { id: "innovator", label: "İnovatör", emoji: "💡", color: "#F59E0B" },
  { id: "world_traveler", label: "Dünya Gezgini", emoji: "🌍", color: "#5BA3D0" },
  { id: "10_years", label: "10+ Yıl Deneyim", emoji: "🏅", color: "#D4A843" },
  { id: "20_years", label: "20+ Yıl Deneyim", emoji: "🎖️", color: "#D4A843" },
];

export var GROUP_CATEGORIES = [
  { id: "technique", label: "Teknik", emoji: "🔬" },
  { id: "cuisine", label: "Mutfak", emoji: "🍽️" },
  { id: "regional", label: "Bölgesel", emoji: "🌍" },
  { id: "career", label: "Kariyer", emoji: "💼" },
  { id: "general", label: "Genel", emoji: "💬" },
];

export var COLLAB_TYPES = [
  { id: "popup", label: "Pop-up Restaurant", emoji: "🎭" },
  { id: "event", label: "Etkinlik", emoji: "🎉" },
  { id: "recipe", label: "Ortak Tarif", emoji: "📖" },
  { id: "video", label: "Video İçerik", emoji: "🎬" },
  { id: "mentorship", label: "Mentörlük", emoji: "🎓" },
];

export var NOTIFICATION_TYPES = {
  follow: { label: "takip etti", emoji: "👤" },
  like: { label: "beğendi", emoji: "❤️" },
  comment: { label: "yorum yaptı", emoji: "💬" },
  connection: { label: "bağlantı isteği", emoji: "🤝" },
  job_application: { label: "başvuru", emoji: "📩" },
  booking: { label: "rezervasyon", emoji: "📅" },
  message: { label: "mesaj", emoji: "✉️" },
  mention: { label: "bahsetti", emoji: "📢" },
};

export var COUNTRIES = [
  "Türkiye","ABD","İngiltere","Fransa","İtalya","İspanya","Almanya","Japonya",
  "Çin","Hindistan","Brezilya","Meksika","Avustralya","Kanada","BAE","Katar",
  "Suudi Arabistan","Güney Kore","Tayland","Vietnam","Endonezya","Yunanistan",
  "Portekiz","Fas","Lübnan","Mısır","İsveç","Norveç","Danimarka","Hollanda",
  "Belçika","İsviçre","Avusturya","Polonya","Rusya","Singapur","Malezya",
];

export var CURRENCIES = [
  { id: "TRY", label: "₺ TRY", symbol: "₺" },
  { id: "USD", label: "$ USD", symbol: "$" },
  { id: "EUR", label: "€ EUR", symbol: "€" },
  { id: "GBP", label: "£ GBP", symbol: "£" },
  { id: "AED", label: "AED", symbol: "د.إ" },
  { id: "SAR", label: "SAR", symbol: "﷼" },
  { id: "JPY", label: "¥ JPY", symbol: "¥" },
];

// Network tab sub-modes
export var NETWORK_MODES = [
  { id: "feed", label: "Akış", emoji: "📰" },
  { id: "discover", label: "Keşfet", emoji: "🔍" },
  { id: "groups", label: "Gruplar", emoji: "👥" },
  { id: "collab", label: "İşbirliği", emoji: "🤝" },
  { id: "notifications", label: "Bildirimler", emoji: "🔔" },
];

// Profile tab sub-modes
export var PROFILE_MODES = [
  { id: "info", label: "Bilgiler", emoji: "📋" },
  { id: "portfolio", label: "Portfolyo", emoji: "🎨" },
  { id: "reviews", label: "Değerlendirmeler", emoji: "⭐" },
  { id: "connections", label: "Bağlantılar", emoji: "🤝" },
];

// Jobs tab sub-modes
export var JOBS_MODES = [
  { id: "browse", label: "İlanlar", emoji: "🔍" },
  { id: "post", label: "İlan Ver", emoji: "📝" },
  { id: "applications", label: "Başvurularım", emoji: "📩" },
  { id: "my_jobs", label: "İlanlarım", emoji: "📋" },
  { id: "discovery", label: "AI Keşif", emoji: "🤖" },
];

// Freelance tab sub-modes
export var FREELANCE_MODES = [
  { id: "browse", label: "Hizmetler", emoji: "🔍" },
  { id: "my_services", label: "Hizmetlerim", emoji: "🎯" },
  { id: "bookings", label: "Rezervasyonlar", emoji: "📅" },
  { id: "calendar", label: "Takvim", emoji: "🗓️" },
];
