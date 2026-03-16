// App-level constants (colors, nav, version)
export const C = {
  gold: "#D4A843",
  goldL: "#F0C96A",
  goldDim: "rgba(212,168,67,0.15)",
  borderG: "rgba(212,168,67,0.25)",
  red: "#E05252",
  blue: "#5BA3D0",
  green: "#4CAF7A",
  purple: "#9B7FD4",
  teal: "#2DD4BF",
  orange: "#F97316",
  pink: "#EC4899",
  bg: "var(--bg)",
  card: "var(--card)",
  card2: "var(--card2)",
  border: "var(--border)",
  cream: "var(--cream)",
  muted: "var(--muted)",
  dim: "var(--dim)",
};

export const THEMES=[
  {id:"cream",name:"Sıcak Krem",bg:"#f8f4ef",card:"#fffcf8",text:"#1a1208",muted:"#9a7b5a",border:"#e5ddd4",accent:"#b07020",nav:"#ede8de"},
  {id:"forest",name:"Orman",bg:"#0d1f1a",card:"#122820",text:"#e8f0eb",muted:"#4a8c6a",border:"#1e3a30",accent:"#5dcaa5",nav:"#0a1814"},
  {id:"midnight",name:"Gece Yarısı",bg:"#0f0e0c",card:"#1a1810",text:"#f0ecd8",muted:"#7a6840",border:"#252318",accent:"#d4a843",nav:"#0a0908"},
  {id:"ocean",name:"Okyanus",bg:"#0a1628",card:"#0f1e35",text:"#d8e8f8",muted:"#4a7aaa",border:"#1a2e4a",accent:"#3a9ad9",nav:"#080f1e"},
  {id:"rose",name:"Gül",bg:"#1a0f14",card:"#241620",text:"#f0dce4",muted:"#a06080",border:"#2e1828",accent:"#d4607a",nav:"#140a10"},
  {id:"sage",name:"Adaçayı",bg:"#f2f0ea",card:"#fafaf6",text:"#2a2e24",muted:"#7a8a6a",border:"#ddd8cc",accent:"#5a7a4a",nav:"#e8e6de"},
  {id:"lavender",name:"Lavanta",bg:"#f4f0f8",card:"#fcfaff",text:"#2a2434",muted:"#8a7aa0",border:"#ddd6e8",accent:"#7a5aaa",nav:"#eae4f0"},
  {id:"terracotta",name:"Terracotta",bg:"#f6f0ea",card:"#fffaf5",text:"#2e1e14",muted:"#a07858",border:"#e8ddd4",accent:"#c06030",nav:"#ede4da"},
  {id:"arctic",name:"Kutup",bg:"#f0f4f8",card:"#f8faff",text:"#1a2030",muted:"#6a8aaa",border:"#d8e2ee",accent:"#2a8ac0",nav:"#e4eaf2"},
  {id:"volcanic",name:"Volkan",bg:"#120808",card:"#1e0e0e",text:"#f0dcd8",muted:"#a04a3a",border:"#2e1818",accent:"#e04030",nav:"#0e0606"},
  {id:"moss",name:"Yosun",bg:"#0e1a0e",card:"#142414",text:"#d8f0d8",muted:"#5a8a4a",border:"#1e2e1e",accent:"#60c040",nav:"#0a140a"},
  {id:"amber",name:"Amber",bg:"#1a1408",card:"#241e0e",text:"#f0e8c8",muted:"#a09040",border:"#2e2818",accent:"#e0b020",nav:"#141008"},
  {id:"slate",name:"Kayrak",bg:"#f0f0f0",card:"#fafafa",text:"#1a1a2a",muted:"#7a7a8a",border:"#dddde0",accent:"#4a4a6a",nav:"#e4e4e8"},
  {id:"copper",name:"Bakır",bg:"#140e0a",card:"#1e1610",text:"#f0e0d0",muted:"#a07a5a",border:"#2e2018",accent:"#d08040",nav:"#100a08"},
  {id:"plum",name:"Erik",bg:"#180e1e",card:"#221628",text:"#e8d0f0",muted:"#8a5aa0",border:"#2e1e38",accent:"#b050d0",nav:"#120a18"},
  {id:"sand",name:"Kum",bg:"#f4f0e4",card:"#faf8f0",text:"#2e2a1e",muted:"#9a9070",border:"#e0d8c4",accent:"#a09040",nav:"#eae6d8"},
  {id:"ice",name:"Buz",bg:"#e8f0f4",card:"#f4fafe",text:"#1a2a30",muted:"#5a8a9a",border:"#d0e0e8",accent:"#2aaabe",nav:"#dce8ee"},
  {id:"wine",name:"Şarap",bg:"#1a0a10",card:"#261018",text:"#f0d0d8",muted:"#a04060",border:"#2e1420",accent:"#d03060",nav:"#140810"},
  {id:"olive",name:"Zeytin",bg:"#141408",card:"#1e1e0e",text:"#e8e8c8",muted:"#8a8a40",border:"#28281a",accent:"#a0a030",nav:"#101008"},
  {id:"steel",name:"Çelik",bg:"#101418",card:"#181e24",text:"#d8e0e8",muted:"#6080a0",border:"#202a34",accent:"#4090c0",nav:"#0c1014"},
  {id:"peach",name:"Şeftali",bg:"#f8f0ea",card:"#fff8f2",text:"#2e1e18",muted:"#b08060",border:"#e8dcd4",accent:"#e08050",nav:"#f0e4dc"},
  {id:"cobalt",name:"Kobalt",bg:"#0a0e1e",card:"#101628",text:"#d0d8f0",muted:"#4a60a0",border:"#1a2038",accent:"#3050d0",nav:"#080c18"},
  {id:"mint",name:"Nane",bg:"#eaf6f2",card:"#f4fefa",text:"#1a2e28",muted:"#4a9a80",border:"#d0e8e0",accent:"#20a880",nav:"#deeee8"},
  {id:"charcoal",name:"Kömür",bg:"#141414",card:"#1e1e1e",text:"#e0e0e0",muted:"#6a6a6a",border:"#2a2a2a",accent:"#909090",nav:"#0e0e0e"},
  {id:"honey",name:"Bal",bg:"#f8f2e4",card:"#fefaf0",text:"#2e2410",muted:"#a09050",border:"#e8dcc0",accent:"#c09020",nav:"#eee6d4"},
  {id:"cosmos",name:"Kozmos",bg:"#08080e",card:"#10101a",text:"#e0daf0",muted:"#6a5a8a",border:"#1a1a28",accent:"#8060c0",nav:"#06060a"},
  {id:"cedar",name:"Sedir",bg:"#1a1410",card:"#241e18",text:"#e8dcd0",muted:"#8a7060",border:"#2e2420",accent:"#b08050",nav:"#14100a"},
  {id:"pearl",name:"İnci",bg:"#f4f4f0",card:"#fefefe",text:"#1a1a1e",muted:"#8a8a90",border:"#e0e0dc",accent:"#6a6a70",nav:"#eaeae6"},
  {id:"ruby",name:"Yakut",bg:"#180810",card:"#220e18",text:"#f0d0dc",muted:"#a04868",border:"#2e1420",accent:"#d03058",nav:"#140610"},
  {id:"tundra",name:"Tundra",bg:"#f0f2f4",card:"#f8fafe",text:"#1e2028",muted:"#6a7a8a",border:"#dce0e6",accent:"#4a6a8a",nav:"#e4e8ec"},
  {id:"sunset",name:"Gün Batımı",bg:"#1a100a",card:"#241810",text:"#f0dcc8",muted:"#a07040",border:"#2e2018",accent:"#e08030",nav:"#14100a"},
  {id:"emerald",name:"Zümrüt",bg:"#0a1a14",card:"#10241c",text:"#d0f0e0",muted:"#3a8a60",border:"#183028",accent:"#20c070",nav:"#081410"},
  {id:"parchment",name:"Parşömen",bg:"#f2ece0",card:"#faf6ec",text:"#2a2418",muted:"#8a7a5a",border:"#ddd4c0",accent:"#9a7a3a",nav:"#e8e2d4"},
  {id:"noir",name:"Noir",bg:"#0a0a0a",card:"#141414",text:"#f5efe0",muted:"#666",border:"rgba(255,255,255,0.08)",accent:"#d4a843",nav:"#060606"},
];

