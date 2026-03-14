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

export const BOTTOM_TABS = [
  { id: "menu", icon: "🍽️", label: "Menü" },
  { id: "kur", icon: "🍵", label: "Kür" },
  { id: "kan", icon: "🩸", label: "Kan" },
  { id: "vucut", icon: "🫀", label: "Vücut" },
  { id: "oruc", icon: "🌙", label: "Oruç" },
  { id: "nefes", icon: "🫁", label: "Nefes" },
  { id: "saglik", icon: "🌿", label: "Sağlık" },
  { id: "smoothie", icon: "🥤", label: "Smoothie" },
  { id: "foto", icon: "📸", label: "Analiz" },
  { id: "takip", icon: "📊", label: "Takip" },
  { id: "favoriler", icon: "❤️", label: "Favoriler" },
  { id: "chat", icon: "💬", label: "Şef" },
  { id: "akademi", icon: "📚", label: "Akademi" },
  { id: "hikaye", icon: "📜", label: "Hikaye" },
];

export const BOTTOM_TABS_VISIBLE = 6;
export const APP_VERSION = "1.1.0";
export const CHANGELOG = [
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