export var DEFAULT_THEME_ID="cream";

export function getInitialTheme(){
  try{var s=localStorage.getItem("chef_theme");if(s){var found=THEMES.find(function(t){return t.id===s;});if(found)return found;}}catch(e){}
  return THEMES.find(function(t){return t.id===DEFAULT_THEME_ID;})||THEMES[0];
}

export function nextTheme(current){
  var idx=THEMES.findIndex(function(t){return t.id===current.id;});
  return THEMES[(idx+1)%THEMES.length];
}

export const BOTTOM_TABS = [
  { id: "menu", icon: "🍽️", label: "Yemek" },
  { id: "buzdolabi", icon: "🧊", label: "Buzdolabı" },
  { id: "alisveris", icon: "🛒", label: "Market" },
  { id: "kur", icon: "🍵", label: "Kür" },
  { id: "kan", icon: "🩸", label: "Kan" },
  { id: "vucut", icon: "🫀", label: "Vücut" },
  { id: "oruc", icon: "🌙", label: "Oruç" },
  { id: "saglik", icon: "🌿", label: "Sağlık" },
  { id: "smoothie", icon: "☕", label: "İçecek" },
  { id: "diyet", icon: "🥗", label: "Diyet" },
  { id: "tatli", icon: "🍰", label: "Tatlı" },
  { id: "ekmek", icon: "🍞", label: "Ekmek" },
  { id: "sefdunya", icon: "👨‍🍳", label: "Şefler" },
  { id: "fonktip", icon: "🔬", label: "Takviye" },
  { id: "foto", icon: "📸", label: "Analiz" },
  { id: "takip", icon: "📊", label: "Takip" },
  { id: "favoriler", icon: "❤️", label: "Favoriler" },
  { id: "chat", icon: "💬", label: "Şef" },
  { id: "akademi", icon: "📚", label: "Akademi" },
  { id: "hikaye", icon: "📜", label: "Hikaye" },
  { id: "araclar", icon: "🧰", label: "Araçlar" },
  { id: "network", icon: "🌐", label: "Network" },
  { id: "chefprofil", icon: "👤", label: "Şef Profil" },
  { id: "isler", icon: "💼", label: "İş" },
  { id: "freelance", icon: "🎯", label: "Freelance" },
  { id: "mesajlar", icon: "💬", label: "Mesajlar" },
];

export const BOTTOM_TABS_VISIBLE = 6;
export const APP_VERSION = "4.0.0";
export const CHANGELOG = [
  {
    ver: "4.0.0",
    title: "Chef Network — Profesyonel Şef Platformu",
    items: [
      "Şef Profil: Profesyonel şef profili oluşturma, portfolyo, sertifikalar ve iş geçmişi.",
      "Network: Şef keşfet, takip, grup, işbirliği, sosyal akış ve AI şef keşfi.",
      "İş İlanları: İlan verme, başvuru, başvuru takibi, AI iş keşfi ve yetenek eşleştirme.",
      "Freelance: Hizmet listeleme, rezervasyon, takvim yönetimi ve müşteri değerlendirmeleri.",
      "Mesajlaşma: Şefler arası mesajlaşma, medya paylaşımı ve okundu bildirimi.",
      "Supabase altyapısı: 16 tablo, RLS politikaları, gerçek zamanlı senkronizasyon.",
    ],
  },
  {
    ver: "3.0.0",
    title: "Mega Güncelleme — 20 Yeni Özellik",
    items: [
      "Tarif Ölçekleme: 1-20 kişiye kadar porsiyon ayarlama.",
      "Günün Tarifi + Sürpriz: Her gün farklı tarif ve rastgele dünya yemeği keşfi.",
      "Tarif Koleksiyonları: Kendi yemek defterlerinizi oluşturun.",
      "Global Diyet Filtreleri: Tüm menüye uygulanan beslenme filtresi.",
      "Tarif Puanlama: Favorilerinize 1-5 yıldız verin.",
      "PDF Dışa Aktarma: Tarifleri yazdırılabilir formatta kaydedin.",
      "Hızlı Yemek Kategorileri: 15dk, tek tava, 5 malzeme, meal prep vb.",
      "Buzdolabından Akıllı Menü: Mevcut malzemelerle tarif önerisi.",
      "Akıllı Alışveriş Birleştirme: Birden fazla tarifin malzemelerini birleştirin.",
      "Yemek Günlüğü: Planlanan vs yenen takibi.",
      "Sağlık Skoru (A-E): Her tarife otomatik sağlık puanı.",
      "Tarif Maliyet Hesaplama: Yaklaşık maliyet ve kişi başı fiyat.",
      "Barkod Tarayıcı: Ürün adı ile besin analizi ve sağlık skoru.",
      "Restoran Bulucu: AI destekli bölgesel restoran önerileri.",
      "Bulanık Arama: Türkçe karakter toleranslı tarif arama.",
      "Fotoğraftan Yemek Tanıma: Kamera ile yemek tanıma.",
      "Mikrobesin Takibi: Vitamin ve mineral detaylı besin analizi.",
      "Kişiselleştirilmiş AI Öneriler: Profilinize göre tarif önerileri.",
      "Konsensüs Tarif: Geleneksel + modern kaynakların en iyi tarifi.",
      "Aile Planlaması: Aile üyelerinin tercihlerine göre menü.",
    ],
  },
  {
    ver: "2.0.0",
    title: "Büyük Güncelleme",
    items: [
      "Haftalık takvim görünümü: Menü sonuçlarını takvim grid'inde gör.",
      "Akıllı menü modu: Malzeme örtüşmesi ile daha kısa alışveriş listesi.",
      "URL'den tarif içe aktarma: Herhangi bir tarif URL'sini yapıştır, AI çıkarsın.",
      "Buzdolabı envanter yönetimi: Kategoriler, SKT takibi, süresi geçen uyarılar.",
      "Market (Alışveriş) sekmesi: Bağımsız alışveriş listesi oluştur ve yönet.",
      "Market reyonlarına göre sıralama: Alışveriş listesi süpermarket rotasına göre sıralanır.",
      "Hedef sistemi: Günlük kalori, makro (protein/karb/yağ/lif) ve su hedefleri belirle.",
      "BMI hesaplayıcı: Vücut kitle indeksi, BMR, ideal kilo ve kilo trendi grafiği.",
      "Birim çevirici: Bardak↔ml, kaşık↔gram, °F↔°C ve malzeme ölçü tablosu.",
      "QR ile tarif paylaşımı: Herhangi bir tarifi QR kod olarak paylaş.",
    ],
  },
  {
    ver: "1.1.0",
    title: "Yenilikler",
    items: [
      "Menü son ayarları otomatik kaydediliyor.",
      "Favoriler boşken Menüye Git butonu.",
      "İlk menü için kısa rehber kartı.",
      "Takip: Bugün dışarıda yediklerim (Kahvaltı/Öğle/Akşam).",
      "Şef sohbetinde Artık yemekten ne yapabilirim? hızlı sorusu.",
      "Alışveriş listesi: Metni kopyala ve Yazdır.",
      "Favoriler ve listeleri JSON olarak dışa aktarabilirsiniz.",
      "Sürüm ve Yenilikler modalı.",
    ],
  },
];
