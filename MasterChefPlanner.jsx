import { useState, useEffect, useRef, memo } from "react";
import { callAI, callAIStream, callAIText, callAIVision, getAnthropicHeaders, apiUrl, sleep, API_BASE } from "./src/api/anthropic.js";
import { parseJSON } from "./src/utils/json.js";
import { C, BOTTOM_TABS, BOTTOM_TABS_VISIBLE, APP_VERSION, CHANGELOG, THEMES, getInitialTheme, nextTheme } from "./src/constants.js";
import ChefNetworkTab from "./src/network/ChefNetworkTab.jsx";
import ChefProfileTab from "./src/network/ChefProfileTab.jsx";
import ChefJobsTab from "./src/network/ChefJobsTab.jsx";
import ChefFreelanceTab from "./src/network/ChefFreelanceTab.jsx";
import ChefMessagesTab from "./src/network/ChefMessagesTab.jsx";

const FOOD_IMGS = {
  kahvalti:{emoji:"🥐",bg:"linear-gradient(135deg,#3D2B1F,#5C3D2E)"},
  ogle:{emoji:"🥗",bg:"linear-gradient(135deg,#1A2E1A,#2D4A2D)"},
  aksam:{emoji:"🍷",bg:"linear-gradient(135deg,#2A1A2E,#3D2A4A)"},
  atistirma:{emoji:"🍿",bg:"linear-gradient(135deg,#2E2A1A,#4A3D1A)"},
  karma:{emoji:"🍽️",bg:"linear-gradient(135deg,#1A1A2E,#2A2A3D)"},
};
const CE={türk:"🫕",fransız:"🥐",italyan:"🍕",yunan:"🫒",ispanyol:"🥘",japon:"🍜",cin:"🥟",hint:"🍛",tayland:"🍲",kore:"🍱",ortadogu:"🧆",akdeniz:"🐟",lubnan:"🫔",fas:"🥘",meksika:"🌮",amerikan:"🍔",brezilya:"🥩"};
const OGUN_COL={"Kahvaltı":"#E8A030","Öğle":C.green,"Akşam Yemeği":C.purple,"Atıştırmalık":"#C96B8A","Karma Menü":C.gold};
const CUISINES=[
  {group:"Avrupa",items:[{id:"türk",l:"Türk"},{id:"fransız",l:"Fransız"},{id:"italyan",l:"İtalyan"},{id:"yunan",l:"Yunan"},{id:"ispanyol",l:"İspanyol"}]},
  {group:"Asya",items:[{id:"japon",l:"Japon"},{id:"cin",l:"Çin"},{id:"hint",l:"Hint"},{id:"tayland",l:"Tayland"},{id:"kore",l:"Kore"}]},
  {group:"Orta Doğu",items:[{id:"ortadogu",l:"Orta Doğu"},{id:"akdeniz",l:"Akdeniz"},{id:"lubnan",l:"Lübnan"},{id:"fas",l:"Fas"}]},
  {group:"Amerika",items:[{id:"meksika",l:"Meksika"},{id:"amerikan",l:"Amerikan"},{id:"brezilya",l:"Brezilya"}]},
];
const OGUNLER=[
  {id:"kahvalti",label:"Kahvaltı",img:FOOD_IMGS.kahvalti},{id:"ogle",label:"Öğle",img:FOOD_IMGS.ogle},
  {id:"aksam",label:"Akşam Yemeği",img:FOOD_IMGS.aksam},{id:"atistirma",label:"Atıştırmalık",img:FOOD_IMGS.atistirma},
  {id:"karma",label:"Karma Menü",img:FOOD_IMGS.karma},
];
const STILLER=[{id:"ev",label:"Ev",emoji:"🏠",desc:"Sıcak"},{id:"fine",label:"Fine Dining",emoji:"🥂",desc:"Michelin"},{id:"sokak",label:"Sokak",emoji:"🛺",desc:"Street"},{id:"fusion",label:"Fusion",emoji:"🔮",desc:"Modern"},{id:"gelenek",label:"Geleneksel",emoji:"🏺",desc:"Klasik"}];
const ZORLUK=[{id:"kolay",label:"Kolay",emoji:"🟢",desc:"30 dk",col:C.green},{id:"orta",label:"Orta",emoji:"🟡",desc:"45-60 dk",col:"#F59E0B"},{id:"ozenli",label:"Özenli",emoji:"🔴",desc:"1 saat+",col:C.red}];
const BESLENME=[{id:"normal",label:"Her Şey",emoji:"🍽️"},{id:"vejet",label:"Vejetaryen",emoji:"🌿"},{id:"vegan",label:"Vegan",emoji:"🌱"},{id:"keto",label:"Keto",emoji:"🥩"},{id:"lowcarb",label:"Low Carb",emoji:"🥦"}];
const KISI_OPT=[1,2,3,4,5,6,7,8,10,12,15,20];
const BAHARAT=[{id:"az",label:"Az",emoji:"🌿",col:C.green},{id:"orta",label:"Orta",emoji:"🌶️",col:"#F59E0B"},{id:"bol",label:"Bol",emoji:"🔥",col:C.red}];
const ALERJEN=[{id:"glutensiz",label:"Glutensiz",emoji:"🌾"},{id:"sutsuz",label:"Sütsüz",emoji:"🥛"},{id:"yumurtasiz",label:"Yumurtasız",emoji:"🥚"},{id:"findik",label:"Fındıksız",emoji:"🥜"}];
const EKSTRA=[{id:"tatli",label:"Tatlı",emoji:"🍮"},{id:"corba",label:"Çorba",emoji:"🍲"},{id:"salata",label:"Salata",emoji:"🥗"},{id:"meze",label:"Meze",emoji:"🫙"}];
const DENGE=[
  {id:"dengeli",label:"Tamamlayıcı",emoji:"⚖️",col:"#4CAF7A",bg:"rgba(76,175,122,0.08)",br:"rgba(76,175,122,0.45)",desc:"Öğünler birbirini tamamlar, besin çeşitliliği sağlar"},
  {id:"hafif",label:"Kolay Sindirilen",emoji:"🌸",col:"#5BA3D0",bg:"rgba(91,163,208,0.08)",br:"rgba(91,163,208,0.45)",desc:"Mide dostu, hafif pişirme, sindirimi kolay"},
  {id:"gaz_yok",label:"Gaz Yapmayan",emoji:"🚫💨",col:"#9B7FD4",bg:"rgba(155,127,212,0.08)",br:"rgba(155,127,212,0.45)",desc:"Baklagil, lahana, brokoli, soğan azaltılır"},
  {id:"lif_dengeli",label:"Lif Dengeli",emoji:"🌾",col:"#F59E0B",bg:"rgba(245,158,11,0.08)",br:"rgba(245,158,11,0.45)",desc:"Aşırı lif yükü yok, çeşitli öğün dağılımı"},
  {id:"protein_odakli",label:"Protein Ağırlıklı",emoji:"💪",col:"#E05252",bg:"rgba(224,82,82,0.08)",br:"rgba(224,82,82,0.45)",desc:"Her öğünde kaliteli protein, dengeli makro"},
  {id:"anti_inflamatuar",label:"Anti-İnflamatuar",emoji:"🫚",col:"#2DD4BF",bg:"rgba(45,212,191,0.08)",br:"rgba(45,212,191,0.45)",desc:"Zeytinyağı, zerdeçal, omega-3, işlenmemiş"},
];
const IMZA_MUTFAK=[{id:"türk",label:"Türk",emoji:"🫕"},{id:"fransız",label:"Fransız",emoji:"🥐"},{id:"italyan",label:"İtalyan",emoji:"🍕"},{id:"japon",label:"Japon",emoji:"🍜"},{id:"hint",label:"Hint",emoji:"🍛"},{id:"akdeniz",label:"Akdeniz",emoji:"🐟"}];
const PUF_KAT=[{id:"bicak",label:"Bıçak",emoji:"🔪"},{id:"pisirme",label:"Pişirme",emoji:"🔥"},{id:"baharat",label:"Baharat",emoji:"🌶️"},{id:"et",label:"Et",emoji:"🥩"},{id:"balik",label:"Balık",emoji:"🐟"},{id:"hamur",label:"Hamur",emoji:"🍞"},{id:"sebze",label:"Sebze",emoji:"🥦"},{id:"saus",label:"Sos",emoji:"🫙"},{id:"tatli",label:"Tatlı",emoji:"🍮"}];
const SAGLIK_SYS=[
  {id:"sina",label:"İbn-i Sina",emoji:"📜",col:C.gold,sub:"El-Kanun fi't-Tıbb",egitim:[{baslik:"Dört Hümor Teorisi",icerik:"İbn-i Sina'ya göre insan vücudu kan, balgam, sarı safra ve kara safradan oluşan dört temel sıvı ile yönetilir. Bu sıvıların dengesi sağlığı, dengesizliği hastalığı doğurur."},{baslik:"Mizaç (Temperament)",icerik:"Her insanın doğuştan gelen bir mizacı vardır: Sıcak-Kuru (Safraî), Sıcak-Nemli (Demevî), Soğuk-Nemli (Balgamî), Soğuk-Kuru (Sevdavî). Yemek seçimi bu mizaca göre yapılmalıdır."},{baslik:"Gıda İlaçtır",icerik:"'Gıdan ilaç olsun, ilacın gıda olsun.' Doğru besin, doğru zamanda, doğru miktarda tüketildiğinde en güçlü ilaçtır. Hastalık tedavisinde önce diyet değişikliği uygulanır."},{baslik:"Beslenme Tedavisi",icerik:"İbn-i Sina, beslenmeyi tıbbın birinci aracı olarak görür. Bitkisel tedavi ikinci, ilaç ise üçüncü sıradadır. Günümüz bütünsel tıbbının temeli bu anlayışa dayanır."}]},
  {id:"nebevi",label:"Tıbbı Nebevi",emoji:"☪️",col:C.green,sub:"Hz. Peygamber'in Öğretisi",egitim:[{baslik:"Midenin Üçte Biri Prensibi",icerik:"'Mide her hastalığın evidir.' Hz. Peygamber mideyi üçe bölmeyi öğütlemiştir: 1/3 yemek, 1/3 su, 1/3 nefes. Bu prensip modern tıpta da doğrulanmıştır."},{baslik:"Nebevi Şifalı Gıdalar",icerik:"Kur'an ve hadislerde zikredilen şifalı gıdalar: zeytin, bal, hurma, çörekotu, zencefil, sirke ve nar. Bu gıdaların şifası on dört asır önce bildirilmiştir."},{baslik:"Oruç ve Sağlık",icerik:"'Oruç tutunuz, sağlıklı olursunuz.' Modern tıp, aralıklı oruçlanmanın metabolizma, bağışıklık ve beyin sağlığı üzerindeki faydalarını ispatlamaktadır."},{baslik:"Çörekotu (Habbetüssevda)",icerik:"'Ölüm dışında her derde devadır.' Çörekotunun antiviral, antibakteriyal ve antienflamatuvar özellikleri bugün bilimsel olarak doğrulanmıştır."}]},
  {id:"cin",label:"Çin Tıbbı",emoji:"☯️",col:C.red,sub:"Beş Element (5000 yıllık)",egitim:[{baslik:"Beş Element Sistemi",icerik:"Ateş (kalp), Toprak (dalak-mide), Metal (akciğer), Su (böbrek), Ahşap (karaciğer). Her organ bir elemana karşılık gelir ve birbirini destekler."},{baslik:"Yin-Yang Dengesi",icerik:"Gıdalar ısıtıcı (Yang) veya soğutucu (Yin) enerjiye sahiptir. Kışın Yang, yazın Yin gıdalar tercih edilmeli; mevsim ve kişiye göre denge sağlanmalıdır."},{baslik:"Altı Tat",icerik:"Tatlı (dalak besler), Ekşi (karaciğer güçlendirir), Acı (kalp temizler), Tuzlu (böbrek destekler), Keskin (akciğer açar), Buruk (kururuğu giderir)."},{baslik:"Mevsimsel Beslenme",icerik:"İlkbaharda yeşillikler karaciğeri temizler, yazın karpuz böbrekleri serinletir, sonbaharda armut akciğerleri nemlendirir, kışın ceviz böbrekleri güçlendirir."}]},
  {id:"ayurveda",label:"Ayurveda",emoji:"🪷",col:C.orange,sub:"Dosha Dengesi — 5000 Yıllık",egitim:[{baslik:"Üç Dosha",icerik:"Vata (hava+eter: hareket), Pitta (ateş+su: sindirim), Kapha (toprak+su: yapı). Her insan baskın bir dosha ile doğar; beslenme buna göre seçilir."},{baslik:"Agni — Sindirim Ateşi",icerik:"Agni güçlüyse her gıda enerji verir; zayıfsa aynı gıda bile hastalık üretir. Zencefil, karabiber ve trifala Agni'yi ateşleyen en güçlü araçlardır."},{baslik:"Altı Tat (Shad Rasa)",icerik:"Tatlı (Vata-Pitta dengeler), Ekşi (Vata dengeler), Tuzlu (Vata dengeler), Keskin (Kapha azaltır), Acı (Pitta-Kapha azaltır), Buruk (Kapha dengeler)."},{baslik:"Ojas — Yaşam Özü",icerik:"Ojas tüm dokuların özü ve bağışıklığın kaynağıdır. Süt, ghee, hurma, badem, safran Ojas'ı artırır. Stres ve işlenmiş gıdalar ise Ojas'ı tüketir."}]},
];
const ICECEK_KAT=[
  {id:"cay",label:"Çay",emoji:"🍵",col:C.green},
  {id:"kahve",label:"Kahve",emoji:"☕",col:"#8B5E3C"},
  {id:"smoothie",label:"Smoothie",emoji:"🥤",col:C.teal},
  {id:"sicak",label:"Sıcak İçecek",emoji:"🫖",col:C.orange},
  {id:"soguk",label:"Soğuk İçecek",emoji:"🧊",col:C.blue},
  {id:"bitki",label:"Bitkisel Karışım",emoji:"🌿",col:"#2DD4BF"},
  {id:"sifali",label:"Şifalı İçecek",emoji:"💚",col:"#4CAF7A"},
  {id:"geleneksel",label:"Geleneksel",emoji:"🏺",col:C.gold},
  {id:"ulke",label:"Dünya İçecekleri",emoji:"🌍",col:C.purple},
  {id:"detoks",label:"Detoks",emoji:"🧃",col:"#A3E635"},
  {id:"protein",label:"Protein",emoji:"💪",col:C.red},
  {id:"cocuk",label:"Çocuk",emoji:"🧒",col:C.pink}
];
const ICECEK_AMAC=[
  {id:"enerji",label:"Enerji Ver",emoji:"⚡",col:C.orange},
  {id:"rahatlama",label:"Rahatlat",emoji:"🧘",col:C.purple},
  {id:"sindirim",label:"Sindirim",emoji:"🫚",col:C.green},
  {id:"bagisiklik",label:"Bağışıklık",emoji:"🛡️",col:C.teal},
  {id:"guzellik",label:"Cilt & Güzellik",emoji:"✨",col:C.pink},
  {id:"uyku",label:"Uyku Düzeni",emoji:"🌙",col:"#6366F1"},
  {id:"kilo",label:"Kilo Kontrolü",emoji:"⚖️",col:C.blue},
  {id:"odaklanma",label:"Odaklanma",emoji:"🧠",col:"#F59E0B"}
];
const ICECEK_SICAKLIK=[{id:"sicak",label:"Sıcak",emoji:"🔥"},{id:"soguk",label:"Soğuk",emoji:"❄️"},{id:"farketmez",label:"Farketmez",emoji:"🌡️"}];
const ICECEK_ZORLUK=[{id:"kolay",label:"Kolay",emoji:"🟢",col:C.green},{id:"orta",label:"Orta",emoji:"🟡",col:"#F59E0B"},{id:"ozenli",label:"Özenli",emoji:"🔴",col:C.red}];
const DIYET_EKOL=[
  {id:"akdeniz",label:"Akdeniz Diyeti",emoji:"🫒",col:C.teal,desc:"Zeytinyağı, sebze, balık ağırlıklı — kalp dostu"},
  {id:"keto",label:"Ketojenik",emoji:"🥑",col:"#8B5E3C",desc:"Düşük karbonhidrat, yüksek yağ — yağ yakımı"},
  {id:"vegan",label:"Vegan",emoji:"🌱",col:C.green,desc:"Hayvansal ürün yok — bitkisel beslenme"},
  {id:"vejet",label:"Vejetaryen",emoji:"🥬",col:"#4CAF7A",desc:"Etsiz ama süt & yumurta var"},
  {id:"pegan",label:"Pegan",emoji:"🥗",col:"#A3E635",desc:"Paleo + Vegan karışımı — doğal ve bitkisel"},
  {id:"paleo",label:"Paleo",emoji:"🍖",col:C.orange,desc:"Taş devri diyeti — işlenmemiş gıda"},
  {id:"whole30",label:"Whole30",emoji:"🔄",col:C.blue,desc:"30 gün şeker, tahıl, süt ürünü yok"},
  {id:"lowcarb",label:"Low Carb",emoji:"🥦",col:"#2DD4BF",desc:"Düşük karbonhidrat — kan şekeri dengesi"},
  {id:"dash",label:"DASH",emoji:"❤️",col:C.red,desc:"Tansiyon düşürücü — az tuz, bol mineral"},
  {id:"IF",label:"Aralıklı Oruç (IF)",emoji:"⏰",col:C.purple,desc:"16:8 veya 5:2 — yeme penceresi"},
  {id:"flexitarian",label:"Flexitarian",emoji:"🌿",col:"#6366F1",desc:"Esnek vejetaryen — az et, çok sebze"},
  {id:"makrobiyotik",label:"Makrobiyotik",emoji:"☯️",col:C.gold,desc:"Tam tahıl, fermente gıda — yin-yang dengesi"},
  {id:"fodmap",label:"Düşük FODMAP",emoji:"🫃",col:"#F59E0B",desc:"IBS dostu — şişkinlik azaltıcı"},
  {id:"anti_inflamatuar",label:"Anti-İnflamatuar",emoji:"🫚",col:"#E05252",desc:"İltihaplanmayı azaltan gıdalar"},
  {id:"nordic",label:"İskandinav",emoji:"🐟",col:"#5BA3D0",desc:"Tam tahıl, balık, kök sebze — kuzeyli beslenme"},
  {id:"mind",label:"MIND Diyeti",emoji:"🧠",col:C.pink,desc:"Beyin sağlığı — Alzheimer önleyici"},
  {id:"carnivore",label:"Karnivor",emoji:"🥩",col:"#B91C1C",desc:"Sadece hayvansal ürün — sıfır karbonhidrat"},
  {id:"raw",label:"Çiğ Beslenme",emoji:"🥕",col:"#22C55E",desc:"Pişirmeden — enzim ve besin koruması"},
  {id:"alkalin",label:"Alkalin Diyet",emoji:"🍋",col:"#06B6D4",desc:"Asit-baz dengesi — alkali gıdalar ağırlıklı"},
  {id:"zone",label:"Zone Diyeti",emoji:"📐",col:"#7C3AED",desc:"40-30-30 oranı — karb-protein-yağ dengesi"},
  {id:"dubrow",label:"Dubrow Diyeti",emoji:"🪞",col:"#EC4899",desc:"Aralıklı oruç + düşük karbonhidrat"},
  {id:"volumetrik",label:"Volumetrik",emoji:"🥣",col:"#14B8A6",desc:"Düşük kalori yoğunluğu — bol hacimli gıda"},
  {id:"ornish",label:"Ornish Diyeti",emoji:"💚",col:"#16A34A",desc:"Çok düşük yağ — kalp hastalığı önleyici"},
  {id:"tlc",label:"TLC Diyeti",emoji:"🫀",col:"#DC2626",desc:"Kolesterol düşürücü — doymuş yağ azaltma"},
  {id:"gaps",label:"GAPS Diyeti",emoji:"🦠",col:"#8B5CF6",desc:"Bağırsak-beyin bağlantısı — otoimmün destek"},
  {id:"bebek_mama",label:"Bebek & Çocuk",emoji:"👶",col:"#F472B6",desc:"Bebek/çocuk beslenme programı"},
  {id:"hamile",label:"Hamilelik Diyeti",emoji:"🤰",col:"#FB923C",desc:"Hamilelik & emzirme dönemi beslenme"},
  {id:"sporcu",label:"Sporcu Diyeti",emoji:"🏋️",col:"#EF4444",desc:"Performans odaklı — egzersiz türüne göre"},
  {id:"diyabet",label:"Diyabet Diyeti",emoji:"💉",col:"#3B82F6",desc:"Kan şekeri yönetimi — glisemik indeks odaklı"},
];
const DIYET_OGUN=[
  {id:"3ogun",label:"3 Öğün",emoji:"🍽️",desc:"Kahvaltı + Öğle + Akşam"},
  {id:"5ogun",label:"5 Öğün",emoji:"🥣",desc:"3 ana + 2 ara öğün"},
  {id:"2ogun",label:"2 Öğün (IF)",emoji:"⏰",desc:"Öğle + Akşam (16:8)"},
  {id:"6ogun",label:"6 Öğün",emoji:"📋",desc:"Sporcu tipi — 3 ana + 3 ara"},
];
const DIYET_HEDEF=[
  {id:"kilo_ver",label:"Kilo Verme",emoji:"⬇️",col:C.green},
  {id:"kilo_al",label:"Kilo Alma",emoji:"⬆️",col:C.orange},
  {id:"koruma",label:"Kilo Koruma",emoji:"⚖️",col:C.blue},
  {id:"kas",label:"Kas Yapma",emoji:"💪",col:C.red},
  {id:"detoks",label:"Detoks",emoji:"🧃",col:C.teal},
  {id:"saglik",label:"Genel Sağlık",emoji:"❤️",col:C.pink},
];
const DIYET_PROTEIN=[
  {id:"etli",label:"Etli",emoji:"🥩"},{id:"tavuk",label:"Tavuk",emoji:"🍗"},{id:"balik",label:"Balıklı",emoji:"🐟"},
  {id:"etsiz",label:"Etsiz",emoji:"🥬"},{id:"yumurta",label:"Yumurtalı",emoji:"🥚"},{id:"karma",label:"Karma",emoji:"🍽️"},
];
const DIYET_KISIT=[
  {id:"glutensiz",label:"Glutensiz",emoji:"🌾"},{id:"sutsuz",label:"Sütsüz",emoji:"🥛"},
  {id:"sekersiz",label:"Şekersiz",emoji:"🚫🍬"},{id:"tuzsuz",label:"Az Tuzlu",emoji:"🧂"},
  {id:"findik",label:"Fındıksız",emoji:"🥜"},{id:"soya",label:"Soyasız",emoji:"🫘"},
];
const DIYET_STIL=[
  {id:"ev",label:"Ev Yemekleri",emoji:"🏠"},{id:"pratik",label:"Pratik",emoji:"⚡"},
  {id:"gurme",label:"Gurme",emoji:"🥂"},{id:"meal_prep",label:"Meal Prep",emoji:"📦"},
];
const DIYET_KALORI=[1200,1400,1600,1800,2000,2200,2500,3000];
const FONK_SORUN=[
  {id:"yorgunluk",label:"Kronik Yorgunluk",emoji:"😴",col:C.purple},
  {id:"sindirim",label:"Sindirim & Bağırsak",emoji:"🫃",col:C.green},
  {id:"inflamasyon",label:"İnflamasyon",emoji:"🔥",col:C.red},
  {id:"bagisiklik",label:"Bağışıklık Zayıflığı",emoji:"🛡️",col:C.teal},
  {id:"stres",label:"Stres & Anksiyete",emoji:"🧠",col:"#6366F1"},
  {id:"uyku",label:"Uyku Bozukluğu",emoji:"🌙",col:"#8B5CF6"},
  {id:"hormon",label:"Hormonal Dengesizlik",emoji:"⚖️",col:C.pink},
  {id:"tiroid",label:"Tiroid Sorunları",emoji:"🦋",col:C.blue},
  {id:"kan_sekeri",label:"Kan Şekeri Dengesi",emoji:"📊",col:"#F59E0B"},
  {id:"eklem",label:"Eklem & Kas Ağrısı",emoji:"🦴",col:C.orange},
  {id:"cilt",label:"Cilt Problemleri",emoji:"✨",col:"#EC4899"},
  {id:"sac",label:"Saç Dökülmesi",emoji:"💇",col:"#8B5E3C"},
  {id:"demir",label:"Demir Eksikliği",emoji:"🩸",col:C.red},
  {id:"kolesterol",label:"Kolesterol",emoji:"❤️",col:"#E05252"},
  {id:"baş_agrisi",label:"Baş Ağrısı & Migren",emoji:"🤕",col:C.purple},
  {id:"detoks",label:"Detoks & Arınma",emoji:"🧹",col:"#A3E635"},
];
const FONK_TAKVIYE_KAT=[
  {id:"vitamin",label:"Vitaminler",emoji:"💊",col:C.orange},
  {id:"mineral",label:"Mineraller",emoji:"⚗️",col:C.blue},
  {id:"omega",label:"Omega & Yağ Asitleri",emoji:"🐟",col:C.teal},
  {id:"probiyotik",label:"Probiyotik & Prebiyotik",emoji:"🦠",col:C.green},
  {id:"antioksidan",label:"Antioksidanlar",emoji:"🫐",col:C.purple},
  {id:"adaptogen",label:"Adaptogenler",emoji:"🍄",col:"#8B5E3C"},
  {id:"aminoasit",label:"Amino Asitler",emoji:"💪",col:C.red},
  {id:"bitkisel",label:"Bitkisel Ekstraktlar",emoji:"🌿",col:"#4CAF7A"},
  {id:"enzim",label:"Enzimler",emoji:"🧬",col:"#F59E0B"},
  {id:"superfood",label:"Süper Gıdalar",emoji:"🥝",col:C.pink},
];
const FONK_CINSIYET=[{id:"erkek",label:"Erkek",emoji:"🙋‍♂️"},{id:"kadin",label:"Kadın",emoji:"🙋‍♀️"}];
const FONK_YAS=[{id:"18_25",label:"18-25"},{id:"26_35",label:"26-35"},{id:"36_45",label:"36-45"},{id:"46_55",label:"46-55"},{id:"56_65",label:"56-65"},{id:"65_plus",label:"65+"}];
const FONK_KRONIK=[
  {id:"diyabet",label:"Diyabet",emoji:"💉"},{id:"tansiyon",label:"Tansiyon",emoji:"❤️"},
  {id:"tiroid",label:"Tiroid",emoji:"🦋"},{id:"ibs",label:"IBS",emoji:"🫃"},
  {id:"astim",label:"Astım & Alerji",emoji:"🌬️"},{id:"otoimmun",label:"Otoimmün",emoji:"🔬"},
  {id:"depresyon",label:"Depresyon",emoji:"🧠"},{id:"osteoporoz",label:"Osteoporoz",emoji:"🦴"},
];
const TATLI_KAT=[
  {id:"sutlu",label:"Sütlü Tatlı",emoji:"🍮",col:C.gold},
  {id:"hamur",label:"Hamur Tatlısı",emoji:"🥐",col:C.orange},
  {id:"cikolata",label:"Çikolatalı",emoji:"🍫",col:"#8B5E3C"},
  {id:"meyve",label:"Meyveli Tatlı",emoji:"🍓",col:C.red},
  {id:"dondurma",label:"Dondurma & Sorbe",emoji:"🍦",col:C.blue},
  {id:"kurabiye",label:"Kurabiye & Bisküvi",emoji:"🍪",col:"#F59E0B"},
  {id:"pasta",label:"Pasta & Kek",emoji:"🎂",col:C.pink},
  {id:"baklava",label:"Baklava & Şerbetli",emoji:"🍯",col:C.gold},
  {id:"saglikli",label:"Sağlıklı Tatlı",emoji:"🌿",col:C.green},
  {id:"vegan_t",label:"Vegan Tatlı",emoji:"🌱",col:"#4CAF7A"},
  {id:"glutensiz_t",label:"Glutensiz",emoji:"🌾",col:C.teal},
  {id:"raw_t",label:"Çiğ (Raw)",emoji:"🥜",col:"#A3E635"},
  {id:"turk",label:"Türk Tatlıları",emoji:"🇹🇷",col:C.red},
  {id:"fransiz",label:"Fransız Pâtisserie",emoji:"🇫🇷",col:C.blue},
  {id:"italyan_t",label:"İtalyan Dolci",emoji:"🇮🇹",col:C.green},
  {id:"japon_t",label:"Japon Tatlıları",emoji:"🇯🇵",col:C.pink},
  {id:"ortadogu_t",label:"Orta Doğu",emoji:"🕌",col:C.gold},
  {id:"hint_t",label:"Hint Tatlıları",emoji:"🪷",col:C.orange},
];
const TATLI_MUTFAK=[
  {group:"Avrupa",items:[{id:"turk_m",l:"Türk"},{id:"fransiz_m",l:"Fransız"},{id:"italyan_m",l:"İtalyan"},{id:"avusturya_m",l:"Avusturya"},{id:"ispanyol_m",l:"İspanyol"},{id:"belcika_m",l:"Belçika"}]},
  {group:"Asya",items:[{id:"japon_m",l:"Japon"},{id:"kore_m",l:"Kore"},{id:"hint_m",l:"Hint"},{id:"tayland_m",l:"Tayland"}]},
  {group:"Orta Doğu",items:[{id:"ortadogu_m",l:"Orta Doğu"},{id:"lubnan_m",l:"Lübnan"},{id:"iran_m",l:"İran"}]},
  {group:"Amerika",items:[{id:"amerikan_m",l:"Amerikan"},{id:"meksika_m",l:"Meksika"},{id:"brezilya_m",l:"Brezilya"}]},
];
const TATLI_CE={turk_m:"🇹🇷",fransiz_m:"🇫🇷",italyan_m:"🇮🇹",avusturya_m:"🇦🇹",ispanyol_m:"🇪🇸",belcika_m:"🇧🇪",japon_m:"🇯🇵",kore_m:"🇰🇷",hint_m:"🇮🇳",tayland_m:"🇹🇭",ortadogu_m:"🕌",lubnan_m:"🇱🇧",iran_m:"🇮🇷",amerikan_m:"🇺🇸",meksika_m:"🇲🇽",brezilya_m:"🇧🇷"};
const TATLI_STIL=[{id:"ev",label:"Ev Yapımı",emoji:"🏠",desc:"Kolay"},{id:"pastane",label:"Pastane",emoji:"🧁",desc:"Profesyonel"},{id:"gurme",label:"Gurme",emoji:"🥂",desc:"Fine Dining"},{id:"sokak",label:"Sokak",emoji:"🛺",desc:"Street"},{id:"modern",label:"Modern",emoji:"🔮",desc:"Füzyon"}];
const TATLI_ZORLUK=[{id:"kolay",label:"Kolay",emoji:"🟢",desc:"30 dk",col:C.green},{id:"orta",label:"Orta",emoji:"🟡",desc:"1 saat",col:"#F59E0B"},{id:"ozenli",label:"Özenli",emoji:"🔴",desc:"2 saat+",col:C.red}];
const TATLI_ALERJEN=[{id:"glutensiz",label:"Glutensiz",emoji:"🌾"},{id:"sutsuz",label:"Sütsüz",emoji:"🥛"},{id:"yumurtasiz",label:"Yumurtasız",emoji:"🥚"},{id:"findik",label:"Fındıksız",emoji:"🥜"},{id:"sekersiz",label:"Şekersiz",emoji:"🚫🍬"},{id:"soyasiz",label:"Soyasız",emoji:"🫘"}];
const TATLI_EKSTRA=[{id:"sunum",label:"Özel Sunum",emoji:"🎨"},{id:"cocuk",label:"Çocuk Dostu",emoji:"🧒"},{id:"parti",label:"Parti",emoji:"🎉"},{id:"romantik",label:"Romantik",emoji:"💕"},{id:"bayram",label:"Bayram",emoji:"🎊"},{id:"iftar",label:"İftar",emoji:"🌙"}];
const TATLI_DENGE=[
  {id:"az_seker",label:"Az Şekerli",emoji:"🍬",col:C.green,bg:"rgba(76,175,122,0.08)",br:"rgba(76,175,122,0.45)",desc:"Düşük şeker, doğal tatlandırıcı"},
  {id:"protein_t",label:"Proteinli",emoji:"💪",col:C.red,bg:"rgba(224,82,82,0.08)",br:"rgba(224,82,82,0.45)",desc:"Yüksek protein içerikli tatlılar"},
  {id:"lif_t",label:"Lifli",emoji:"🌾",col:"#F59E0B",bg:"rgba(245,158,11,0.08)",br:"rgba(245,158,11,0.45)",desc:"Tam tahıl, yulaf, lif kaynağı"},
  {id:"hafif_t",label:"Hafif & Light",emoji:"🌸",col:C.blue,bg:"rgba(91,163,208,0.08)",br:"rgba(91,163,208,0.45)",desc:"Düşük kalorili, hafif porsiyon"},
  {id:"superfood",label:"Süper Gıdalı",emoji:"🫐",col:C.purple,bg:"rgba(155,127,212,0.08)",br:"rgba(155,127,212,0.45)",desc:"Chia, açaí, matcha, spirulina"},
  {id:"prebiyotik",label:"Prebiyotik",emoji:"🦠",col:C.teal,bg:"rgba(45,212,191,0.08)",br:"rgba(45,212,191,0.45)",desc:"Bağırsak dostu fermente tatlılar"},
];
const EKMEK_KAT=[
  {id:"beyaz",label:"Beyaz Ekmek",emoji:"🍞",col:C.gold},
  {id:"tam_bugday",label:"Tam Buğday",emoji:"🌾",col:"#A67C52"},
  {id:"cavdar",label:"Çavdar Ekmeği",emoji:"🥖",col:"#8B6914"},
  {id:"eksi_maya",label:"Ekşi Mayalı",emoji:"🧪",col:C.orange},
  {id:"brioche",label:"Brioche",emoji:"🧈",col:"#F5C542"},
  {id:"ciabatta",label:"Ciabatta",emoji:"🇮🇹",col:C.green},
  {id:"baget",label:"Baget / Fransız",emoji:"🥖",col:C.blue},
  {id:"focaccia",label:"Focaccia",emoji:"🫒",col:"#6B8E23"},
  {id:"pide_ekmek",label:"Pide / Lavaş",emoji:"🫓",col:C.red},
  {id:"naan",label:"Naan / Chapati",emoji:"🇮🇳",col:C.orange},
  {id:"tortilla",label:"Tortilla / Wrap",emoji:"🌮",col:"#F59E0B"},
  {id:"pretzel",label:"Pretzel / Simit",emoji:"🥨",col:"#8B5E3C"},
  {id:"glutensiz_e",label:"Glutensiz Ekmek",emoji:"🌿",col:C.teal},
  {id:"kepekli",label:"Kepekli / Lifli",emoji:"🫘",col:"#A3E635"},
  {id:"misir",label:"Mısır Ekmeği",emoji:"🌽",col:"#FFD700"},
  {id:"yulaf",label:"Yulaf Ekmeği",emoji:"🥣",col:"#DEB887"},
  {id:"tatli_ekmek",label:"Tatlı Ekmek / Çörek",emoji:"🧁",col:C.pink},
  {id:"ozel",label:"Özel & Dolgulu",emoji:"🧀",col:C.purple},
];
const EKMEK_MUTFAK=[
  {group:"Avrupa",items:[{id:"turk_e",l:"Türk"},{id:"fransiz_e",l:"Fransız"},{id:"italyan_e",l:"İtalyan"},{id:"alman_e",l:"Alman"},{id:"ispanyol_e",l:"İspanyol"},{id:"iskandinav_e",l:"İskandinav"}]},
  {group:"Asya & Orta Doğu",items:[{id:"hint_e",l:"Hint"},{id:"ortadogu_e",l:"Orta Doğu"},{id:"kafkas_e",l:"Kafkas"},{id:"orta_asya_e",l:"Orta Asya"}]},
  {group:"Amerika",items:[{id:"amerikan_e",l:"Amerikan"},{id:"meksika_e",l:"Meksika"},{id:"guney_amerika_e",l:"Güney Amerika"}]},
];
const EKMEK_CE={turk_e:"🇹🇷",fransiz_e:"🇫🇷",italyan_e:"🇮🇹",alman_e:"🇩🇪",ispanyol_e:"🇪🇸",iskandinav_e:"🇸🇪",hint_e:"🇮🇳",ortadogu_e:"🕌",kafkas_e:"🏔️",orta_asya_e:"🏜️",amerikan_e:"🇺🇸",meksika_e:"🇲🇽",guney_amerika_e:"🇧🇷"};
const EKMEK_MAYA=[{id:"yas_maya",label:"Yaş Maya",emoji:"🟡",desc:"Hızlı"},{id:"kuru_maya",label:"Kuru Maya",emoji:"🟤",desc:"Pratik"},{id:"eksi_maya_m",label:"Ekşi Maya",emoji:"🧪",desc:"Geleneksel"},{id:"kabartma",label:"Kabartma Tozu",emoji:"💨",desc:"Mayasız"},{id:"mayasiz",label:"Mayasız",emoji:"🫓",desc:"Hamursuz"}];
const EKMEK_UN=[{id:"beyaz_un",label:"Beyaz Un",emoji:"🌾"},{id:"tam_bugday_un",label:"Tam Buğday",emoji:"🟤"},{id:"cavdar_un",label:"Çavdar Unu",emoji:"🌿"},{id:"misir_un",label:"Mısır Unu",emoji:"🌽"},{id:"yulaf_un",label:"Yulaf Unu",emoji:"🥣"},{id:"badem_un",label:"Badem Unu",emoji:"🥜"},{id:"hindistan_c",label:"Hindistan C. Unu",emoji:"🥥"},{id:"pirinc_un",label:"Pirinç Unu",emoji:"🍚"},{id:"spelt",label:"Spelt / Siyez",emoji:"🌱"}];
const EKMEK_STIL=[{id:"ev_e",label:"Ev Yapımı",emoji:"🏠",desc:"Kolay"},{id:"firin",label:"Fırın Usulü",emoji:"🏭",desc:"Profesyonel"},{id:"artisan",label:"Artisan",emoji:"🎨",desc:"Zanaatkâr"},{id:"sokak_e",label:"Sokak Lezzeti",emoji:"🛺",desc:"Pratik"},{id:"modern_e",label:"Modern",emoji:"🔮",desc:"Füzyon"}];
const EKMEK_ZORLUK=[{id:"kolay_e",label:"Kolay",emoji:"🟢",desc:"30-45 dk",col:C.green},{id:"orta_e",label:"Orta",emoji:"🟡",desc:"1-2 saat",col:"#F59E0B"},{id:"usta_e",label:"Usta İşi",emoji:"🔴",desc:"3+ saat",col:C.red}];
const EKMEK_ALERJEN=[{id:"glutensiz_ea",label:"Glutensiz",emoji:"🌾"},{id:"sutsuz_e",label:"Sütsüz",emoji:"🥛"},{id:"yumurtasiz_e",label:"Yumurtasız",emoji:"🥚"},{id:"vegan_e",label:"Vegan",emoji:"🌱"},{id:"sekersiz_e",label:"Şekersiz",emoji:"🚫🍬"},{id:"findik_e",label:"Fındıksız",emoji:"🥜"}];
const EKMEK_EKSTRA=[{id:"tohumlu",label:"Tohumlu",emoji:"🌻"},{id:"peynirli",label:"Peynirli",emoji:"🧀"},{id:"zeytinli",label:"Zeytinli",emoji:"🫒"},{id:"baharatli",label:"Baharatlı",emoji:"🌶️"},{id:"kurutulmus",label:"Kuru Meyveli",emoji:"🍇"},{id:"cevizli",label:"Cevizli",emoji:"🌰"}];
const EKMEK_DENGE=[
  {id:"dusuk_gi",label:"Düşük GI",emoji:"📉",col:C.green,bg:"rgba(76,175,122,0.08)",br:"rgba(76,175,122,0.45)",desc:"Düşük glisemik indeks, kan şekerini yavaş yükseltir"},
  {id:"yuksek_lif",label:"Yüksek Lif",emoji:"🌾",col:"#F59E0B",bg:"rgba(245,158,11,0.08)",br:"rgba(245,158,11,0.45)",desc:"Lifli unlar, kepek, tam tahıl"},
  {id:"protein_e",label:"Proteinli",emoji:"💪",col:C.red,bg:"rgba(224,82,82,0.08)",br:"rgba(224,82,82,0.45)",desc:"Protein tozu, badem unu, yumurta"},
  {id:"dusuk_karbonhidrat",label:"Düşük Karb",emoji:"🥑",col:C.blue,bg:"rgba(91,163,208,0.08)",br:"rgba(91,163,208,0.45)",desc:"Keto-dostu, düşük karbonhidrat"},
  {id:"fermente",label:"Fermente",emoji:"🧪",col:C.purple,bg:"rgba(155,127,212,0.08)",br:"rgba(155,127,212,0.45)",desc:"Ekşi maya, uzun fermantasyon"},
  {id:"antik_tahil",label:"Antik Tahıl",emoji:"🏛️",col:C.teal,bg:"rgba(45,212,191,0.08)",br:"rgba(45,212,191,0.45)",desc:"Siyez, kamut, amarant, kinoa"},
];
const UNLU_SEFLER=[
  {id:"gordon",isim:"Gordon Ramsay",ulke:"🇬🇧 İngiltere",emoji:"🔥",col:C.red,uzmanlik:"Modern İngiliz, Fine Dining",yildiz:"7 Michelin"},
  {id:"massimo",isim:"Massimo Bottura",ulke:"🇮🇹 İtalya",emoji:"🍝",col:C.green,uzmanlik:"Modern İtalyan",yildiz:"3 Michelin"},
  {id:"nusret",isim:"Nusret Gökçe",ulke:"🇹🇷 Türkiye",emoji:"🥩",col:C.gold,uzmanlik:"Et Ustalığı, Steakhouse",yildiz:"—"},
  {id:"ducasse",isim:"Alain Ducasse",ulke:"🇫🇷 Fransa",emoji:"🥂",col:C.blue,uzmanlik:"Haute Cuisine, Akdeniz",yildiz:"21 Michelin"},
  {id:"jiro",isim:"Jiro Ono",ulke:"🇯🇵 Japonya",emoji:"🍣",col:C.pink,uzmanlik:"Sushi Ustası",yildiz:"3 Michelin"},
  {id:"redzepi",isim:"René Redzepi",ulke:"🇩🇰 Danimarka",emoji:"🌿",col:C.teal,uzmanlik:"Nordik, Foraging",yildiz:"3 Michelin"},
  {id:"blumenthal",isim:"Heston Blumenthal",ulke:"🇬🇧 İngiltere",emoji:"🧪",col:C.purple,uzmanlik:"Moleküler Gastronomi",yildiz:"3 Michelin"},
  {id:"gaggan",isim:"Gaggan Anand",ulke:"🇹🇭 Tayland",emoji:"🪷",col:C.orange,uzmanlik:"Progresif Hint",yildiz:"2 Michelin"},
  {id:"keller",isim:"Thomas Keller",ulke:"🇺🇸 ABD",emoji:"🏛️",col:"#8B5E3C",uzmanlik:"Fransız-Amerikan",yildiz:"7 Michelin"},
  {id:"crenn",isim:"Dominique Crenn",ulke:"🇺🇸 ABD",emoji:"🎨",col:C.pink,uzmanlik:"Poetik Gastronomi",yildiz:"3 Michelin"},
  {id:"alleno",isim:"Yannick Alléno",ulke:"🇫🇷 Fransa",emoji:"🍷",col:"#722F37",uzmanlik:"Modern Fransız, Sos Sanatı",yildiz:"6 Michelin"},
  {id:"martinez",isim:"Virgilio Martínez",ulke:"🇵🇪 Peru",emoji:"🏔️",col:"#A3E635",uzmanlik:"Peru Mutfağı, Yükseklik",yildiz:"—"},
  {id:"atala",isim:"Alex Atala",ulke:"🇧🇷 Brezilya",emoji:"🌴",col:C.green,uzmanlik:"Amazon Mutfağı",yildiz:"—"},
  {id:"barber",isim:"Dan Barber",ulke:"🇺🇸 ABD",emoji:"🌱",col:"#4CAF7A",uzmanlik:"Farm-to-Table",yildiz:"—"},
  {id:"pic",isim:"Anne-Sophie Pic",ulke:"🇫🇷 Fransa",emoji:"💐",col:C.pink,uzmanlik:"Modern Fransız",yildiz:"3 Michelin"},
  {id:"olvera",isim:"Enrique Olvera",ulke:"🇲🇽 Meksika",emoji:"🌮",col:"#F59E0B",uzmanlik:"Modern Meksika",yildiz:"—"},
  {id:"colagreco",isim:"Mauro Colagreco",ulke:"🇫🇷 Fransa",emoji:"🌊",col:C.blue,uzmanlik:"Akdeniz Füzyon",yildiz:"3 Michelin"},
  {id:"narisawa",isim:"Yoshihiro Narisawa",ulke:"🇯🇵 Japonya",emoji:"🌳",col:C.green,uzmanlik:"Doğa Odaklı",yildiz:"2 Michelin"},
  {id:"achatz",isim:"Grant Achatz",ulke:"🇺🇸 ABD",emoji:"🔮",col:C.purple,uzmanlik:"Avangard, Moleküler",yildiz:"3 Michelin"},
  {id:"gurs",isim:"Mehmet Gürs",ulke:"🇹🇷 Türkiye",emoji:"🌍",col:C.gold,uzmanlik:"Anadolu Füzyon, Yeni Türk",yildiz:"—"},
  {id:"yosses",isim:"Bill Yosses",ulke:"🇺🇸 ABD",emoji:"🎂",col:"#F5C542",uzmanlik:"Pastacılık, Beyaz Saray Şefi",yildiz:"—"},
  {id:"robuchon",isim:"Joël Robuchon",ulke:"🇫🇷 Fransa",emoji:"⭐",col:C.gold,uzmanlik:"Fransız Klasik",yildiz:"32 Michelin (rekor)"},
  {id:"bocuse",isim:"Paul Bocuse",ulke:"🇫🇷 Fransa",emoji:"👑",col:C.red,uzmanlik:"Nouvelle Cuisine öncüsü",yildiz:"3 Michelin (54 yıl)"},
  {id:"oliver",isim:"Jamie Oliver",ulke:"🇬🇧 İngiltere",emoji:"🥘",col:"#4CAF7A",uzmanlik:"Ev Yemekleri, Sağlıklı",yildiz:"—"},
  {id:"arda",isim:"Arda Türkmen",ulke:"🇹🇷 Türkiye",emoji:"📺",col:C.orange,uzmanlik:"Türk Ev Yemekleri, TV Şef",yildiz:"—"},
  {id:"burak",isim:"Burak Özdemir",ulke:"🇹🇷 Türkiye",emoji:"😊",col:C.red,uzmanlik:"Geleneksel Türk, Sosyal Medya",yildiz:"—"},
  {id:"hazer",isim:"Hazer Amani",ulke:"🇹🇷 Türkiye",emoji:"🍳",col:C.pink,uzmanlik:"Sağlıklı Beslenme, Raw Food",yildiz:"—"},
  {id:"refika",isim:"Refika Birgül",ulke:"🇹🇷 Türkiye",emoji:"❤️",col:C.red,uzmanlik:"Türk Mutfağı, Ev Yemekleri",yildiz:"—"},
  {id:"cankiri",isim:"Cenk Sönmezsoy",ulke:"🇹🇷 Türkiye",emoji:"📖",col:"#8B5E3C",uzmanlik:"Pastacılık, Yemek Yazarlığı",yildiz:"—"},
  {id:"ayhan",isim:"Ayhan Sicimoğlu",ulke:"🇹🇷 Türkiye",emoji:"✈️",col:C.blue,uzmanlik:"Dünya Mutfakları, Gezi",yildiz:"—"},
  {id:"white",isim:"Marco Pierre White",ulke:"🇬🇧 İngiltere",emoji:"🔪",col:C.red,uzmanlik:"Klasik Fransız-İngiliz",yildiz:"3 Michelin"},
  {id:"adrià",isim:"Ferran Adrià",ulke:"🇪🇸 İspanya",emoji:"🧫",col:C.orange,uzmanlik:"Moleküler Gastronomi, elBulli",yildiz:"3 Michelin"},
  {id:"roca",isim:"Joan Roca",ulke:"🇪🇸 İspanya",emoji:"🌡️",col:C.purple,uzmanlik:"Sous Vide, Katalan Mutfağı",yildiz:"3 Michelin"},
  {id:"muñoz",isim:"David Muñoz",ulke:"🇪🇸 İspanya",emoji:"⚡",col:C.red,uzmanlik:"Avangard, Asya Füzyon",yildiz:"3 Michelin"},
  {id:"point",isim:"Fernand Point",ulke:"🇫🇷 Fransa",emoji:"🏛️",col:C.gold,uzmanlik:"Modern Fransız Mutfağın Babası",yildiz:"3 Michelin (efsane)"},
  {id:"troisgros",isim:"Michel Troisgros",ulke:"🇫🇷 Fransa",emoji:"🌿",col:C.green,uzmanlik:"Yeni Fransız, Asit Dengesi",yildiz:"3 Michelin"},
  {id:"bras",isim:"Michel Bras",ulke:"🇫🇷 Fransa",emoji:"🏔️",col:C.teal,uzmanlik:"Doğa Odaklı, Aubrac",yildiz:"3 Michelin"},
  {id:"passard",isim:"Alain Passard",ulke:"🇫🇷 Fransa",emoji:"🥕",col:C.green,uzmanlik:"Sebze Sanatı, L'Arpège",yildiz:"3 Michelin"},
  {id:"matsuhisa",isim:"Nobu Matsuhisa",ulke:"🇯🇵 Japonya",emoji:"🍱",col:C.blue,uzmanlik:"Japon-Peru Füzyon, Nobu",yildiz:"—"},
  {id:"morimoto",isim:"Masaharu Morimoto",ulke:"🇯🇵 Japonya",emoji:"⚔️",col:C.red,uzmanlik:"Iron Chef, Fusion",yildiz:"—"},
  {id:"arzak",isim:"Juan Mari Arzak",ulke:"🇪🇸 İspanya",emoji:"🔬",col:C.orange,uzmanlik:"Bask Mutfağı, Yeni İspanyol",yildiz:"3 Michelin"},
  {id:"vongerichten",isim:"Jean-Georges Vongerichten",ulke:"🇺🇸 ABD",emoji:"🌏",col:C.teal,uzmanlik:"Fransız-Asya, Minimal",yildiz:"4 Michelin"},
  {id:"batali",isim:"Mario Batali",ulke:"🇺🇸 ABD",emoji:"🍕",col:C.red,uzmanlik:"Rustik İtalyan",yildiz:"1 Michelin"},
  {id:"chang",isim:"David Chang",ulke:"🇺🇸 ABD",emoji:"🍜",col:C.orange,uzmanlik:"Kore-Amerikan, Momofuku",yildiz:"2 Michelin"},
  {id:"flay",isim:"Bobby Flay",ulke:"🇺🇸 ABD",emoji:"🌶️",col:C.red,uzmanlik:"Güneybatı, Izgara",yildiz:"—"},
  {id:"puck",isim:"Wolfgang Puck",ulke:"🇺🇸 ABD",emoji:"🌟",col:C.gold,uzmanlik:"California Cuisine, Spago",yildiz:"—"},
  {id:"tsumura",isim:"Mitsuharu Tsumura",ulke:"🇵🇪 Peru",emoji:"🐟",col:C.teal,uzmanlik:"Nikkei (Japon-Peru)",yildiz:"—"},
  {id:"leon",isim:"Leonor Espinosa",ulke:"🇨🇴 Kolombiya",emoji:"🌺",col:C.pink,uzmanlik:"Kolombiya Biyoçeşitlilik",yildiz:"—"},
  {id:"smith",isim:"Clare Smyth",ulke:"🇬🇧 İngiltere",emoji:"💎",col:C.blue,uzmanlik:"Modern İngiliz",yildiz:"3 Michelin"},
  {id:"caines",isim:"Michael Caines",ulke:"🇬🇧 İngiltere",emoji:"🍂",col:"#8B5E3C",uzmanlik:"Modern Avrupa",yildiz:"2 Michelin"},
  {id:"poon",isim:"Kwok Keung Tung",ulke:"🇭🇰 Hong Kong",emoji:"🥟",col:C.red,uzmanlik:"Kanton Mutfağı",yildiz:"3 Michelin"},
  {id:"aponiente",isim:"Ángel León",ulke:"🇪🇸 İspanya",emoji:"🌊",col:C.blue,uzmanlik:"Deniz Gastronomisi",yildiz:"3 Michelin"},
  {id:"nilsson",isim:"Magnus Nilsson",ulke:"🇸🇪 İsveç",emoji:"❄️",col:C.teal,uzmanlik:"İskandinav, Fäviken",yildiz:"2 Michelin"},
  {id:"perello",isim:"Jordi Cruz",ulke:"🇪🇸 İspanya",emoji:"🎭",col:C.purple,uzmanlik:"Modern Katalan, ABaC",yildiz:"3 Michelin"},
  {id:"locatelli",isim:"Giorgio Locatelli",ulke:"🇬🇧 İngiltere",emoji:"🇮🇹",col:C.green,uzmanlik:"İtalyan Klasik, Locanda",yildiz:"1 Michelin"},
  {id:"dacosta",isim:"Quique Dacosta",ulke:"🇪🇸 İspanya",emoji:"🧊",col:C.blue,uzmanlik:"Akdeniz Avangard",yildiz:"3 Michelin"},
  {id:"aduriz",isim:"Andoni Luis Aduriz",ulke:"🇪🇸 İspanya",emoji:"🧬",col:C.purple,uzmanlik:"Bilimsel Gastronomi, Mugaritz",yildiz:"2 Michelin"},
  {id:"humm",isim:"Daniel Humm",ulke:"🇺🇸 ABD",emoji:"🌱",col:C.green,uzmanlik:"Vegan Fine Dining, EMP",yildiz:"3 Michelin"},
  {id:"leung",isim:"Alvin Leung",ulke:"🇭🇰 Hong Kong",emoji:"😈",col:C.red,uzmanlik:"X-Treme Çin, Bo Innovation",yildiz:"3 Michelin"},
  {id:"cenk",isim:"Cenk Debensason",ulke:"🇹🇷 Türkiye",emoji:"🌿",col:C.teal,uzmanlik:"Ege Mutfağı, Sürdürülebilir",yildiz:"—"},
  {id:"didem",isim:"Didem Şenol",ulke:"🇹🇷 Türkiye",emoji:"🍷",col:C.purple,uzmanlik:"Modern Türk, Lokanta Maya",yildiz:"—"},
  {id:"maksut",isim:"Maksut Aşkar",ulke:"🇹🇷 Türkiye",emoji:"🎨",col:C.gold,uzmanlik:"Yeni Anadolu, Neolokal",yildiz:"—"},
  {id:"semsa",isim:"Şemsa Denizsel",ulke:"🇹🇷 Türkiye",emoji:"🍽️",col:C.pink,uzmanlik:"Osmanlı Saray Mutfağı",yildiz:"—"},
  {id:"sahrap",isim:"Sahrap Soysal",ulke:"🇹🇷 Türkiye",emoji:"🫖",col:C.orange,uzmanlik:"Geleneksel Türk, TV Şef",yildiz:"—"},
  {id:"somer",isim:"Somer Sivrioğlu",ulke:"🇦🇺 Avustralya",emoji:"🦘",col:C.teal,uzmanlik:"Türk-Avustralya Füzyon",yildiz:"—"},
  {id:"musa",isim:"Musa Dağdeviren",ulke:"🇹🇷 Türkiye",emoji:"📜",col:"#8B5E3C",uzmanlik:"Anadolu Mutfak Mirası",yildiz:"—"},
  {id:"fatih",isim:"Fatih Tutak",ulke:"🇹🇷 Türkiye",emoji:"⭐",col:C.gold,uzmanlik:"Modern Türk Fine Dining, Turk",yildiz:"2 Michelin"},
  {id:"civan",isim:"Civan Er",ulke:"🇹🇷 Türkiye",emoji:"🫒",col:C.green,uzmanlik:"Meyhane Kültürü, Yeni Nesil Meze",yildiz:"—"},
  {id:"serkan",isim:"Serkan Güzelçoban",ulke:"🇹🇷 Türkiye",emoji:"🍳",col:C.orange,uzmanlik:"Modern Türk, Araka",yildiz:"—"},
  {id:"ebru_sef",isim:"Ebru Şallı",ulke:"🇹🇷 Türkiye",emoji:"💪",col:C.pink,uzmanlik:"Sağlıklı Yemek, Fit Mutfak",yildiz:"—"},
  {id:"danilo",isim:"Danilo Zanna",ulke:"🇹🇷 Türkiye",emoji:"🇮🇹",col:C.green,uzmanlik:"İtalyan-Türk Füzyon, TV Şef",yildiz:"—"},
  {id:"oktay",isim:"Oktay Usta",ulke:"🇹🇷 Türkiye",emoji:"👨‍🍳",col:C.red,uzmanlik:"Geleneksel Türk, TV Efsanesi",yildiz:"—"},
  {id:"tanju",isim:"Tanju Babacan",ulke:"🇹🇷 Türkiye",emoji:"🍖",col:"#8B5E3C",uzmanlik:"Kebap & Et Ustası, Güneydoğu",yildiz:"—"},
  {id:"omur",isim:"Ömür Akkor",ulke:"🇹🇷 Türkiye",emoji:"📚",col:C.purple,uzmanlik:"Yemek Tarihçisi, Osmanlı Mutfağı",yildiz:"—"},
  {id:"dilara",isim:"Dilara Koçak",ulke:"🇹🇷 Türkiye",emoji:"🥗",col:C.green,uzmanlik:"Diyetisyen Şef, Sağlıklı Tarifler",yildiz:"—"},
  {id:"selin",isim:"Selin Sözen",ulke:"🇹🇷 Türkiye",emoji:"🍰",col:C.pink,uzmanlik:"Pastacılık, Tatlı Sanatı",yildiz:"—"},
  {id:"esat",isim:"Esat Dedeoğlu",ulke:"🇹🇷 Türkiye",emoji:"🐟",col:C.blue,uzmanlik:"Deniz Ürünleri, Balık Ustası",yildiz:"—"},
  {id:"akdeniz",isim:"Ahmet Diker",ulke:"🇹🇷 Türkiye",emoji:"🌊",col:C.teal,uzmanlik:"Ege & Akdeniz Mutfağı",yildiz:"—"},
  {id:"kilis",isim:"Şeref Oruç",ulke:"🇹🇷 Türkiye",emoji:"🌶️",col:C.red,uzmanlik:"Antep & Güneydoğu Mutfağı",yildiz:"—"},
  {id:"hidir",isim:"Hıdır Gürdal",ulke:"🇹🇷 Türkiye",emoji:"🫕",col:C.orange,uzmanlik:"Karadeniz Mutfağı",yildiz:"—"},
  {id:"nazli",isim:"Nazlı Pişkin",ulke:"🇹🇷 Türkiye",emoji:"🧁",col:C.pink,uzmanlik:"Butik Pastacılık, Çikolata",yildiz:"—"},
];
const MICHELIN_BOLGE=[
  {group:"Avrupa",items:[{id:"fransa_r",l:"Fransa"},{id:"italya_r",l:"İtalya"},{id:"ispanya_r",l:"İspanya"},{id:"ingiltere_r",l:"İngiltere"},{id:"almanya_r",l:"Almanya"},{id:"iskandinav_r",l:"İskandinav"},{id:"turkiye_r",l:"Türkiye"},{id:"portekiz_r",l:"Portekiz"},{id:"isvicre_r",l:"İsviçre"},{id:"belcika_r",l:"Belçika"},{id:"hollanda_r",l:"Hollanda"},{id:"avusturya_r",l:"Avusturya"},{id:"yunanistan_r",l:"Yunanistan"},{id:"hirvatistan_r",l:"Hırvatistan"}]},
  {group:"Asya",items:[{id:"japonya_r",l:"Japonya"},{id:"hongkong_r",l:"Hong Kong"},{id:"singapur_r",l:"Singapur"},{id:"tayland_r",l:"Tayland"},{id:"guney_kore_r",l:"Güney Kore"},{id:"tayvan_r",l:"Tayvan"},{id:"cin_r",l:"Çin"},{id:"hindistan_r",l:"Hindistan"},{id:"malezya_r",l:"Malezya"},{id:"vietnam_r",l:"Vietnam"},{id:"dubai_r",l:"Dubai/BAE"}]},
  {group:"Amerika & Diğer",items:[{id:"abd_r",l:"ABD"},{id:"meksika_r",l:"Meksika"},{id:"peru_r",l:"Peru"},{id:"brezilya_r",l:"Brezilya"},{id:"kanada_r",l:"Kanada"},{id:"arjantin_r",l:"Arjantin"},{id:"avustralya_r",l:"Avustralya"}]},
];
const MICHELIN_CE={fransa_r:"🇫🇷",italya_r:"🇮🇹",ispanya_r:"🇪🇸",ingiltere_r:"🇬🇧",almanya_r:"🇩🇪",iskandinav_r:"🇸🇪",turkiye_r:"🇹🇷",portekiz_r:"🇵🇹",isvicre_r:"🇨🇭",belcika_r:"🇧🇪",hollanda_r:"🇳🇱",avusturya_r:"🇦🇹",yunanistan_r:"🇬🇷",hirvatistan_r:"🇭🇷",japonya_r:"🇯🇵",hongkong_r:"🇭🇰",singapur_r:"🇸🇬",tayland_r:"🇹🇭",guney_kore_r:"🇰🇷",tayvan_r:"🇹🇼",cin_r:"🇨🇳",hindistan_r:"🇮🇳",malezya_r:"🇲🇾",vietnam_r:"🇻🇳",dubai_r:"🇦🇪",abd_r:"🇺🇸",meksika_r:"🇲🇽",peru_r:"🇵🇪",brezilya_r:"🇧🇷",kanada_r:"🇨🇦",arjantin_r:"🇦🇷",avustralya_r:"🇦🇺"};
const MICHELIN_YILDIZ=[{id:"1",label:"1 Yıldız",emoji:"⭐",col:"#CD7F32",desc:"Alanında çok iyi"},{id:"2",label:"2 Yıldız",emoji:"⭐⭐",col:"#C0C0C0",desc:"Yolunuzu değiştirmeye değer"},{id:"3",label:"3 Yıldız",emoji:"⭐⭐⭐",col:C.gold,desc:"Mükemmellik, seyahate değer"}];
const GURME_LIST=[
  {id:"milor",isim:"Vedat Milor",ulke:"🇹🇷 Türkiye",emoji:"🍷",col:C.red,uzmanlik:"Şarap & Gastronomi Yazarı, TV Programcısı",bio:"Türkiye'nin en tanınan gurme eleştirmeni. 'Vedat Milor ile Sofrada' programıyla tanınır."},
  {id:"cuinet",isim:"François-Régis Gaudry",ulke:"🇫🇷 Fransa",emoji:"📰",col:C.blue,uzmanlik:"Gastronomi Gazetecisi, L'Express",bio:"Fransa'nın en etkili yemek eleştirmenlerinden. On Va Déguster programcısı."},
  {id:"gold",isim:"Jonathan Gold",ulke:"🇺🇸 ABD",emoji:"🏆",col:C.gold,uzmanlik:"Pulitzer Ödüllü Yemek Eleştirmeni",bio:"LA Times eleştirmeni, sokak yemeğinden fine dining'e Pulitzer kazanan ilk yemek yazarı."},
  {id:"reichl",isim:"Ruth Reichl",ulke:"🇺🇸 ABD",emoji:"📖",col:C.pink,uzmanlik:"NY Times & Gourmet Dergisi Editörü",bio:"Kılık değiştirerek restoran eleştirisi yapmasıyla ünlü. Gourmet dergisi baş editörü."},
  {id:"gill",isim:"A.A. Gill",ulke:"🇬🇧 İngiltere",emoji:"✍️",col:C.purple,uzmanlik:"Sunday Times Eleştirmeni",bio:"İngiliz basınının en keskin kalemli yemek eleştirmeni. Acımasız ama adil."},
  {id:"wells",isim:"Pete Wells",ulke:"🇺🇸 ABD",emoji:"⭐",col:C.orange,uzmanlik:"NY Times Baş Restoran Eleştirmeni",bio:"New York Times'ın restoran eleştirmeni. Yıldız sistemi puanlamalarıyla tanınır."},
  {id:"rayner",isim:"Jay Rayner",ulke:"🇬🇧 İngiltere",emoji:"🎹",col:C.teal,uzmanlik:"The Observer Eleştirmeni, Yazar",bio:"Hem müzisyen hem yemek yazarı. Samimi ve eğlenceli eleştirileriyle bilinir."},
  {id:"savarin",isim:"Brillat-Savarin",ulke:"🇫🇷 Fransa",emoji:"📜",col:C.gold,uzmanlik:"Gastronomi Felsefecisi (Klasik)",bio:"'Ne yediğini söyle, kim olduğunu söyleyeyim' sözünün sahibi. Modern gastronominin babası."},
  {id:"coskun",isim:"Mehmet Yaşin",ulke:"🇹🇷 Türkiye",emoji:"📝",col:C.green,uzmanlik:"Gastronomi Yazarı, Eleştirmen",bio:"Türk gastronomi yazınının öncülerinden. Restoran rehberleri ve yemek kültürü kitapları."},
  {id:"gurkan",isim:"Gürkan Topçu",ulke:"🇹🇷 Türkiye",emoji:"🥩",col:C.red,uzmanlik:"Et & Restoran Kültürü, Sosyal Medya",bio:"Sosyal medyada yemek kültürünü anlatan, restoran keşifleriyle tanınan gurme."},
  {id:"basri",isim:"Basri Bey (Sezai Coşkun)",ulke:"🇹🇷 Türkiye",emoji:"🍖",col:"#8B5E3C",uzmanlik:"Yemek Kültürü, İstanbul Mekanları",bio:"YouTube'da İstanbul'un meşhur lokantalerini ve lezzetlerini tanıtan yemek kâşifi."},
  {id:"ebru",isim:"Ebru Baybara Demir",ulke:"🇹🇷 Türkiye",emoji:"🌾",col:C.orange,uzmanlik:"Gastrodiplomasi, Mardin Mutfağı",bio:"Mardin mutfağını dünyaya tanıtan, gastrodiplomasi kavramının Türkiye temsilcisi."},
  {id:"stein",isim:"Rick Stein",ulke:"🇬🇧 İngiltere",emoji:"🐟",col:C.blue,uzmanlik:"Deniz Ürünleri, Gezi & Gastronomi",bio:"BBC'nin efsane şef-gezgini. Dünya mutfaklarını keşfeden belgesel yapımcısı."},
  {id:"bourdain",isim:"Anthony Bourdain",ulke:"🇺🇸 ABD",emoji:"🌍",col:C.teal,uzmanlik:"Gezi & Gastronomi, Parts Unknown",bio:"Kitchen Confidential yazarı, CNN Parts Unknown sunucusu. Sokak yemeklerinin şampiyonu."},
  {id:"ramsay_g",isim:"Giles Coren",ulke:"🇬🇧 İngiltere",emoji:"🎬",col:C.purple,uzmanlik:"The Times Eleştirmeni, TV Sunucusu",bio:"The Times restoran eleştirmeni, The Supersizers programı sunucusu."},
  {id:"white_m",isim:"Marco White Jr",ulke:"🇬🇧 İngiltere",emoji:"📱",col:C.muted,uzmanlik:"Yeni Nesil Eleştirmen, Sosyal Medya",bio:"Sosyal medya üzerinden restoran incelemeleri yapan yeni nesil gurme."},
  {id:"setyan",isim:"Takuhi Tovmasyan",ulke:"🇹🇷 Türkiye",emoji:"🥄",col:C.pink,uzmanlik:"Ermeni-Türk Mutfağı, Yazar",bio:"Anadolu'nun çokkültürlü mutfak mirasını araştıran ve yazan gastronomi tarihçisi."},
  {id:"durlu",isim:"Defne Koryürek",ulke:"🇹🇷 Türkiye",emoji:"🫒",col:C.green,uzmanlik:"Sağlıklı Beslenme, Gastronomi Yazarı",bio:"Akdeniz diyeti ve Türk mutfağının sağlıklı yönlerini anlatan yemek yazarı."},
  {id:"warwick",isim:"William Sitwell",ulke:"🇬🇧 İngiltere",emoji:"👔",col:C.gold,uzmanlik:"Waitrose Dergisi Editörü, MasterChef Jüri",bio:"Waitrose Food dergisi eski editörü, MasterChef jüri üyesi ve yemek tarihçisi."},
  {id:"fuchsia",isim:"Fuchsia Dunlop",ulke:"🇬🇧 İngiltere",emoji:"🥢",col:C.red,uzmanlik:"Çin Mutfağı Uzmanı, Yazar",bio:"Batı dünyasının en saygın Çin mutfağı yazarı. 'Land of Fish and Rice' kitabının yazarı."},
];
const SEF_MUTFAK_ULKE=[
  {id:"turk_s",label:"Türk",emoji:"🇹🇷"},{id:"fransiz_s",label:"Fransız",emoji:"🇫🇷"},{id:"italyan_s",label:"İtalyan",emoji:"🇮🇹"},
  {id:"japon_s",label:"Japon",emoji:"🇯🇵"},{id:"ispanyol_s",label:"İspanyol",emoji:"🇪🇸"},{id:"nordik_s",label:"Nordik",emoji:"🇩🇰"},
  {id:"amerikan_s",label:"Amerikan",emoji:"🇺🇸"},{id:"cin_s",label:"Çin",emoji:"🇨🇳"},{id:"hint_s",label:"Hint",emoji:"🇮🇳"},
  {id:"kore_s",label:"Kore",emoji:"🇰🇷"},{id:"peru_s",label:"Peru",emoji:"🇵🇪"},{id:"meksika_s",label:"Meksika",emoji:"🇲🇽"},
];
const SEF_MUTFAK_CESIT=[
  {id:"et_s",label:"Et Ustalığı",emoji:"🥩"},{id:"deniz_s",label:"Deniz Ürünleri",emoji:"🦞"},
  {id:"pastaci_s",label:"Pastacılık",emoji:"🎂"},{id:"vegan_s",label:"Vegan/Bitki",emoji:"🌱"},
  {id:"molekuler_s",label:"Moleküler",emoji:"🧪"},{id:"fusion_s",label:"Füzyon",emoji:"🌍"},
  {id:"farm_s",label:"Farm-to-Table",emoji:"🌿"},{id:"sokak_s",label:"Sokak Yemeği",emoji:"🛺"},
  {id:"saglikli_s",label:"Sağlıklı",emoji:"🥗"},{id:"fine_s",label:"Fine Dining",emoji:"🥂"},
];
const SEF_MUTFAK_TUR=SEF_MUTFAK_ULKE.concat(SEF_MUTFAK_CESIT);
const REHBER_TABS=[{id:"saklama",label:"Saklama",emoji:"📦"},{id:"sunum",label:"Sunum",emoji:"🎨"},{id:"eslesme",label:"Eşleşme",emoji:"🍷"},{id:"temizlik",label:"Temizlik",emoji:"🧹"},{id:"stok",label:"Stok",emoji:"🛒"}];

// ─── NEW FEATURES: CONSTANTS ──────────────────────────────────

// Feature 4: Hızlı Yemek Kategorileri
const HIZLI_KAT=[
  {id:"15dk",label:"15 Dakika",emoji:"⚡",desc:"Çok hızlı tarifler",col:C.orange},
  {id:"tek_tava",label:"Tek Tava",emoji:"🍳",desc:"Tek kap yeterli",col:C.green},
  {id:"5_malzeme",label:"5 Malzeme",emoji:"🖐️",desc:"Az malzemeli",col:C.blue},
  {id:"one_pot",label:"Tek Tencere",emoji:"🫕",desc:"One-pot tarifler",col:C.teal},
  {id:"no_cook",label:"Pişirmesiz",emoji:"🥗",desc:"Ateş yok",col:C.purple},
  {id:"meal_prep",label:"Meal Prep",emoji:"📦",desc:"Hazırlık yemekleri",col:"#F59E0B"},
  {id:"cocuk",label:"Çocuk Dostu",emoji:"🧒",desc:"Çocukların sevdiği",col:C.pink},
  {id:"ekonomik",label:"Ekonomik",emoji:"💰",desc:"Bütçe dostu",col:C.gold},
  {id:"gece",label:"Gece Atıştırması",emoji:"🌙",desc:"Hafif & geç",col:"#6366F1"},
  {id:"piknik",label:"Piknik / Dışarı",emoji:"🧺",desc:"Taşınabilir",col:"#A3E635"},
];

// Feature 5: Sağlık Skoru renkleri
const SAGLIK_SKOR_RENK={A:"#22C55E",B:"#84CC16",C:"#F59E0B",D:"#F97316",E:"#EF4444"};

// Feature 7: Tarif Puanlama
const YILDIZ_PUAN=[1,2,3,4,5];

// Feature 10: Yemek Günlüğü
const GUNLUK_OGUNLER=["Kahvaltı","Öğle","Akşam","Ara Öğün"];

// Feature 12: Maliyet Kategorileri
const MALIYET_SEVIYE={ucuz:{label:"Ekonomik",emoji:"💰",col:C.green,max:50},orta:{label:"Orta",emoji:"💰💰",col:"#F59E0B",max:100},pahali:{label:"Pahalı",emoji:"💰💰💰",col:C.red,max:999}};

// Feature 14: Restoran yakın arama
const RESTORAN_KAT=[{id:"fine",label:"Fine Dining",emoji:"🥂"},{id:"casual",label:"Gündelik",emoji:"🍽️"},{id:"cafe",label:"Kafe",emoji:"☕"},{id:"sokak",label:"Sokak Lezzeti",emoji:"🛺"},{id:"fast",label:"Fast Food",emoji:"🍔"},{id:"vegan_r",label:"Vegan",emoji:"🌱"}];

// Feature 20: Aile Profili sabitleri
const AILE_ROLLER=[{id:"anne",label:"Anne",emoji:"👩"},{id:"baba",label:"Baba",emoji:"👨"},{id:"cocuk",label:"Çocuk",emoji:"🧒"},{id:"bebek",label:"Bebek",emoji:"👶"},{id:"buyuk",label:"Büyük",emoji:"👴"},{id:"diger",label:"Diğer",emoji:"👤"}];

var CACHE_TTL_MS=7*24*60*60*1000;
function aiCacheGet(key){return stGet("aicache:"+key).then(function(r){if(!r||!r.ts)return null;if(Date.now()-r.ts>CACHE_TTL_MS)return null;return r.data;});}
function aiCacheSet(key,data){return stSet("aicache:"+key,{data:data,ts:Date.now()});}
function aiCacheClear(key){return stSet("aicache:"+key,null);}

function makeCSS(theme) {
  var t=theme||getInitialTheme();
  var bg=t.bg, card=t.card, text=t.text, muted=t.muted, border=t.border, accent=t.accent, nav=t.nav;
  // detect if dark by checking bg luminance
  var isDarkBg=(function(){var hex=bg.replace("#","");if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);return(r*299+g*587+b*114)/1000<128;})();
  var card2=isDarkBg?"#1A1A1A":"#F0EBE3";
  var dim=muted+"88";
  var base="@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');\n"+
  ":root{--bg:"+bg+";--card:"+card+";--card2:"+card2+";--border:"+border+";--cream:"+text+";--text:"+text+";--muted:"+muted+";--dim:"+dim+";--accent:"+accent+";--nav:"+nav+";--serif:Georgia,'Playfair Display',serif;--sans:'Inter',system-ui,-apple-system,sans-serif}\n"+
  "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}\n"+
  "body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:15px;line-height:1.5}\n"+
  "::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:"+(isDarkBg?"#333":"#d1d5db")+";border-radius:6px}\n"+
  "input,textarea,button{font-family:var(--sans);font-size:15px}\n"+
  "input::placeholder,textarea::placeholder{color:var(--muted)}\n"+
  "button{cursor:pointer}\n"+
  "@keyframes spin{to{transform:rotate(360deg)}}\n"+
  "@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}\n"+
  "@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}\n"+
  "@keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}\n"+
  "@keyframes toastIn{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}\n"+
  ".up{animation:fadeUp 0.35s ease both}\n"+
  ".sk{background:linear-gradient(90deg,"+(isDarkBg?"rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%":"rgba(0,0,0,0.03) 25%,rgba(0,0,0,0.07) 50%,rgba(0,0,0,0.03) 75%")+");background-size:800px 100%;animation:shimmer 1.6s infinite linear;border-radius:12px}\n"+
  "button:active{transform:scale(0.97);opacity:0.9}\n"+
  // Editorial CSS classes
  ".ed-eyebrow{font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);font-family:var(--sans);display:block}\n"+
  ".ed-title{font-family:var(--serif);font-weight:500;color:var(--text);line-height:1.2}\n"+
  ".ed-item{display:flex;align-items:flex-start;padding:15px 20px;border-bottom:0.5px solid var(--border);cursor:pointer;background:var(--bg);transition:background 0.1s}\n"+
  ".ed-item:hover{background:var(--card)}\n"+
  ".ed-item-num{font-size:11px;color:var(--dim);min-width:26px;padding-top:3px;font-family:var(--sans)}\n"+
  ".ed-item-body{flex:1}\n"+
  ".ed-item-tag{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;font-family:var(--sans)}\n"+
  ".ed-item-title{font-size:16px;font-weight:500;color:var(--text);font-family:var(--serif);margin-bottom:3px;line-height:1.3}\n"+
  ".ed-item-sub{font-size:12px;color:var(--muted);line-height:1.5;font-family:var(--sans)}\n"+
  ".ed-item-arrow{font-size:18px;color:var(--dim);padding-top:2px}\n"+
  ".ed-stat{padding:16px 20px}\n"+
  ".ed-stat-label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);margin-bottom:4px;font-family:var(--sans)}\n"+
  ".ed-stat-val{font-size:24px;font-weight:500;color:var(--text);font-family:var(--serif)}\n"+
  ".ed-stat-sub{font-size:11px;color:var(--muted);margin-top:2px;font-family:var(--sans)}\n"+
  ".ed-badge{display:inline-block;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border:0.5px solid var(--border);color:var(--muted);font-family:var(--sans)}\n"+
  ".ed-badge.active{border-color:var(--text);color:var(--text)}\n"+
  ".ed-progress{height:2px;background:var(--border);margin:10px 20px}\n"+
  ".ed-progress-fill{height:100%;background:var(--accent);transition:width 0.4s}\n"+
  ".ed-chip{display:inline-flex;align-items:center;padding:7px 14px;border:0.5px solid var(--border);color:var(--muted);font-size:13px;cursor:pointer;font-family:var(--sans);transition:all 0.12s;background:var(--bg)}\n"+
  ".ed-chip.on{border-color:var(--accent);color:var(--accent);background:var(--card)}\n"+
  ".ed-chip-row{display:flex;gap:0;border-bottom:0.5px solid var(--border);overflow-x:auto;scrollbar-width:none}\n"+
  ".ed-chip-underline{padding:12px 16px;font-size:13px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;font-family:var(--sans)}\n"+
  ".ed-chip-underline.on{color:var(--text);border-bottom-color:var(--accent)}\n"+
  ".ed-section-hd{padding:12px 20px 4px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:var(--dim);font-family:var(--sans);background:var(--bg)}\n"+
  ".ed-grid-2{display:grid;grid-template-columns:1fr 1fr;border-top:0.5px solid var(--border);border-bottom:0.5px solid var(--border)}\n"+
  ".ed-grid-cell{padding:15px 20px;border-bottom:0.5px solid var(--border);border-right:0.5px solid var(--border)}\n"+
  ".ed-grid-cell:nth-child(2n){border-right:none}\n"+
  ".ed-input-wrap{padding:14px 20px}\n"+
  ".ed-input-label{font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:6px;font-family:var(--sans)}\n"+
  ".ed-input{width:100%;border:none;border-bottom:1px solid var(--border);padding:8px 0;font-size:15px;color:var(--text);background:transparent;outline:none;font-family:var(--serif)}\n"+
  ".ed-input:focus{border-bottom-color:var(--accent)}\n"+
  ".ed-btn{display:block;width:calc(100% - 40px);margin:12px 20px;padding:14px;border:1px solid var(--accent);background:var(--accent);color:var(--bg);font-size:13px;font-family:var(--sans);font-weight:500;cursor:pointer;letter-spacing:0.06em;text-align:center}\n"+
  ".ed-btn:disabled{opacity:0.35;cursor:not-allowed}\n"+
  ".ed-btn-outline{background:transparent;color:var(--muted);border-color:var(--border);margin-top:0}\n"+
  ".ed-pull{padding:14px 20px;border-left:2px solid var(--accent);margin:0 20px 14px}\n"+
  ".ed-pull-text{font-size:14px;color:var(--muted);line-height:1.7;font-style:italic;font-family:var(--serif)}\n"+
  ".ed-nav{position:fixed;bottom:0;left:0;right:0;background:var(--nav);border-top:0.5px solid var(--border);display:flex;z-index:500;padding:8px 0 12px}\n";
  var print="@media print{.no-print{display:none!important}.print-only{display:block!important}.menu-print-area{background:#fff!important;color:#111!important;padding:20px!important;max-width:100%!important}.menu-print-area *{color:#111!important;border-color:rgba(0,0,0,0.15)!important}}";
  return base+"\n"+print;
}
// Helper to detect if current theme is dark
function isThemeDark(theme){var hex=(theme||getInitialTheme()).bg.replace("#","");if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];var r=parseInt(hex.slice(0,2),16),g=parseInt(hex.slice(2,4),16),b=parseInt(hex.slice(4,6),16);return(r*299+g*587+b*114)/1000<128;}

// ─── UTILS ───────────────────────────────────────────────────
function fI(arr,id){ return arr.find(function(x){ return x.id===id; }); }
function toBase64(file){ return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(",")[1]);};r.onerror=rej;r.readAsDataURL(file);}); }
async function stGet(k){try{var r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch(e){return null;}}
async function stSet(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch(e){}}

// ─── FEATURE UTILS ───────────────────────────────────────────

// Feature 1: Extended scaling — helper converts fraction strings too
function scaleIngredient(str,factor){if(!str||factor===1)return str;var m=String(str).match(/^([0-9]+[.,\/]?[0-9]*)\s*(.*)$/);if(!m)return str;var raw=m[1];var num;if(raw.includes("/")){var parts=raw.split("/");num=parseFloat(parts[0])/parseFloat(parts[1]);}else{num=parseFloat(raw.replace(",","."));}if(isNaN(num))return str;var rest=m[2]||"";var scaled=Math.round(num*factor*100)/100;return scaled+(rest?" "+rest:"");}

// Feature 2: Günün Tarifi — random seed based on date
function getDailyRecipeSeed(){var d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();}

// Feature 5: Sağlık Skoru hesaplama (basit kural tabanlı)
function calcSaglikSkor(dish){
  var skor=70; // başlangıç C
  var ml=(dish.malzemeler||[]).map(function(m){return typeof m==="string"?m.toLowerCase():(m.isim||"").toLowerCase();});
  var hasVeg=ml.some(function(m){return /sebze|salata|brokoli|ıspanak|domates|biber|havuç|kabak|patlıcan|enginar|bezelye|fasulye/.test(m);});
  var hasFruit=ml.some(function(m){return /meyve|elma|portakal|çilek|limon|nar|incir/.test(m);});
  var hasProtein=ml.some(function(m){return /tavuk|balık|somon|yumurta|et|hindi|ton|mercimek|nohut/.test(m);});
  var hasProcessed=ml.some(function(m){return /sosis|sucuk|nugget|hazır|konserve|margarin|ketçap|mayonez/.test(m);});
  var hasSugar=ml.some(function(m){return /şeker|çikolata|karamel|şurup|toz şeker/.test(m);});
  if(hasVeg)skor+=12;if(hasFruit)skor+=8;if(hasProtein)skor+=10;
  if(hasProcessed)skor-=20;if(hasSugar)skor-=10;
  var cal=parseInt(dish.kalori)||0;if(cal>0&&cal<400)skor+=5;if(cal>700)skor-=10;
  if(skor>=85)return "A";if(skor>=70)return "B";if(skor>=55)return "C";if(skor>=40)return "D";return "E";
}

// Feature 11: Sağlık Skoru badge component
function SkorBadge(props){var s=props.skor||"C";var renk=SAGLIK_SKOR_RENK[s]||"#999";return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:renk+"22",color:renk,fontSize:10,fontWeight:700,border:"1.5px solid "+renk+"55"}} title={"Sağlık Skoru: "+s}>{s}</span>;}

// Feature 7: Star Rating component
function StarRating(props){
  var current=props.value||0;var onChange=props.onChange;var size=props.size||14;var readonly=props.readonly;
  return <div style={{display:"inline-flex",gap:2}}>{YILDIZ_PUAN.map(function(n){return <span key={n} onClick={function(){if(!readonly&&onChange)onChange(n===current?0:n);}} style={{cursor:readonly?"default":"pointer",fontSize:size,color:n<=current?"#F59E0B":"var(--border)",transition:"color 0.15s"}}>{n<=current?"★":"☆"}</span>;})}</div>;
}

// Feature 15: Bulanık arama
function fuzzyMatch(query,text){
  if(!query||!text) return false;
  var q=query.toLowerCase().replace(/[ğüşıöç]/g,function(c){return{ğ:"g",ü:"u",ş:"s",ı:"i",ö:"o",ç:"c"}[c]||c;});
  var t=text.toLowerCase().replace(/[ğüşıöç]/g,function(c){return{ğ:"g",ü:"u",ş:"s",ı:"i",ö:"o",ç:"c"}[c]||c;});
  if(t.includes(q)) return true;
  // simple Levenshtein distance check for short queries
  if(q.length<=3) return false;
  var qi=0;for(var ti=0;ti<t.length&&qi<q.length;ti++){if(t[ti]===q[qi])qi++;}
  return qi>=q.length*0.7;
}

// Feature 6: PDF export (uses canvas/blob approach)
async function exportToPDF(content,filename){
  var win=window.open("","_blank");
  if(!win){alert("Pop-up engelleyici aktif. Lütfen izin verin.");return;}
  win.document.write("<!DOCTYPE html><html><head><meta charset='utf-8'><title>"+filename+"</title><style>body{font-family:'Inter',system-ui,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#1a1a1a;line-height:1.7}h1{font-size:22px;margin-bottom:6px}h2{font-size:16px;color:#666;margin:20px 0 8px}p{margin:4px 0}.ing{display:inline-block;background:#f4f0e8;padding:3px 10px;border-radius:20px;margin:2px;font-size:13px}.step{margin:6px 0;padding-left:20px}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;margin:2px}.footer{margin-top:30px;padding-top:14px;border-top:1px solid #ddd;font-size:11px;color:#999}@media print{body{padding:20px}}</style></head><body>");
  win.document.write(content);
  win.document.write("<div class='footer'>MasterChef Planner | "+new Date().toLocaleDateString("tr-TR")+"</div></body></html>");
  win.document.close();
  setTimeout(function(){win.print();},500);
}

function dishToHTML(dish){
  var html="<h1>"+(dish.isim||"Tarif")+"</h1>";
  if(dish.ogun)html+="<span class='badge' style='background:#f0e6d0'>"+dish.ogun+"</span> ";
  if(dish.sure)html+="<span class='badge' style='background:#e0f0ff'>⏱ "+dish.sure+"</span> ";
  if(dish.kalori)html+="<span class='badge' style='background:#f0e0f0'>🔥 "+dish.kalori+"</span>";
  if(dish.aciklama)html+="<p style='color:#666;font-style:italic'>"+dish.aciklama+"</p>";
  html+="<h2>Malzemeler</h2><div>";
  (dish.malzemeler||[]).forEach(function(m){
    var txt=typeof m==="string"?m:((m.miktar||"")+" "+m.isim).trim();
    html+="<span class='ing'>"+txt+"</span>";
  });
  html+="</div>";
  if(dish.adimlar&&dish.adimlar.length){
    html+="<h2>Hazırlanış</h2>";
    dish.adimlar.forEach(function(s,i){html+="<div class='step'><b>"+(i+1)+".</b> "+s+"</div>";});
  }
  if(dish.sef_notu)html+="<h2>Şef Notu</h2><p style='background:#fdf6e3;padding:10px 14px;border-radius:8px;border-left:3px solid #d4a843'>"+dish.sef_notu+"</p>";
  return html;
}

// Feature 12: Maliyet hesaplama (basit AI prompt helper)
function buildMaliyetPrompt(dish){
  return "Mutfak ekonomisti. '"+dish.isim+"' tarifinin Türkiye'deki yaklaşık maliyetini hesapla (Mart 2026 fiyatları). Her malzemeye ayrı fiyat ver.\nJSON: toplam_maliyet:string, kisi_basi:string, malzemeler:[{isim:string,miktar:string,fiyat:string}], tasarruf_ipucu:string, maliyet_seviye:string(ucuz/orta/pahali)";
}

// ─── PAZAR TAKVİMİ ────────────────────────────────────────────
var PAZAR_AY={
  1:{urunler:["ispanak","lahana","pirasa","havuc","portakal","mandalina"],tema:"Kis"},
  2:{urunler:["ispanak","brokoli","kereviz","havuc","portakal","limon"],tema:"Kis-Bahar"},
  3:{urunler:["enginar","bakla","taze sarimsak","bezelye","cilek"],tema:"Ilkbahar"},
  4:{urunler:["enginar","bakla","bezelye","semizotu","cilek","kiraz"],tema:"Ilkbahar"},
  5:{urunler:["kabak","bezelye","salatalik","domates","kiraz","kayisi"],tema:"Ilkbahar-Yaz"},
  6:{urunler:["kabak","salatalik","domates","biber","patlican","karpuz"],tema:"Yaz"},
  7:{urunler:["domates","biber","patlican","salatalik","misir","karpuz"],tema:"Yaz"},
  8:{urunler:["domates","biber","patlican","misir","karpuz","uzum","incir"],tema:"Yaz"},
  9:{urunler:["kabak","domates","biber","uzum","incir","armut","nar"],tema:"Sonbahar"},
  10:{urunler:["kabak","havuc","brokoli","elma","nar","ayva","kestane"],tema:"Sonbahar"},
  11:{urunler:["ispanak","lahana","kereviz","havuc","elma","nar","portakal"],tema:"Sonbahar-Kis"},
  12:{urunler:["ispanak","lahana","pirasa","portakal","mandalina","nar"],tema:"Kis"},
};
// ─── AI MEMORY ────────────────────────────────────────────────
async function buildMemoryCtx(user){
  try{
    var fav=await stGet("fav:"+(user||"mis"))||[];
    var hist=await stGet("menu_hist")||[];
    var today=new Date();
    var days=[];
    for(var i=0;i<7;i++){var d=new Date(today);d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
    var all=[];
    for(var i=0;i<days.length;i++){var r=await stGet("nutri:"+days[i]);if(r) all=all.concat(r);}
    var recentNames=[];
    for(var i=0;i<all.length&&recentNames.length<15;i++){if(all[i].isim&&recentNames.indexOf(all[i].isim)===-1) recentNames.push(all[i].isim);}
    var parts=[];
    if(fav.length>0) parts.push("Favoriler: "+fav.slice(0,4).map(function(f){return f.isim;}).join(", "));
    if(recentNames.length>0) parts.push("Son yedikleri: "+recentNames.slice(0,6).join(", "));
    if(hist.length>0){
      var cc={};
      hist.forEach(function(h){try{var k=JSON.parse(h.key||"{}");(k.selC||[]).forEach(function(c){cc[c]=(cc[c]||0)+1;});}catch(e){}});
      var topC=Object.keys(cc).sort(function(a,b){return cc[b]-cc[a];}).slice(0,3);
      if(topC.length) parts.push("Sevdiği mutfaklar: "+topC.join(", "));
    }
    return parts.length?"Kullanici: "+parts.join(" | "):"";
  }catch(e){return "";}
}

// ─── MAKRO TAHMİN ─────────────────────────────────────────────
async function estimateMacros(dishName, kalStr){
  try{
    var kal=parseInt(String(kalStr).match(/[0-9]+/)?.[0])||300;
    var r=await callAI("Yemek: "+dishName+". Kalori ~"+kal+". JSON sadece: protein:number, karbonhidrat:number, yag:number, lif:number, vitamin_c:number(mg), demir:number(mg), kalsiyum:number(mg), magnezyum:number(mg). Tum degerler tam sayi.",350);
    return {protein:r.protein||0,karbonhidrat:r.karbonhidrat||0,yag:r.yag||0,lif:r.lif||0};
  }catch(e){return {protein:0,karbonhidrat:0,yag:0,lif:0};}
}
async function trackMemory(user,selC,dishes){
  try{
    var key="stats:"+(user||"mis");
    var s=await stGet(key)||{menuCount:0,cuisineCount:{},dishCount:{}};
    s.menuCount=(s.menuCount||0)+1;
    (selC||[]).forEach(function(x){s.cuisineCount[x]=(s.cuisineCount[x]||0)+1;});
    (dishes||[]).forEach(function(x){if(x) s.dishCount[x]=(s.dishCount[x]||0)+1;});
    s.lastUsed=new Date().toISOString().slice(0,10);
    await stSet(key,s);
  }catch(e){}
}


// Voice reading
function speak(text){
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u=new SpeechSynthesisUtterance(text);
  u.lang="tr-TR"; u.rate=0.9; u.pitch=1;
  window.speechSynthesis.speak(u);
}
function stopSpeech(){ if (window.speechSynthesis) window.speechSynthesis.cancel(); }

// Share
async function shareMenu(text,title){
  if (navigator.share){try{await navigator.share({title:title||"Master Chef Menüm",text:text});return;}catch(e){}}
  try{await navigator.clipboard.writeText(text); alert("Panoya kopyalandı!");}catch(e){alert("Paylaşım desteklenmiyor.");}
}

// QR Code generation (simple text-based QR via external API)
function generateQRDataUrl(text){
  return "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="+encodeURIComponent(text);
}

// QR Share Modal component
function QRShareModal(props){
  var text=props.text||"";
  var title=props.title||"Tarif Paylaş";
  var [copied,setCopied]=useState(false);
  function copy(){navigator.clipboard.writeText(text).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);});}
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,overflowY:"auto"}} onClick={props.onClose}>
    <div className="up" style={{background:"var(--card)",borderRadius:18,padding:"16px 20px 20px",maxWidth:340,width:"100%",textAlign:"center",position:"relative",maxHeight:"85vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
      <button onClick={props.onClose} style={{position:"absolute",top:10,right:12,background:"none",border:"none",color:"var(--muted)",fontSize:20,cursor:"pointer",lineHeight:1,padding:4,zIndex:2}}>✕</button>
      <div style={{fontSize:15,fontWeight:700,color:"var(--cream)",fontFamily:"'Playfair Display',serif",marginBottom:12,paddingRight:28}}>{title}</div>
      <div style={{background:"#fff",borderRadius:12,padding:12,display:"inline-block",marginBottom:12}}>
        <img src={generateQRDataUrl(text)} alt="QR Code" style={{width:160,height:160,display:"block"}}/>
      </div>
      <div style={{fontSize:11,color:"var(--muted)",marginBottom:10,maxHeight:60,overflowY:"auto",textAlign:"left",padding:"6px 10px",background:"var(--card2)",borderRadius:8,lineHeight:1.5}}>{text.slice(0,200)}{text.length>200?"…":""}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={copy} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>{copied?"✓ Kopyalandı":"📋 Kopyala"}</button>
        <button onClick={props.onClose} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",fontSize:12}}>Kapat</button>
      </div>
    </div>
  </div>;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────
function Spinner(props){var size=props.size||16,color=props.color||C.gold;return <span style={{display:"inline-block",width:size,height:size,flexShrink:0,borderRadius:"50%",border:"2px solid "+color+"33",borderTopColor:color,animation:"spin 0.7s linear infinite"}}/>;}
function SH(props){return <div style={{marginBottom:12}}><div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--muted)",fontWeight:500,marginBottom:4,fontFamily:"var(--sans)"}}>{props.label}</div>{props.sub?<div style={{fontSize:12,color:"var(--muted)",lineHeight:1.5}}>{props.sub}</div>:null}</div>;}
function ErrBox(props){if (!props.msg) return null;return <div style={{padding:"11px 15px",borderRadius:11,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><span style={{flex:1,minWidth:0}}>⚠ {props.msg}</span>{props.onRetry&&<button onClick={props.onRetry} style={{flexShrink:0,padding:"5px 12px",borderRadius:8,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tekrar dene</button>}</div>;}
function GoldBtn(props){var ld=props.loading;return <button onClick={props.onClick} disabled={props.disabled||ld} style={{width:"100%",padding:"14px",border:"1px solid var(--accent)",background:ld?"transparent":"var(--accent)",color:ld?"var(--muted)":"var(--bg)",fontSize:13,fontWeight:500,fontFamily:"var(--sans)",letterSpacing:"0.06em",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:ld?0.5:1}}>{props.children}</button>;}
function TabHeader(props){return <div style={{background:"var(--bg)",padding:"24px 20px 20px",marginBottom:0,borderBottom:"0.5px solid var(--border)"}}><div style={{fontSize:10,letterSpacing:"0.18em",color:"var(--muted)",textTransform:"uppercase",fontWeight:500,marginBottom:8,fontFamily:"var(--sans)"}}>{props.sub}</div><h2 style={{fontFamily:"var(--serif)",fontSize:28,fontWeight:500,color:"var(--text)",marginBottom:props.desc?6:0,lineHeight:1.2}}>{props.title}</h2>{props.desc?<p style={{fontSize:14,color:"var(--muted)",lineHeight:1.5,fontFamily:"var(--sans)"}}>{props.desc}</p>:null}</div>;}

function ThemeToggle(props){
  var idx=THEMES.findIndex(function(t){return t.id===props.themeId;})+1;
  return <button onClick={props.onToggle} title={"Tema: "+props.themeName+" ("+idx+"/"+THEMES.length+")"} aria-label="Tema değiştir" style={{position:"fixed",top:10,right:12,zIndex:601,background:"var(--accent)",border:"none",padding:"8px 14px",borderRadius:20,fontSize:13,color:"var(--bg)",cursor:"pointer",fontFamily:"var(--sans)",fontWeight:600,letterSpacing:"0.04em",display:"flex",alignItems:"center",gap:6,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>
    <span style={{fontSize:14}}>🎨</span>
    <span style={{fontSize:11}}>{props.themeName}</span>
    <span style={{fontSize:10,opacity:0.7}}>{idx}/{THEMES.length}</span>
  </button>;
}

// ─── DETAIL PANEL ────────────────────────────────────────────



// ─── MENÜ KARTI EXPORT ───────────────────────────────────────
function rrect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
function exportMenuCard(dayData,isDark){
  var W=800,H=560;
  var cv=document.createElement("canvas");cv.width=W;cv.height=H;
  var ctx=cv.getContext("2d");
  var bg=ctx.createLinearGradient(0,0,W,H);
  if(isDark){bg.addColorStop(0,"#0A0A0A");bg.addColorStop(1,"#160F04");}
  else{bg.addColorStop(0,"#F5EFE0");bg.addColorStop(1,"#EDE3C8");}
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Border
  ctx.strokeStyle="rgba(212,168,67,0.35)";ctx.lineWidth=1.5;rrect(ctx,12,12,W-24,H-24,14);ctx.stroke();
  // Header
  ctx.fillStyle="#D4A843";ctx.font="bold 10px sans-serif";ctx.textAlign="center";
  ctx.fillText("MASTER CHEF PLANNER",W/2,40);
  ctx.fillStyle=isDark?"#F5EFE0":"#1A1A1A";ctx.font="bold 24px Georgia,serif";
  ctx.fillText((dayData.menu_adi||"Gunun Menusu").slice(0,40),W/2,76);
  if(dayData.aciklama){ctx.fillStyle="#888";ctx.font="italic 12px sans-serif";ctx.fillText(dayData.aciklama.slice(0,70),W/2,98);}
  ctx.strokeStyle="rgba(212,168,67,0.3)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(50,112);ctx.lineTo(W-50,112);ctx.stroke();
  // Dishes
  var dishes=dayData.dishes||[];
  var cols=2,cw=(W-80)/cols,rh=88;
  var colMap={"Kahvalt\u0131":"#E8A030","Ogle":"#4CAF7A","Aksam Yemegi":"#9B7FD4"};
  dishes.slice(0,6).forEach(function(dish,i){
    var cx=40+(i%cols)*cw,cy=122+Math.floor(i/cols)*rh;
    var dc=colMap[dish.ogun]||"#D4A843";
    ctx.fillStyle=isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)";
    rrect(ctx,cx,cy,cw-14,rh-8,8);ctx.fill();
    ctx.strokeStyle=dc+"33";ctx.lineWidth=1;rrect(ctx,cx,cy,cw-14,rh-8,8);ctx.stroke();
    ctx.fillStyle=dc;ctx.beginPath();ctx.arc(cx+13,cy+13,3.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isDark?"#F5EFE0":"#1A1A1A";ctx.font="bold 13px sans-serif";ctx.textAlign="left";
    ctx.fillText(dish.isim.slice(0,26)+(dish.isim.length>26?"...":""),cx+23,cy+17);
    ctx.fillStyle="#666";ctx.font="11px sans-serif";
    ctx.fillText(([dish.sure,dish.kalori].filter(Boolean).join("  ·  ")).slice(0,30),cx+23,cy+33);
    ctx.fillStyle="#555";ctx.font="11px sans-serif";
    var ml=(dish.malzemeler||[]).slice(0,3).join(", ");
    ctx.fillText(ml.slice(0,34)+(ml.length>34?"...":""),cx+23,cy+49);
  });
  // Footer
  ctx.fillStyle="#444";ctx.font="10px sans-serif";ctx.textAlign="center";
  ctx.fillText(new Date().toLocaleDateString("tr-TR"),W/2,H-20);
  var a=document.createElement("a");a.download="menu-"+(dayData.gunNo||1)+".png";a.href=cv.toDataURL("image/png");a.click();
}

// ─── BİLDİRİM ─────────────────────────────────────────────────
var OGÜN_S=[{id:"kahvalti",label:"Kahvalti",time:"08:00",emoji:"🥐"},{id:"ogle",label:"Ogle",time:"12:30",emoji:"🥗"},{id:"ikindi",label:"Ikindi",time:"16:00",emoji:"🍿"},{id:"aksam",label:"Aksam",time:"19:00",emoji:"🍽️"}];
function BildirimPanel(){
  var hasPerm=typeof Notification!=="undefined";
  var [perm,setPerm]=useState(hasPerm?Notification.permission:"denied");
  var [aktif,setAktif]=useState({});
  var [times,setTimes]=useState({});
  var ivs=useRef({});
  useEffect(function(){stGet("notif_s").then(function(s){if(s){setAktif(s.a||{});setTimes(s.t||{});}});},[]);
  function reqPerm(){if(!hasPerm){alert("Bildirim desteklenmiyor.");return;}Notification.requestPermission().then(setPerm);}
  function schedule(id,t,label){
    var now=new Date(),pts=t.split(":");
    var next=new Date(now.getFullYear(),now.getMonth(),now.getDate(),parseInt(pts[0]),parseInt(pts[1]),0);
    if(next<=now) next.setDate(next.getDate()+1);
    clearTimeout(ivs.current[id]);
    ivs.current[id]=setTimeout(function(){
      if(typeof Notification!=="undefined"&&Notification.permission==="granted") new Notification(label+" vakti!",{body:"Master Chef Planner"});
      schedule(id,t,label);
    },next-now);
  }
  function cancel(id){clearTimeout(ivs.current[id]);}
  async function toggle(id,label,t){
    var na=Object.assign({},aktif);na[id]=!na[id];setAktif(na);
    if(na[id]) schedule(id,t,label); else cancel(id);
    await stSet("notif_s",{a:na,t:times});
  }
  return <div style={{padding:"14px 16px"}}>
    {perm!=="granted"&&<div style={{padding:"11px 13px",background:"rgba(91,163,208,0.07)",borderRadius:10,border:"1px solid rgba(91,163,208,0.2)",display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
      <div style={{flex:1,fontSize:12,color:C.muted}}>{perm==="denied"?"Bildirim izni reddedildi":"Hatirlatici icin izin gerekiyor"}</div>
      {perm!=="denied"&&<button onClick={reqPerm} style={{padding:"6px 12px",borderRadius:8,border:"none",background:C.blue,color:"#fff",fontSize:12,fontWeight:600}}>Izin Ver</button>}
    </div>}
    {OGÜN_S.map(function(o){
      var on=aktif[o.id];var t=times[o.id]||o.time;
      return <div key={o.id} style={{display:"flex",alignItems:"center",gap:11,padding:"11px 13px",background:"var(--card)",borderRadius:11,border:"1px solid "+(on?"rgba(212,168,67,0.3)":"var(--border)"),marginBottom:7}}>
        <span style={{fontSize:18}}>{o.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:2}}>{o.label}</div>
          <input type="time" value={t} onChange={function(e){var nt=Object.assign({},times);nt[o.id]=e.target.value;setTimes(nt);if(on){cancel(o.id);schedule(o.id,e.target.value,o.label);}stSet("notif_s",{a:aktif,t:nt});}} style={{fontSize:11,color:C.muted,background:"transparent",border:"none",padding:0}}/>
        </div>
        <div onClick={function(){if(perm==="granted") toggle(o.id,o.label,t);else reqPerm();}} style={{width:42,height:23,borderRadius:11,background:on?"linear-gradient(90deg,"+C.gold+","+C.goldL+")":"var(--card2)",border:"1px solid "+(on?"transparent":"var(--border)"),cursor:"pointer",position:"relative",flexShrink:0}}>
          <div style={{position:"absolute",top:3,left:on?21:3,width:15,height:15,borderRadius:"50%",background:on?"#000":"var(--muted)",transition:"left 0.18s"}}/>
        </div>
      </div>;
    })}
  </div>;
}
// ─── AİLE PROFİLLERİ ─────────────────────────────────────────
var DIYET_OPT=["Normal","Vejetaryen","Vegan","Keto","Glutensiz","Diyabetik","Dusuk Tuz","Sut Alerjisi","Findik Alerjisi"];
function AileModal(props){
  var [profiller,setProfiller]=useState(props.profiller||[]);
  var [edit,setEdit]=useState(null);
  var RENK=["#D4A843","#4CAF7A","#5BA3D0","#E05252","#9B7FD4","#F97316"];
  function newProf(){setEdit({idx:-1,isim:"",yas:"",diyet:[]});}
  function saveEdit(){
    if(!edit.isim.trim()) return;
    var p=profiller.slice();
    var item={isim:edit.isim,yas:edit.yas,diyet:edit.diyet.slice()};
    if(edit.idx===-1) p.push(item); else p[edit.idx]=item;
    setProfiller(p);setEdit(null);props.onSave(p);
  }
  function delProf(i){var p=profiller.slice();p.splice(i,1);setProfiller(p);props.onSave(p);}
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1500,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div className="up" style={{width:"100%",maxWidth:500,background:"var(--card)",borderRadius:"20px 20px 0 0",padding:"20px 20px 32px",maxHeight:"85vh",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:16}}>
        <div style={{flex:1,fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.cream}}>Aile Profilleri</div>
        <button onClick={props.onClose} style={{background:"transparent",border:"1px solid var(--border)",borderRadius:9,color:C.muted,padding:"5px 10px",fontSize:12}}>✕</button>
      </div>
      {!edit&&<div>
        {profiller.map(function(p,i){var rc=RENK[i%RENK.length];return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",background:"var(--card2)",borderRadius:11,border:"1px solid var(--border)",marginBottom:7}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:rc+"22",border:"2px solid "+rc+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{p.isim[0]||"?"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.cream}}>{p.isim}{p.yas?" ("+p.yas+"y)":""}</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:3}}>
              {(p.diyet||[]).map(function(d,j){return <span key={j} style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:rc+"15",color:rc}}>{d}</span>;})}
              {(!p.diyet||p.diyet.length===0)&&<span style={{fontSize:10,color:C.dim}}>Kisitlama yok</span>}
            </div>
          </div>
          <button onClick={function(){setEdit(Object.assign({},p,{idx:i,diyet:(p.diyet||[]).slice()}));}} style={{padding:"5px 8px",borderRadius:7,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>✏️</button>
          <button onClick={function(){delProf(i);}} style={{padding:"5px 8px",borderRadius:7,border:"1px solid rgba(224,82,82,0.3)",background:"transparent",color:C.red,fontSize:11}}>✕</button>
        </div>;})}
        {profiller.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13}}>Henuz profil eklenmedi</div>}
        <button onClick={newProf} style={{width:"100%",padding:"11px",borderRadius:11,border:"2px dashed rgba(212,168,67,0.35)",background:C.goldDim,color:C.goldL,fontSize:13,fontWeight:600,marginTop:4}}>+ Profil Ekle</button>
      </div>}
      {edit&&<div className="up">
        <div style={{fontSize:13,fontWeight:700,color:C.cream,marginBottom:12}}>{edit.idx===-1?"Yeni Profil":"Profili Duzenle"}</div>
        <input value={edit.isim} onChange={function(e){setEdit(Object.assign({},edit,{isim:e.target.value}));}} placeholder="Isim (or. Ayse, Cocuk)" style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13,marginBottom:8}}/>
        <input value={edit.yas} onChange={function(e){setEdit(Object.assign({},edit,{yas:e.target.value}));}} placeholder="Yas (opsiyonel)" type="number" style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13,marginBottom:11}}/>
        <div style={{fontSize:11,color:C.muted,marginBottom:8,fontWeight:600}}>Diyet ve Alerji</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {DIYET_OPT.map(function(d){var on=(edit.diyet||[]).indexOf(d)!==-1;return <button key={d} onClick={function(){var nd=on?(edit.diyet||[]).filter(function(x){return x!==d;}):(edit.diyet||[]).concat([d]);setEdit(Object.assign({},edit,{diyet:nd}));}} style={{padding:"5px 10px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?C.goldDim:"transparent",color:on?C.goldL:C.muted}}>{d}</button>;})}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setEdit(null);}} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:13}}>Iptal</button>
          <button onClick={saveEdit} style={{flex:2,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,"+C.gold+","+C.goldL+")",color:"#000",fontSize:13,fontWeight:700}}>Kaydet</button>
        </div>
      </div>}
    </div>
  </div>;
}
// ─── PİŞİRME MODU ────────────────────────────────────────────
function PisirmeModu(props){
  var d=props.data, col=props.col||"#D4A843";
  var [step,setStep]=useState(0);
  var [timerVal,setTimerVal]=useState(null);
  var [running,setRunning]=useState(false);
  var ivRef=useRef(null);
  var adimlar=d.adimlar||[];
  var cur=adimlar[step]||"";
  function parseSec(txt){
    var m=txt.match(/([0-9]+)[ ]*(dakika|dk|saat)/i);
    if(!m) return null;
    var v=parseInt(m[1]);
    return m[2].toLowerCase().startsWith("saat")?v*3600:v*60;
  }
  var stepSec=parseSec(cur);
  useEffect(function(){setTimerVal(stepSec);setRunning(false);if(ivRef.current) clearInterval(ivRef.current);},[step]);
  useEffect(function(){
    if(running&&timerVal>0){
      ivRef.current=setInterval(function(){
        setTimerVal(function(t){if(t<=1){clearInterval(ivRef.current);setRunning(false);return 0;}return t-1;});
      },1000);
    } else {clearInterval(ivRef.current);}
    return function(){clearInterval(ivRef.current);};
  },[running]);
  function fmt(s){var m=Math.floor(s/60),sc=s%60;return String(m).padStart(2,"0")+":"+String(sc).padStart(2,"0");}

  // Sesli komut
  var recRef=useRef(null);
  var [listening,setListening]=useState(false);
  function startVoice(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Tarayıcınız sesli komut desteklemiyor.");return;}
    if(listening){recRef.current&&recRef.current.stop();setListening(false);return;}
    var rec=new SR();recRef.current=rec;
    rec.lang="tr-TR";rec.continuous=false;rec.interimResults=false;
    rec.onstart=function(){setListening(true);};
    rec.onend=function(){setListening(false);};
    rec.onerror=function(){setListening(false);};
    rec.onresult=function(e){
      var t=(e.results[0][0].transcript||"").toLowerCase().trim();
      if(t.includes("sonraki")||t.includes("devam")){if(step<adimlar.length-1){setStep(step+1);speak("Adım "+(step+2)+". "+adimlar[step+1]);}}
      else if(t.includes("geri")||t.includes("önceki")){if(step>0){setStep(step-1);speak("Adım "+step+". "+adimlar[step-1]);}}
      else if(t.includes("başlat")||t.includes("timer")){setRunning(true);speak("Timer başladı.");}
      else if(t.includes("dur")||t.includes("durdur")){setRunning(false);speak("Timer durdu.");}
      else if(t.includes("malzeme")){speak("Malzemeler: "+(d.malzemeler||[]).map(function(m){return m.miktar+" "+m.isim;}).join(", "));}
      else if(t.includes("tekrar")||t.includes("oku")){speak(cur);}
      else{speak("Anlamadım. Sonraki adım, geri, timer başlat veya malzemeler diyebilirsiniz.");}
    };
    rec.start();
  }
  var pct=Math.round(((step+1)/Math.max(adimlar.length,1))*100);
  return <div style={{position:"fixed",inset:0,background:"var(--bg)",zIndex:2000,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{padding:"14px 16px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
      <button onClick={props.onClose} style={{width:34,height:34,borderRadius:"50%",border:"1px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:col,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:1}}>Pişirme Modu</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:C.cream}}>{d.isim}</div>
      </div>
      <div style={{fontSize:12,color:C.muted}}>{step+1}/{adimlar.length}</div>
      <button onClick={startVoice} title="Sesli komut" style={{width:34,height:34,borderRadius:"50%",border:"1.5px solid "+(listening?"rgba(224,82,82,0.5)":"rgba(212,168,67,0.3)"),background:listening?"rgba(224,82,82,0.1)":C.goldDim,color:listening?C.red:C.gold,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {listening?"🔴":"🎙️"}
      </button>
    </div>
    <div style={{height:3,background:"var(--border)",flexShrink:0}}>
      <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+col+","+col+"99)",transition:"width 0.4s"}}/>
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px 24px",textAlign:"center"}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:col+"18",border:"2px solid "+col+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:col,marginBottom:18}}>{step+1}</div>
      <p style={{fontSize:21,fontWeight:500,color:C.cream,lineHeight:1.55,marginBottom:24,maxWidth:460}}>{cur}</p>
      <div style={{fontSize:10,color:listening?C.red:C.dim,marginBottom:12,display:"flex",alignItems:"center",gap:5,justifyContent:"center"}}>
        {listening?<><span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:C.red,animation:"pulse 0.8s infinite"}}/>Dinliyorum…</>:<span>🎙️ Sesli komut: "Sonraki" · "Geri" · "Timer başlat" · "Malzemeler"</span>}
      </div>
      {stepSec&&<div style={{marginBottom:16}}>
        <div style={{fontSize:48,fontWeight:700,color:timerVal===0?C.red:running?col:C.muted,fontFamily:"monospace",marginBottom:10}}>{fmt(timerVal===null?stepSec:timerVal)}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <button onClick={function(){setTimerVal(stepSec);setRunning(false);}} style={{padding:"8px 14px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:12}}>↺ Sıfırla</button>
          <button onClick={function(){setRunning(!running);}} style={{padding:"8px 20px",borderRadius:9,border:"1.5px solid "+col,background:running?"rgba(224,82,82,0.1)":col+"18",color:running?C.red:col,fontSize:13,fontWeight:700}}>{running?"⏸ Dur":"▶ Başlat"}</button>
        </div>
        {timerVal===0&&<div style={{marginTop:10,fontSize:14,color:C.green,fontWeight:700}}>✅ Süre doldu!</div>}
      </div>}
    </div>
    <div style={{padding:"14px 18px 28px",display:"flex",gap:8,flexShrink:0,borderTop:"1px solid var(--border)"}}>
      <button onClick={function(){if(step>0)setStep(step-1);}} disabled={step===0} style={{flex:1,padding:"13px",borderRadius:11,border:"1.5px solid var(--border)",background:"var(--card)",color:step===0?C.dim:C.muted,fontSize:14,fontWeight:600,opacity:step===0?0.4:1}}>← Geri</button>
      {step<adimlar.length-1
        ?<button onClick={function(){setStep(step+1);}} style={{flex:2,padding:"13px",borderRadius:11,border:"none",background:"linear-gradient(135deg,"+col+","+col+"bb)",color:"#000",fontSize:14,fontWeight:700}}>Sonraki →</button>
        :<button onClick={props.onClose} style={{flex:2,padding:"13px",borderRadius:11,border:"none",background:"linear-gradient(135deg,"+C.green+",#2d9a5f)",color:"#fff",fontSize:14,fontWeight:700}}>✅ Tamamlandı!</button>
      }
    </div>
    <div style={{padding:"8px 16px 14px",borderTop:"1px solid var(--border)",flexShrink:0}}>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {(d.malzemeler||[]).map(function(m,i){return <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",color:C.muted}}>{m.miktar} {m.isim}</span>;})}
      </div>
    </div>
  </div>;
}
function scaleMiktar(str,factor){if(!str||factor===1)return str;var m=String(str).match(/^([0-9]+[.,]?[0-9]*)\s*(.*)$/);if(!m)return str;var num=parseFloat(m[1].replace(",","."));if(isNaN(num))return str;var rest=m[2]||"";var scaled=Math.round(num*factor*100)/100;return scaled+(rest?" "+rest:"");}
var DetailPanel=memo(function DetailPanel(props){
  var d=props.data,col=props.col,baseKisi=props.baseKisi||2;
  var [speaking,setSpeaking]=useState(false);
  var [pisirme,setPisirme]=useState(false);
  var [porsiyonGoster,setPorsiyonGoster]=useState(baseKisi);
  var scale=porsiyonGoster/baseKisi;
  function doSpeak(){
    var mals=(d.malzemeler||[]).map(function(m){return scaleMiktar(m.miktar,scale)+" "+m.isim;});
    var t=d.isim+". Malzemeler: "+mals.join(", ")+". Hazırlanış: "+(d.adimlar||[]).join(". ");
    speak(t); setSpeaking(true);
  }
  function doStop(){ stopSpeech(); setSpeaking(false); }
  return <div style={{background:"var(--card2)",padding:"16px 18px",borderRadius:"0 0 14px 14px",border:"1px solid var(--border)",borderTop:"none"}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
      {d.sure?<span style={{padding:"4px 11px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue,fontSize:11}}>⏱ {d.sure}</span>:null}
      {d.porsiyon?<span style={{padding:"4px 11px",borderRadius:50,background:"var(--card)",color:C.muted,fontSize:11}}>🍽 {d.porsiyon}</span>:null}
      {d.kalori?<span style={{padding:"4px 11px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple,fontSize:11}}>🔥 {d.kalori}</span>:null}
      <span style={{fontSize:10,color:C.muted,marginRight:4}}>Porsiyon:</span>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{[1,2,3,4,5,6,8,10,12,15,20].map(function(n){return <button key={n} onClick={function(){setPorsiyonGoster(n);}} style={{padding:"3px 8px",borderRadius:6,border:"1px solid "+(porsiyonGoster===n?C.gold:"var(--border)"),background:porsiyonGoster===n?C.goldDim:"transparent",color:porsiyonGoster===n?C.goldL:C.muted,fontSize:11}}>{n}</button>;})}</div>
      <div style={{flex:1}}/>
      <button onClick={speaking?doStop:doSpeak} style={{padding:"5px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(speaking?"rgba(224,82,82,0.4)":"rgba(212,168,67,0.3)"),background:speaking?"rgba(224,82,82,0.08)":C.goldDim,color:speaking?C.red:C.goldL,display:"flex",alignItems:"center",gap:5}}>
        {speaking?"⏹ Durdur":"🔊 Sesli Oku"}
      </button>
      {(d.adimlar||[]).length>0&&<button onClick={function(){setPisirme(true);}} style={{padding:"5px 13px",borderRadius:50,fontSize:11,border:"1.5px solid rgba(76,175,122,0.4)",background:"rgba(76,175,122,0.1)",color:C.green,fontWeight:600}}>👨‍🍳 Pişirmeye Başla</button>}
    </div>
    {pisirme&&<PisirmeModu data={d} col={col} onClose={function(){setPisirme(false);}}/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:col,fontWeight:700,marginBottom:9}}>Malzemeler{porsiyonGoster!==baseKisi?" ("+porsiyonGoster+" kişi)":""}</div>
        {(d.malzemeler||[]).map(function(m,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,flexShrink:0,fontSize:9,marginTop:4}}>◆</span><span style={{color:C.muted,minWidth:36,fontSize:12}}>{scaleMiktar(m.miktar,scale)}</span><span style={{color:C.cream,fontSize:12}}>{m.isim}</span></div>;})}
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:col,fontWeight:700,marginBottom:9}}>Hazırlanış</div>
        {(d.adimlar||[]).map(function(s,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:18}}>{i+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
      </div>
    </div>
    {d.sef_notu?<div style={{marginTop:12,padding:"10px 14px",background:C.goldDim,borderRadius:9,border:"1px solid rgba(212,168,67,0.2)"}}><span style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>👨‍🍳 Şef Notu  </span><span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>{d.sef_notu}</span></div>:null}
  </div>;
});

// ─── SHARED ACTION BUTTONS (Tatlı, Ekmek, İçecek, vb.) ─────
function DishActionButtons(props){
  var dish=props.dish; var col=props.col||C.gold;
  var [pufOpen,setPufOpen]=useState(false);var [pufData,setPufData]=useState(null);var [pufLoad,setPufLoad]=useState(false);var [pufErr,setPufErr]=useState(null);
  var [saglikOpen,setSaglikOpen]=useState(false);var [saglikData,setSaglikData]=useState(null);var [saglikLoad,setSaglikLoad]=useState(false);var [saglikErr,setSaglikErr]=useState(null);
  var [eslesmeOpen,setEslesmeOpen]=useState(false);var [eslesmeData,setEslesmeData]=useState(null);var [eslesmeLoad,setEslesmeLoad]=useState(false);var [eslesmeErr,setEslesmeErr]=useState(null);
  var [hazirlikOpen,setHazirlikOpen]=useState(false);var [hazirlikData,setHazirlikData]=useState(null);var [hazirlikLoad,setHazirlikLoad]=useState(false);var [hazirlikErr,setHazirlikErr]=useState(null);
  var [varyasyonOpen,setVaryasyonOpen]=useState(false);var [varyasyonData,setVaryasyonData]=useState(null);var [varyasyonLoad,setVaryasyonLoad]=useState(false);var [varyasyonErr,setVaryasyonErr]=useState(null);
  var [tarihOpen,setTarihOpen]=useState(false);var [tarihData,setTarihData]=useState(null);var [tarihLoad,setTarihLoad]=useState(false);var [tarihErr,setTarihErr]=useState(null);
  var [kimlerOpen,setKimlerOpen]=useState(false);var [kimlerData,setKimlerData]=useState(null);var [kimlerLoad,setKimlerLoad]=useState(false);var [kimlerErr,setKimlerErr]=useState(null);
  var [ikameOpen,setIkameOpen]=useState(false);var [ikameLoad,setIkameLoad]=useState(false);var [ikameData,setIkameData]=useState(null);var [ikameErr,setIkameErr]=useState(null);var [ikameSorgu,setIkameSorgu]=useState("");
  var dishType=props.dishType||"yemek";
  function _load(key,prompt,setOpen,setData,setLoad,setErr,openV,dataV,errV,forceRefresh){
    if(!forceRefresh&&dataV){setOpen(!openV);return;}if(!forceRefresh&&errV){setOpen(!openV);return;}
    setOpen(true);setLoad(true);setErr(null);
    var cacheKey=key+":"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setData(c);setLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI(prompt,900).then(function(r){aiCacheSet(cacheKey,r);setData(r);setLoad(false);}).catch(function(e){setErr(e&&e.message?e.message:"API hatası");setLoad(false);});}
  }
  function loadPuf(f){_load("puf","Turkish chef. "+dish.isim+" ("+dishType+") icin 5 pratik pisirme/hazirlama ipucu. Her ipucu 1-2 cumle Turkce. Kisaca tut.\nJSON: baslik string, ipuclari:[{baslik,aciklama}]",setPufOpen,setPufData,setPufLoad,setPufErr,pufOpen,pufData,pufErr,f);}
  function loadSaglik(f){_load("saglik","Turkish nutritionist. "+dish.isim+" ("+dishType+") icin kisaca Turkce saglik analizi yap. Maksimum 3 fayda, her aciklama 1 cumle.\nJSON sadece: baslik string, faydalar:[{baslik,aciklama}], dikkat:string, kalori_not:string, oneri:string",setSaglikOpen,setSaglikData,setSaglikLoad,setSaglikErr,saglikOpen,saglikData,saglikErr,f);}
  function loadEslesme(f){_load("eslesme","Somelier ve yemek uzmani. "+dish.isim+" ("+dishType+") icin Turkce eslestirme onerileri. Kisaca tut, her aciklama max 1 cumle.\nJSON: icecekler:[{isim,neden}], yan_yemekler:[{isim,neden}], kacinin:string",setEslesmeOpen,setEslesmeData,setEslesmeLoad,setEslesmeErr,eslesmeOpen,eslesmeData,eslesmeErr,f);}
  function loadHazirlik(f){_load("hazirlik","Mutfak uzmani. "+dish.isim+" ("+dishType+") icin Turkce hazirlik ve saklama plani. Kisa tut.\nJSON: onceden_hazirlik:string, saklama_suresi:string, saklama_yontemi:string, isitma:string, meal_prep:string",setHazirlikOpen,setHazirlikData,setHazirlikLoad,setHazirlikErr,hazirlikOpen,hazirlikData,hazirlikErr,f);}
  function loadVaryasyon(f){_load("varyasyon","Yaratici sef. "+dish.isim+" ("+dishType+") icin Turkce varyasyon ve degisim onerileri. Kisa tut.\nJSON: varyasyonlar:[{isim,aciklama}], malzeme_degisim:[{original,alternatif,neden}], sef_notu:string",setVaryasyonOpen,setVaryasyonData,setVaryasyonLoad,setVaryasyonErr,varyasyonOpen,varyasyonData,varyasyonErr,f);}
  function loadTarih(f){_load("tarih","Mutfak tarihcisi. "+dish.isim+" ("+dishType+") yemeginin Turkce tarih ve kultur bilgisi. Kisa tut.\nJSON: koken:string, tarih:string, yayilim:string, ilginc_bilgi:string",setTarihOpen,setTarihData,setTarihLoad,setTarihErr,tarihOpen,tarihData,tarihErr,f);}
  function loadKimler(f){_load("kimler","Diyetisyen. "+dish.isim+" ("+dishType+") icin Turkce uygunluk analizi. Kisa tut, her aciklama 1 cumle.\nJSON: uygun:[{grup,neden}], dikkatli:[{grup,neden}], uygun_degil:[{grup,neden}]",setKimlerOpen,setKimlerData,setKimlerLoad,setKimlerErr,kimlerOpen,kimlerData,kimlerErr,f);}
  function loadIkame(){setIkameOpen(!ikameOpen);}
  async function doIkame(){
    if(!ikameSorgu.trim()) return;setIkameLoad(true);setIkameErr(null);setIkameData(null);
    callAI("Mutfak uzmani. '"+dish.isim+"' icin '"+ikameSorgu+"' yerine ne kullanilabilir? JSON: orijinal:string, alternatifler:[{isim:string,oran:string,not:string}], en_iyi:string, uyari:string",400)
      .then(function(r){setIkameData(r);setIkameLoad(false);}).catch(function(e){setIkameErr(e.message||"Hata");setIkameLoad(false);});
  }
  var btnStyle=function(open,c){return {padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(open?c+"66":"var(--border)"),background:open?c+"14":"transparent",color:open?c:C.muted,display:"flex",alignItems:"center",gap:3};};
  return <div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:8}}>
      <button onClick={function(){loadPuf();}} style={btnStyle(pufOpen,C.green)}>{pufLoad?<Spinner size={9} color={C.green}/>:"💡"}<span>Püf</span></button>
      <button onClick={function(){loadSaglik();}} style={btnStyle(saglikOpen,C.gold)}>{saglikLoad?<Spinner size={9} color={C.gold}/>:"🌿"}<span>Sağlık</span></button>
      <button onClick={function(){loadEslesme();}} style={btnStyle(eslesmeOpen,C.teal)}>{eslesmeLoad?<Spinner size={9} color={C.teal}/>:"🍷"}<span>Eşleşme</span></button>
      <button onClick={function(){loadHazirlik();}} style={btnStyle(hazirlikOpen,C.blue)}>{hazirlikLoad?<Spinner size={9} color={C.blue}/>:"⏰"}<span>Hazırlık</span></button>
      <button onClick={function(){loadVaryasyon();}} style={btnStyle(varyasyonOpen,C.orange)}>{varyasyonLoad?<Spinner size={9} color={C.orange}/>:"🔄"}<span>Varyasyon</span></button>
      <button onClick={function(){loadTarih();}} style={btnStyle(tarihOpen,C.purple)}>{tarihLoad?<Spinner size={9} color={C.purple}/>:"🌍"}<span>Tarih</span></button>
      <button onClick={function(){loadKimler();}} style={btnStyle(kimlerOpen,C.pink)}>{kimlerLoad?<Spinner size={9} color={C.pink}/>:"👥"}<span>Kimler</span></button>
      <button onClick={loadIkame} style={btnStyle(ikameOpen,C.teal)}>{ikameLoad?<Spinner size={9} color={C.teal}/>:"🧂"}<span>İkame</span></button>
    </div>
    {pufOpen&&<div className="up" style={{background:"rgba(76,175,122,0.05)",borderRadius:12,border:"1px solid rgba(76,175,122,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em"}}>💡 Püf Noktaları</div>{pufData&&!pufLoad&&<button onClick={function(){loadPuf(true);}} style={{fontSize:10,color:C.gold,background:"transparent",border:"none"}}>🔄</button>}</div>
      {pufLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.green}/><span style={{fontSize:12,color:C.green}}>Hazırlanıyor…</span></div>}
      {pufErr&&<div style={{fontSize:12,color:C.red}}>⚠ {pufErr} <button onClick={function(){setPufData(null);setPufErr(null);loadPuf(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {pufData&&(pufData.ipuclari||[]).map(function(ip,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:7,paddingBottom:7,borderBottom:i<(pufData.ipuclari.length-1)?"1px solid rgba(76,175,122,0.1)":"none"}}><span style={{color:C.green,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{i+1}.</span><div><div style={{fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2}}>{ip.baslik||""}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{ip.aciklama||""}</div></div></div>;})}
    </div>}
    {saglikOpen&&<div className="up" style={{background:"rgba(212,168,67,0.04)",borderRadius:12,border:"1px solid rgba(212,168,67,0.18)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>🌿 Sağlık Analizi</div>
      {saglikLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.gold}/><span style={{fontSize:12,color:C.gold}}>Analiz ediliyor…</span></div>}
      {saglikErr&&<div style={{fontSize:12,color:C.red}}>⚠ {saglikErr} <button onClick={function(){setSaglikData(null);setSaglikErr(null);loadSaglik(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {saglikData&&<div>
        {saglikData.kalori_not&&<div style={{padding:"7px 10px",background:"rgba(155,127,212,0.08)",borderRadius:8,fontSize:12,color:C.purple,marginBottom:8}}>🔥 {saglikData.kalori_not}</div>}
        {(saglikData.faydalar||[]).map(function(f,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:6,paddingBottom:6,borderBottom:"1px solid rgba(212,168,67,0.08)"}}><span style={{color:C.green,fontWeight:700,fontSize:13}}>✓</span><div><div style={{fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:2}}>{f.baslik||""}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{f.aciklama||""}</div></div></div>;})}
        {saglikData.dikkat&&<div style={{padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,fontSize:12,color:C.red,marginTop:6}}>⚠ {saglikData.dikkat}</div>}
        {saglikData.oneri&&<div style={{padding:"7px 10px",background:C.goldDim,borderRadius:8,fontSize:12,color:C.gold,marginTop:5}}>💡 {saglikData.oneri}</div>}
      </div>}
    </div>}
    {eslesmeOpen&&<div className="up" style={{background:"rgba(45,212,191,0.05)",borderRadius:12,border:"1px solid rgba(45,212,191,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>🍷 Eşleşme</div>
      {eslesmeLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.teal}/><span style={{fontSize:12,color:C.teal}}>Yükleniyor…</span></div>}
      {eslesmeErr&&<div style={{fontSize:12,color:C.red}}>⚠ {eslesmeErr} <button onClick={function(){setEslesmeData(null);setEslesmeErr(null);loadEslesme(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {eslesmeData&&<div>
        {(eslesmeData.icecekler||[]).length>0&&<div style={{marginBottom:8}}><div style={{fontSize:9,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>İçecekler</div>{(eslesmeData.icecekler||[]).map(function(ic,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:5}}><span style={{fontSize:13}}>🥂</span><div><div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{ic.isim||""}</div><div style={{fontSize:11,color:C.muted}}>{ic.neden||""}</div></div></div>;})}</div>}
        {(eslesmeData.yan_yemekler||[]).length>0&&<div><div style={{fontSize:9,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>Yan Yemekler</div>{(eslesmeData.yan_yemekler||[]).map(function(y,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:5}}><span style={{fontSize:13}}>🍽️</span><div><div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{y.isim||""}</div><div style={{fontSize:11,color:C.muted}}>{y.neden||""}</div></div></div>;})}</div>}
        {eslesmeData.kacinin&&<div style={{padding:"6px 10px",background:"rgba(45,212,191,0.08)",borderRadius:8,fontSize:12,color:C.teal,marginTop:5}}>🕐 {eslesmeData.kacinin}</div>}
      </div>}
    </div>}
    {hazirlikOpen&&<div className="up" style={{background:"rgba(91,163,208,0.05)",borderRadius:12,border:"1px solid rgba(91,163,208,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>⏰ Hazırlık & Saklama</div>
      {hazirlikLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.blue}/><span style={{fontSize:12,color:C.blue}}>Yükleniyor…</span></div>}
      {hazirlikErr&&<div style={{fontSize:12,color:C.red}}>⚠ {hazirlikErr} <button onClick={function(){setHazirlikData(null);setHazirlikErr(null);loadHazirlik(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {hazirlikData&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[{key:"onceden_hazirlik",emoji:"📋",label:"Önceden"},{key:"saklama_yontemi",emoji:"📦",label:"Saklama"},{key:"saklama_suresi",emoji:"📅",label:"Süre"},{key:"isitma",emoji:"🔥",label:"Isıtma"},{key:"meal_prep",emoji:"🥡",label:"Meal Prep"}].map(function(row){var val=hazirlikData[row.key];if(!val) return null;return <div key={row.key} style={{display:"flex",gap:8,padding:"7px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid var(--border)"}}><span style={{fontSize:15,flexShrink:0}}>{row.emoji}</span><div><div style={{fontSize:10,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:1}}>{row.label}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{val}</div></div></div>;})}
      </div>}
    </div>}
    {varyasyonOpen&&<div className="up" style={{background:"rgba(249,115,22,0.05)",borderRadius:12,border:"1px solid rgba(249,115,22,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>🔄 Varyasyonlar</div>
      {varyasyonLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.orange}/><span style={{fontSize:12,color:C.orange}}>Yükleniyor…</span></div>}
      {varyasyonErr&&<div style={{fontSize:12,color:C.red}}>⚠ {varyasyonErr} <button onClick={function(){setVaryasyonData(null);setVaryasyonErr(null);loadVaryasyon(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {varyasyonData&&<div>
        {(varyasyonData.varyasyonlar||[]).map(function(v,i){return <div key={i} style={{padding:"7px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid rgba(249,115,22,0.12)",marginBottom:5}}><div style={{fontSize:12,fontWeight:700,color:"var(--text)",marginBottom:2}}>{v.isim||""}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{v.aciklama||""}</div></div>;})}
        {(varyasyonData.malzeme_degisim||[]).length>0&&<div style={{marginTop:6}}><div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>Malzeme Değişimleri</div>{(varyasyonData.malzeme_degisim||[]).map(function(m,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,padding:"5px 8px",background:"var(--card2)",borderRadius:8}}><span style={{fontSize:12,color:C.red,fontWeight:600,minWidth:70,textAlign:"right"}}>{m.original||""}</span><span style={{fontSize:14,color:C.orange}}>→</span><span style={{fontSize:12,color:C.green,fontWeight:600,flex:1}}>{m.alternatif||""}</span></div>;})}</div>}
        {varyasyonData.sef_notu&&<div style={{padding:"7px 10px",background:C.goldDim,borderRadius:8,fontSize:12,color:C.gold,marginTop:5}}>👨‍🍳 {varyasyonData.sef_notu}</div>}
      </div>}
    </div>}
    {tarihOpen&&<div className="up" style={{background:"rgba(155,127,212,0.05)",borderRadius:12,border:"1px solid rgba(155,127,212,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>🌍 Tarih & Köken</div>
      {tarihLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.purple}/><span style={{fontSize:12,color:C.purple}}>Yükleniyor…</span></div>}
      {tarihErr&&<div style={{fontSize:12,color:C.red}}>⚠ {tarihErr} <button onClick={function(){setTarihData(null);setTarihErr(null);loadTarih(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {tarihData&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
        {[{key:"koken",emoji:"📍",label:"Köken"},{key:"tarih",emoji:"📜",label:"Tarihçe"},{key:"yayilim",emoji:"🗺️",label:"Yayılım"},{key:"ilginc_bilgi",emoji:"✨",label:"İlginç"}].map(function(row){var val=tarihData[row.key];if(!val) return null;return <div key={row.key} style={{padding:"7px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid rgba(155,127,212,0.12)"}}><div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}><span style={{fontSize:13}}>{row.emoji}</span><span style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>{row.label}</span></div><div style={{fontSize:12,color:C.muted,lineHeight:1.6,paddingLeft:19}}>{val}</div></div>;})}
      </div>}
    </div>}
    {kimlerOpen&&<div className="up" style={{background:"rgba(236,72,153,0.05)",borderRadius:12,border:"1px solid rgba(236,72,153,0.2)",padding:"12px 14px",marginTop:8}}>
      <div style={{fontSize:10,color:C.pink,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>👥 Kimler İçin</div>
      {kimlerLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0"}}><Spinner size={12} color={C.pink}/><span style={{fontSize:12,color:C.pink}}>Yükleniyor…</span></div>}
      {kimlerErr&&<div style={{fontSize:12,color:C.red}}>⚠ {kimlerErr} <button onClick={function(){setKimlerData(null);setKimlerErr(null);loadKimler(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11}}>🔄 Tekrar</button></div>}
      {kimlerData&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
        {(kimlerData.uygun||[]).length>0&&<div><div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>✅ Uygun</div>{(kimlerData.uygun||[]).map(function(u,i){return <div key={i} style={{fontSize:12,color:C.muted,marginBottom:3,paddingLeft:14}}>• <strong style={{color:"var(--text)"}}>{u.grup}</strong> — {u.neden}</div>;})}</div>}
        {(kimlerData.dikkatli||[]).length>0&&<div><div style={{fontSize:9,color:"#F59E0B",fontWeight:700,textTransform:"uppercase",marginBottom:4}}>⚠️ Dikkatli</div>{(kimlerData.dikkatli||[]).map(function(u,i){return <div key={i} style={{fontSize:12,color:C.muted,marginBottom:3,paddingLeft:14}}>• <strong style={{color:"var(--text)"}}>{u.grup}</strong> — {u.neden}</div>;})}</div>}
        {(kimlerData.uygun_degil||[]).length>0&&<div><div style={{fontSize:9,color:C.red,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>❌ Uygun Değil</div>{(kimlerData.uygun_degil||[]).map(function(u,i){return <div key={i} style={{fontSize:12,color:C.muted,marginBottom:3,paddingLeft:14}}>• <strong style={{color:"var(--text)"}}>{u.grup}</strong> — {u.neden}</div>;})}</div>}
      </div>}
    </div>}
    {ikameOpen&&<div className="up" style={{background:"rgba(45,212,191,0.04)",borderRadius:12,padding:"12px 14px",border:"1px solid rgba(45,212,191,0.15)",marginTop:8}}>
      <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:8}}>🧂 Malzeme İkamesi</div>
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        <input value={ikameSorgu} onChange={function(e){setIkameSorgu(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") doIkame();}} placeholder="Hangi malzemeyi değiştirmek istiyorsun?" style={{flex:1,padding:"7px 10px",borderRadius:9,border:"1px solid rgba(45,212,191,0.25)",background:"var(--card)",color:"var(--text)",fontSize:12}}/>
        <button onClick={doIkame} disabled={ikameLoad} style={{padding:"7px 12px",borderRadius:9,border:"none",background:C.teal,color:"#000",fontSize:12,fontWeight:700}}>{ikameLoad?"…":"Sor"}</button>
      </div>
      {ikameLoad&&<div style={{display:"flex",gap:8,alignItems:"center"}}><Spinner size={12} color={C.teal}/><span style={{fontSize:12,color:C.teal}}>Bulunuyor…</span></div>}
      {ikameErr&&<div style={{fontSize:12,color:C.red}}>⚠ {ikameErr}</div>}
      {ikameData&&<div>
        <div style={{fontSize:11,color:C.muted,marginBottom:6}}>"{ikameData.orijinal}" yerine:</div>
        {(ikameData.alternatifler||[]).map(function(a,i){return <div key={i} style={{display:"flex",gap:8,padding:"7px 10px",background:"var(--card)",borderRadius:9,border:"1px solid rgba(45,212,191,0.12)",marginBottom:4}}><div style={{width:18,height:18,borderRadius:"50%",background:"rgba(45,212,191,0.1)",border:"1.5px solid rgba(45,212,191,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:C.teal,flexShrink:0}}>{i+1}</div><div><div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{a.isim}<span style={{fontSize:10,color:C.teal,marginLeft:4}}>{a.oran}</span></div>{a.not&&<div style={{fontSize:11,color:C.muted}}>{a.not}</div>}</div></div>;})}
        {ikameData.en_iyi&&<div style={{padding:"6px 9px",background:"rgba(45,212,191,0.07)",borderRadius:8,fontSize:12,color:C.teal,marginTop:4}}>⭐ En iyi: <strong>{ikameData.en_iyi}</strong></div>}
        {ikameData.uyari&&<div style={{fontSize:11,color:C.orange,padding:"4px 8px",background:"rgba(249,115,22,0.06)",borderRadius:8,marginTop:3}}>{ikameData.uyari}</div>}
      </div>}
    </div>}
  </div>;
}

// ─── DISH CARD ───────────────────────────────────────────────
var DishCard=memo(function DishCard(props){
  var dish=props.dish,index=props.index,dayIndex=props.dayIndex;
  var detail=props.detail,repIdx=props.repIdx,favorites=props.favorites;
  var ref=useRef(null);
  var col=OGUN_COL[dish.ogun]||C.gold;
  var gIdx=String(dayIndex)+"-"+String(index);
  var isRep=repIdx===gIdx; var showD=detail&&detail.index===gIdx;
  var hasD=showD&&detail.data; var isLoad=showD&&detail.loading;
  var isFav=favorites.some(function(f){return f.isim===dish.isim;});
  var [pufOpen,setPufOpen]=useState(false);
  var [pufData,setPufData]=useState(null);
  var [pufLoad,setPufLoad]=useState(false);
  var [pufErr,setPufErr]=useState(null);
  var [saglikOpen,setSaglikOpen]=useState(false);
  var [saglikData,setSaglikData]=useState(null);
  var [saglikLoad,setSaglikLoad]=useState(false);
  var [saglikErr,setSaglikErr]=useState(null);
  var [eslesmeOpen,setEslesmeOpen]=useState(false);
  var [eslesmeData,setEslesmeData]=useState(null);
  var [eslesmeLoad,setEslesmeLoad]=useState(false);
  var [eslesmeErr,setEslesmeErr]=useState(null);
  var [hazirlikOpen,setHazirlikOpen]=useState(false);
  var [hazirlikData,setHazirlikData]=useState(null);
  var [hazirlikLoad,setHazirlikLoad]=useState(false);
  var [hazirlikErr,setHazirlikErr]=useState(null);
  var [varyasyonOpen,setVaryasyonOpen]=useState(false);
  var [varyasyonData,setVaryasyonData]=useState(null);
  var [varyasyonLoad,setVaryasyonLoad]=useState(false);
  var [varyasyonErr,setVaryasyonErr]=useState(null);
  var [tarihOpen,setTarihOpen]=useState(false);
  var [tarihData,setTarihData]=useState(null);
  var [tarihLoad,setTarihLoad]=useState(false);
  var [tarihErr,setTarihErr]=useState(null);
  var [kimlerOpen,setKimlerOpen]=useState(false);
  var [kimlerData,setKimlerData]=useState(null);
  var [kimlerLoad,setKimlerLoad]=useState(false);
  var [kimlerErr,setKimlerErr]=useState(null);
  var [ikameOpen,setIkameOpen]=useState(false);
  var [ikameLoad,setIkameLoad]=useState(false);
  var [ikameData,setIkameData]=useState(null);
  var [ikameErr,setIkameErr]=useState(null);
  var [ikameSorgu,setIkameSorgu]=useState("");
  var [maliyetOpen,setMaliyetOpen]=useState(false);
  var [maliyetLoad,setMaliyetLoad]=useState(false);
  var [maliyetData,setMaliyetData]=useState(null);
  var [maliyetErr,setMaliyetErr]=useState(null);
  var [mikroOpen,setMikroOpen]=useState(false);
  var [mikroLoad,setMikroLoad]=useState(false);
  var [mikroData,setMikroData]=useState(null);
  var [mikroErr,setMikroErr]=useState(null);
  useEffect(function(){if(hasD&&ref.current) setTimeout(function(){ref.current.scrollIntoView({behavior:"smooth",block:"nearest"});},100);},[hasD]);

  function loadPuf(forceRefresh){
    if (!forceRefresh&&pufData){setPufOpen(!pufOpen);return;}
    if (!forceRefresh&&pufErr){setPufOpen(!pufOpen);return;}
    setPufOpen(true);setPufLoad(true);setPufErr(null);
    var cacheKey="puf:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setPufData(c);setPufLoad(false);return;} doPuf();}); else doPuf();
    function doPuf(){
      callAI("Turkish chef. "+dish.isim+" icin 5 pratik pisirme ipucu. Her ipucu 1-2 cumle Turkce. Kisaca tut.\nJSON: baslik string, ipuclari:[{baslik,aciklama}]",900)
        .then(function(r){aiCacheSet(cacheKey,r);setPufData(r);setPufLoad(false);})
        .catch(function(e){setPufErr(e&&e.message?e.message:"API hatası");setPufLoad(false);});
    }
  }
  function loadSaglik(forceRefresh){
    if (!forceRefresh&&saglikData){setSaglikOpen(!saglikOpen);return;}
    if (!forceRefresh&&saglikErr){setSaglikOpen(!saglikOpen);return;}
    setSaglikOpen(true);setSaglikLoad(true);setSaglikErr(null);
    var cacheKey="saglik:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setSaglikData(c);setSaglikLoad(false);return;} doSaglik();}); else doSaglik();
    function doSaglik(){
      var p="Turkish nutritionist. "+dish.isim+" icin kisaca Turkce saglik analizi yap. Maksimum 3 fayda, her aciklama 1 cumle.\nJSON sadece: baslik string, faydalar:[{baslik,aciklama}], dikkat:string, kalori_not:string, oneri:string";
      callAI(p,900).then(function(r){aiCacheSet(cacheKey,r);setSaglikData(r);setSaglikLoad(false);}).catch(function(e){setSaglikErr(e&&e.message?e.message:"API hatası");setSaglikLoad(false);});
    }
  }
  function loadEslesme(forceRefresh){
    if(!forceRefresh&&eslesmeData){setEslesmeOpen(!eslesmeOpen);return;}
    if(!forceRefresh&&eslesmeErr){setEslesmeOpen(!eslesmeOpen);return;}
    setEslesmeOpen(true);setEslesmeLoad(true);setEslesmeErr(null);
    var cacheKey="eslesme:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setEslesmeData(c);setEslesmeLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Somelier ve yemek uzmani. "+dish.isim+" icin Turkce eslestirme onerileri. Kisaca tut, her aciklama max 1 cumle.\nJSON: icecekler:[{isim,neden}], yan_yemekler:[{isim,neden}], kacinin:string",800).then(function(r){aiCacheSet(cacheKey,r);setEslesmeData(r);setEslesmeLoad(false);}).catch(function(e){setEslesmeErr(e&&e.message?e.message:"Hata");setEslesmeLoad(false);});}
  }
  function loadHazirlik(forceRefresh){
    if(!forceRefresh&&hazirlikData){setHazirlikOpen(!hazirlikOpen);return;}
    if(!forceRefresh&&hazirlikErr){setHazirlikOpen(!hazirlikOpen);return;}
    setHazirlikOpen(true);setHazirlikLoad(true);setHazirlikErr(null);
    var cacheKey="hazirlik:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setHazirlikData(c);setHazirlikLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Mutfak uzmani. "+dish.isim+" icin Turkce hazirlik ve saklama plani. Kisa tut.\nJSON: onceden_hazirlik:string, saklama_suresi:string, saklama_yontemi:string, isitma:string, meal_prep:string",800).then(function(r){aiCacheSet(cacheKey,r);setHazirlikData(r);setHazirlikLoad(false);}).catch(function(e){setHazirlikErr(e&&e.message?e.message:"Hata");setHazirlikLoad(false);});}
  }
  function loadVaryasyon(forceRefresh){
    if(!forceRefresh&&varyasyonData){setVaryasyonOpen(!varyasyonOpen);return;}
    if(!forceRefresh&&varyasyonErr){setVaryasyonOpen(!varyasyonOpen);return;}
    setVaryasyonOpen(true);setVaryasyonLoad(true);setVaryasyonErr(null);
    var cacheKey="varyasyon:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setVaryasyonData(c);setVaryasyonLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Yaratici sef. "+dish.isim+" icin Turkce varyasyon ve degisim onerileri. Kisa tut.\nJSON: varyasyonlar:[{isim,aciklama}], malzeme_degisim:[{original,alternatif,neden}], sef_notu:string",900).then(function(r){aiCacheSet(cacheKey,r);setVaryasyonData(r);setVaryasyonLoad(false);}).catch(function(e){setVaryasyonErr(e&&e.message?e.message:"Hata");setVaryasyonLoad(false);});}
  }
  function loadTarih(forceRefresh){
    if(!forceRefresh&&tarihData){setTarihOpen(!tarihOpen);return;}
    if(!forceRefresh&&tarihErr){setTarihOpen(!tarihOpen);return;}
    setTarihOpen(true);setTarihLoad(true);setTarihErr(null);
    var cacheKey="tarih:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setTarihData(c);setTarihLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Mutfak tarihcisi. "+dish.isim+" yemeginin Turkce tarih ve kultur bilgisi. Kisa tut.\nJSON: koken:string, tarih:string, yayilim:string, ilginc_bilgi:string",800).then(function(r){aiCacheSet(cacheKey,r);setTarihData(r);setTarihLoad(false);}).catch(function(e){setTarihErr(e&&e.message?e.message:"Hata");setTarihLoad(false);});}
  }
  function loadKimler(forceRefresh){
    if(!forceRefresh&&kimlerData){setKimlerOpen(!kimlerOpen);return;}
    if(!forceRefresh&&kimlerErr){setKimlerOpen(!kimlerOpen);return;}
    setKimlerOpen(true);setKimlerLoad(true);setKimlerErr(null);
    var cacheKey="kimler:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setKimlerData(c);setKimlerLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Diyetisyen. "+dish.isim+" yemegi icin Turkce uygunluk analizi. Kisa tut, her aciklama 1 cumle.\nJSON: uygun:[{grup,neden}], dikkatli:[{grup,neden}], uygun_degil:[{grup,neden}]",800).then(function(r){aiCacheSet(cacheKey,r);setKimlerData(r);setKimlerLoad(false);}).catch(function(e){setKimlerErr(e&&e.message?e.message:"Hata");setKimlerLoad(false);});}
  }
  function loadIkame(){setIkameOpen(!ikameOpen);}
  async function doIkame(){
    if(!ikameSorgu.trim()) return;
    setIkameLoad(true);setIkameErr(null);setIkameData(null);
    callAI("Mutfak uzmani. '"+dish.isim+"' icin '"+ikameSorgu+"' yerine ne kullanilabilir? JSON: orijinal:string, alternatifler:[{isim:string,oran:string,not:string}], en_iyi:string, uyari:string",400)
      .then(function(r){setIkameData(r);setIkameLoad(false);}).catch(function(e){setIkameErr(e.message||"Hata");setIkameLoad(false);});
  }
  function loadMaliyet(forceRefresh){
    if(!forceRefresh&&maliyetData){setMaliyetOpen(!maliyetOpen);return;}
    if(!forceRefresh&&maliyetErr){setMaliyetOpen(!maliyetOpen);return;}
    setMaliyetOpen(true);setMaliyetLoad(true);setMaliyetErr(null);
    var cacheKey="maliyet:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setMaliyetData(c);setMaliyetLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI(buildMaliyetPrompt(dish),600).then(function(r){aiCacheSet(cacheKey,r);setMaliyetData(r);setMaliyetLoad(false);}).catch(function(e){setMaliyetErr(e&&e.message?e.message:"Hata");setMaliyetLoad(false);});}
  }
  function loadMikro(forceRefresh){
    if(!forceRefresh&&mikroData){setMikroOpen(!mikroOpen);return;}
    if(!forceRefresh&&mikroErr){setMikroOpen(!mikroOpen);return;}
    setMikroOpen(true);setMikroLoad(true);setMikroErr(null);
    var cacheKey="mikro:"+dish.isim;
    if(!forceRefresh) aiCacheGet(cacheKey).then(function(c){if(c){setMikroData(c);setMikroLoad(false);return;} doIt();}); else doIt();
    function doIt(){callAI("Diyetisyen ve besin uzmanı. '"+dish.isim+"' yemeğinin detaylı besin değeri analizi. Mikro besinleri (vitamin, mineral) listele. Kısa ve öz tut.\nJSON: kalori:string, protein:string, karb:string, yag:string, lif:string, vitaminler:[{isim:string,miktar:string,yuzde:string}], mineraller:[{isim:string,miktar:string,yuzde:string}], onemli_not:string",700).then(function(r){aiCacheSet(cacheKey,r);setMikroData(r);setMikroLoad(false);}).catch(function(e){setMikroErr(e&&e.message?e.message:"Hata");setMikroLoad(false);});}
  }
  function doPDFExport(){exportToPDF(dishToHTML(dish),dish.isim||"tarif");}
    return <div ref={ref} className="up" style={{animationDelay:(props.delay||0)+"s"}}>
    <div style={{background:"var(--card)",borderLeft:"4px solid "+col,border:"1px solid var(--border)",borderRadius:hasD?"14px 14px 0 0":14,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",opacity:isRep?0.5:1}}>
      <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:col+"18",border:"2px solid "+col+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:col,fontWeight:700}}>{index+1}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{dish.isim}</span>
          {dish.ogun?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:col+"18",color:col,fontWeight:600}}>{dish.ogun}</span>:null}
          {dish.sure?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {dish.sure}</span>:null}
          {dish.kalori?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {dish.kalori}</span>:null}
          <SkorBadge skor={calcSaglikSkor(dish)}/>
        </div>
        <p style={{fontSize:12,color:C.muted,margin:"0 0 8px",lineHeight:1.5,fontStyle:"italic"}}>{dish.aciklama}</p>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:9}}>
          {(dish.malzemeler||[]).slice(0,5).map(function(m,j){return <span key={j} style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>{m}</span>;})}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={function(){props.onDetail(gIdx,dayIndex,index);}} disabled={isLoad} style={{padding:"6px 12px",borderRadius:9,fontSize:11,fontWeight:500,border:"1.5px solid "+(hasD?C.gold:"var(--border)"),background:hasD?C.goldDim:"var(--card2)",color:hasD?C.goldL:C.muted,display:"flex",alignItems:"center",gap:4}}>
            {isLoad?<span style={{display:"flex",alignItems:"center",gap:4}}><Spinner size={10}/>Yükleniyor</span>:hasD?"✕ Kapat":"📖 Tarif"}
          </button>
          <button onClick={function(){props.onReplace(gIdx,dayIndex,index);}} disabled={isRep} style={{padding:"6px 12px",borderRadius:9,fontSize:11,border:"1.5px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red,display:"flex",alignItems:"center",gap:4}}>
            {isRep?<span style={{display:"flex",alignItems:"center",gap:4}}><Spinner size={10} color={C.red}/>Değiştiriliyor</span>:"🔄 Değiştir"}
          </button>
          <button onClick={function(){props.onFav(dish);}} style={{padding:"6px 10px",borderRadius:9,fontSize:13,border:"1.5px solid "+(isFav?"rgba(224,82,82,0.4)":"var(--border)"),background:isFav?"rgba(224,82,82,0.1)":"transparent"}}>{isFav?"❤️":"🤍"}</button>
          <button onClick={function(){props.onList(dish);}} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid var(--border)",background:"transparent",color:C.muted}}>📋</button>
          <button onClick={function(){shareMenu(dish.isim+" ("+dish.sure+")\n"+dish.aciklama+"\nMalzemeler: "+(dish.malzemeler||[]).join(", "),"Yemek Tarifim");}} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid var(--border)",background:"transparent",color:C.muted}}>📤</button>

          <button onClick={loadPuf} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(pufOpen?"rgba(76,175,122,0.5)":"var(--border)"),background:pufOpen?"rgba(76,175,122,0.1)":"transparent",color:pufOpen?C.green:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {pufLoad?<Spinner size={9} color={C.green}/>:"💡"}<span>Püf</span>
          </button>
          <button onClick={loadSaglik} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(saglikOpen?"rgba(212,168,67,0.5)":"var(--border)"),background:saglikOpen?C.goldDim:"transparent",color:saglikOpen?C.goldL:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {saglikLoad?<Spinner size={9} color={C.gold}/>:"🌿"}<span>Sağlık</span>
          </button>
          <button onClick={loadEslesme} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(eslesmeOpen?"rgba(45,212,191,0.5)":"var(--border)"),background:eslesmeOpen?"rgba(45,212,191,0.1)":"transparent",color:eslesmeOpen?C.teal:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {eslesmeLoad?<Spinner size={9} color={C.teal}/>:"🍷"}<span>Eşleşme</span>
          </button>
          <button onClick={loadHazirlik} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(hazirlikOpen?"rgba(91,163,208,0.5)":"var(--border)"),background:hazirlikOpen?"rgba(91,163,208,0.1)":"transparent",color:hazirlikOpen?C.blue:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {hazirlikLoad?<Spinner size={9} color={C.blue}/>:"⏰"}<span>Hazırlık</span>
          </button>
          <button onClick={loadVaryasyon} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(varyasyonOpen?"rgba(249,115,22,0.5)":"var(--border)"),background:varyasyonOpen?"rgba(249,115,22,0.1)":"transparent",color:varyasyonOpen?C.orange:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {varyasyonLoad?<Spinner size={9} color={C.orange}/>:"🔄"}<span>Varyasyon</span>
          </button>
          <button onClick={loadTarih} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(tarihOpen?"rgba(155,127,212,0.5)":"var(--border)"),background:tarihOpen?"rgba(155,127,212,0.1)":"transparent",color:tarihOpen?C.purple:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {tarihLoad?<Spinner size={9} color={C.purple}/>:"🌍"}<span>Tarih</span>
          </button>
          <button onClick={loadKimler} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(kimlerOpen?"rgba(236,72,153,0.5)":"var(--border)"),background:kimlerOpen?"rgba(236,72,153,0.1)":"transparent",color:kimlerOpen?C.pink:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {kimlerLoad?<Spinner size={9} color={C.pink}/>:"👥"}<span>Kimler</span>
          </button>
          <button onClick={loadIkame} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid rgba(45,212,191,0.35)",background:"rgba(45,212,191,0.07)",color:C.teal,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
            {ikameLoad?<Spinner size={9} color={C.teal}/>:"🧂"}<span>İkame</span>
          </button>
          <button onClick={loadMaliyet} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(maliyetOpen?"rgba(76,175,122,0.5)":"var(--border)"),background:maliyetOpen?"rgba(76,175,122,0.1)":"transparent",color:maliyetOpen?C.green:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {maliyetLoad?<Spinner size={9} color={C.green}/>:"💰"}<span>Maliyet</span>
          </button>
          <button onClick={loadMikro} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid "+(mikroOpen?"rgba(249,115,22,0.5)":"var(--border)"),background:mikroOpen?"rgba(249,115,22,0.1)":"transparent",color:mikroOpen?C.orange:C.muted,display:"flex",alignItems:"center",gap:3}}>
            {mikroLoad?<Spinner size={9} color={C.orange}/>:"🧬"}<span>Besin</span>
          </button>
          <button onClick={doPDFExport} style={{padding:"6px 10px",borderRadius:9,fontSize:11,border:"1.5px solid var(--border)",background:"transparent",color:C.muted,display:"flex",alignItems:"center",gap:3}}>
            📄 <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
    {showD&&!isLoad&&detail.data?<DetailPanel data={detail.data} col={col} baseKisi={props.baseKisi||2}/>:null}
    {showD&&!isLoad&&detail.error?<div style={{padding:"11px 14px",background:"rgba(224,82,82,0.07)",borderRadius:"0 0 12px 12px",border:"1px solid rgba(224,82,82,0.2)",borderTop:"none",color:C.red,fontSize:12}}>⚠ {detail.error}</div>:null}
    {pufOpen&&<div className="up" style={{background:"rgba(76,175,122,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(76,175,122,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.2em"}}>💡 {dish.isim} — Püf Noktaları</div>{pufData&&!pufLoad&&<button onClick={function(){loadPuf(true);}} style={{fontSize:10,color:C.gold,background:"transparent",border:"none",cursor:"pointer"}} aria-label="Yenile">🔄</button>}</div>
      {pufLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.green}/><span style={{fontSize:12,color:C.green}}>Hazırlanıyor…</span></div>}
      {pufErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}><button onClick={function(){setPufData(null);setPufErr(null);loadPuf(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {!pufLoad&&pufData&&(pufData.ipuclari||[]).length===0&&<div style={{fontSize:12,color:C.muted,padding:"8px 0"}}>Veri yüklenemedi, tekrar deneyin.</div>}
      {pufData&&(pufData.ipuclari||[]).map(function(ip,i){return <div key={i} style={{display:"flex",gap:9,marginBottom:8,paddingBottom:8,borderBottom:i<(pufData.ipuclari.length-1)?"1px solid rgba(76,175,122,0.1)":"none"}}><span style={{color:C.green,fontWeight:700,fontSize:11,flexShrink:0,width:18,marginTop:1}}>{i+1}.</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream,marginBottom:3}}>{ip.baslik||ip.tip||""}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.65}}>{ip.aciklama||ip.description||ip.detay||""}</div></div></div>;})}
    </div>}
    {saglikOpen&&<div className="up" style={{background:"rgba(212,168,67,0.04)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(212,168,67,0.18)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:10}}>🌿 {dish.isim} — Sağlık Analizi</div>
      {saglikLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.gold}/><span style={{fontSize:12,color:C.gold}}>Analiz ediliyor…</span></div>}
      {saglikErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {saglikErr} <button onClick={function(){setSaglikData(null);setSaglikErr(null);loadSaglik();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {saglikData&&<div>
        {saglikData.kalori_not?<div style={{padding:"8px 12px",background:"rgba(155,127,212,0.08)",borderRadius:8,border:"1px solid rgba(155,127,212,0.15)",fontSize:12,color:C.purple,marginBottom:10,lineHeight:1.6}}>🔥 {saglikData.kalori_not}</div>:null}
        {(saglikData.faydalar||saglikData.benefits||[]).map(function(f,i){return <div key={i} style={{display:"flex",gap:9,marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(212,168,67,0.08)"}}><span style={{color:C.green,fontWeight:700,fontSize:13,flexShrink:0,marginTop:0}}>✓</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream,marginBottom:2}}>{f.baslik||f.title||f.name||""}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.65}}>{f.aciklama||f.description||f.detay||""}</div></div></div>;})}
        {saglikData.dikkat?<div style={{padding:"8px 12px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.18)",fontSize:12,color:C.red,marginTop:8,lineHeight:1.6}}>⚠ {saglikData.dikkat}</div>:null}
        {saglikData.oneri?<div style={{padding:"8px 12px",background:C.goldDim,borderRadius:8,border:"1px solid rgba(212,168,67,0.2)",fontSize:12,color:C.gold,marginTop:7,lineHeight:1.6}}>💡 {saglikData.oneri}</div>:null}
      </div>}
      {!saglikLoad&&!saglikErr&&saglikData&&!(saglikData.faydalar||saglikData.benefits||[]).length&&<div style={{fontSize:12,color:C.muted,padding:"6px 0"}}>Veri yüklenemedi, tekrar deneyin.</div>}
    </div>}
    {eslesmeOpen&&<div className="up" style={{background:"rgba(45,212,191,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(45,212,191,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>🍷 {dish.isim} — Eşleşme</div>
      {eslesmeLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.teal}/><span style={{fontSize:12,color:C.teal}}>Yükleniyor…</span></div>}
      {eslesmeErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {eslesmeErr} <button onClick={function(){setEslesmeData(null);setEslesmeErr(null);loadEslesme();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {eslesmeData&&<div>
        {eslesmeData.kacinin?<div style={{padding:"7px 11px",background:"rgba(45,212,191,0.08)",borderRadius:8,border:"1px solid rgba(45,212,191,0.15)",fontSize:12,color:C.teal,marginBottom:10}}>🕐 {eslesmeData.kacinin}</div>:null}
        {(eslesmeData.icecekler||[]).length>0&&<div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:7}}>İçecekler</div>
          {(eslesmeData.icecekler||[]).map(function(ic,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:6,paddingBottom:6,borderBottom:"1px solid rgba(45,212,191,0.08)"}}><span style={{fontSize:14,flexShrink:0}}>🥂</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{ic.isim||ic.name||""}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{ic.neden||ic.aciklama||""}</div></div></div>;})}
        </div>}
        {(eslesmeData.yan_yemekler||[]).length>0&&<div>
          <div style={{fontSize:9,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:7}}>Yan Yemekler</div>
          {(eslesmeData.yan_yemekler||[]).map(function(y,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:6,paddingBottom:6,borderBottom:"1px solid rgba(45,212,191,0.08)"}}><span style={{fontSize:14,flexShrink:0}}>🍽️</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{y.isim||y.name||""}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{y.neden||y.aciklama||""}</div></div></div>;})}
        </div>}
      </div>}
    </div>}
    {hazirlikOpen&&<div className="up" style={{background:"rgba(91,163,208,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(91,163,208,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>⏰ {dish.isim} — Hazırlık & Saklama</div>
      {hazirlikLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.blue}/><span style={{fontSize:12,color:C.blue}}>Yükleniyor…</span></div>}
      {hazirlikErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {hazirlikErr} <button onClick={function(){setHazirlikData(null);setHazirlikErr(null);loadHazirlik();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {hazirlikData&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[
          {key:"onceden_hazirlik",emoji:"📋",label:"Önceden"},
          {key:"saklama_yontemi",emoji:"📦",label:"Saklama"},
          {key:"saklama_suresi",emoji:"📅",label:"Süre"},
          {key:"isitma",emoji:"🔥",label:"Isıtma"},
          {key:"meal_prep",emoji:"🥡",label:"Meal Prep"},
        ].map(function(row){
          var val=hazirlikData[row.key];
          if(!val) return null;
          return <div key={row.key} style={{display:"flex",gap:10,padding:"8px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid var(--border)"}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{row.emoji}</span>
            <div><div style={{fontSize:10,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:2}}>{row.label}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{val}</div></div>
          </div>;
        })}
      </div>}
    </div>}
    {varyasyonOpen&&<div className="up" style={{background:"rgba(249,115,22,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(249,115,22,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>🔄 {dish.isim} — Varyasyonlar</div>
      {varyasyonLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.orange}/><span style={{fontSize:12,color:C.orange}}>Yükleniyor…</span></div>}
      {varyasyonErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {varyasyonErr} <button onClick={function(){setVaryasyonData(null);setVaryasyonErr(null);loadVaryasyon();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {varyasyonData&&<div>
        {(varyasyonData.varyasyonlar||[]).length>0&&<div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Versiyonlar</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(varyasyonData.varyasyonlar||[]).map(function(v,i){return <div key={i} style={{padding:"9px 12px",background:"var(--card2)",borderRadius:10,border:"1px solid rgba(249,115,22,0.12)"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.cream,marginBottom:3}}>{v.isim||v.name||""}</div>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>{v.aciklama||v.description||""}</div>
            </div>;})}
          </div>
        </div>}
        {(varyasyonData.malzeme_degisim||[]).length>0&&<div style={{marginBottom:10}}>
          <div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Malzeme Değişimleri</div>
          {(varyasyonData.malzeme_degisim||[]).map(function(m,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"7px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid var(--border)"}}>
            <span style={{fontSize:12,color:C.red,fontWeight:600,minWidth:80,textAlign:"right"}}>{m.original||""}</span>
            <span style={{fontSize:14,color:C.orange}}>→</span>
            <span style={{fontSize:12,color:C.green,fontWeight:600,flex:1}}>{m.alternatif||""}</span>
            {m.neden?<span style={{fontSize:10,color:C.muted,flexShrink:0,maxWidth:80,textAlign:"right",lineHeight:1.3}}>{m.neden}</span>:null}
          </div>;})}
        </div>}
        {varyasyonData.sef_notu?<div style={{padding:"8px 11px",background:C.goldDim,borderRadius:9,border:"1px solid rgba(212,168,67,0.2)",fontSize:12,color:C.gold,lineHeight:1.6}}>👨‍🍳 {varyasyonData.sef_notu}</div>:null}
      </div>}
    </div>}
    {tarihOpen&&<div className="up" style={{background:"rgba(155,127,212,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(155,127,212,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>🌍 {dish.isim} — Tarih & Köken</div>
      {tarihLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.purple}/><span style={{fontSize:12,color:C.purple}}>Yükleniyor…</span></div>}
      {tarihErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {tarihErr} <button onClick={function(){setTarihData(null);setTarihErr(null);loadTarih();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {tarihData&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {[
          {key:"koken",emoji:"📍",label:"Köken"},
          {key:"tarih",emoji:"📜",label:"Tarihçe"},
          {key:"yayilim",emoji:"🗺️",label:"Yayılım"},
          {key:"ilginc_bilgi",emoji:"✨",label:"İlginç"},
        ].map(function(row){
          var val=tarihData[row.key];
          if(!val) return null;
          return <div key={row.key} style={{padding:"9px 12px",background:"var(--card2)",borderRadius:10,border:"1px solid rgba(155,127,212,0.12)"}}>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:14}}>{row.emoji}</span>
              <span style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>{row.label}</span>
            </div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.65,paddingLeft:21}}>{val}</div>
          </div>;
        })}
      </div>}
    </div>}
    {kimlerOpen&&<div className="up" style={{background:"rgba(236,72,153,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(236,72,153,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.pink,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>👥 {dish.isim} — Kimler İçin</div>
      {kimlerLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.pink}/><span style={{fontSize:12,color:C.pink}}>Yükleniyor…</span></div>}
      {kimlerErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>⚠ {kimlerErr} <button onClick={function(){setKimlerData(null);setKimlerErr(null);loadKimler();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {kimlerData&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        {(kimlerData.uygun||[]).length>0&&<div>
          <div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>✅ Uygun</div>
          {(kimlerData.uygun||[]).map(function(g,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5,padding:"7px 10px",background:"rgba(76,175,122,0.06)",borderRadius:8,border:"1px solid rgba(76,175,122,0.13)"}}><span style={{color:C.green,fontWeight:700,fontSize:12,flexShrink:0,marginTop:1}}>✓</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{g.grup||""}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.45}}>{g.neden||""}</div></div></div>;})}
        </div>}
        {(kimlerData.dikkatli||[]).length>0&&<div>
          <div style={{fontSize:9,color:"#F59E0B",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6,marginTop:4}}>⚠ Dikkatli</div>
          {(kimlerData.dikkatli||[]).map(function(g,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5,padding:"7px 10px",background:"rgba(245,158,11,0.06)",borderRadius:8,border:"1px solid rgba(245,158,11,0.15)"}}><span style={{color:"#F59E0B",fontWeight:700,fontSize:12,flexShrink:0,marginTop:1}}>!</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{g.grup||""}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.45}}>{g.neden||""}</div></div></div>;})}
        </div>}
        {(kimlerData.uygun_degil||[]).length>0&&<div>
          <div style={{fontSize:9,color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6,marginTop:4}}>✗ Uygun Değil</div>
          {(kimlerData.uygun_degil||[]).map(function(g,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5,padding:"7px 10px",background:"rgba(224,82,82,0.05)",borderRadius:8,border:"1px solid rgba(224,82,82,0.12)"}}><span style={{color:C.red,fontWeight:700,fontSize:12,flexShrink:0,marginTop:1}}>✗</span><div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{g.grup||""}</div><div style={{fontSize:11,color:C.muted,lineHeight:1.45}}>{g.neden||""}</div></div></div>;})}
        </div>}
      </div>}
    </div>}
    {ikameOpen&&<div className="up" style={{background:"rgba(45,212,191,0.04)",borderRadius:"0 0 14px 14px",padding:"12px 14px",border:"1px solid rgba(45,212,191,0.15)",borderTop:"none"}}>
      <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:9}}>🧂 Malzeme İkamesi</div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        <input value={ikameSorgu} onChange={function(e){setIkameSorgu(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") doIkame();}} placeholder="Hangi malzemeyi değiştiriyorsun? (örn. krema, tereyağı)" style={{flex:1,padding:"8px 11px",borderRadius:9,border:"1px solid rgba(45,212,191,0.25)",background:"var(--card)",color:C.cream,fontSize:12}}/>
        <button onClick={doIkame} disabled={ikameLoad} style={{padding:"8px 13px",borderRadius:9,border:"none",background:C.teal,color:"#000",fontSize:12,fontWeight:700,flexShrink:0}}>{ikameLoad?"…":"Sor"}</button>
      </div>
      {ikameLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0"}}><Spinner size={13} color={C.teal}/><span style={{fontSize:12,color:C.teal}}>Alternatifler bulunuyor…</span></div>}
      {ikameErr&&<div style={{fontSize:12,color:C.red,padding:"5px 0"}}>⚠ {ikameErr}</div>}
      {ikameData&&<div>
        <div style={{fontSize:11,color:C.muted,marginBottom:8}}>"{ikameData.orijinal}" yerine:</div>
        {(ikameData.alternatifler||[]).map(function(a,i){return <div key={i} style={{display:"flex",gap:10,padding:"8px 11px",background:"var(--card)",borderRadius:9,border:"1px solid rgba(45,212,191,0.12)",marginBottom:5}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(45,212,191,0.1)",border:"1.5px solid rgba(45,212,191,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.teal,flexShrink:0}}>{i+1}</div>
          <div><div style={{fontSize:13,fontWeight:700,color:C.cream}}>{a.isim}<span style={{fontSize:10,color:C.teal,marginLeft:5}}>{a.oran}</span></div>{a.not&&<div style={{fontSize:11,color:C.muted}}>{a.not}</div>}</div>
        </div>;})}
        {ikameData.en_iyi&&<div style={{padding:"7px 10px",background:"rgba(45,212,191,0.07)",borderRadius:9,fontSize:12,color:C.teal,marginBottom:5}}>⭐ En iyi: <strong>{ikameData.en_iyi}</strong></div>}
        {ikameData.uyari&&<div style={{fontSize:11,color:C.orange,padding:"5px 9px",background:"rgba(249,115,22,0.06)",borderRadius:8}}>{ikameData.uyari}</div>}
      </div>}
    </div>}
    {maliyetOpen&&<div className="up" style={{background:"rgba(76,175,122,0.04)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(76,175,122,0.18)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em"}}>💰 {dish.isim} — Maliyet Analizi</div>{maliyetData&&!maliyetLoad&&<button onClick={function(){loadMaliyet(true);}} style={{fontSize:10,color:C.gold,background:"transparent",border:"none",cursor:"pointer"}}>🔄</button>}</div>
      {maliyetLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.green}/><span style={{fontSize:12,color:C.green}}>Hesaplanıyor…</span></div>}
      {maliyetErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8}}>⚠ {maliyetErr} <button onClick={function(){setMaliyetData(null);setMaliyetErr(null);loadMaliyet(true);}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
      {maliyetData&&<div>
        <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
          <div style={{padding:"10px 16px",background:"rgba(76,175,122,0.1)",borderRadius:10,border:"1px solid rgba(76,175,122,0.2)"}}><div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em"}}>Toplam</div><div style={{fontSize:18,fontWeight:700,color:C.cream}}>{maliyetData.toplam_maliyet||"?"}</div></div>
          <div style={{padding:"10px 16px",background:"var(--card2)",borderRadius:10,border:"1px solid var(--border)"}}><div style={{fontSize:9,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em"}}>Kişi Başı</div><div style={{fontSize:18,fontWeight:700,color:C.gold}}>{maliyetData.kisi_basi||"?"}</div></div>
        </div>
        {(maliyetData.malzemeler||[]).map(function(m,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12}}><span style={{color:C.muted}}>{m.miktar} {m.isim}</span><span style={{color:C.green,fontWeight:600}}>{m.fiyat}</span></div>;})}
        {maliyetData.tasarruf_ipucu&&<div style={{marginTop:10,padding:"8px 12px",background:C.goldDim,borderRadius:8,fontSize:12,color:C.gold}}>💡 {maliyetData.tasarruf_ipucu}</div>}
      </div>}
    </div>}
    {mikroOpen&&<div className="up" style={{background:"rgba(249,115,22,0.04)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(249,115,22,0.18)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{fontSize:10,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em"}}>🧬 {dish.isim} — Besin Değerleri</div>{mikroData&&!mikroLoad&&<button onClick={function(){loadMikro(true);}} style={{fontSize:10,color:C.gold,background:"transparent",border:"none",cursor:"pointer"}}>🔄</button>}</div>
      {mikroLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.orange}/><span style={{fontSize:12,color:C.orange}}>Analiz ediliyor…</span></div>}
      {mikroErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8}}>⚠ {mikroErr}</div>}
      {mikroData&&<div>
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {[{l:"Kalori",v:mikroData.kalori,c:C.red},{l:"Protein",v:mikroData.protein,c:C.blue},{l:"Karb",v:mikroData.karb,c:C.orange},{l:"Yağ",v:mikroData.yag,c:C.gold},{l:"Lif",v:mikroData.lif,c:C.green}].map(function(n){return n.v?<div key={n.l} style={{padding:"6px 12px",background:n.c+"15",borderRadius:8,border:"1px solid "+n.c+"30",textAlign:"center"}}><div style={{fontSize:8,color:n.c,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em"}}>{n.l}</div><div style={{fontSize:14,fontWeight:700,color:C.cream}}>{n.v}</div></div>:null;})}
        </div>
        {(mikroData.vitaminler||[]).length>0&&<div style={{marginBottom:8}}><div style={{fontSize:9,color:C.orange,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>Vitaminler</div>{(mikroData.vitaminler||[]).map(function(v,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:11}}><span style={{color:C.cream}}>{v.isim}</span><span style={{color:C.muted}}>{v.miktar}{v.yuzde?" ("+v.yuzde+")":""}</span></div>;})}</div>}
        {(mikroData.mineraller||[]).length>0&&<div><div style={{fontSize:9,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>Mineraller</div>{(mikroData.mineraller||[]).map(function(m,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)",fontSize:11}}><span style={{color:C.cream}}>{m.isim}</span><span style={{color:C.muted}}>{m.miktar}{m.yuzde?" ("+m.yuzde+")":""}</span></div>;})}</div>}
        {mikroData.onemli_not&&<div style={{marginTop:8,padding:"8px 12px",background:C.goldDim,borderRadius:8,fontSize:12,color:C.gold}}>💡 {mikroData.onemli_not}</div>}
      </div>}
    </div>}
  </div>;
});

// ─── SHOPPING LIST ───────────────────────────────────────────
function ShoppingList(props){
  var [loading,setLoading]=useState(true);
  var [list,setList]=useState(null);
  var [error,setError]=useState(null);
  var [checked,setChecked]=useState({});
  var [copyOk,setCopyOk]=useState(false);
  function fetchList(){var all=props.days.flatMap(function(d){return d.dishes||[];});var mats=all.map(function(d){return d.isim+": "+(d.malzemeler||[]).join(", ");}).join("\n");setError(null);setLoading(true);callAI("Grocery list in Turkish for:\n"+mats+"\nContinue JSON:\n\"kategoriler\":[{\"ad\":\"Sebze & Meyve\",\"reyon\":\"🥦 Sebze-Meyve Reyonu\",\"malzemeler\":[{\"isim\":\"soğan\",\"miktar\":\"2 adet\",\"tahmini_fiyat\":12}]},{\"ad\":\"Et & Balık\",\"reyon\":\"🥩 Et Reyonu\"},{\"ad\":\"Süt & Yumurta\",\"reyon\":\"🥛 Süt Reyonu\"},{\"ad\":\"Tahıl & Baklagil\",\"reyon\":\"🌾 Kuru Gıda\"},{\"ad\":\"Baharat & Sos\",\"reyon\":\"🌶️ Baharat Reyonu\"},{\"ad\":\"Dondurulmuş\",\"reyon\":\"❄️ Dondurucu\"},{\"ad\":\"İçecek\",\"reyon\":\"🧃 İçecek Reyonu\"}],\"toplam_tahmini\":350,\"market_sirasi\":\"Giriş → Sebze → Et → Süt → Tahıl → Baharat → Dondurulmuş → Kasa\",\"not\":\"Market reyonlarına göre sıralanmıştır — Fiyatlar Mart 2026 Türkiye ortalama\"}",1100).then(function(r){setList(r);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});}
  useEffect(function(){fetchList();},[]);
  function copyListText(){if(!list||!list.kategoriler) return;var txt=(list.kategoriler||[]).map(function(kat){return kat.ad.toUpperCase()+"\n"+((kat.malzemeler||[]).map(function(m){return "• "+(m.miktar||"")+" "+(m.isim||"").trim();}).join("\n"));}).join("\n\n");navigator.clipboard.writeText(txt).then(function(){setCopyOk(true);setTimeout(function(){setCopyOk(false);},2000);});}
  function printList(){window.print();}
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999,padding:14}} className="alisveris-modal">
    <style dangerouslySetInnerHTML={{__html:"@media print{.alisveris-modal *{visibility:hidden}.alisveris-print-area,.alisveris-print-area *{visibility:visible !important}.alisveris-print-area{position:absolute !important;left:0 !important;top:0 !important;width:100% !important;max-height:none !important;background:#fff !important;color:#111 !important;padding:24px !important;border-radius:0 !important}"}}/>
    <div id="alisveris-print-area" className="alisveris-print-area" style={{width:"100%",maxWidth:500,background:"var(--card)",borderRadius:"18px 18px 0 0",padding:20,border:"1px solid "+C.borderG,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.cream}}>🛒 Alışveriş Listesi</div>
          {list&&list.toplam_tahmini&&<div style={{fontSize:11,color:C.gold,marginTop:2}}>Tahmini: ~{list.toplam_tahmini} ₺</div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {list?<><button onClick={copyListText} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:9,color:C.muted,padding:"5px 10px",fontSize:12}}>{copyOk?"✓ Kopyalandı":"📋 Kopyala"}</button><button onClick={printList} style={{background:"var(--card2)",border:"1px solid var(--border)",borderRadius:9,color:C.muted,padding:"5px 10px",fontSize:12}}>🖨️ Yazdır</button></>:null}
          <button onClick={props.onClose} style={{background:"transparent",border:"1px solid var(--border)",borderRadius:9,color:C.muted,padding:"5px 10px",fontSize:12}}>✕ Kapat</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {loading?<div style={{textAlign:"center",padding:36}}><Spinner size={26}/></div>:null}
        {error?<div style={{color:C.red,fontSize:13,padding:10,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>⚠ {error} <button onClick={fetchList} style={{padding:"5px 12px",borderRadius:8,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tekrar dene</button></div>:null}
        {list&&list.market_sirasi&&<div style={{padding:"8px 10px",background:"rgba(91,163,208,0.06)",borderRadius:9,border:"1px solid rgba(91,163,208,0.15)",marginBottom:10}}>
          <div style={{fontSize:9,color:C.blue,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:3}}>🛒 Market Rotası</div>
          <div style={{fontSize:11,color:C.muted}}>{list.market_sirasi}</div>
        </div>}
        {list?(list.kategoriler||[]).map(function(kat,ki){return <div key={ki} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8,paddingBottom:6,borderBottom:"1px solid rgba(212,168,67,0.15)"}}>
            <div style={{flex:1}}><div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,fontWeight:700}}>{kat.ad}</div>{kat.reyon&&<div style={{fontSize:9,color:C.dim,marginTop:1}}>{kat.reyon}</div>}</div>
            {(kat.malzemeler||[]).some(function(m){return m.tahmini_fiyat;})&&<span style={{fontSize:10,color:C.dim}}>~{(kat.malzemeler||[]).reduce(function(a,m){return a+(m.tahmini_fiyat||0);},0)}₺</span>}
          </div>
          {(kat.malzemeler||[]).map(function(m,mi){var ck=ki+"-"+mi;return <div key={mi} onClick={function(){setChecked(function(p){var n=Object.assign({},p);n[ck]=!n[ck];return n;});}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 3px",borderBottom:"1px solid var(--border)",cursor:"pointer",opacity:checked[ck]?0.35:1}}>
            <span style={{width:16,height:16,borderRadius:4,flexShrink:0,border:"1.5px solid "+(checked[ck]?C.gold:"var(--border)"),background:checked[ck]?C.goldDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.gold}}>{checked[ck]?"✓":""}</span>
            <span style={{fontSize:12,color:C.muted,minWidth:52}}>{m.miktar}</span>
            <span style={{fontSize:13,color:checked[ck]?"var(--muted)":C.cream,textDecoration:checked[ck]?"line-through":"none"}}>{m.isim}</span>
          </div>;})}
        </div>;}):null}
      </div>
      {list&&list.not&&<div style={{fontSize:10,color:C.dim,padding:"8px 4px",borderTop:"1px solid var(--border)",marginTop:8}}>ℹ️ {list.not}</div>}
    </div>
  </div>;
}

// ─── ALIŞVERİŞ TAB (standalone) ─────────────────────────────
function AlisverisTab(){
  var [manuelList,setManuelList]=useState([]);
  var [yeniItem,setYeniItem]=useState("");
  var [yeniMiktar,setYeniMiktar]=useState("");
  var [yeniKat,setYeniKat]=useState("Sebze & Meyve");
  var [checked,setChecked]=useState({});
  var ALKAT=["Sebze & Meyve","Et & Balık","Süt & Yumurta","Tahıl & Baklagil","Baharat & Sos","İçecek","Temizlik","Diğer"];
  useEffect(function(){stGet("alisveris_list").then(function(r){setManuelList(r||[]);});stGet("alisveris_checked").then(function(r){setChecked(r||{});});},[]);
  async function save(list,chk){setManuelList(list);await stSet("alisveris_list",list);if(chk!==undefined){setChecked(chk);await stSet("alisveris_checked",chk);}}
  function addItem(){
    if(!yeniItem.trim()) return;
    var item={id:Date.now(),isim:yeniItem.trim(),miktar:yeniMiktar.trim(),kategori:yeniKat};
    save(manuelList.concat([item]));
    setYeniItem("");setYeniMiktar("");
  }
  function removeItem(id){save(manuelList.filter(function(x){return x.id!==id;}));}
  function toggleCheck(id){var n=Object.assign({},checked);n[id]=!n[id];save(manuelList,n);}
  function clearChecked(){var ids=Object.keys(checked).filter(function(k){return checked[k];}).map(Number);save(manuelList.filter(function(x){return !ids.includes(x.id);}),{});}
  function copyList(){
    var txt=ALKAT.map(function(k){var items=manuelList.filter(function(x){return x.kategori===k&&!checked[x.id];});if(items.length===0) return "";return k.toUpperCase()+"\n"+items.map(function(x){return "• "+(x.miktar?x.miktar+" ":"")+x.isim;}).join("\n");}).filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(txt).then(function(){alert("Kopyalandı!");});
  }
  var grouped={};
  ALKAT.forEach(function(k){grouped[k]=manuelList.filter(function(x){return x.kategori===k;});});
  var totalItems=manuelList.length;
  var checkedCount=Object.keys(checked).filter(function(k){return checked[k];}).length;

  return <div style={{paddingBottom:68}}>
    <TabHeader sub="Alışveriş Listesi" title="Market Listesi" desc="Manuel liste oluştur ve yönet"/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:150,background:"linear-gradient(135deg,rgba(212,168,67,0.1),rgba(212,168,67,0.04))",borderRadius:11,padding:"12px",border:"1px solid rgba(212,168,67,0.2)"}}>
          <div style={{fontSize:20,fontWeight:700,color:C.cream}}>{totalItems}</div>
          <div style={{fontSize:10,color:C.muted}}>Toplam ürün</div>
        </div>
        <div style={{flex:1,minWidth:150,background:"linear-gradient(135deg,rgba(76,175,122,0.1),rgba(76,175,122,0.04))",borderRadius:11,padding:"12px",border:"1px solid rgba(76,175,122,0.2)"}}>
          <div style={{fontSize:20,fontWeight:700,color:C.green}}>{checkedCount}/{totalItems}</div>
          <div style={{fontSize:10,color:C.muted}}>Alınan</div>
        </div>
      </div>
      <div style={{background:"var(--card)",borderRadius:13,padding:"14px",border:"1px solid var(--border)",marginBottom:12}}>
        <div style={{display:"flex",gap:7,marginBottom:8}}>
          <input value={yeniItem} onChange={function(e){setYeniItem(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") addItem();}} placeholder="Ürün adı" style={{flex:2,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:13}}/>
          <input value={yeniMiktar} onChange={function(e){setYeniMiktar(e.target.value);}} placeholder="Miktar" style={{flex:1,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:12}}/>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
          {ALKAT.map(function(k){var on=yeniKat===k;return <button key={k} onClick={function(){setYeniKat(k);}} style={{padding:"4px 8px",borderRadius:50,fontSize:10,border:"1px solid "+(on?C.gold+"88":"var(--border)"),background:on?C.goldDim:"transparent",color:on?C.goldL:C.muted}}>{k}</button>;})}
        </div>
        <button onClick={addItem} disabled={!yeniItem.trim()} style={{width:"100%",padding:"9px",borderRadius:9,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>+ Ekle</button>
      </div>
      {manuelList.length>0&&<div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={copyList} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted,fontSize:11}}>📋 Kopyala</button>
        <button onClick={function(){window.print();}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted,fontSize:11}}>🖨️ Yazdır</button>
        {checkedCount>0&&<button onClick={clearChecked} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.06)",color:C.red,fontSize:11}}>🗑 Alınanları Sil</button>}
      </div>}
      {manuelList.length===0&&<div style={{textAlign:"center",padding:"30px 20px",background:"var(--card)",borderRadius:13,border:"1px solid var(--border)"}}>
        <div style={{fontSize:36,marginBottom:8}}>🛒</div>
        <div style={{fontSize:13,color:C.muted}}>Alışveriş listen boş</div>
        <div style={{fontSize:11,color:"var(--dim)",marginTop:5}}>Yukarıdan ürün ekle veya Menü'den alışveriş listesi oluştur</div>
      </div>}
      {ALKAT.map(function(kat){
        var items=grouped[kat]||[];
        if(items.length===0) return null;
        return <div key={kat} style={{marginBottom:14}}>
          <div style={{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:6,paddingBottom:4,borderBottom:"1px solid rgba(212,168,67,0.15)"}}>{kat}</div>
          {items.map(function(item){var ck=!!checked[item.id];return <div key={item.id} onClick={function(){toggleCheck(item.id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 3px",borderBottom:"1px solid var(--border)",cursor:"pointer",opacity:ck?0.35:1}}>
            <span style={{width:18,height:18,borderRadius:5,flexShrink:0,border:"1.5px solid "+(ck?C.gold:"var(--border)"),background:ck?C.goldDim:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:C.gold}}>{ck?"✓":""}</span>
            {item.miktar&&<span style={{fontSize:11,color:C.muted,minWidth:50}}>{item.miktar}</span>}
            <span style={{fontSize:13,color:ck?"var(--muted)":"var(--cream)",textDecoration:ck?"line-through":"none",flex:1}}>{item.isim}</span>
            <button onClick={function(e){e.stopPropagation();removeItem(item.id);}} style={{background:"transparent",border:"none",color:C.dim,fontSize:10,padding:"3px",cursor:"pointer"}}>✕</button>
          </div>;})}
        </div>;
      })}
    </div>
  </div>;
}

// ─── LOADING OVERLAY ──────────────────────────────────────────
function LoadingOverlay({msg,eta}){
  var [elapsed,setElapsed]=useState(0);
  useEffect(function(){
    var iv=setInterval(function(){setElapsed(function(e){return e+1;});},1000);
    return function(){clearInterval(iv);};
  },[]);
  var remaining=eta?Math.max(0,eta-elapsed):null;
  var pct=eta?Math.min(100,Math.round((elapsed/eta)*100)):null;
  var dots=["",".","..","."][elapsed%4];
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:32}}>
    <div style={{width:"100%",maxWidth:340,background:"var(--card)",borderRadius:18,padding:"28px 24px",border:"1px solid rgba(212,168,67,0.2)",textAlign:"center"}}>
      <div style={{marginBottom:18,position:"relative",width:72,height:72,margin:"0 auto 18px"}}>
        <svg width={72} height={72} style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
          <circle cx={36} cy={36} r={30} fill="none" stroke="rgba(212,168,67,0.15)" strokeWidth={4}/>
          {pct!==null&&<circle cx={36} cy={36} r={30} fill="none" stroke={C.gold} strokeWidth={4} strokeDasharray={2*Math.PI*30} strokeDashoffset={2*Math.PI*30*(1-pct/100)} style={{transition:"stroke-dashoffset 0.8s ease"}}/>}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold}}>{pct!==null?pct+"%":"..."}</div>
        </div>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.cream,marginBottom:6,fontFamily:"'Playfair Display',serif"}}>{msg||"Hazırlanıyor"}{dots}</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.6}}>AI analiz yapıyor, kişiselleştiriyor…</div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
        <span style={{fontSize:11,color:C.dim}}>Geçen: {elapsed}s</span>
        {remaining!==null&&<span style={{fontSize:11,color:remaining<10?C.orange:C.dim}}>Kalan: ~{remaining}s</span>}
      </div>
      {pct!==null&&<div style={{height:4,borderRadius:2,background:"rgba(212,168,67,0.15)",overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+C.gold+",#F0C96A)",borderRadius:2,transition:"width 0.8s ease"}}/>
      </div>}
      {!pct&&<div style={{display:"flex",gap:5,justifyContent:"center",marginTop:4}}>
        {[0,1,2].map(function(i){return <div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.gold,opacity:elapsed%3===i?1:0.25,transition:"opacity 0.3s"}}/>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// BUZDOLABI PANELİ
// ══════════════════════════════════════════════════════════════
function BuzdolabiPanel(){
  var [malzemeler,setMalzemeler]=useState("");
  var [kisi,setKisi]=useState(2);
  var [loading,setLoading]=useState(false);
  var [data,setData]=useState(null);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var ORNEK=["domates, mozzarella, fesleğen","tavuk, limon, sarımsak, zeytinyağı","yumurta, peynir, domates","mercimek, soğan, biber, domates","makarna, kıyma, salça"];

  function generate(){
    if (!malzemeler.trim()) return;
    setLoading(true); setError(null); setData(null); setOpenIdx(null);
    callAI("Expert Turkish chef. Create 4 complete recipes using ONLY these available ingredients: "+malzemeler+". For "+kisi+" people. Be creative and make the most of what's available.\nContinue JSON:\n\"baslik\":\"string\",\"tarifler\":[{\"isim\":\"dish\",\"sure\":\"X dk\",\"zorluk\":\"Kolay\",\"kalori\":\"XXX kcal\",\"aciklama\":\"1 sentence\",\"malzemeler\":[{\"miktar\":\"amount\",\"isim\":\"ingredient\"}],\"adimlar\":[\"step1\",\"step2\",\"step3\"],\"ipucu\":\"chef tip\",\"eksik\":\"optional missing ingredient that would make it better\"}]}\nAll Turkish.",1400)
      .then(function(r){setData(r);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }

  return <div style={{paddingBottom:8}}>
    <div style={{marginBottom:14,padding:"14px 16px",background:"linear-gradient(135deg,rgba(45,212,191,0.08),rgba(45,212,191,0.02))",borderRadius:14,border:"1px solid rgba(45,212,191,0.2)"}}>
      <div style={{fontSize:10,letterSpacing:"0.3em",color:C.teal,textTransform:"uppercase",fontWeight:700,marginBottom:5}}>✦ Buzdolabı Modu</div>
      <div style={{fontSize:17,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>Eldekilerden <em style={{color:C.teal}}>Tarif</em> Yap</div>
      <div style={{fontSize:12,color:C.muted,marginTop:3}}>Ne varsa yaz, AI tarife dönüştürsün</div>
    </div>
    <SH label="Elindeki Malzemeler" sub="Virgülle ayırarak yaz"/>
    <textarea value={malzemeler} onChange={function(e){setMalzemeler(e.target.value);}} placeholder="Örn: domates, yumurta, peynir, soğan, zeytinyağı, makarna…" rows={3} style={{width:"100%",background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:11,padding:"11px 14px",color:C.cream,fontSize:13,outline:"none",resize:"none",marginBottom:10,lineHeight:1.6}}/>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Hızlı örnek:</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {ORNEK.map(function(o,i){return <button key={i} onClick={function(){setMalzemeler(o);}} style={{padding:"5px 11px",borderRadius:50,fontSize:11,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted}}>{o}</button>;})}
      </div>
    </div>
    <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:14}}>
      <span style={{fontSize:12,color:C.muted,flexShrink:0}}>Kaç kişi?</span>
      <div style={{display:"flex",gap:5}}>
        {[1,2,3,4,5,6].map(function(n){return <button key={n} onClick={function(){setKisi(n);}} style={{width:36,height:36,borderRadius:9,border:"1.5px solid "+(kisi===n?C.teal:"var(--border)"),background:kisi===n?"rgba(45,212,191,0.12)":"var(--card2)",color:kisi===n?C.teal:C.muted,fontSize:13,fontWeight:kisi===n?700:400}}>{n}</button>;})}
      </div>
    </div>
    <ErrBox msg={error}/>
    <button onClick={generate} disabled={loading||!malzemeler.trim()} style={{width:"100%",padding:"14px",borderRadius:13,border:"2px solid rgba(45,212,191,"+(loading?"0.15":"0.5")+")",background:loading?"rgba(45,212,191,0.03)":"linear-gradient(135deg,rgba(45,212,191,0.2),rgba(45,212,191,0.06))",color:loading?"#444":C.teal,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
      {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16} color={C.teal}/>Tarifler oluşturuluyor…</span>:"🧊 Buzdolabından Tarif Bul"}
    </button>
    {loading&&<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:14}}>{[0,1,2,3].map(function(i){return <div key={i} className="sk" style={{height:85,animationDelay:i*0.1+"s"}}/>;})}  </div>}
    {data&&<div className="up" style={{marginTop:18}}>
      <div style={{fontSize:10,letterSpacing:"0.25em",color:C.teal,textTransform:"uppercase",fontWeight:700,marginBottom:14}}>✦ {data.baslik||"Buzdolabı Tarifleri"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {(data.tarifler||[]).map(function(t,i){
          var open=openIdx===i;
          return <div key={i} style={{background:"var(--card)",borderRadius:14,border:"1px solid "+(open?"rgba(45,212,191,0.35)":"var(--border)"),overflow:"hidden"}}>
            <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"14px 16px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:11,alignItems:"flex-start"}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:"rgba(45,212,191,0.1)",border:"1px solid rgba(45,212,191,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🧊</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:4}}>{t.isim}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {t.sure?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {t.sure}</span>:null}
                  {t.zorluk?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(45,212,191,0.1)",color:C.teal}}>{t.zorluk}</span>:null}
                  {t.kalori?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔥 {t.kalori}</span>:null}
                </div>
              </div>
              <span style={{fontSize:11,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </button>
            {open&&<div className="up" style={{padding:"0 16px 16px",borderTop:"1px solid rgba(45,212,191,0.12)"}}>
              <p style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.7,marginTop:12,marginBottom:12}}>{t.aciklama}</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:12}}>
                <div>
                  <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Malzemeler</div>
                  {(t.malzemeler||[]).map(function(m,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:C.teal,fontSize:9,marginTop:3}}>◆</span><span style={{color:C.muted,minWidth:36,fontSize:12}}>{m.miktar}</span><span style={{color:C.cream,fontSize:12}}>{m.isim}</span></div>;})}
                </div>
                <div>
                  <div style={{fontSize:10,color:C.teal,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Hazırlanış</div>
                  {(t.adimlar||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:6}}><span style={{color:C.teal,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
                </div>
              </div>
              {t.ipucu?<div style={{padding:"9px 12px",background:"rgba(212,168,67,0.07)",borderRadius:9,border:"1px solid rgba(212,168,67,0.15)",fontSize:12,color:C.gold,marginBottom:8}}>💡 {t.ipucu}</div>:null}
              {t.eksik?<div style={{padding:"9px 12px",background:"rgba(45,212,191,0.06)",borderRadius:9,border:"1px solid rgba(45,212,191,0.15)",fontSize:12,color:C.teal}}>✨ Opsiyonel: {t.eksik}</div>:null}
            </div>}
          </div>;
        })}
      </div>
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// BUZDOLABI TAB (standalone) — enhanced with categories, expiry, alerts
// ══════════════════════════════════════════════════════════════
var BUZD_KAT=[
  {id:"sebze",label:"Sebze & Meyve",emoji:"🥦",col:C.green},
  {id:"et",label:"Et & Balık",emoji:"🥩",col:C.red},
  {id:"sut",label:"Süt & Yumurta",emoji:"🥛",col:C.blue},
  {id:"tahil",label:"Tahıl & Baklagil",emoji:"🌾",col:"#F59E0B"},
  {id:"baharat",label:"Baharat & Sos",emoji:"🌶️",col:C.orange},
  {id:"diger",label:"Diğer",emoji:"📦",col:C.muted},
];
function BuzdolabiTab(){
  var [buzdItems,setBuzdItems]=useState([]);
  var [showAdd,setShowAdd]=useState(false);
  var [addName,setAddName]=useState("");
  var [addKat,setAddKat]=useState("sebze");
  var [addExpiry,setAddExpiry]=useState("");
  var [addMiktar,setAddMiktar]=useState("");
  var [subtab,setSubtab]=useState("envanter");

  useEffect(function(){stGet("buzd_items").then(function(r){setBuzdItems(r||[]);});},[]);
  async function saveBuzd(items){setBuzdItems(items);await stSet("buzd_items",items);}
  function addItem(){
    if(!addName.trim()) return;
    var item={id:Date.now(),isim:addName.trim(),kategori:addKat,miktar:addMiktar.trim()||"",skt:addExpiry||"",eklenme:new Date().toISOString().slice(0,10)};
    saveBuzd(buzdItems.concat([item]));
    setAddName("");setAddMiktar("");setAddExpiry("");setShowAdd(false);
  }
  function removeItem(id){saveBuzd(buzdItems.filter(function(x){return x.id!==id;}));}

  var today=new Date().toISOString().slice(0,10);
  var expiringSoon=buzdItems.filter(function(x){
    if(!x.skt) return false;
    var diff=(new Date(x.skt)-new Date(today))/(86400000);
    return diff>=0&&diff<=3;
  });
  var expired=buzdItems.filter(function(x){return x.skt&&x.skt<today;});
  var grouped={};
  BUZD_KAT.forEach(function(k){grouped[k.id]=buzdItems.filter(function(x){return x.kategori===k.id;});});

  return <div style={{paddingBottom:68}}>
    <TabHeader sub="Buzdolabı Yönetimi" title="Ne var ne yok?"/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:5,marginBottom:12}}>
        {[["envanter","📦","Envanter"],["tarif","🧊","Tarif Bul"]].map(function(t){var ac=subtab===t[0];return <button key={t[0]} onClick={function(){setSubtab(t[0]);}} style={{flex:1,padding:"9px",borderRadius:10,border:"1.5px solid "+(ac?"rgba(45,212,191,0.5)":"var(--border)"),background:ac?"rgba(45,212,191,0.1)":"var(--card)",color:ac?C.teal:C.muted,fontSize:12,fontWeight:ac?700:400}}>{t[1]} {t[2]}</button>;})}
      </div>
      {subtab==="tarif"&&<BuzdolabiPanel/>}
      {subtab==="envanter"&&<div>
        {(expired.length>0||expiringSoon.length>0)&&<div style={{marginBottom:12}}>
          {expired.length>0&&<div style={{padding:"10px 13px",borderRadius:10,background:"rgba(224,82,82,0.08)",border:"1px solid rgba(224,82,82,0.2)",marginBottom:6}}>
            <div style={{fontSize:10,color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:4}}>⚠ Süresi Geçmiş ({expired.length})</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{expired.map(function(x){return <span key={x.id} style={{fontSize:11,padding:"3px 8px",borderRadius:50,background:"rgba(224,82,82,0.12)",color:C.red,cursor:"pointer"}} onClick={function(){removeItem(x.id);}}>{x.isim} ✕</span>;})}</div>
          </div>}
          {expiringSoon.length>0&&<div style={{padding:"10px 13px",borderRadius:10,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)"}}>
            <div style={{fontSize:10,color:"#F59E0B",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:4}}>⏰ Son 3 Gün ({expiringSoon.length})</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{expiringSoon.map(function(x){return <span key={x.id} style={{fontSize:11,padding:"3px 8px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{x.isim} ({x.skt.slice(5)})</span>;})}</div>
          </div>}
        </div>}
        <button onClick={function(){setShowAdd(!showAdd);}} style={{width:"100%",padding:"10px",borderRadius:11,border:"2px dashed rgba(45,212,191,0.3)",background:"rgba(45,212,191,0.04)",color:C.teal,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12}}>+ Malzeme Ekle</button>
        {showAdd&&<div className="up" style={{background:"var(--card)",borderRadius:13,padding:"14px",border:"1px solid rgba(45,212,191,0.25)",marginBottom:14}}>
          <input value={addName} onChange={function(e){setAddName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") addItem();}} placeholder="Malzeme adı" style={{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:13,marginBottom:7}}/>
          <div style={{display:"flex",gap:7,marginBottom:7}}>
            <input value={addMiktar} onChange={function(e){setAddMiktar(e.target.value);}} placeholder="Miktar (opsiyonel)" style={{flex:1,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:12}}/>
            <input type="date" value={addExpiry} onChange={function(e){setAddExpiry(e.target.value);}} style={{flex:1,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:12}}/>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
            {BUZD_KAT.map(function(k){var on=addKat===k.id;return <button key={k.id} onClick={function(){setAddKat(k.id);}} style={{padding:"5px 10px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?k.col+"88":"var(--border)"),background:on?k.col+"18":"transparent",color:on?k.col:C.muted}}>{k.emoji} {k.label}</button>;})}
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={function(){setShowAdd(false);}} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>İptal</button>
            <button onClick={addItem} disabled={!addName.trim()} style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,rgba(45,212,191,0.3),rgba(45,212,191,0.1))",color:C.teal,fontSize:12,fontWeight:700}}>✓ Ekle</button>
          </div>
        </div>}
        {buzdItems.length===0&&<div style={{textAlign:"center",padding:"30px 20px",background:"var(--card)",borderRadius:13,border:"1px solid var(--border)"}}>
          <div style={{fontSize:36,marginBottom:8}}>🧊</div>
          <div style={{fontSize:13,color:C.muted}}>Buzdolabın boş</div>
          <div style={{fontSize:11,color:"var(--dim)",marginTop:5}}>Yukarıdaki butona tıklayarak malzeme ekle</div>
        </div>}
        {BUZD_KAT.map(function(kat){
          var items=grouped[kat.id]||[];
          if(items.length===0) return null;
          return <div key={kat.id} style={{marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
              <span style={{fontSize:14}}>{kat.emoji}</span>
              <span style={{fontSize:11,fontWeight:700,color:kat.col,textTransform:"uppercase",letterSpacing:"0.12em"}}>{kat.label}</span>
              <span style={{fontSize:10,color:C.dim}}>({items.length})</span>
            </div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {items.map(function(item){
                var isExp=item.skt&&item.skt<today;
                var isNear=item.skt&&!isExp&&((new Date(item.skt)-new Date(today))/86400000)<=3;
                return <div key={item.id} style={{padding:"6px 10px",borderRadius:9,background:isExp?"rgba(224,82,82,0.08)":isNear?"rgba(245,158,11,0.08)":"var(--card)",border:"1px solid "+(isExp?"rgba(224,82,82,0.25)":isNear?"rgba(245,158,11,0.25)":"var(--border)"),display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12,color:isExp?C.red:"var(--cream)"}}>{item.isim}</span>
                  {item.miktar&&<span style={{fontSize:10,color:C.dim}}>{item.miktar}</span>}
                  {item.skt&&<span style={{fontSize:9,color:isExp?C.red:isNear?"#F59E0B":C.dim}}>{item.skt.slice(5)}</span>}
                  <button onClick={function(){removeItem(item.id);}} style={{background:"transparent",border:"none",color:C.dim,fontSize:10,padding:0,cursor:"pointer"}}>✕</button>
                </div>;
              })}
            </div>
          </div>;
        })}
        {buzdItems.length>0&&<div style={{marginTop:8,padding:"10px 13px",borderRadius:10,background:"rgba(45,212,191,0.04)",border:"1px solid rgba(45,212,191,0.15)"}}>
          <div style={{fontSize:10,color:C.teal,marginBottom:4}}>📊 Toplam: {buzdItems.length} malzeme · {expired.length} süresi geçmiş · {expiringSoon.length} yakında bitiyor</div>
        </div>}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// İMZA PANELİ
// ══════════════════════════════════════════════════════════════
function ImzaPanel(){
  var [mutfak,setMutfak]=useState("türk");
  var [stil,setStil]=useState("fine");
  var [loading,setLoading]=useState(false);
  var [data,setData]=useState(null);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  function generate(){
    setLoading(true); setError(null); setData(null); setOpenIdx(null);
    var m=(fI(IMZA_MUTFAK,mutfak)||{}).label||mutfak;
    var s=(fI(STILLER,stil)||{}).label||stil;
    callAI("Michelin chef. 5 signature dishes for "+m+", "+s+" style.\nContinue JSON:\n\"baslik\":\"İmza Yemekler — "+m+"\",\"spesiyal\":[{\"isim\":\"dish\",\"hikaye\":\"2 sentences\",\"teknik\":\"key technique\",\"sir\":\"secret\",\"malzemeler\":[\"s1\",\"s2\",\"s3\"],\"sunum\":\"plating\",\"eslesme\":\"pairing\",\"zorluk\":\"Orta\",\"sure\":\"X dk\",\"kalori\":\"XXX kcal\"}]}\nAll Turkish.",1200)
      .then(function(r){setData(r);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }
  return <div>
    <SH label="Mutfak"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:7,marginBottom:14}}>
      {IMZA_MUTFAK.map(function(m){var on=mutfak===m.id;return <button key={m.id} onClick={function(){setMutfak(m.id);}} style={{borderRadius:11,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",transition:"all 0.18s",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <span style={{fontSize:20}}>{m.emoji}</span><span style={{fontSize:11,color:on?C.cream:"var(--muted)"}}>{m.label}</span>
      </button>;})}
    </div>
    <SH label="Sunum Stili"/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:7,marginBottom:14}}>
      {STILLER.map(function(s){var on=stil===s.id;return <button key={s.id} onClick={function(){setStil(s.id);}} style={{borderRadius:11,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
        <div style={{fontSize:20,marginBottom:3}}>{s.emoji}</div><div style={{fontSize:11,fontWeight:600,color:on?C.cream:"var(--muted)"}}>{s.label}</div>
      </button>;})}
    </div>
    <ErrBox msg={error}/>
    <GoldBtn onClick={generate} loading={loading} disabled={loading}>
      {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Hazırlanıyor…</span>:"⭐ İmza Yemekleri Oluştur"}
    </GoldBtn>
    {loading&&<div style={{display:"flex",flexDirection:"column",gap:9,marginTop:14}}>{[0,1,2,3,4].map(function(i){return <div key={i} className="sk" style={{height:75,animationDelay:i*0.08+"s"}}/>;})}  </div>}
    {data&&<div className="up" style={{marginTop:18}}>
      <div style={{textAlign:"center",marginBottom:14,fontSize:10,letterSpacing:"0.25em",color:C.gold,textTransform:"uppercase",fontWeight:700}}>{data.baslik}</div>
      {(data.spesiyal||[]).map(function(sp,i){var open=openIdx===i;return <div key={i} style={{background:"var(--card)",borderRadius:14,border:"1px solid "+(open?C.borderG:"var(--border)"),overflow:"hidden",marginBottom:9}}>
        <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"14px 16px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:11,alignItems:"flex-start"}}>
          <div style={{width:34,height:34,borderRadius:10,flexShrink:0,background:C.goldDim,border:"1px solid "+C.borderG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.gold,fontWeight:700}}>{i+1}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:4}}>{sp.isim}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {sp.sure?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {sp.sure}</span>:null}
              {sp.zorluk?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:C.goldDim,color:C.gold}}>{sp.zorluk}</span>:null}
            </div>
          </div>
          <span style={{fontSize:11,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
        </button>
        {open&&<div className="up" style={{padding:"0 16px 16px",borderTop:"1px solid var(--border)"}}>
          <p style={{fontSize:13,color:C.muted,fontStyle:"italic",lineHeight:1.7,margin:"12px 0"}}>{sp.hikaye}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
            <div style={{background:C.goldDim,borderRadius:9,padding:"10px 12px",border:"1px solid "+C.borderG}}><div style={{fontSize:9,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>🔪 Teknik</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{sp.teknik}</div></div>
            <div style={{background:"rgba(224,82,82,0.05)",borderRadius:9,padding:"10px 12px",border:"1px solid rgba(224,82,82,0.15)"}}><div style={{fontSize:9,color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>🤫 Sır</div><div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{sp.sir}</div></div>
          </div>
          {sp.eslesme?<div style={{padding:"8px 12px",background:"rgba(91,163,208,0.06)",borderRadius:9,border:"1px solid rgba(91,163,208,0.15)"}}><span style={{fontSize:9,color:C.blue,fontWeight:700,textTransform:"uppercase"}}>🍷 Eşleşme  </span><span style={{fontSize:12,color:C.muted}}>{sp.eslesme}</span></div>:null}
        </div>}
      </div>;})}
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: MENU
// ══════════════════════════════════════════════════════════════

function PazarWidget(){
  var ay=new Date().getMonth()+1;
  var pd=PAZAR_AY[ay]||{urunler:[],tema:""};
  var AYLAR=["","Ocak","Subat","Mart","Nisan","Mayis","Haziran","Temmuz","Agustos","Eylul","Ekim","Kasim","Aralik"];
  var [open,setOpen]=useState(false);
  return <div style={{marginBottom:12}}>
    <button onClick={function(){setOpen(!open);}} style={{width:"100%",padding:"9px 13px",borderRadius:10,border:"1px solid rgba(76,175,122,0.3)",background:"rgba(76,175,122,0.05)",color:C.green,display:"flex",alignItems:"center",gap:8,fontSize:12}}>
      <span style={{fontSize:16}}>🥕</span>
      <span style={{flex:1,textAlign:"left",fontWeight:500}}>{AYLAR[ay]} pazari — {pd.tema}</span>
      <span style={{fontSize:9,background:"rgba(76,175,122,0.15)",padding:"2px 7px",borderRadius:50}}>{pd.urunler.length} urun</span>
      <span style={{fontSize:10,color:C.dim}}>{open?"▲":"▼"}</span>
    </button>
    {open&&<div className="up" style={{background:"rgba(76,175,122,0.03)",borderRadius:"0 0 10px 10px",border:"1px solid rgba(76,175,122,0.2)",borderTop:"none",padding:"10px 13px"}}>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
        {pd.urunler.map(function(u){return <span key={u} style={{fontSize:11,padding:"4px 9px",borderRadius:50,background:"rgba(76,175,122,0.1)",border:"1px solid rgba(76,175,122,0.2)",color:C.green}}>{u}</span>;})}
      </div>
      <div style={{fontSize:10,color:C.dim}}>Bu ürünler menüye otomatik dahil edilir (Mevsimsel seçeneği aktifken)</div>
    </div>}
  </div>;
}
function MenuTab(props){
  var [imzaMutfak,setImzaMutfak]=useState("türk");
  var [memCtx,setMemCtx]=useState("");
  var [aileProf,setAileProf]=useState([]);
  var [showAile,setShowAile]=useState(false);
  var [showBildirim,setShowBildirim]=useState(false);
  var [denge,setDenge]=useState({});
  // Feature 2: Günün Tarifi
  var [gunTarif,setGunTarif]=useState(null);var [gunTarifLoad,setGunTarifLoad]=useState(false);
  // Feature 4: Global Diyet Filtresi
  var [globalDiyet,setGlobalDiyet]=useState("normal");
  // Feature 7: Hızlı Kategori
  var [hizliKat,setHizliKat]=useState(null);
  // Feature 15: Bulanık Arama
  var [aramaQ,setAramaQ]=useState("");
  // Feature 18: Kişisel AI Öneri
  var [aiOneri,setAiOneri]=useState(null);var [aiOneriLoad,setAiOneriLoad]=useState(false);
  // Feature 19: Konsensüs Tarif
  var [konsensusQ,setKonsensusQ]=useState("");var [konsensusData,setKonsensusData]=useState(null);var [konsensusLoad,setKonsensusLoad]=useState(false);
  useEffect(function(){
    buildMemoryCtx(props.user||"mis").then(function(m){setMemCtx(m||"");});
    stGet("aile_prof").then(function(p){if(p) setAileProf(p);});
  },[]);
  async function saveAileProf(p){setAileProf(p);await stSet("aile_prof",p);}
  var [selC,setSelC]=useState([]);
  var [ogun,setOgun]=useState("karma");
  var [stil,setStil]=useState("ev");
  var [zorluk,setZorluk]=useState("kolay");
  var [beslenme,setBeslenme]=useState("normal");
  var [baharat,setBaharat]=useState("orta");
  var [alerjen,setAlerjen]=useState({});
  var [ekstra,setEkstra]=useState({});
  var [kisi,setKisi]=useState(2);
  var [kalem,setKalem]=useState(5);
  var [gunSayisi,setGunSayisi]=useState(1);
  var [step,setStep]=useState(1);
  var [days,setDays]=useState(null);
  var [loading,setLoading]=useState(false);
  var [loadingDay,setLoadingDay]=useState(null);
  var [menuAdimlar,setMenuAdimlar]=useState([]);
  var [alisverisListesi,setAlisverisListesi]=useState([]);
  var [alisverisLoading,setAlisverisLoading]=useState(false);
  var [error,setError]=useState(null);
  var [detail,setDetail]=useState(null);
  var [repIdx,setRepIdx]=useState(null);
  var [listDish,setListDish]=useState(null);
  var [showShop,setShowShop]=useState(false);
  var [activeDay,setActiveDay]=useState(0);
  var [hasMenuHistory,setHasMenuHistory]=useState(null);
  var [pazarOncelik,setPazarOncelik]=useState(true);
  var cache=useRef({});
  var [akiMenuMod,setAkiMenuMod]=useState(false);
  var [urlImport,setUrlImport]=useState("");
  var [urlLoading,setUrlLoading]=useState(false);
  var [urlResult,setUrlResult]=useState(null);
  var [calendarView,setCalendarView]=useState(false);
  useEffect(function(){stGet("menu_hist").then(function(h){setHasMenuHistory(Array.isArray(h)&&h.length>0);});},[]);

  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function reset(){setDays(null);setDetail(null);}
  var oI=fI(OGUNLER,ogun)||{};
  var oL=oI.label||ogun;
  var _mAy=new Date().getMonth()+1,_mPd=PAZAR_AY[_mAy]||{tema:"",urunler:[]};
  var ctx=["Mutfak:"+(selC.length?selC.join(","):"Türk"),"Stil:"+(fI(STILLER,stil)||{}).label,"ImzaMutfak:"+(fI(IMZA_MUTFAK,imzaMutfak)||{}).label,"Beslenme:"+(fI(BESLENME,beslenme)||{}).label,"Baharat:"+(fI(BAHARAT,baharat)||{}).label,"Kişi:"+kisi,"Denge:"+Object.keys(denge).filter(function(k){return denge[k];}).map(function(k){return (DENGE.find(function(d){return d.id===k;})||{label:k}).label;}).join(","),"Mevsim:"+_mPd.tema,"Pazar:"+_mPd.urunler.slice(0,4).join(",")].join("|");
  var hKey=JSON.stringify({selC,ogun,stil,imzaMutfak,zorluk,beslenme,baharat,alerjen,ekstra,kisi,kalem,gunSayisi,pazarOncelik});

  // Load from persistent storage (cached menu for this exact key)
  useEffect(function(){
    stGet("menu:"+hKey).then(function(cached){
      if (cached&&!days){ setDays(cached); setStep(3); setActiveDay(0); }
    });
  },[hKey]);
  // Load last used menu settings
  useEffect(function(){
    stGet("menu_last_settings").then(function(s){
      if (!s||typeof s!=="object") return;
      if (s.selC&&Array.isArray(s.selC)) setSelC(s.selC);
      if (s.ogun) setOgun(s.ogun);
      if (s.stil) setStil(s.stil);
      if (s.imzaMutfak) setImzaMutfak(s.imzaMutfak);
      if (s.zorluk) setZorluk(s.zorluk);
      if (s.beslenme) setBeslenme(s.beslenme);
      if (s.baharat) setBaharat(s.baharat);
      if (s.alerjen&&typeof s.alerjen==="object") setAlerjen(s.alerjen);
      if (s.ekstra&&typeof s.ekstra==="object") setEkstra(s.ekstra);
      if (s.kisi&&KISI_OPT.includes(s.kisi)) setKisi(s.kisi);
      if (s.kalem&&[3,4,5,6,7,8,9,10].includes(s.kalem)) setKalem(s.kalem);
      if (s.gunSayisi&&s.gunSayisi>=1&&s.gunSayisi<=10) setGunSayisi(s.gunSayisi);
      if (s.denge&&typeof s.denge==="object") setDenge(s.denge);
      if (s.pazarOncelik!==undefined) setPazarOncelik(!!s.pazarOncelik);
    });
  },[]);

  function buildPrompt(gNo,exN){
    var pazarStr=pazarOncelik&&_mPd.urunler&&_mPd.urunler.length?"\nMevsimsel ve bu ay pazarda bol olan ürünlere öncelik ver: "+_mPd.urunler.join(", ")+".":"";
    var overlapStr=akiMenuMod?"\nAKILLI MENÜ: Yemekler arasında mümkün olduğunca ortak malzeme kullan. Aynı sebze/baharat/protein birden fazla yemekte tekrar etsin ki alışveriş listesi kısa kalsın. Malzeme örtüşmesini (ingredient overlap) maksimize et.":"";
    var hizliStr=hizliKat?"\nHIZLI KATEGORİ: "+(fI(HIZLI_KAT,hizliKat)||{}).desc+". Tüm yemekler bu kategoriye uygun olsun.":"";
    var globalDiyetStr=globalDiyet&&globalDiyet!=="normal"?"\nDİYET: "+(fI(BESLENME,globalDiyet)||{}).label+" diyetine uygun olsun.":"";
    return "Turkish chef. Exactly "+kalem+" dishes for Day "+gNo+"/"+gunSayisi+".\nContext:"+ctx+" | Meal:"+oL+" | Difficulty:"+(fI(ZORLUK,zorluk)||{}).label+" | Servings:"+kisi+(exN.length?"\nDo NOT include: "+exN.join(", "):"")+pazarStr+overlapStr+hizliStr+globalDiyetStr+(memCtx?"\n"+memCtx:"")+(Object.keys(denge).some(function(k){return denge[k];})?("\nDENGE: "+Object.keys(denge).filter(function(k){return denge[k];}).map(function(k){var _d=DENGE.find(function(x){return x.id===k;});return _d?_d.desc:"";}).filter(Boolean).join(". ")):"")+"\nContinue JSON:\n\"menu_adi\":\"name\",\"aciklama\":\"desc\",\"yemekler\":[{\"isim\":\"dish\",\"ogun\":\""+oL+"\",\"aciklama\":\"1 sentence\",\"malzemeler\":[\"i1\",\"i2\",\"i3\",\"i4\"],\"sure\":\"X dk\",\"zorluk\":\"Kolay\",\"kalori\":\"XXX kcal\"}]}\nAll Turkish, no duplicates.";
  }

  async function importFromUrl(){
    if(!urlImport.trim()) return;
    setUrlLoading(true);setUrlResult(null);
    try{
      var r=await callAI("URL'den tarif çıkar. URL: "+urlImport.trim()+"\nBu URL bir yemek tarifi sitesine ait. Tarifin adını, malzemelerini, adımlarını ve kalori bilgisini çıkar.\nJSON: \"isim\":\"tarif adı\",\"aciklama\":\"kısa açıklama\",\"malzemeler\":[{\"miktar\":\"amount\",\"isim\":\"ingredient\"}],\"adimlar\":[\"step1\",\"step2\"],\"sure\":\"X dk\",\"kalori\":\"XXX kcal\",\"kisi\":\"X kişilik\",\"zorluk\":\"Kolay/Orta/Zor\",\"ipucu\":\"chef tip\"}\nAll Turkish.",1200);
      setUrlResult(r);
    }catch(e){setUrlResult({error:e.message});}
    setUrlLoading(false);
  }

  async function generate(){
    await stSet("menu_last_settings",{selC,ogun,stil,imzaMutfak,zorluk,beslenme,baharat,alerjen,ekstra,kisi,kalem,gunSayisi,denge,pazarOncelik});
    if (cache.current[hKey]){setDays(cache.current[hKey]);setDetail(null);setActiveDay(0);return;}
    setLoading(true);setError(null);setDays(null);setDetail(null);
    // Build full checklist upfront
    var allSteps=[];
    for(var gi=1;gi<=gunSayisi;gi++) allSteps.push({label:gi+". gün menüsü hazırlanıyor",durum:"bekliyor"});
    allSteps.push({label:"Menü kaydediliyor",durum:"bekliyor"});
    allSteps.push({label:"Beslenme takibine ekleniyor",durum:"bekliyor"});
    setMenuAdimlar(allSteps);
    function updAdim(idx,durum){setMenuAdimlar(function(prev){var n=prev.slice();if(n[idx])n[idx]={label:n[idx].label,durum:durum};return n;});}
    var aD=[],aN=[];
    try{
      var tok=kalem<=4?700:kalem<=7?1000:1400;
      for (var g=1;g<=gunSayisi;g++){
        setLoadingDay(g);
        updAdim(g-1,"aktif");
        var r=await callAI(buildPrompt(g,aN),tok);
        if (!Array.isArray(r.yemekler)||r.yemekler.length===0) throw new Error(g+". gün başarısız.");
        r.yemekler.forEach(function(d){aN.push(d.isim);});
        aD.push({gunNo:g,menu_adi:r.menu_adi,aciklama:r.aciklama,dishes:r.yemekler});
        updAdim(g-1,"tamam");
      }
      updAdim(gunSayisi,"aktif");
      cache.current[hKey]=aD;
      await stSet("menu:"+hKey,aD);
      var hist=await stGet("menu_hist")||[];
      hist.unshift({date:new Date().toLocaleDateString("tr-TR"),key:hKey,days:aD.length,dishes:aD[0]&&aD[0].dishes.length,ogun:oL,label:aD[0]&&aD[0].menu_adi});
      if (hist.length>20) hist=hist.slice(0,20);
      await stSet("menu_hist",hist);
      trackMemory(props.user||"mis",selC,aD.flatMap(function(d){return (d.dishes||[]).map(function(x){return x.isim;});}));
      updAdim(gunSayisi,"tamam");
      updAdim(gunSayisi+1,"aktif");
      var today2=new Date().toISOString().slice(0,10);
      var allDishes=aD.flatMap(function(d){return (d.dishes||[]).map(function(x){return {isim:x.isim,kalori:x.kalori||"300 kcal",ogun:oL,loggedAt:new Date().toISOString(),protein:0,karbonhidrat:0,yag:0,lif:0};});});
      var existing2=await stGet("nutri:"+today2)||[];
      await stSet("nutri:"+today2,existing2.concat(allDishes));
      allDishes.slice(0,4).forEach(async function(item,ii){
        try{
          var ms=await estimateMacros(item.isim,item.kalori);
          var cur2=await stGet("nutri:"+today2)||[];
          var idx2=existing2.length+ii;
          if(cur2[idx2]) cur2[idx2]=Object.assign({},cur2[idx2],ms);
          await stSet("nutri:"+today2,cur2);
        }catch(e){}
      });
      updAdim(gunSayisi+1,"tamam");
      setDays(aD);setActiveDay(0);setStep(3);
    }catch(e){setError(e.message);}
    setLoadingDay(null);setLoading(false);
  }
  async function generateAlisverisListesi(){
    if(!days||days.length===0)return;
    setAlisverisLoading(true);
    var tumYemekler=days.flatMap(function(d){return (d.dishes||[]).map(function(x){return x.isim;});});
    try{
      var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe alışveriş listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu yemekler için alışveriş listesi çıkar: "+tumYemekler.join(", ")+".\n\nJSON: {\"kategoriler\":[{\"kategori\":\"Sebze & Meyve\",\"malzemeler\":[\"malzeme1\",\"malzeme2\"]},{\"kategori\":\"Et & Protein\",\"malzemeler\":[]},{\"kategori\":\"Tahıl & Baklagil\",\"malzemeler\":[]},{\"kategori\":\"Süt & Yumurta\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Sos\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
      var body=await res.json();
      var raw="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var parsed=parseJSON(raw);
      setAlisverisListesi(parsed&&parsed.kategoriler?parsed.kategoriler:[]);
      setShowShop(true);
    }catch(e){alert("Alışveriş listesi oluşturulamadı: "+e.message);}
    setAlisverisLoading(false);
  }



  async function hDetail(gIdx,dI,diI){
    if (detail&&detail.index===gIdx&&detail.data){setDetail(null);return;}
    setDetail({index:gIdx,loading:true,data:null});
    var dish=days&&days[dI]&&days[dI].dishes&&days[dI].dishes[diI];
    if (!dish){setDetail({index:gIdx,loading:false,error:"Bulunamadı"});return;}
    try{
      var r=await callAI("Detailed recipe for \""+dish.isim+"\" in Turkish, for "+kisi+" people.\nContinue JSON:\n\"sure\":\"X dk\",\"porsiyon\":\""+kisi+" kişilik\",\"kalori\":\"XXX kcal\",\"malzemeler\":[{\"miktar\":\"amount\",\"isim\":\"ing\"}],\"adimlar\":[\"step1\"],\"sef_notu\":\"tip\"}\nAll Turkish.",900);
      setDetail({index:gIdx,loading:false,data:r});
    }catch(e){setDetail({index:gIdx,loading:false,error:e.message});}
  }

  async function hReplace(gIdx,dI,diI){
    setRepIdx(gIdx);
    var dish=days[dI].dishes[diI];
    var aN=days.flatMap(function(d){return d.dishes.map(function(x){return x.isim;});});
    try{
      var r=null,att=0;
      while(att<5){
        r=await callAI("One UNIQUE replacement for \""+dish.isim+"\". Context:"+ctx+" | Meal:"+oL+" | Servings:"+kisi+".\nNot: "+aN.join(", ")+"\nContinue JSON:\n\"isim\":\"dish\",\"ogun\":\""+oL+"\",\"aciklama\":\"1 sentence\",\"malzemeler\":[\"i1\",\"i2\",\"i3\"],\"sure\":\"X dk\",\"zorluk\":\"Kolay\",\"kalori\":\"XXX kcal\"}\nAll Turkish.",450);
        if (!aN.some(function(n){return n.toLowerCase().trim()===(r.isim||"").toLowerCase().trim();})) break;
        att++;
      }
      setDays(function(prev){return prev.map(function(d,di){if(di!==dI) return d; var nd=d.dishes.slice();nd[diI]=r;return Object.assign({},d,{dishes:nd});});});
      if (detail&&detail.index===gIdx) setDetail(null);
      delete cache.current[hKey];
    }catch(e){setError(e.message);}
    setRepIdx(null);
  }

  async function tFav(dish){
    if (props.isGuest){alert("Favori için hesap açın.");return;}
    await props.onToggleFav(Object.assign({},dish));
  }
  async function cList(lid){if (!listDish) return;await props.onAddToList(lid,listDish);setListDish(null);}

  function doShare(){
    if (!days) return;
    var txt=days.map(function(d){return d.menu_adi+"\n"+d.dishes.map(function(x,i){return (i+1)+". "+x.isim+" ("+x.sure+")";}).join("\n");}).join("\n\n");
    shareMenu("🍽️ Menüm:\n"+txt,"Menüm");
  }

  var cDay=days&&days[activeDay];

  if (step===1||step===2) return <div style={{paddingBottom:78}}>
    {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
    <div style={{padding:"18px 20px 0"}}>
      <div style={{fontSize:12,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:600,marginBottom:6}}>ADIM {step} / 2</div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"var(--cream)",marginBottom:6,lineHeight:1.2}}>Menü Oluştur</h1>
      <p style={{fontSize:15,color:"var(--muted)",marginBottom:20}}>{step===1?"Öğün ve mutfak seçimi":"Kişi, süre ve tercihler"}</p>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {[["1","Öğün & Mutfak"],["2","Detaylar"]].map(function(s,i){var ac=step===i+1;return <div key={i} onClick={function(){setStep(i+1);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:50,background:ac?C.goldDim:"transparent",border:"1.5px solid "+(ac?C.gold:"var(--border)"),cursor:"pointer"}}>
          <span style={{width:22,height:22,borderRadius:"50%",background:ac?C.gold:"var(--dim)",color:ac?"#000":"var(--muted)",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{s[0]}</span>
          <span style={{fontSize:14,fontWeight:ac?600:400,color:ac?"var(--cream)":"var(--muted)"}}>{s[1]}</span>
        </div>;})}
      </div>
      {/* Feature 2: Günün Tarifi */}
      {step===1&&<div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <button onClick={function(){
            if(gunTarif&&!gunTarifLoad){setGunTarif(null);return;}
            setGunTarifLoad(true);
            var seed=getDailyRecipeSeed();
            var cacheKey="gun_tarif:"+seed;
            aiCacheGet(cacheKey).then(function(c){if(c){setGunTarif(c);setGunTarifLoad(false);return;}
              callAI("Yasadigimiz gun icin ozel bir Turk yemegi tarifi. Bugun "+new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})+" — mevsime ve gune uygun. Her seferinde farkli olsun. Baslik, aciklama, malzemeler ve adimlar ver.\nJSON: isim:string, aciklama:string, malzemeler:[{miktar,isim}], adimlar:[string], sure:string, kalori:string, hikaye:string, sef_notu:string",700).then(function(r){aiCacheSet(cacheKey,r);setGunTarif(r);setGunTarifLoad(false);}).catch(function(){setGunTarifLoad(false);});
            });
          }} style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid rgba(212,168,67,0.3)",background:gunTarif?C.goldDim:"linear-gradient(135deg,rgba(212,168,67,0.08),rgba(212,168,67,0.02))",color:C.goldL,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
            {gunTarifLoad?<Spinner size={12} color={C.gold}/>:<span style={{fontSize:18}}>🌟</span>}
            <span>{gunTarif?"Günün Tarifi: "+gunTarif.isim:"Günün Tarifi — Sürpriz!"}</span>
          </button>
          <button onClick={function(){
            setGunTarifLoad(true);
            callAI("Rastgele surpriz bir dunya yemegi tarifi. Farkli ulkelerden olabilir. Ilginc ve ozel olsun.\nJSON: isim:string, aciklama:string, malzemeler:[{miktar,isim}], adimlar:[string], sure:string, kalori:string, hikaye:string, sef_notu:string, ulke:string",700).then(function(r){setGunTarif(r);setGunTarifLoad(false);}).catch(function(){setGunTarifLoad(false);});
          }} style={{padding:"10px 14px",borderRadius:12,border:"1.5px solid rgba(155,127,212,0.3)",background:"rgba(155,127,212,0.08)",color:C.purple,fontSize:18}} title="Sürpriz Tarif">🎲</button>
        </div>
        {gunTarif&&!gunTarifLoad&&<div className="up" style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div><div style={{fontSize:16,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{gunTarif.isim}</div>{gunTarif.ulke&&<span style={{fontSize:10,color:C.purple}}>🌍 {gunTarif.ulke}</span>}</div>
            <div style={{display:"flex",gap:4}}>
              {gunTarif.sure&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {gunTarif.sure}</span>}
              {gunTarif.kalori&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {gunTarif.kalori}</span>}
            </div>
          </div>
          <p style={{fontSize:12,color:C.muted,fontStyle:"italic",marginBottom:8,lineHeight:1.6}}>{gunTarif.aciklama}</p>
          {gunTarif.hikaye&&<p style={{fontSize:11,color:C.gold,marginBottom:8,lineHeight:1.5}}>📖 {gunTarif.hikaye}</p>}
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{(gunTarif.malzemeler||[]).slice(0,8).map(function(m,i){return <span key={i} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>{typeof m==="string"?m:((m.miktar||"")+" "+m.isim).trim()}</span>;})}</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={function(){props.onToggleFav(gunTarif);}} style={{padding:"5px 10px",borderRadius:8,fontSize:11,border:"1px solid var(--border)",background:"transparent",color:C.muted}}>❤️ Favori</button>
            <button onClick={function(){exportToPDF(dishToHTML(gunTarif),(gunTarif.isim||"tarif"));}} style={{padding:"5px 10px",borderRadius:8,fontSize:11,border:"1px solid var(--border)",background:"transparent",color:C.muted}}>📄 PDF</button>
          </div>
          <DishActionButtons dish={gunTarif} col={C.gold} dishType="yemek"/>
          {gunTarif.sef_notu&&<div style={{marginTop:8,padding:"8px 12px",background:C.goldDim,borderRadius:8,fontSize:11,color:C.gold}}>👨‍🍳 {gunTarif.sef_notu}</div>}
        </div>}
      </div>}
      {/* Feature 7: Hızlı Yemek Kategorileri */}
      {step===1&&<div style={{marginBottom:14}}>
        <div style={{fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.muted,marginBottom:7}}>⚡ Hızlı Kategoriler</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
          {HIZLI_KAT.map(function(k){var ac=hizliKat===k.id;return <button key={k.id} onClick={function(){setHizliKat(ac?null:k.id);}} style={{padding:"5px 11px",borderRadius:50,fontSize:11,border:"1.5px solid "+(ac?k.col+"88":"var(--border)"),background:ac?k.col+"15":"transparent",color:ac?k.col:C.muted,fontWeight:ac?600:400,display:"flex",alignItems:"center",gap:4}}>{k.emoji} {k.label}</button>;})}
        </div>
      </div>}
      {/* Feature 15: Bulanık Arama */}
      {step===1&&<div style={{marginBottom:14}}>
        <div style={{position:"relative"}}>
          <input value={aramaQ} onChange={function(e){setAramaQ(e.target.value);}} placeholder="🔍 Tarif, malzeme veya yemek ara..." style={{width:"100%",padding:"10px 14px",borderRadius:12,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:13}}/>
          {aramaQ&&<button onClick={function(){setAramaQ("");}} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:C.muted,fontSize:14}}>✕</button>}
        </div>
      </div>}
      {/* Feature 19: Konsensüs Tarif */}
      {step===1&&<div style={{marginBottom:14}}>
        <div style={{display:"flex",gap:6}}>
          <input value={konsensusQ} onChange={function(e){setKonsensusQ(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&konsensusQ.trim()){
            setKonsensusLoad(true);setKonsensusData(null);
            callAI("Yemek tarihcisi ve sef. '"+konsensusQ+"' yemegi icin farkli kaynaklardan (geleneksel, modern, bolgesel) en iyi tarifi birlestir. Konsensus tarif olustur — herkesin uzerinde anlastigi malzeme ve tekniklerle.\nJSON: isim:string, konsensus:string, geleneksel_fark:string, modern_fark:string, malzemeler:[{miktar,isim}], adimlar:[string], sure:string, kalori:string, neden_bu_tarif:string",800).then(function(r){setKonsensusData(r);setKonsensusLoad(false);}).catch(function(){setKonsensusLoad(false);});
          }}} placeholder="🏆 Konsensüs tarif ara (örn: 'karnıyarık')" style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(212,168,67,0.25)",background:"var(--card)",color:C.cream,fontSize:12}}/>
          {konsensusLoad&&<Spinner size={14} color={C.gold}/>}
        </div>
        {konsensusData&&<div className="up" style={{marginTop:8,padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14}}>
          <div style={{fontSize:16,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:4}}>🏆 {konsensusData.isim||konsensusQ}</div>
          {konsensusData.konsensus&&<p style={{fontSize:12,color:C.gold,marginBottom:6,lineHeight:1.5}}>{konsensusData.konsensus}</p>}
          {konsensusData.neden_bu_tarif&&<p style={{fontSize:11,color:C.muted,marginBottom:8,fontStyle:"italic"}}>{konsensusData.neden_bu_tarif}</p>}
          <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
            {konsensusData.geleneksel_fark&&<div style={{flex:1,minWidth:120,padding:"8px 10px",background:"rgba(212,168,67,0.08)",borderRadius:8,fontSize:11}}><div style={{color:C.gold,fontWeight:600,marginBottom:3}}>🏺 Geleneksel</div><div style={{color:C.muted}}>{konsensusData.geleneksel_fark}</div></div>}
            {konsensusData.modern_fark&&<div style={{flex:1,minWidth:120,padding:"8px 10px",background:"rgba(155,127,212,0.08)",borderRadius:8,fontSize:11}}><div style={{color:C.purple,fontWeight:600,marginBottom:3}}>🔮 Modern</div><div style={{color:C.muted}}>{konsensusData.modern_fark}</div></div>}
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>{(konsensusData.malzemeler||[]).map(function(m,i){return <span key={i} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>{typeof m==="string"?m:((m.miktar||"")+" "+m.isim).trim()}</span>;})}</div>
          <button onClick={function(){props.onToggleFav(Object.assign({},konsensusData,{ogun:"Konsensüs"}));}} style={{padding:"5px 10px",borderRadius:8,fontSize:11,border:"1px solid var(--border)",background:"transparent",color:C.muted}}>❤️ Favorile</button>
        </div>}
      </div>}
      {step===1&&<div className="up">
        {hasMenuHistory===false&&<div style={{padding:"14px 16px",marginBottom:16,borderRadius:14,border:"1px solid rgba(212,168,67,0.25)",background:"linear-gradient(135deg,rgba(212,168,67,0.1),rgba(212,168,67,0.04))",color:C.cream}}>
          <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:8}}>🍽️ İlk menünü oluştur</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.7,marginBottom:4}}>1) Aşağıdan öğün ve mutfak seç · 2) Detaylara geçip kişi sayısı vb. ayarla · 3) "Menü Oluştur"a tıkla.</div>
        </div>}
        <SH label="Öğün"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:18}}>
          {OGUNLER.map(function(o){return <button key={o.id} onClick={function(){setOgun(o.id);reset();}} style={{borderRadius:13,overflow:"hidden",border:"2px solid "+(ogun===o.id?C.gold:"transparent"),background:ogun===o.id?C.goldDim:"var(--card)",padding:0}}>
            <div style={{background:o.img.bg,height:65,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>{o.img.emoji}</div>
            <div style={{padding:"6px",textAlign:"center"}}><span style={{fontSize:11,fontWeight:600,color:ogun===o.id?C.cream:"var(--muted)"}}>{o.label}</span></div>
          </button>;})}
        </div>
        <SH label="Mutfak" sub="Boş = Türk mutfağı"/>
        {CUISINES.map(function(gr){return <div key={gr.group} style={{marginBottom:18}}>
          <div style={{fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.1em"}}>MUTFAK — {gr.group.toUpperCase()}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
            {gr.items.map(function(c){var on=selC.indexOf(c.id)>-1;return <button key={c.id} onClick={function(){setSelC(function(p){return p.indexOf(c.id)>-1?p.filter(function(x){return x!==c.id;}):p.concat([c.id]);});reset();}} style={{borderRadius:9,padding:"8px 5px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:18}}>{CE[c.id]||"🍴"}</span>
              <span style={{fontSize:10,color:on?C.cream:"var(--muted)"}}>{c.l}</span>
            </button>;})}
          </div>
        </div>;})}
        <div style={{marginTop:16,padding:"14px",borderRadius:13,border:"1px solid rgba(155,127,212,0.25)",background:"rgba(155,127,212,0.04)"}}>
          <div style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>🔗 URL'den Tarif İçe Aktar</div>
          <div style={{display:"flex",gap:7}}>
            <input value={urlImport} onChange={function(e){setUrlImport(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") importFromUrl();}} placeholder="Tarif URL'si yapıştır…" style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",borderRadius:9,padding:"9px 12px",color:"var(--cream)",fontSize:12}}/>
            <button onClick={importFromUrl} disabled={urlLoading||!urlImport.trim()} style={{padding:"9px 16px",borderRadius:9,border:"1px solid rgba(155,127,212,0.4)",background:"rgba(155,127,212,0.1)",color:urlLoading?"var(--dim)":C.purple,fontSize:12,fontWeight:600,flexShrink:0}}>
              {urlLoading?<Spinner size={13} color={C.purple}/>:"İçe Aktar"}
            </button>
          </div>
          {urlResult&&!urlResult.error&&<div className="up" style={{marginTop:10,background:"var(--card)",borderRadius:11,padding:"12px 14px",border:"1px solid rgba(155,127,212,0.2)"}}>
            <div style={{fontSize:14,fontWeight:700,color:"var(--cream)",fontFamily:"'Playfair Display',serif",marginBottom:6}}>{urlResult.isim}</div>
            <div style={{fontSize:12,color:"var(--muted)",fontStyle:"italic",marginBottom:8}}>{urlResult.aciklama}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              {urlResult.sure&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {urlResult.sure}</span>}
              {urlResult.kalori&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {urlResult.kalori}</span>}
              {urlResult.kisi&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:C.goldDim,color:C.gold}}>👥 {urlResult.kisi}</span>}
            </div>
            {urlResult.malzemeler&&<div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:5}}>Malzemeler</div>
              {(urlResult.malzemeler||[]).map(function(m,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:3}}><span style={{color:C.purple,fontSize:9,marginTop:3}}>◆</span><span style={{color:"var(--muted)",minWidth:40,fontSize:12}}>{m.miktar}</span><span style={{color:"var(--cream)",fontSize:12}}>{m.isim}</span></div>;})}
            </div>}
            {urlResult.adimlar&&<div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:5}}>Hazırlanış</div>
              {(urlResult.adimlar||[]).map(function(s,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:4}}><span style={{color:C.purple,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{i+1}.</span><span style={{color:"var(--muted)",fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
            </div>}
            {urlResult.ipucu&&<div style={{padding:"8px 11px",background:C.goldDim,borderRadius:8,border:"1px solid rgba(212,168,67,0.2)",fontSize:12,color:C.gold}}>💡 {urlResult.ipucu}</div>}
            <button onClick={function(){props.onToggleFav&&props.onToggleFav({isim:urlResult.isim,aciklama:urlResult.aciklama,kalori:urlResult.kalori,sure:urlResult.sure,ogun:"Karma Menü",malzemeler:(urlResult.malzemeler||[]).map(function(m){return m.isim;})});}} style={{width:"100%",marginTop:8,padding:"10px",borderRadius:9,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>❤️ Favorilere Ekle</button>
          </div>}
          {urlResult&&urlResult.error&&<div style={{marginTop:8,padding:"8px 12px",borderRadius:9,background:"rgba(224,82,82,0.07)",border:"1px solid rgba(224,82,82,0.2)",color:C.red,fontSize:12}}>⚠ {urlResult.error}</div>}
        </div>
        <button onClick={function(){setStep(2);}} style={{width:"100%",padding:"13px",borderRadius:12,border:"2px solid "+C.borderG,background:"linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.07))",color:C.goldL,fontSize:14,fontWeight:600,marginTop:8}}>Detaylara Geç →</button>
      </div>}
      {step===2&&<div className="up">
        <div style={{background:"linear-gradient(135deg,rgba(212,168,67,0.06),transparent)",borderRadius:14,border:"1px solid rgba(212,168,67,0.15)",padding:"13px 14px",marginBottom:14}}>
          <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.22em",marginBottom:12}}>⭐ İmza Mutfak & Sunum Stili</div>
          <div style={{marginBottom:10}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:6}}>Mutfak Karakteri</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
              {IMZA_MUTFAK.map(function(m){var on=imzaMutfak===m.id;return <button key={m.id} onClick={function(){setImzaMutfak(m.id);}} style={{borderRadius:10,padding:"8px 5px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:18}}>{m.emoji}</span><span style={{fontSize:10,fontWeight:500,color:on?C.cream:"var(--muted)"}}>{m.label}</span>
              </button>;})}
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:6}}>Sunum Stili</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {STILLER.map(function(s){var on=stil===s.id;return <button key={s.id} onClick={function(){setStil(s.id);reset();}} style={{padding:"6px 11px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:14}}>{s.emoji}</span><span style={{fontWeight:on?700:400}}>{s.label}</span>
              </button>;})}
            </div>
          </div>
        </div>
        <SH label="Zorluk"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
          {ZORLUK.map(function(z){var on=zorluk===z.id;return <button key={z.id} onClick={function(){setZorluk(z.id);reset();}} style={{borderRadius:11,padding:"11px 7px",border:"2px solid "+(on?z.col:"var(--border)"),background:on?z.col+"14":"var(--card)",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:3}}>{z.emoji}</div><div style={{fontSize:11,fontWeight:700,color:on?C.cream:"var(--muted)"}}>{z.label}</div>
          </button>;})}
        </div>
        <SH label="Beslenme"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {BESLENME.map(function(b){var on=beslenme===b.id;return <button key={b.id} onClick={function(){setBeslenme(b.id);reset();}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{b.emoji}</span>{b.label}</button>;})}
        </div>
        <SH label="Baharat"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {BAHARAT.map(function(b){var on=baharat===b.id;return <button key={b.id} onClick={function(){setBaharat(b.id);reset();}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?b.col:"var(--border)"),background:on?b.col+"14":"var(--card)",color:on?b.col:C.muted,display:"inline-flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{b.emoji}</span>{b.label}</button>;})}
        </div>
        <SH label="Alerjen"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5,marginBottom:14}}>
          {ALERJEN.map(function(a){var on=!!alerjen[a.id];return <button key={a.id} onClick={function(){tMap(setAlerjen,a.id);reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"flex",alignItems:"center",gap:7}}>
            <span style={{fontSize:14}}>{a.emoji}</span><span style={{fontSize:12,flex:1}}>{a.label}</span>
            <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:on?C.gold:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:on?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
          </button>;})}
        </div>
        <SH label="Ekstralar"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {EKSTRA.map(function(e){var on=!!ekstra[e.id];return <button key={e.id} onClick={function(){tMap(setEkstra,e.id);reset();}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}><span style={{fontSize:14}}>{e.emoji}</span>{e.label}</button>;})}
        </div>
        <SH label="Akıllı Menü"/>
        <div style={{marginBottom:14}}>
          <button onClick={function(){setAkiMenuMod(!akiMenuMod);reset();}} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(akiMenuMod?"rgba(45,212,191,0.5)":"var(--border)"),background:akiMenuMod?"rgba(45,212,191,0.1)":"var(--card)",color:akiMenuMod?C.teal:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:8,width:"100%"}}>
            <span>🧠</span><span style={{flex:1,textAlign:"left"}}>Malzeme örtüşmesi (aynı malzemeleri paylaşan yemekler)</span>{akiMenuMod&&<span style={{color:C.teal}}>✓</span>}
          </button>
          <div style={{fontSize:10,color:C.dim,marginTop:4,paddingLeft:4}}>Daha kısa alışveriş listesi, daha az israf</div>
        </div>
        <SH label="Mevsim & Pazar"/>
        <div style={{marginBottom:10}}>
          <button onClick={function(){setPazarOncelik(!pazarOncelik);reset();}} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(pazarOncelik?"rgba(76,175,122,0.5)":"var(--border)"),background:pazarOncelik?"rgba(76,175,122,0.1)":"var(--card)",color:pazarOncelik?C.green:C.muted,fontSize:12,display:"flex",alignItems:"center",gap:8}}>
            <span>🥬</span><span>Bu ay pazarda / mevsimsel öncelik</span>{pazarOncelik&&<span style={{color:C.green}}>✓</span>}
          </button>
        </div>
        <SH label="Menü Dengesi"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:14}}>
          {DENGE.map(function(d){var on=!!denge[d.id];return <button key={d.id} onClick={function(){setDenge(function(p){var n=Object.assign({},p);n[d.id]=!n[d.id];return n;});reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?d.br:"var(--border)"),background:on?d.bg:"var(--card)",color:on?d.col:C.muted,textAlign:"left"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
              <span style={{fontSize:14}}>{d.emoji}</span>
              <span style={{fontSize:12,fontWeight:700,color:on?d.col:C.cream}}>{d.label}</span>
            </div>
            <div style={{fontSize:9,color:on?d.col:C.dim,lineHeight:1.4}}>{d.desc}</div>
          </button>;})}
        </div>
        <SH label="Kaç Kişilik?"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {KISI_OPT.map(function(n){return <button key={n} onClick={function(){setKisi(n);reset();}} style={{width:43,height:43,borderRadius:9,border:"1.5px solid "+(kisi===n?C.gold:"var(--border)"),background:kisi===n?C.goldDim:"var(--card)",color:kisi===n?C.goldL:C.muted,fontSize:13,fontWeight:700}}>{n}</button>;})}
        </div>
        <SH label={"Yemek Sayısı — "+kalem}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
          {[3,4,5,6,7,8,9,10].map(function(n){return <button key={n} onClick={function(){setKalem(n);reset();}} style={{width:43,height:43,borderRadius:9,border:"1.5px solid "+(kalem===n?C.gold:"var(--border)"),background:kalem===n?C.goldDim:"var(--card)",color:kalem===n?C.goldL:C.muted,fontSize:13,fontWeight:700}}>{n}</button>;})}
        </div>
        <SH label={"Gün Sayısı — "+gunSayisi} sub={gunSayisi>1?"Her gün farklı, tekrar yok":""}/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:20}}>
          {[1,2,3,4,5,6,7,8,9,10].map(function(n){return <button key={n} onClick={function(){setGunSayisi(n);reset();}} style={{padding:"7px 10px",borderRadius:9,border:"1.5px solid "+(gunSayisi===n?C.gold:"var(--border)"),background:gunSayisi===n?C.goldDim:"var(--card)",color:gunSayisi===n?C.goldL:C.muted,fontSize:11,fontWeight:600,display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:48}}>
            <span style={{fontSize:15}}>{n===1?"📋":n<=3?"📅":n<=7?"🗓️":"📆"}</span><span>{n}G</span>
          </button>;})}
        </div>
        <ErrBox msg={error} onRetry={function(){setError(null);generate();}}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:10}}><Spinner size={16}/>{loadingDay?loadingDay+". gün…":"Başlıyor…"}</span>:"✦ "+gunSayisi+"×"+kalem+" Yemeklik Menü Oluştur"}
        </GoldBtn>
      </div>}
    </div>
  </div>;

  return <div style={{paddingBottom:60}}>
    {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
    <div className="no-print" style={{display:"flex",gap:6,padding:"10px 16px 8px",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={function(){setStep(2);reset();}} style={{padding:"6px 12px",borderRadius:9,border:"1.5px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>← Ayarlar</button>
      <div style={{flex:1}}/>
      <button onClick={doShare} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid "+C.borderG,background:C.goldDim,color:C.goldL,fontSize:12}}>📤 Paylaş</button>
      <button onClick={function(){if(days&&days[activeDay]) exportMenuCard(days[activeDay],true);}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid rgba(155,127,212,0.4)",background:"rgba(155,127,212,0.1)",color:C.purple,fontSize:12}} aria-label="PNG indir">🖼️ PNG</button>
      <button onClick={function(){window.print();}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:12}} aria-label="Yazdır">🖨️ Yazdır</button>
      <button onClick={function(){if(days&&days.length>0){var ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//MasterChefPlanner//TR"];days.forEach(function(d,i){var dt=(d.tarih||new Date(Date.now()+i*86400000).toISOString().slice(0,10)).replace(/-/g,"");var summary=(d.menu_adi||"Gün "+(i+1))+" — "+(d.dishes||[]).map(function(x){return x.isim;}).join(", ").slice(0,200);ics.push("BEGIN:VEVENT","DTSTART;VALUE=DATE:"+dt,"DTEND;VALUE=DATE:"+dt,"SUMMARY:"+summary.replace(/\n/g," "),"END:VEVENT");});ics.push("END:VCALENDAR");var blob=new Blob([ics.join("\r\n")],{type:"text/calendar;charset=utf-8"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="menü-takvim.ics";a.click();URL.revokeObjectURL(a.href);}}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid "+C.blue+"44",background:C.blue+"11",color:C.blue,fontSize:12}} aria-label="Takvime ekle">📅 Takvim</button>
      <button onClick={function(){setShowBildirim(!showBildirim);}} style={{padding:"6px 10px",borderRadius:9,border:"1.5px solid "+(showBildirim?"rgba(45,212,191,0.4)":"var(--border)"),background:showBildirim?"rgba(45,212,191,0.1)":"transparent",color:showBildirim?C.teal:C.muted,fontSize:13}} aria-label="Bildirimler">🔔</button>
      <button onClick={function(){setShowShop(true);}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:12}} aria-label="Alışveriş listesi">🛒 Alışveriş</button>
      <button onClick={function(){reset();generate();}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid "+C.borderG,background:C.goldDim,color:C.goldL,fontSize:12}}>🔄</button>
    </div>
    {oI.img&&<div style={{margin:"0 16px 12px",borderRadius:16,overflow:"hidden",position:"relative",height:130}}>
      <div style={{background:oI.img.bg,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:55}}>{oI.img.emoji}</div></div>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 30%,rgba(10,10,10,0.9) 100%)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"10px 14px"}}>
        <div style={{fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:2,fontWeight:700}}>{kisi} Kişilik · {(fI(STILLER,stil)||{}).label}</div>
        {cDay&&<div style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.cream}}>{cDay.menu_adi}</div>}
      </div>
    </div>}
    <div className="menu-print-area" style={{padding:"0 16px"}}>
    {gunSayisi>1&&<div style={{display:"flex",gap:5,padding:"0 0 6px",marginBottom:4,overflowX:"auto",alignItems:"center"}}>
      {(days||[]).map(function(d,i){return <button key={i} onClick={function(){setActiveDay(i);setCalendarView(false);}} style={{flexShrink:0,padding:"5px 13px",borderRadius:50,border:"1.5px solid "+(activeDay===i&&!calendarView?C.gold:"var(--border)"),background:activeDay===i&&!calendarView?C.goldDim:"var(--card)",color:activeDay===i&&!calendarView?C.goldL:C.muted,fontSize:12,fontWeight:activeDay===i&&!calendarView?700:400}}>{i+1}. Gün</button>;})}
      <button onClick={function(){setCalendarView(!calendarView);}} style={{flexShrink:0,padding:"5px 13px",borderRadius:50,border:"1.5px solid "+(calendarView?"rgba(91,163,208,0.5)":"var(--border)"),background:calendarView?"rgba(91,163,208,0.1)":"var(--card)",color:calendarView?C.blue:C.muted,fontSize:12,fontWeight:calendarView?700:400}}>📅 Takvim</button>
    </div>}
    {calendarView&&days&&days.length>1?<div className="up" style={{marginBottom:14}}>
      <div style={{fontSize:10,letterSpacing:"0.2em",color:C.blue,textTransform:"uppercase",fontWeight:700,marginBottom:10}}>HAFTALIK TAKVİM GÖRÜNÜMÜ</div>
      <div style={{overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(days.length,7)+",minmax(130px,1fr))",gap:6}}>
          {days.slice(0,7).map(function(d,di){
            var isAct=activeDay===di;
            return <div key={di} onClick={function(){setActiveDay(di);setCalendarView(false);}} style={{background:isAct?C.goldDim:"var(--card)",borderRadius:12,border:"1.5px solid "+(isAct?C.gold:"var(--border)"),padding:"10px",cursor:"pointer",minWidth:120}}>
              <div style={{fontSize:11,fontWeight:700,color:isAct?C.gold:C.cream,marginBottom:6,textAlign:"center"}}>{di+1}. Gün</div>
              <div style={{fontSize:10,color:C.muted,fontStyle:"italic",textAlign:"center",marginBottom:8,minHeight:28}}>{d.menu_adi||""}</div>
              {(d.dishes||[]).map(function(dish,dii){var oCol=OGUN_COL[dish.ogun]||C.gold;return <div key={dii} style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,padding:"3px 5px",borderRadius:6,background:"rgba(255,255,255,0.03)"}}>
                <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:oCol}}/>
                <div style={{fontSize:10,color:C.cream,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dish.isim}</div>
              </div>;})}
            </div>;
          })}
        </div>
      </div>
      {days.length>7&&<div style={{marginTop:8}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat("+Math.min(days.length-7,7)+",minmax(130px,1fr))",gap:6}}>
          {days.slice(7).map(function(d,di){
            var realIdx=di+7;var isAct=activeDay===realIdx;
            return <div key={realIdx} onClick={function(){setActiveDay(realIdx);setCalendarView(false);}} style={{background:isAct?C.goldDim:"var(--card)",borderRadius:12,border:"1.5px solid "+(isAct?C.gold:"var(--border)"),padding:"10px",cursor:"pointer",minWidth:120}}>
              <div style={{fontSize:11,fontWeight:700,color:isAct?C.gold:C.cream,marginBottom:6,textAlign:"center"}}>{realIdx+1}. Gün</div>
              <div style={{fontSize:10,color:C.muted,fontStyle:"italic",textAlign:"center",marginBottom:8,minHeight:28}}>{d.menu_adi||""}</div>
              {(d.dishes||[]).map(function(dish,dii){var oCol=OGUN_COL[dish.ogun]||C.gold;return <div key={dii} style={{display:"flex",gap:5,alignItems:"center",marginBottom:4,padding:"3px 5px",borderRadius:6,background:"rgba(255,255,255,0.03)"}}>
                <div style={{width:5,height:5,borderRadius:"50%",flexShrink:0,background:oCol}}/>
                <div style={{fontSize:10,color:C.cream,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dish.isim}</div>
              </div>;})}
            </div>;
          })}
        </div>
      </div>}
    </div>:null}
    {!calendarView&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
      {cDay&&cDay.dishes.map(function(d,i){return <DishCard key={d.isim+"-"+i} dish={d} index={i} dayIndex={activeDay} detail={detail} repIdx={repIdx} favorites={props.favorites} onDetail={hDetail} onReplace={hReplace} onFav={tFav} onList={setListDish} delay={i*0.05} baseKisi={kisi}/>;})}
    </div>}
    </div>
    {listDish&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:998,padding:12}}>
      <div style={{width:"100%",maxWidth:400,background:"var(--card)",borderRadius:"16px 16px 0 0",padding:18,border:"1px solid "+C.borderG}}>
        <div style={{fontSize:14,color:C.goldL,marginBottom:12,fontFamily:"'Playfair Display',serif"}}>"{listDish.isim}" hangi listeye?</div>
        {props.lists.map(function(lst){return <button key={lst.id} onClick={function(){cList(lst.id);}} style={{width:"100%",padding:"10px 12px",marginBottom:5,borderRadius:9,textAlign:"left",border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13,display:"flex",justifyContent:"space-between"}}>📋 {lst.name}<span style={{fontSize:11,color:C.muted}}>{lst.dishes.length}</span></button>;})}
        <button onClick={function(){setListDish(null);}} style={{width:"100%",marginTop:4,padding:"9px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:13}}>İptal</button>
      </div>
    </div>}
    {showShop&&days&&days.length>0&&<ShoppingList days={days} onClose={function(){setShowShop(false);}}/>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: PÜF NOKTALARI
// ══════════════════════════════════════════════════════════════
function PufTab(){
  var [activeKat,setActiveKat]=useState(null);
  var [loading,setLoading]=useState(false);
  var [displayData,setDisplayData]=useState(null);
  var [error,setError]=useState(null);
  var cacheRef=useRef({});
  function selectKat(kid){
    if (cacheRef.current[kid]){setActiveKat(kid);setDisplayData(cacheRef.current[kid]);setError(null);return;}
    setActiveKat(kid);setDisplayData(null);setError(null);setLoading(true);
    var kl=(fI(PUF_KAT,kid)||{}).label||kid;
    callAI("Turkish chef. 8 essential practical tips for: "+kl+".\nContinue JSON:\n\"kategori\":\""+kl+"\",\"ipuclari\":[{\"baslik\":\"tip title\",\"aciklama\":\"2-3 sentence explanation\",\"onemli\":true}]}",1000)
      .then(function(r){cacheRef.current[kid]=r;setDisplayData(r);setLoading(false);})
      .catch(function(e){setError(e.message);setLoading(false);});
  }
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Şef Sırları" title="Püf Noktaları" desc="Profesyonel mutfak teknikleri" col={C.green}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))",gap:6,marginBottom:16}}>
        {PUF_KAT.map(function(k){var ac=activeKat===k.id;return <button key={k.id} onClick={function(){selectKat(k.id);}} style={{borderRadius:11,padding:"10px 6px",border:"1.5px solid "+(ac?"rgba(76,175,122,0.6)":"var(--border)"),background:ac?"rgba(76,175,122,0.12)":"var(--card)",textAlign:"center"}}>
          <div style={{fontSize:20,marginBottom:4}}>{k.emoji}</div>
          <div style={{fontSize:11,fontWeight:500,color:ac?C.cream:"var(--muted)"}}>{k.label}</div>
        </button>;})}
      </div>
      <ErrBox msg={error}/>
      {!activeKat&&<div style={{textAlign:"center",padding:"44px 20px"}}><div style={{fontSize:40,marginBottom:10}}>💡</div><div style={{fontSize:14,color:C.muted}}>Kategori seçin</div><div style={{fontSize:12,color:"var(--dim)",marginTop:5}}>9 farklı mutfak konusu</div></div>}
      {activeKat&&loading&&<div style={{display:"flex",flexDirection:"column",gap:7}}>
        <div style={{padding:"12px 14px",background:"rgba(76,175,122,0.06)",borderRadius:11,border:"1px solid rgba(76,175,122,0.15)",marginBottom:6,display:"flex",alignItems:"center",gap:10}}><Spinner size={14} color={C.green}/><span style={{fontSize:13,color:C.green}}>Püf noktaları hazırlanıyor…</span></div>
        {[0,1,2,3,4,5,6,7].map(function(i){return <div key={i} className="sk" style={{height:72,animationDelay:i*0.07+"s"}}/>;})}
      </div>}
      {activeKat&&!loading&&displayData&&<div className="up">
        <div style={{fontSize:10,letterSpacing:"0.25em",color:C.green,textTransform:"uppercase",fontWeight:700,marginBottom:12}}>✦ {displayData.kategori} Püf Noktaları</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(displayData.ipuclari||[]).map(function(ip,i){return <div key={i} style={{background:"var(--card)",borderRadius:12,padding:"13px 15px",border:"1px solid "+(ip.onemli?"rgba(76,175,122,0.2)":"var(--border)"),borderLeft:"4px solid "+(ip.onemli?C.green:"var(--dim)")}}>
            <div style={{display:"flex",gap:9,alignItems:"flex-start"}}>
              <div style={{width:26,height:26,borderRadius:7,flexShrink:0,background:ip.onemli?"rgba(76,175,122,0.12)":"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:ip.onemli?C.green:C.muted,fontWeight:700}}>{i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:4,fontFamily:"'Playfair Display',serif"}}>{ip.baslik}</div>
                <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{ip.aciklama}</div>
              </div>
            </div>
          </div>;})}
        </div>
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: MUTFAK REHBERİ
// ══════════════════════════════════════════════════════════════
function RehberTab(){
  var [subtab,setSubtab]=useState("saklama");
  var [query,setQuery]=useState("");
  var [loading,setLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [error,setError]=useState(null);
  var PROMPTS={
    saklama:function(q){return "Storage expert. Turkish answer for: "+q+"\nContinue JSON:\n\"baslik\":\"s\",\"sure\":\"s\",\"sicaklik\":\"s\",\"yontemler\":[{\"baslik\":\"s\",\"detay\":\"s\"}],\"dikkat\":\"s\",\"ipucu\":\"s\"}\nAll Turkish.";},
    sunum:function(q){return "Plating expert. Turkish tips for: "+q+"\nContinue JSON:\n\"baslik\":\"s\",\"teknikler\":[{\"isim\":\"s\",\"aciklama\":\"s\",\"araca\":\"s\"}],\"garnitur\":\"s\",\"fotografik_ipucu\":\"s\"}\nAll Turkish.";},
    eslesme:function(q){return "Sommelier. Turkish pairings for: "+q+"\nContinue JSON:\n\"baslik\":\"s\",\"icecek\":[{\"isim\":\"s\",\"neden\":\"s\"}],\"yanlar\":[{\"isim\":\"s\",\"neden\":\"s\"}],\"kacinin\":\"s\"}\nAll Turkish.";},
    temizlik:function(q){return "Kitchen cleaner. Turkish tips for: "+q+"\nContinue JSON:\n\"baslik\":\"s\",\"adimlar\":[{\"baslik\":\"s\",\"detay\":\"s\",\"urun\":\"s\"}],\"siklik\":\"s\",\"uyari\":\"s\"}\nAll Turkish.";},
    stok:function(q){return "Pantry expert. Turkish advice for: "+q+"\nContinue JSON:\n\"baslik\":\"s\",\"essentials\":[{\"urun\":\"s\",\"miktar\":\"s\",\"sure\":\"s\",\"ipucu\":\"s\"}],\"israf_oneri\":\"s\"}\nAll Turkish.";},
  };
  var PH={saklama:"Örn: domates, zeytinyağı…",sunum:"Örn: levrek, tiramisu…",eslesme:"Örn: kuzu tandır…",temizlik:"Örn: döküm tava…",stok:"Örn: baharatlar…"};
  function ask(){
    if (!query.trim()) return;
    setLoading(true);setError(null);setResult(null);
    callAI(PROMPTS[subtab](query),900).then(function(r){setResult({subtab:subtab,data:r});}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Profesyonel Rehber" title="Mutfak Rehberi" desc="Saklama · Sunum · Eşleşme · Temizlik · Stok" col={C.blue}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:3}}>
        {REHBER_TABS.map(function(t){var ac=subtab===t.id;return <button key={t.id} onClick={function(){setSubtab(t.id);setResult(null);}} style={{flexShrink:0,padding:"8px 12px",borderRadius:10,border:"1.5px solid "+(ac?"rgba(91,163,208,0.6)":"var(--border)"),background:ac?"rgba(91,163,208,0.12)":"var(--card)",color:ac?C.cream:C.muted,fontSize:12,fontWeight:ac?600:400,display:"flex",alignItems:"center",gap:5}}>
          <span>{t.emoji}</span><span>{t.label}</span>
        </button>;})}
      </div>
      <div style={{display:"flex",gap:7,marginBottom:12}}>
        <input value={query} onChange={function(e){setQuery(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") ask();}} placeholder={PH[subtab]||"Sorunuzu yazın…"} style={{flex:1,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 14px",color:C.cream,fontSize:13,outline:"none"}}/>
        <button onClick={ask} disabled={loading||!query.trim()} style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid rgba(91,163,208,0.4)",background:"rgba(91,163,208,0.1)",color:loading?"var(--dim)":C.blue,fontSize:13,fontWeight:600}}>
          {loading?<Spinner size={13} color={C.blue}/>:"Sor"}
        </button>
      </div>
      <ErrBox msg={error}/>
      {result&&result.data&&<div className="up">
        <div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:12}}>{result.data.baslik}</div>
        {result.subtab==="saklama"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            {result.data.sure?<div style={{background:"rgba(91,163,208,0.08)",borderRadius:10,padding:"10px 12px",border:"1px solid rgba(91,163,208,0.2)"}}><div style={{fontSize:9,color:C.blue,fontWeight:700,marginBottom:3}}>📅 SÜRE</div><div style={{fontSize:13,color:C.cream}}>{result.data.sure}</div></div>:null}
            {result.data.sicaklik?<div style={{background:"rgba(76,175,122,0.08)",borderRadius:10,padding:"10px 12px",border:"1px solid rgba(76,175,122,0.2)"}}><div style={{fontSize:9,color:C.green,fontWeight:700,marginBottom:3}}>🌡️ SICAKLIK</div><div style={{fontSize:13,color:C.cream}}>{result.data.sicaklik}</div></div>:null}
          </div>
          {(result.data.yontemler||[]).map(function(y,i){return <div key={i} style={{background:"var(--card)",borderRadius:10,padding:"11px 13px",border:"1px solid var(--border)",marginBottom:6}}><div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:3}}>{y.baslik}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{y.detay}</div></div>;})}
          {result.data.uyari?<div style={{padding:"9px 13px",background:"rgba(224,82,82,0.07)",borderRadius:9,border:"1px solid rgba(224,82,82,0.2)",color:C.red,fontSize:12,marginTop:8}}>⚠ {result.data.uyari}</div>:null}
          {result.data.ipucu?<div style={{padding:"9px 13px",background:C.goldDim,borderRadius:9,border:"1px solid rgba(212,168,67,0.2)",color:C.gold,fontSize:12,marginTop:6}}>💡 {result.data.ipucu}</div>:null}
        </div>}
        {result.subtab==="sunum"&&<div>
          {(result.data.teknikler||[]).map(function(t,i){return <div key={i} style={{background:"var(--card)",borderRadius:10,padding:"11px 13px",border:"1px solid var(--border)",marginBottom:6,borderLeft:"3px solid "+C.purple}}><div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:3}}>{t.isim}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:t.araca?4:0}}>{t.aciklama}</div>{t.araca?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔧 {t.araca}</span>:null}</div>;})}
          {result.data.garnitur?<div style={{padding:"9px 13px",background:"rgba(76,175,122,0.07)",borderRadius:9,border:"1px solid rgba(76,175,122,0.2)",color:C.green,fontSize:12,marginTop:8}}>🌿 {result.data.garnitur}</div>:null}
          {result.data.fotografik_ipucu?<div style={{padding:"9px 13px",background:"rgba(91,163,208,0.07)",borderRadius:9,border:"1px solid rgba(91,163,208,0.2)",color:C.blue,fontSize:12,marginTop:6}}>📸 {result.data.fotografik_ipucu}</div>:null}
        </div>}
        {result.subtab==="eslesme"&&<div>
          {result.data.icecek&&result.data.icecek.length>0?<div style={{marginBottom:10}}><div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:6}}>🍷 İçecekler</div>{result.data.icecek.map(function(ic,i){return <div key={i} style={{background:"var(--card)",borderRadius:9,padding:"9px 12px",marginBottom:4,border:"1px solid var(--border)"}}><span style={{color:C.cream,fontWeight:600,fontSize:13}}>{ic.isim}</span> <span style={{color:C.muted,fontSize:12}}>— {ic.neden}</span></div>;})}</div>:null}
          {result.data.yanlar&&result.data.yanlar.length>0?<div style={{marginBottom:10}}><div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:6}}>🥗 Yanlar</div>{result.data.yanlar.map(function(y,i){return <div key={i} style={{background:"var(--card)",borderRadius:9,padding:"9px 12px",marginBottom:4,border:"1px solid var(--border)"}}><span style={{color:C.cream,fontWeight:600,fontSize:13}}>{y.isim}</span> <span style={{color:C.muted,fontSize:12}}>— {y.neden}</span></div>;})}</div>:null}
          {result.data.kacinin?<div style={{padding:"9px 13px",background:"rgba(224,82,82,0.07)",borderRadius:9,border:"1px solid rgba(224,82,82,0.2)",color:C.red,fontSize:12}}>⛔ {result.data.kacinin}</div>:null}
        </div>}
        {(result.subtab==="temizlik"||result.subtab==="stok")&&<div>
          {(result.data.adimlar||result.data.essentials||[]).map(function(item,i){var ti=item.baslik||item.urun||"";var de=item.detay||item.ipucu||"";return <div key={i} style={{background:"var(--card)",borderRadius:10,padding:"11px 13px",border:"1px solid var(--border)",marginBottom:6,borderLeft:"3px solid "+C.teal}}><div style={{display:"flex",gap:8}}><span style={{color:C.teal,fontWeight:700,fontSize:12,flexShrink:0}}>{i+1}.</span><div><div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:2}}>{ti}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{de}</div></div></div></div>;})}
          {result.data.israf_oneri?<div style={{padding:"9px 13px",background:"rgba(76,175,122,0.07)",borderRadius:9,border:"1px solid rgba(76,175,122,0.2)",color:C.green,fontSize:12,marginTop:6}}>♻ {result.data.israf_oneri}</div>:null}
        </div>}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: SAĞLIK
// ══════════════════════════════════════════════════════════════
function SaglikTab(){
  var [sistem,setSistem]=useState("sina");
  var [query,setQuery]=useState("");
  var [loading,setLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [error,setError]=useState(null);
  var [openEg,setOpenEg]=useState(null);
  var [showProfile,setShowProfile]=useState(false);
  var [profile,setProfile]=useState({yas:"",kilo:"",boy:"",saglik:"",alerji:""});
  var [profSaved,setProfSaved]=useState(false);

  useEffect(function(){stGet("saglik_prof").then(function(p){if(p){setProfile(p);setProfSaved(true);}});},[]);

  async function saveProfile(){await stSet("saglik_prof",profile);setProfSaved(true);setShowProfile(false);}

  var cur=fI(SAGLIK_SYS,sistem)||SAGLIK_SYS[0];
  var sc=cur.col;
  var profCtx=profSaved&&profile.yas?(" | Hasta profili: yaş "+profile.yas+(profile.kilo?" kilo "+profile.kilo:"")+(profile.boy?" boy "+profile.boy:"")+(profile.saglik?" sağlık durumu: "+profile.saglik:"")+(profile.alerji?" alerji: "+profile.alerji:"")):"";

  var SYS_PROMPTS={
    sina:"Ibn Sina perspektifinden Türkçe cevap ver. Dört hümor, mizaç dengesi kullan.",
    nebevi:"Tıbbı Nebevi perspektifinden Türkçe cevap ver. Hadisler ve nebevi gıdalar kullan.",
    cin:"Geleneksel Çin tıbbı perspektifinden Türkçe cevap ver. Beş element, yin-yang kullan.",
    ayurveda:"Ayurveda perspektifinden Türkçe cevap ver. Üç dosha, Agni teorisi kullan.",
  };
  var USER_PROMPTS={
    sina:function(q){return "Şikayet: "+q+profCtx+"\nContinue JSON:\n\"baslik\":\"s\",\"mizac_analizi\":\"s\",\"onerilen\":[{\"isim\":\"s\",\"neden\":\"s\",\"miktar\":\"s\"}],\"kacinil\":[{\"isim\":\"s\",\"neden\":\"s\"}],\"bitkiler\":[{\"isim\":\"s\",\"kullanim\":\"s\"}],\"nasihat\":\"s\"}\nAll Turkish.";},
    nebevi:function(q){return "Şikayet: "+q+profCtx+"\nContinue JSON:\n\"baslik\":\"s\",\"nebevi_gidalar\":[{\"isim\":\"s\",\"hadis\":\"s\",\"fayda\":\"s\"}],\"bitkiler\":[{\"isim\":\"s\",\"kullanim\":\"s\"}],\"kacinil\":[{\"isim\":\"s\",\"neden\":\"s\"}],\"nasihat\":\"s\"}\nAll Turkish.";},
    cin:function(q){return "Şikayet: "+q+profCtx+"\nContinue JSON:\n\"baslik\":\"s\",\"analiz\":\"s\",\"isitici\":[{\"isim\":\"s\",\"etki\":\"s\"}],\"sogutucular\":[{\"isim\":\"s\",\"etki\":\"s\"}],\"bitkisel\":[{\"isim\":\"s\",\"etki\":\"s\"}],\"nasihat\":\"s\"}\nAll Turkish.";},
    ayurveda:function(q){return "Şikayet: "+q+profCtx+"\nContinue JSON:\n\"baslik\":\"s\",\"dosha_analizi\":\"s\",\"onerilen\":[{\"isim\":\"s\",\"dosha\":\"s\",\"zaman\":\"s\"}],\"baharatlar\":[{\"isim\":\"s\",\"etki\":\"s\"}],\"kacinil\":[{\"isim\":\"s\",\"neden\":\"s\"}],\"nasihat\":\"s\"}\nAll Turkish.";},
  };

  function ask(){
    if (!query.trim()) return;
    setLoading(true);setError(null);setResult(null);
    callAI(SYS_PROMPTS[sistem]+"\n"+USER_PROMPTS[sistem](query),1000)
      .then(function(r){setResult({sistem:sistem,data:r});}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }

  function FL(fp){
    if (!fp.items||fp.items.length===0) return null;
    return <div style={{marginBottom:12}}>
      <div style={{fontSize:9,color:fp.col,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:6}}>{fp.icon} {fp.title}</div>
      {fp.items.map(function(item,i){return <div key={i} style={{background:"var(--card)",borderRadius:9,padding:"9px 12px",marginBottom:4,border:"1px solid var(--border)",borderLeft:"3px solid "+fp.col}}>
        <div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:fp.dk?2:0}}>{item[fp.nk||"isim"]}</div>
        {fp.dk&&item[fp.dk]?<div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{item[fp.dk]}</div>:null}
      </div>;})}
    </div>;
  }

  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Kadim Bilgelik" title="Geleneksel Tıp" desc="Seç · Öğren · Sor" col={C.gold}/>
    <div style={{padding:"0 16px"}}>
      {/* Sistem seçimi */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
        {SAGLIK_SYS.map(function(s){var ac=sistem===s.id;return <button key={s.id} onClick={function(){setSistem(s.id);setResult(null);setQuery("");setOpenEg(null);}} style={{borderRadius:13,padding:"13px 12px",border:"2px solid "+(ac?s.col:"var(--border)"),background:ac?s.col+"12":"var(--card)",textAlign:"left"}}>
          <div style={{fontSize:24,marginBottom:5}}>{s.emoji}</div>
          <div style={{fontSize:13,fontWeight:700,color:ac?C.cream:"var(--muted)"}}>{s.label}</div>
          <div style={{fontSize:10,color:ac?s.col:C.muted,marginTop:1}}>{s.sub}</div>
        </button>;})}
      </div>
      {/* Eğitim */}
      <div style={{background:sc+"0A",borderRadius:13,border:"1px solid "+sc+"22",marginBottom:16,overflow:"hidden"}}>
        <div style={{padding:"12px 15px",borderBottom:"1px solid "+sc+"15",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{cur.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:C.cream}}>{cur.label} — Temel Öğretiler</div>
            <div style={{fontSize:10,color:sc}}>{cur.sub}</div>
          </div>
        </div>
        {cur.egitim.map(function(eg,i){var open=openEg===i;return <div key={i} style={{borderBottom:i<cur.egitim.length-1?"1px solid "+sc+"10":"none"}}>
          <button onClick={function(){setOpenEg(open?null:i);}} style={{width:"100%",padding:"11px 15px",background:"transparent",border:"none",textAlign:"left",display:"flex",alignItems:"center",gap:11}}>
            <div style={{width:24,height:24,borderRadius:7,flexShrink:0,background:open?sc+"22":sc+"0E",border:"1px solid "+sc+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:sc,fontWeight:700}}>{i+1}</div>
            <span style={{flex:1,fontSize:13,fontWeight:600,color:open?C.cream:"var(--muted)"}}>{eg.baslik}</span>
            <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
          </button>
          {open&&<div className="up" style={{padding:"0 15px 13px 50px"}}><div style={{fontSize:13,color:C.muted,lineHeight:1.75}}>{eg.icerik}</div></div>}
        </div>;})}
      </div>
      {/* Profil butonu */}
      <button onClick={function(){setShowProfile(!showProfile);}} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(profSaved?"rgba(212,168,67,0.4)":"var(--border)"),background:profSaved?C.goldDim:"var(--card)",color:profSaved?C.goldL:C.muted,fontSize:12,fontWeight:500,marginBottom:profSaved?8:12,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:16}}>{profSaved?"👤":"➕"}</span>
        <span style={{flex:1,textAlign:"left"}}>{profSaved?"Sağlık Profilim (aktif — sorular kişiselleştirilecek)":"Sağlık Profili Ekle (yaş, kilo, kronik hastalık…)"}</span>
        <span style={{fontSize:10,color:C.muted}}>{showProfile?"▲":"▼"}</span>
      </button>
      {profSaved&&!showProfile&&(function(){
        var w=parseFloat(profile.kilo)||0,h=parseFloat(profile.boy)||0,a=parseInt(profile.yas)||0;
        if(!w||!h) return null;
        var bmi=Math.round((w/(h/100*h/100))*10)/10;
        var bmcat=bmi<18.5?"Zayıf":bmi<25?"Normal":bmi<30?"Fazla Kilolu":"Obez";
        var bmcol=bmi<18.5?C.blue:bmi<25?C.green:bmi<30?C.orange:C.red;
        var tdee=Math.round(10*w+6.25*h-5*a+5);
        var bfat=Math.round((1.2*bmi)+(0.23*a)-10.8-(a>40?0:0));
      return <div className="up" style={{background:"var(--card)",borderRadius:13,padding:"14px 16px",border:"1px solid rgba(212,168,67,0.15)",marginBottom:12}}>
          <div style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:12}}>Vücut Analizi</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"var(--card2)",borderRadius:11,padding:"13px",border:"1px solid "+bmcol+"33"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>VKİ (BMI)</div>
              <div style={{fontSize:24,fontWeight:700,color:bmcol,marginBottom:2}}>{bmi}</div>
              <div style={{fontSize:10,color:bmcol,fontWeight:600}}>{bmcat}</div>
              <div style={{height:4,borderRadius:2,background:"var(--card)",marginTop:8,overflow:"hidden"}}>
                <div style={{height:"100%",width:Math.min(100,Math.round((bmi/40)*100))+"%",background:"linear-gradient(90deg,"+C.blue+","+C.green+","+C.orange+","+C.red+")",borderRadius:2}}/>
              </div>
            </div>
            <div style={{background:"var(--card2)",borderRadius:11,padding:"13px",border:"1px solid rgba(91,163,208,0.25)"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Günlük Enerji (BMR)</div>
              <div style={{fontSize:24,fontWeight:700,color:C.blue,marginBottom:2}}>{tdee}</div>
              <div style={{fontSize:10,color:C.muted}}>kcal/gün</div>
              <div style={{fontSize:9,color:C.dim,marginTop:6}}>Hafif aktif: ~{Math.round(tdee*1.375)} kcal</div>
            </div>
            <div style={{background:"var(--card2)",borderRadius:11,padding:"11px",border:"1px solid rgba(76,175,122,0.2)"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>İdeal Ağırlık</div>
              <div style={{fontSize:18,fontWeight:700,color:C.green}}>{Math.round(22*(h/100*h/100))}<span style={{fontSize:10,fontWeight:400}}> kg</span></div>
              <div style={{fontSize:9,color:C.dim,marginTop:4}}>Fark: {Math.abs(Math.round(w-22*(h/100*h/100)))} kg</div>
            </div>
            <div style={{background:"var(--card2)",borderRadius:11,padding:"11px",border:"1px solid rgba(249,115,22,0.2)"}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Tahmini Yağ %</div>
              <div style={{fontSize:18,fontWeight:700,color:C.orange}}>{Math.min(50,Math.max(5,Math.round(1.2*bmi+0.23*a-16.2)))}<span style={{fontSize:10,fontWeight:400}}>%</span></div>
              <div style={{fontSize:9,color:C.dim,marginTop:4}}>Tahmin (Deurenberg)</div>
            </div>
          </div>
        </div>;
      })()}
      {showProfile&&<div className="up" style={{background:"var(--card)",borderRadius:12,border:"1px solid var(--border)",padding:"14px",marginBottom:12}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          {[["Yaş","yas","25"],["Kilo (kg)","kilo","70"],["Boy (cm)","boy","170"]].map(function(f){return <div key={f[1]}>
            <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{f[0]}</div>
            <input value={profile[f[1]]} onChange={function(e){var v=e.target.value;setProfile(function(p){var n=Object.assign({},p);n[f[1]]=v;return n;});}} placeholder={f[2]} style={{width:"100%",background:"var(--card2)",border:"1.5px solid var(--border)",borderRadius:8,padding:"8px 10px",color:C.cream,fontSize:12,outline:"none"}}/>
          </div>;})}
        </div>
        {[["Kronik Hastalık / Durum","saglik","diyabet, tansiyon…"],["Alerji / İntolerans","alerji","gluten, laktoz…"]].map(function(f){return <div key={f[1]} style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{f[0]}</div>
          <input value={profile[f[1]]} onChange={function(e){var v=e.target.value;setProfile(function(p){var n=Object.assign({},p);n[f[1]]=v;return n;});}} placeholder={f[2]} style={{width:"100%",background:"var(--card2)",border:"1.5px solid var(--border)",borderRadius:8,padding:"8px 10px",color:C.cream,fontSize:12,outline:"none"}}/>
        </div>;})}
        <button onClick={saveProfile} style={{width:"100%",padding:"10px",borderRadius:9,border:"2px solid rgba(212,168,67,0.4)",background:C.goldDim,color:C.goldL,fontSize:13,fontWeight:600}}>✓ Profili Kaydet</button>
      </div>}
      {/* Soru */}
      <div style={{background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:"14px",marginBottom:12}}>
        <div style={{fontSize:10,color:sc,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:9}}>{cur.emoji} {cur.label} Perspektifinden Sor</div>
        <div style={{display:"flex",gap:7,marginBottom:8}}>
          <input value={query} onChange={function(e){setQuery(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") ask();}} placeholder="Şikayetiniz veya hedefiniz…" style={{flex:1,background:"var(--card2)",border:"1.5px solid var(--border)",borderRadius:9,padding:"10px 13px",color:C.cream,fontSize:13,outline:"none"}}/>
          <button onClick={ask} disabled={loading||!query.trim()} style={{padding:"10px 16px",borderRadius:9,border:"1.5px solid "+sc+"55",background:sc+"12",color:loading?"var(--dim)":sc,fontSize:13,fontWeight:600}}>
            {loading?<Spinner size={13} color={sc}/>:"Sor"}
          </button>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {["Sindirim sorunu","Enerji düşüklüğü","Uyku problemi","Bağışıklık"].map(function(s){return <button key={s} onClick={function(){setQuery(s);}} style={{padding:"4px 10px",borderRadius:50,fontSize:11,border:"1px solid "+sc+"25",background:sc+"08",color:sc}}>{s}</button>;})}
        </div>
      </div>
      <ErrBox msg={error}/>
      {loading&&<div style={{padding:"11px 14px",background:sc+"06",borderRadius:11,border:"1px solid "+sc+"15",display:"flex",alignItems:"center",gap:9}}><Spinner size={13} color={sc}/><span style={{fontSize:13,color:sc}}>Analiz hazırlanıyor…</span></div>}
      {result&&result.data&&<div className="up" style={{marginTop:10}}>
        <div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:12,paddingBottom:8,borderBottom:"1px solid "+sc+"18"}}>{result.data.baslik}</div>
        {result.data.mizac_analizi?<div style={{padding:"10px 14px",background:C.goldDim,borderRadius:10,border:"1px solid rgba(212,168,67,0.2)",marginBottom:10,fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>📜 {result.data.mizac_analizi}</div>:null}
        {result.data.analiz?<div style={{padding:"10px 14px",background:"rgba(224,82,82,0.06)",borderRadius:10,border:"1px solid rgba(224,82,82,0.15)",marginBottom:10,fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>☯️ {result.data.analiz}</div>:null}
        {result.data.dosha_analizi?<div style={{padding:"10px 14px",background:"rgba(249,115,22,0.07)",borderRadius:10,border:"1px solid rgba(249,115,22,0.2)",marginBottom:10,fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic"}}>🪷 {result.data.dosha_analizi}</div>:null}
        <FL items={result.data.onerilen||result.data.nebevi_gidalar} title="Önerilen Gıdalar" col={C.green} icon="✅" nk="isim" dk="neden"/>
        <FL items={result.data.bitkiler||result.data.bitkisel} title="Şifalı Bitkiler" col={C.teal} icon="🌿" nk="isim" dk="kullanim"/>
        <FL items={result.data.isitici} title="Isıtıcı Gıdalar" col={C.orange} icon="🔥" nk="isim" dk="etki"/>
        <FL items={result.data.sogutucular} title="Soğutucu Gıdalar" col={C.blue} icon="❄️" nk="isim" dk="etki"/>
        <FL items={result.data.baharatlar} title="Şifalı Baharatlar" col={C.orange} icon="🌶️" nk="isim" dk="etki"/>
        <FL items={result.data.kacinil} title="Kaçınılacaklar" col={C.red} icon="⛔" nk="isim" dk="neden"/>
        {result.data.nasihat?<div style={{padding:"11px 14px",background:sc+"08",borderRadius:10,border:"1px solid "+sc+"18",fontSize:12,color:C.muted,lineHeight:1.7,fontStyle:"italic",marginTop:10}}>💫 {result.data.nasihat}</div>:null}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: İÇECEK MENÜSÜ
// ══════════════════════════════════════════════════════════════
function IcecekTab(){
  var [selKat,setSelKat]=useState({});
  var [selAmac,setSelAmac]=useState({});
  var [sicaklik,setSicaklik]=useState("farketmez");
  var [zorluk,setZorluk]=useState("kolay");
  var [adet,setAdet]=useState(3);
  var [loading,setLoading]=useState(false);
  var [data,setData]=useState(null);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var [step,setStep]=useState(1);
  var [favs,setFavs]=useState([]);
  useEffect(function(){stGet("icecek_favs").then(function(f){if(f)setFavs(f);});},[]);
  function toggleFav(tarif){
    setFavs(function(p){
      var ex=p.find(function(f){return f.isim===tarif.isim;});
      var nw=ex?p.filter(function(f){return f.isim!==tarif.isim;}):p.concat([tarif]);
      stSet("icecek_favs",nw);return nw;
    });
  }
  function tK(id){setSelKat(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function tA(id){setSelAmac(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function generate(){
    var katArr=Object.keys(selKat).filter(function(k){return selKat[k];});
    var amacArr=Object.keys(selAmac).filter(function(k){return selAmac[k];});
    if(katArr.length===0){setError("En az 1 içecek türü seçin.");return;}
    setLoading(true);setError(null);setData(null);setOpenIdx(null);
    var katLabels=katArr.map(function(k){var f=ICECEK_KAT.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var amacLabels=amacArr.map(function(k){var f=ICECEK_AMAC.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var sicakLbl=(ICECEK_SICAKLIK.find(function(x){return x.id===sicaklik;})||{}).label||"Farketmez";
    var zorLbl=(ICECEK_ZORLUK.find(function(x){return x.id===zorluk;})||{}).label||"Kolay";
    var prompt="Sen dünya mutfaklarından içecek uzmanısın. Tam olarak "+adet+" adet içecek tarifi oluştur.\n"+
      "İçecek Türleri: "+katLabels+"\n"+
      (amacLabels?"Amaç: "+amacLabels+"\n":"")+
      "Sıcaklık: "+sicakLbl+"\nZorluk: "+zorLbl+"\n"+
      "Her tarif farklı ve yaratıcı olsun. Malzeme miktarları kesin olsun.\n"+
      "Eğer 'Dünya İçecekleri' seçildiyse farklı ülkelerden özel içecekler ekle (Türk kahvesi, Matcha Latte, Chai, İtalyan Affogato, Meksika Horchata, Fas Nane Çayı, Kore Yuja-cha vb.).\n"+
      "Eğer 'Bitkisel Karışım' veya 'Şifalı İçecek' seçildiyse her bitkinin faydalarını belirt.\n"+
      "Continue JSON:\n\"baslik\":\"İçecek Menüsü\",\"tarifler\":[{\"isim\":\"Türkçe isim\",\"emoji\":\"1 emoji\",\"kategori\":\"tür\",\"sicaklik\":\"Sıcak/Soğuk\",\"mensei\":\"ülke/bölge\",\"hedef\":\"faydası 1 cümle\",\"malzemeler\":[{\"isim\":\"malzeme\",\"miktar\":\"miktar\",\"neden\":\"neden kullanılır\"}],\"hazirlanis\":[\"adım1\",\"adım2\",\"adım3\"],\"besin\":{\"kalori\":\"XXX kcal\",\"kafein\":\"var/yok/az\",\"seker\":\"Xg\"},\"ipucu\":\"püf noktası\",\"renk\":\"#hexcolor\"}]\nHepsi Türkçe.";
    callAI(prompt,1500)
      .then(function(r){setData(r);setStep(2);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Dünya İçecekleri" title="İçecek Menüsü" desc="Çay, kahve, smoothie, bitkisel ve dünya içecekleri" col={C.teal}/>
    <div style={{padding:"0 16px"}}>
      {step===1&&<div>
        <SH label="İçecek Türü" sub="Birden fazla seçebilirsiniz"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(95px,1fr))",gap:6,marginBottom:18}}>
          {ICECEK_KAT.map(function(g){var on=!!selKat[g.id];return <button key={g.id} onClick={function(){tK(g.id);}} style={{borderRadius:12,padding:"10px 6px",border:"2px solid "+(on?g.col:"var(--border)"),background:on?g.col+"14":"var(--card)",textAlign:"center",position:"relative"}}>
            {on&&<span style={{position:"absolute",top:4,right:6,fontSize:10,color:g.col}}>✓</span>}
            <div style={{fontSize:22,marginBottom:3}}>{g.emoji}</div><div style={{fontSize:10,fontWeight:600,color:on?C.cream:"var(--muted)"}}>{g.label}</div>
          </button>;})}
        </div>
        <SH label="Amaç" sub="İsteğe bağlı"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
          {ICECEK_AMAC.map(function(a){var on=!!selAmac[a.id];return <button key={a.id} onClick={function(){tA(a.id);}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?a.col:"var(--border)"),background:on?a.col+"14":"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:14}}>{a.emoji}</span>{a.label}
          </button>;})}
        </div>
        <SH label="Sıcaklık"/>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {ICECEK_SICAKLIK.map(function(s){var on=sicaklik===s.id;return <button key={s.id} onClick={function(){setSicaklik(s.id);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
            <div style={{fontSize:18}}>{s.emoji}</div><div style={{fontSize:11,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{s.label}</div>
          </button>;})}
        </div>
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          <div style={{flex:1}}>
            <SH label="Zorluk"/>
            <div style={{display:"flex",gap:5}}>
              {ICECEK_ZORLUK.map(function(z){var on=zorluk===z.id;return <button key={z.id} onClick={function(){setZorluk(z.id);}} style={{flex:1,padding:"9px 6px",borderRadius:10,border:"1.5px solid "+(on?z.col:"var(--border)"),background:on?z.col+"14":"var(--card)",textAlign:"center"}}>
                <div style={{fontSize:14}}>{z.emoji}</div><div style={{fontSize:10,color:on?z.col:C.muted}}>{z.label}</div>
              </button>;})}
            </div>
          </div>
          <div style={{flex:1}}>
            <SH label="Tarif Sayısı"/>
            <div style={{display:"flex",gap:5}}>
              {[1,2,3,4,5,6].map(function(n){var on=adet===n;return <button key={n} onClick={function(){setAdet(n);}} style={{flex:1,padding:"9px 4px",borderRadius:10,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center",fontSize:13,fontWeight:on?700:400,color:on?C.cream:C.muted}}>{n}</button>;})}
            </div>
          </div>
        </div>
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>İçecek menüsü hazırlanıyor…</span>:"☕ "+adet+" İçecek Tarifi Oluştur"}
        </GoldBtn>
        {loading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{Array.from({length:adet},function(_,i){return <div key={i} className="sk" style={{height:70,animationDelay:i*0.07+"s"}}/>;})}</div>}
      </div>}
      {step===2&&data&&<div>
        <button onClick={function(){setStep(1);setData(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"none",color:C.teal,fontSize:12,fontWeight:600,marginBottom:12,padding:0}}>← Yeni Seçim</button>
        <div className="up" style={{marginTop:4}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:10,letterSpacing:"0.25em",color:C.teal,textTransform:"uppercase",fontWeight:700}}>{data.baslik||"İçecek Menüsü"}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{(data.tarifler||[]).length} tarif</div>
            <div style={{fontSize:10,color:C.teal,marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",gap:4,opacity:0.8}}>👆 Tarif detayı için kartlara tıklayın</div>
          </div>
          {(data.tarifler||[]).map(function(ic,i){var col=ic.renk||C.teal;var open=openIdx===i;var isFav=favs.some(function(f){return f.isim===ic.isim;});return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:8}}>
            <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"13px 15px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:42,height:42,borderRadius:11,flexShrink:0,background:col+"18",border:"1px solid "+col+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{ic.emoji||"☕"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{ic.isim}</div>
                  {ic.mensei&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:50,background:col+"14",color:col}}>{ic.mensei}</span>}
                </div>
                <div style={{fontSize:12,color:col,marginBottom:3,marginTop:1}}>{ic.hedef}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {ic.sicaklik&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:ic.sicaklik==="Sıcak"?"rgba(224,82,82,0.1)":"rgba(91,163,208,0.1)",color:ic.sicaklik==="Sıcak"?C.red:C.blue}}>{ic.sicaklik==="Sıcak"?"🔥":"❄️"} {ic.sicaklik}</span>}
                  {ic.kategori&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>{ic.kategori}</span>}
                  {ic.besin&&ic.besin.kalori&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>🔥 {ic.besin.kalori}</span>}
                  {ic.besin&&ic.besin.kafein&&<span style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:"rgba(139,94,60,0.1)",color:"#8B5E3C"}}>☕ {ic.besin.kafein}</span>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
                {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Tarif</span>}
                <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
              </div>
            </button>
            {open&&<div className="up" style={{padding:"0 15px 15px",borderTop:"1px solid "+col+"20"}}>
              <div style={{marginTop:10,marginBottom:9}}>
                <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Malzemeler</div>
                {(ic.malzemeler||[]).map(function(m,j){return <div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{color:col,fontSize:8}}>◆</span><span style={{color:C.muted,minWidth:48,fontSize:12}}>{m.miktar}</span><span style={{color:C.cream,fontSize:12,flex:1}}>{m.isim}</span>{m.neden?<span style={{fontSize:10,color:col,fontStyle:"italic"}}>{m.neden}</span>:null}</div>;})}
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Hazırlanış</div>
                {(ic.hazirlanis||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
              </div>
              {ic.ipucu&&<div style={{padding:"8px 11px",background:col+"0A",borderRadius:8,border:"1px solid "+col+"18",fontSize:12,color:col,fontStyle:"italic",marginBottom:8}}>💡 {ic.ipucu}</div>}
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <button onClick={function(){toggleFav(ic);}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+(isFav?C.red+"66":"var(--border)"),background:isFav?"rgba(224,82,82,0.08)":"transparent",color:isFav?C.red:C.muted,fontSize:11,fontWeight:600}}>{isFav?"❤️ Favorilerde":"🤍 Favorile"}</button>
                <button onClick={function(){if(navigator.share){navigator.share({title:ic.isim,text:ic.isim+"\n"+(ic.malzemeler||[]).map(function(m){return m.miktar+" "+m.isim;}).join(", ")+"\n"+(ic.hazirlanis||[]).join("\n")});}else{navigator.clipboard.writeText(ic.isim+"\n"+(ic.malzemeler||[]).map(function(m){return m.miktar+" "+m.isim;}).join(", ")+"\n"+(ic.hazirlanis||[]).join("\n"));}}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤 Paylaş</button>
              </div>
              <DishActionButtons dish={ic} col={C.teal} dishType="içecek"/>
            </div>}
          </div>;})}
        </div>
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: DİYET MENÜSÜ
// ══════════════════════════════════════════════════════════════
function DiyetTab(props){
  var [selEkol,setSelEkol]=useState([]);
  var [ogun,setOgun]=useState("3ogun");
  var [hedef,setHedef]=useState("saglik");
  var [protein,setProtein]=useState({});
  var [kisit,setKisit]=useState({});
  var [stil,setStil]=useState("ev");
  var [kalori,setKalori]=useState(1800);
  var [gunSayisi,setGunSayisi]=useState(1);
  var [kisi,setKisi]=useState(1);
  var [baharat,setBaharat]=useState("orta");
  var [denge,setDenge]=useState({});
  var [pazarOncelik,setPazarOncelik]=useState(true);
  var [step,setStep]=useState(1);
  var [days,setDays]=useState(null);
  var [loading,setLoading]=useState(false);
  var [loadingDay,setLoadingDay]=useState(null);
  var [menuAdimlar,setMenuAdimlar]=useState([]);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var [activeDay,setActiveDay]=useState(0);
  var [alisverisListesi,setAlisverisListesi]=useState([]);
  var [alisverisLoading,setAlisverisLoading]=useState(false);
  var [showShop,setShowShop]=useState(false);
  var cache=useRef({});
  useEffect(function(){
    stGet("diyet_last_settings").then(function(s){
      if(!s||typeof s!=="object")return;
      if(s.selEkol&&Array.isArray(s.selEkol))setSelEkol(s.selEkol);
      if(s.ogun)setOgun(s.ogun);
      if(s.hedef)setHedef(s.hedef);
      if(s.protein&&typeof s.protein==="object")setProtein(s.protein);
      if(s.kisit&&typeof s.kisit==="object")setKisit(s.kisit);
      if(s.stil)setStil(s.stil);
      if(s.kalori)setKalori(s.kalori);
      if(s.gunSayisi&&s.gunSayisi>=1&&s.gunSayisi<=14)setGunSayisi(s.gunSayisi);
      if(s.kisi)setKisi(s.kisi);
      if(s.baharat)setBaharat(s.baharat);
      if(s.denge&&typeof s.denge==="object")setDenge(s.denge);
      if(s.pazarOncelik!==undefined)setPazarOncelik(!!s.pazarOncelik);
    });
  },[]);
  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function toggleEkol(id){setSelEkol(function(p){return p.indexOf(id)>-1?p.filter(function(x){return x!==id;}):p.concat([id]);});}
  var _mAy=new Date().getMonth()+1,_mPd=PAZAR_AY[_mAy]||{tema:"",urunler:[]};
  var ogunInfo=DIYET_OGUN.find(function(x){return x.id===ogun;})||{};
  var hedefInfo=DIYET_HEDEF.find(function(x){return x.id===hedef;})||{};
  var hKey=JSON.stringify({selEkol,ogun,hedef,protein,kisit,stil,kalori,gunSayisi,kisi,baharat,denge,pazarOncelik});
  useEffect(function(){
    stGet("diyet:"+hKey).then(function(cached){
      if(cached&&!days){setDays(cached);setStep(3);setActiveDay(0);}
    });
  },[hKey]);
  function buildPrompt(gNo,exN){
    var ekolLabels=selEkol.map(function(e){var f=DIYET_EKOL.find(function(x){return x.id===e;});return f?f.label:e;}).join(", ")||"Genel Sağlıklı";
    var proteinArr=Object.keys(protein).filter(function(k){return protein[k];});
    var proteinLabels=proteinArr.map(function(k){var f=DIYET_PROTEIN.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var kisitArr=Object.keys(kisit).filter(function(k){return kisit[k];});
    var kisitLabels=kisitArr.map(function(k){var f=DIYET_KISIT.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var dengeArr=Object.keys(denge).filter(function(k){return denge[k];});
    var dengeLabels=dengeArr.map(function(k){var d=DENGE.find(function(x){return x.id===k;});return d?d.desc:"";}).filter(Boolean).join(". ");
    var stilLbl=(DIYET_STIL.find(function(x){return x.id===stil;})||{}).label||"Ev";
    var baharatLbl=(BAHARAT.find(function(x){return x.id===baharat;})||{}).label||"Orta";
    var pazarStr=pazarOncelik&&_mPd.urunler&&_mPd.urunler.length?"\nMevsimsel ürünlere öncelik ver: "+_mPd.urunler.join(", ")+".":"";
    var ogunDesc=ogunInfo.desc||"3 öğün";
    return "Sen klinik diyetisyen ve beslenme uzmanısın. Gün "+gNo+"/"+gunSayisi+" için "+ogunDesc+" formatında diyet menüsü oluştur.\n"+
      "Diyet Ekolü: "+ekolLabels+"\n"+
      "Hedef: "+(hedefInfo.label||"Genel Sağlık")+" | Kalori: günlük ~"+kalori+" kcal | Kişi: "+kisi+"\n"+
      (proteinLabels?"Protein Tercihi: "+proteinLabels+"\n":"")+
      (kisitLabels?"Kısıtlamalar: "+kisitLabels+"\n":"")+
      "Stil: "+stilLbl+" | Baharat: "+baharatLbl+"\n"+
      (dengeLabels?"Denge: "+dengeLabels+"\n":"")+
      (exN.length?"\nBu yemekleri TEKRARLAMA: "+exN.join(", ")+"\n":"")+
      pazarStr+
      "\nHer öğün için kalori belirt. Toplam günlük ~"+kalori+" kcal olmalı."+
      "\nContinue JSON:\n\"gun_adi\":\""+gNo+". Gün\",\"ekol\":\""+ekolLabels+"\",\"toplam_kalori\":\""+kalori+" kcal\","+
      "\"ogunler\":[{\"ogun\":\"Kahvaltı/Öğle/Akşam/Ara Öğün\",\"yemekler\":[{\"isim\":\"yemek adı\",\"aciklama\":\"1 cümle\",\"malzemeler\":[{\"isim\":\"malzeme\",\"miktar\":\"miktar\"}],\"hazirlanis\":[\"adım1\",\"adım2\"],\"kalori\":\"XXX kcal\",\"besin\":{\"protein\":\"Xg\",\"karb\":\"Xg\",\"yag\":\"Xg\",\"lif\":\"Xg\"},\"sure\":\"X dk\",\"ipucu\":\"diyet notu\"}]}],"+
      "\"gun_notu\":\"o güne özel beslenme ipucu\"}\nHepsi Türkçe.";
  }
  async function generate(){
    if(selEkol.length===0){setError("En az 1 diyet ekolü seçin.");return;}
    setLoading(true);setError(null);setDays(null);setOpenIdx(null);setActiveDay(0);
    await stSet("diyet_last_settings",{selEkol,ogun,hedef,protein,kisit,stil,kalori,gunSayisi,kisi,baharat,denge,pazarOncelik});
    if(cache.current[hKey]){setDays(cache.current[hKey]);setStep(3);setLoading(false);return;}
    var allSteps=[];
    for(var gi=1;gi<=gunSayisi;gi++)allSteps.push({label:gi+". gün diyet menüsü",durum:"bekliyor"});
    allSteps.push({label:"Menü kaydediliyor",durum:"bekliyor"});
    setMenuAdimlar(allSteps);
    try{
      var aD=[],aN=[];
      for(var g=1;g<=gunSayisi;g++){
        setLoadingDay(g);
        var sIdx=g-1;setMenuAdimlar(function(p){var n=p.slice();if(n[sIdx])n[sIdx]=Object.assign({},n[sIdx],{durum:"aktif"});return n;});
        var r=await callAI(buildPrompt(g,aN),1500);
        if(!r||!r.ogunler)throw new Error(g+". gün başarısız.");
        r.ogunler.forEach(function(og){(og.yemekler||[]).forEach(function(y){aN.push(y.isim);});});
        aD.push(r);
        setMenuAdimlar(function(p){var n=p.slice();if(n[sIdx])n[sIdx]=Object.assign({},n[sIdx],{durum:"tamam"});return n;});
      }
      cache.current[hKey]=aD;
      await stSet("diyet:"+hKey,aD);
      setMenuAdimlar(function(p){var n=p.slice();var li=n.length-1;if(n[li])n[li]=Object.assign({},n[li],{durum:"tamam"});return n;});
      setDays(aD);setStep(3);setActiveDay(0);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  }
  async function generateAlisveris(){
    if(!days||days.length===0)return;
    setAlisverisLoading(true);
    try{
      var tumYemekler=days.flatMap(function(d){return (d.ogunler||[]).flatMap(function(og){return (og.yemekler||[]).map(function(y){return y.isim;});});});
      var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe diyet alışveriş listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu diyet yemekleri için alışveriş listesi çıkar: "+tumYemekler.join(", ")+".\n\nJSON: {\"kategoriler\":[{\"kategori\":\"Sebze & Meyve\",\"malzemeler\":[\"malzeme1\"]},{\"kategori\":\"Et & Protein\",\"malzemeler\":[]},{\"kategori\":\"Tahıl & Baklagil\",\"malzemeler\":[]},{\"kategori\":\"Süt & Yumurta\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Sos\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
      var body=await res.json();
      var raw="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var parsed=parseJSON(raw);
      setAlisverisListesi(parsed&&parsed.kategoriler?parsed.kategoriler:[]);
      setShowShop(true);
    }catch(e){setError(e.message);}finally{setAlisverisLoading(false);}
  }
  // ── STEP 1 & 2: Selection UI ──
  if(step===1||step===2){
    return <div style={{paddingBottom:78}}>
      {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
      <TabHeader sub="Kişiselleştirilmiş Beslenme" title="Diyet Menüsü" desc="Diyet ekolü seçin, tercihlerinizi belirleyin" col={C.green}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:0,marginBottom:16,background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
          {[1,2].map(function(s){var on=step===s;return <button key={s} onClick={function(){setStep(s);}} style={{flex:1,padding:"10px",background:on?"var(--accent)":"transparent",color:on?"var(--bg)":"var(--muted)",fontSize:12,fontWeight:on?700:400,border:"none",letterSpacing:"0.05em"}}>{s===1?"Diyet & Öğün":"Detay Ayarlar"}</button>;})}
        </div>
        {step===1&&<div>
          <SH label="Diyet Ekolü" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {DIYET_EKOL.map(function(e){var on=selEkol.indexOf(e.id)>-1;return <button key={e.id} onClick={function(){toggleEkol(e.id);}} style={{borderRadius:12,padding:"10px 10px",border:"2px solid "+(on?e.col:"var(--border)"),background:on?e.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
              {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:e.col}}>✓</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{e.emoji}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:on?C.cream:"var(--muted)"}}>{e.label}</div>
                  <div style={{fontSize:9,color:on?e.col:C.dim,lineHeight:1.3,marginTop:1}}>{e.desc}</div>
                </div>
              </div>
            </button>;})}
          </div>
          <SH label="Öğün Planı"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {DIYET_OGUN.map(function(o){var on=ogun===o.id;return <button key={o.id} onClick={function(){setOgun(o.id);}} style={{borderRadius:10,padding:"10px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:2}}>{o.emoji}</div>
              <div style={{fontSize:12,fontWeight:on?700:400,color:on?C.cream:C.muted}}>{o.label}</div>
              <div style={{fontSize:9,color:C.dim}}>{o.desc}</div>
            </button>;})}
          </div>
          <SH label="Hedef"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {DIYET_HEDEF.map(function(h){var on=hedef===h.id;return <button key={h.id} onClick={function(){setHedef(h.id);}} style={{padding:"8px 14px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?h.col:"var(--border)"),background:on?h.col+"14":"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{h.emoji}</span>{h.label}
            </button>;})}
          </div>
          <SH label="Günlük Kalori Hedefi"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {DIYET_KALORI.map(function(k){var on=kalori===k;return <button key={k} onClick={function(){setKalori(k);}} style={{padding:"8px 12px",borderRadius:10,fontSize:12,fontWeight:on?700:400,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted}}>{k} kcal</button>;})}
          </div>
          <SH label="Protein Tercihi" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {DIYET_PROTEIN.map(function(p){var on=!!protein[p.id];return <button key={p.id} onClick={function(){tMap(setProtein,p.id);}} style={{padding:"8px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{p.emoji}</span>{p.label}
            </button>;})}
          </div>
        </div>}
        {step===2&&<div>
          <SH label="Yemek Stili"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:18}}>
            {DIYET_STIL.map(function(s){var on=stil===s.id;return <button key={s.id} onClick={function(){setStil(s.id);}} style={{borderRadius:10,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:18}}>{s.emoji}</div><div style={{fontSize:10,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{s.label}</div>
            </button>;})}
          </div>
          <SH label="Kısıtlamalar & Alerjenler"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5,marginBottom:18}}>
            {DIYET_KISIT.map(function(k){var on=!!kisit[k.id];return <button key={k.id} onClick={function(){tMap(setKisit,k.id);}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:14}}>{k.emoji}</span><span style={{fontSize:12,flex:1}}>{k.label}</span>
              <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:on?C.gold:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:on?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
            </button>;})}
          </div>
          <SH label="Baharat Tercihi"/>
          <div style={{display:"flex",gap:6,marginBottom:18}}>
            {BAHARAT.map(function(b){var on=baharat===b.id;return <button key={b.id} onClick={function(){setBaharat(b.id);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?b.col:"var(--border)"),background:on?b.col+"14":"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:16}}>{b.emoji}</div><div style={{fontSize:11,color:on?b.col:C.muted}}>{b.label}</div>
            </button>;})}
          </div>
          <SH label="Menü Dengesi"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:18}}>
            {DENGE.map(function(d){var on=!!denge[d.id];return <button key={d.id} onClick={function(){setDenge(function(p){var n=Object.assign({},p);n[d.id]=!n[d.id];return n;});}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?d.br:"var(--border)"),background:on?d.bg:"var(--card)",color:on?d.col:C.muted,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:14}}>{d.emoji}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?d.col:C.cream}}>{d.label}</span>
              </div>
              <div style={{fontSize:9,color:on?d.col:C.dim,lineHeight:1.4}}>{d.desc}</div>
            </button>;})}
          </div>
          <SH label="Mevsim Önceliği"/>
          <button onClick={function(){setPazarOncelik(!pazarOncelik);}} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(pazarOncelik?C.green+"66":"var(--border)"),background:pazarOncelik?"rgba(76,175,122,0.06)":"var(--card)",display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <span style={{fontSize:16}}>{pazarOncelik?"🌿":"🌍"}</span>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontSize:12,color:C.cream,fontWeight:600}}>Mevsim Ürünleri</div>
              <div style={{fontSize:10,color:C.dim}}>{_mPd.tema?" "+_mPd.tema+" — "+_mPd.urunler.slice(0,3).join(", "):"Mevsimsel ürünlere öncelik ver"}</div>
            </div>
            <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:pazarOncelik?C.green:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:pazarOncelik?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
          </button>
          <div style={{display:"flex",gap:12,marginBottom:18}}>
            <div style={{flex:1}}>
              <SH label="Kişi Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6].map(function(n){var on=kisi===n;return <button key={n} onClick={function(){setKisi(n);}} style={{width:36,height:36,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:13,fontWeight:on?700:400}}>{n}</button>;})}
              </div>
            </div>
            <div style={{flex:1}}>
              <SH label="Gün Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,3,5,7,14].map(function(n){var on=gunSayisi===n;return <button key={n} onClick={function(){setGunSayisi(n);}} style={{padding:"8px 10px",borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{n}{n>1?" gün":" gün"}</button>;})}
              </div>
            </div>
          </div>
        </div>}
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>{loadingDay?loadingDay+". gün hazırlanıyor…":"Diyet menüsü hazırlanıyor…"}</span>:"🥗 "+gunSayisi+" Günlük Diyet Menüsü Oluştur"}
        </GoldBtn>
        {loading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{menuAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }
  // ── STEP 3: Results ──
  var cDay=days&&days[activeDay];
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Diyet Programı" title={cDay&&cDay.ekol||"Diyet Menüsü"} desc={(cDay&&cDay.toplam_kalori||kalori+" kcal")+" / gün"} col={C.green}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={function(){setStep(1);setDays(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.teal,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Seçim</button>
        <button onClick={generateAlisveris} disabled={alisverisLoading} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>{alisverisLoading?<Spinner size={12}/>:"🛒"} Alışveriş Listesi</button>
      </div>
      {gunSayisi>1&&<div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {days&&days.map(function(d,i){var on=activeDay===i;return <button key={i} onClick={function(){setActiveDay(i);setOpenIdx(null);}} style={{flexShrink:0,padding:"7px 14px",borderRadius:50,border:"1.5px solid "+(on?C.green:"var(--border)"),background:on?C.green+"14":"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{d.gun_adi||i+1+". Gün"}</button>;})}
      </div>}
      {cDay&&<div className="up">
        {cDay.gun_notu&&<div style={{padding:"10px 14px",borderRadius:10,background:"rgba(76,175,122,0.06)",border:"1px solid rgba(76,175,122,0.2)",marginBottom:14,fontSize:12,color:C.green,lineHeight:1.5}}>💡 {cDay.gun_notu}</div>}
        {(cDay.ogunler||[]).map(function(og,oi){return <div key={oi} style={{marginBottom:16}}>
          <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:20,height:2,background:C.gold,borderRadius:2}}/>{og.ogun}<span style={{width:20,height:2,background:C.gold,borderRadius:2}}/>
          </div>
          {(og.yemekler||[]).map(function(y,yi){var uKey=oi+"-"+yi;var open=openIdx===uKey;var col=C.green;return <div key={yi} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
            <button onClick={function(){setOpenIdx(open?null:uKey);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{y.isim}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{y.aciklama}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                  {y.kalori&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(76,175,122,0.1)",color:C.green}}>🔥 {y.kalori}</span>}
                  {y.sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {y.sure}</span>}
                  {y.besin&&y.besin.protein&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>P:{y.besin.protein}</span>}
                  {y.besin&&y.besin.karb&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>K:{y.besin.karb}</span>}
                  {y.besin&&y.besin.yag&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>Y:{y.besin.yag}</span>}
                </div>
              </div>
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </button>
            {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
              <div style={{marginTop:10,marginBottom:9}}>
                <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Malzemeler</div>
                {(y.malzemeler||[]).map(function(m,j){return <div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{color:col,fontSize:8}}>◆</span><span style={{color:C.muted,minWidth:50,fontSize:12}}>{m.miktar}</span><span style={{color:C.cream,fontSize:12}}>{m.isim}</span></div>;})}
              </div>
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Hazırlanış</div>
                {(y.hazirlanis||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
              </div>
              {y.ipucu&&<div style={{padding:"8px 11px",background:col+"0A",borderRadius:8,border:"1px solid "+col+"18",fontSize:12,color:col,fontStyle:"italic"}}>🥗 {y.ipucu}</div>}
            </div>}
          </div>;})}
        </div>;})}
      </div>}
      {showShop&&alisverisListesi.length>0&&<div style={{marginTop:14,background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:C.cream}}>🛒 Diyet Alışveriş Listesi</div>
          <button onClick={function(){setShowShop(false);}} style={{background:"none",border:"none",color:C.muted,fontSize:16}}>✕</button>
        </div>
        {alisverisListesi.map(function(kat,ki){return <div key={ki} style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:5}}>{kat.kategori}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {(kat.malzemeler||[]).map(function(m,mi){return <span key={mi} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"var(--card2)",color:C.muted,border:"1px solid var(--border)"}}>{m}</span>;})}
          </div>
        </div>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: TATLI MENÜSÜ
// ══════════════════════════════════════════════════════════════
function TatliTab(props){
  var [selKat,setSelKat]=useState({});
  var [selMutfak,setSelMutfak]=useState([]);
  var [stil,setStil]=useState("ev");
  var [zorluk,setZorluk]=useState("kolay");
  var [alerjen,setAlerjen]=useState({});
  var [ekstra,setEkstra]=useState({});
  var [denge,setDenge]=useState({});
  var [kisi,setKisi]=useState(4);
  var [kalem,setKalem]=useState(5);
  var [gunSayisi,setGunSayisi]=useState(1);
  var [pazarOncelik,setPazarOncelik]=useState(true);
  var [step,setStep]=useState(1);
  var [days,setDays]=useState(null);
  var [loading,setLoading]=useState(false);
  var [loadingDay,setLoadingDay]=useState(null);
  var [menuAdimlar,setMenuAdimlar]=useState([]);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var [activeDay,setActiveDay]=useState(0);
  var [alisverisListesi,setAlisverisListesi]=useState([]);
  var [alisverisLoading,setAlisverisLoading]=useState(false);
  var [showShop,setShowShop]=useState(false);
  var cache=useRef({});
  useEffect(function(){
    stGet("tatli_last_settings").then(function(s){
      if(!s||typeof s!=="object")return;
      if(s.selKat&&typeof s.selKat==="object")setSelKat(s.selKat);
      if(s.selMutfak&&Array.isArray(s.selMutfak))setSelMutfak(s.selMutfak);
      if(s.stil)setStil(s.stil);
      if(s.zorluk)setZorluk(s.zorluk);
      if(s.alerjen&&typeof s.alerjen==="object")setAlerjen(s.alerjen);
      if(s.ekstra&&typeof s.ekstra==="object")setEkstra(s.ekstra);
      if(s.denge&&typeof s.denge==="object")setDenge(s.denge);
      if(s.kisi)setKisi(s.kisi);
      if(s.kalem)setKalem(s.kalem);
      if(s.gunSayisi&&s.gunSayisi>=1&&s.gunSayisi<=10)setGunSayisi(s.gunSayisi);
      if(s.pazarOncelik!==undefined)setPazarOncelik(!!s.pazarOncelik);
    });
  },[]);
  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function toggleMutfak(id){setSelMutfak(function(p){return p.indexOf(id)>-1?p.filter(function(x){return x!==id;}):p.concat([id]);});}
  function reset(){setDays(null);setOpenIdx(null);}
  var _mAy=new Date().getMonth()+1,_mPd=PAZAR_AY[_mAy]||{tema:"",urunler:[]};
  var hKey=JSON.stringify({selKat,selMutfak,stil,zorluk,alerjen,ekstra,denge,kisi,kalem,gunSayisi,pazarOncelik});
  useEffect(function(){
    stGet("tatli:"+hKey).then(function(cached){
      if(cached&&!days){setDays(cached);setStep(3);setActiveDay(0);}
    });
  },[hKey]);
  function buildPrompt(gNo,exN){
    var katArr=Object.keys(selKat).filter(function(k){return selKat[k];});
    var katLabels=katArr.map(function(k){var f=TATLI_KAT.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var mutfakLabels=selMutfak.map(function(k){var found=null;TATLI_MUTFAK.forEach(function(g){g.items.forEach(function(it){if(it.id===k)found=it.l;});});return found||k;}).join(", ");
    var stilLbl=(TATLI_STIL.find(function(x){return x.id===stil;})||{}).label||"Ev";
    var zorLbl=(TATLI_ZORLUK.find(function(x){return x.id===zorluk;})||{}).label||"Kolay";
    var alerjenArr=Object.keys(alerjen).filter(function(k){return alerjen[k];});
    var alerjenLabels=alerjenArr.map(function(k){var f=TATLI_ALERJEN.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var ekstraArr=Object.keys(ekstra).filter(function(k){return ekstra[k];});
    var ekstraLabels=ekstraArr.map(function(k){var f=TATLI_EKSTRA.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var dengeArr=Object.keys(denge).filter(function(k){return denge[k];});
    var dengeLabels=dengeArr.map(function(k){var d=TATLI_DENGE.find(function(x){return x.id===k;});return d?d.desc:"";}).filter(Boolean).join(". ");
    var pazarStr=pazarOncelik&&_mPd.urunler&&_mPd.urunler.length?"\nMevsim meyveleri ve ürünlerini kullan: "+_mPd.urunler.join(", ")+".":"";
    return "Sen dünyaca ünlü pastacı ve tatlı şefisin. Gün "+gNo+"/"+gunSayisi+" için tam "+kalem+" adet tatlı tarifi oluştur.\n"+
      (katLabels?"Tatlı Türleri: "+katLabels+"\n":"")+
      (mutfakLabels?"Mutfak: "+mutfakLabels+"\n":"Mutfak: Türk\n")+
      "Stil: "+stilLbl+" | Zorluk: "+zorLbl+" | Porsiyon: "+kisi+" kişilik\n"+
      (alerjenLabels?"Alerjen: "+alerjenLabels+"\n":"")+
      (ekstraLabels?"Ekstra: "+ekstraLabels+"\n":"")+
      (dengeLabels?"Denge: "+dengeLabels+"\n":"")+
      (exN.length?"\nBu tatlıları TEKRARLAMA: "+exN.join(", ")+"\n":"")+
      pazarStr+
      "\nHer tatlı tarifi için adım adım hazırlanış talimatları yaz. Malzeme miktarlarını kesin belirt.\n"+
      "Continue JSON:\n\"menu_adi\":\"tatlı menü adı\",\"aciklama\":\"kısa açıklama\","+
      "\"tatlilar\":[{\"isim\":\"tatlı adı\",\"emoji\":\"1 emoji\",\"aciklama\":\"1 cümle\","+
      "\"malzemeler\":[{\"isim\":\"malzeme\",\"miktar\":\"miktar\"}],"+
      "\"hazirlanis\":[\"1. adım\",\"2. adım\",\"3. adım\"],"+
      "\"sure\":\"X dk\",\"zorluk\":\"Kolay/Orta/Zor\",\"kalori\":\"XXX kcal\","+
      "\"porsiyon\":\"X kişilik\",\"mensei\":\"ülke\",\"ogun\":\"tatlı\",\"sef_notu\":\"1 cümle ipucu\""+
      "}]}\nHepsi Türkçe, tekrarsız, yaratıcı.";
  }
  async function generate(){
    setLoading(true);setError(null);setDays(null);setOpenIdx(null);setActiveDay(0);
    await stSet("tatli_last_settings",{selKat,selMutfak,stil,zorluk,alerjen,ekstra,denge,kisi,kalem,gunSayisi,pazarOncelik});
    if(cache.current[hKey]){setDays(cache.current[hKey]);setStep(3);setLoading(false);return;}
    var allSteps=[];
    for(var gi=1;gi<=gunSayisi;gi++)allSteps.push({label:gi+". gün tatlı menüsü",durum:"bekliyor"});
    allSteps.push({label:"Menü kaydediliyor",durum:"bekliyor"});
    setMenuAdimlar(allSteps);
    try{
      var aD=[],aN=[];
      var tok=kalem<=4?700:kalem<=7?1000:1400;
      for(var g=1;g<=gunSayisi;g++){
        setLoadingDay(g);
        setMenuAdimlar(function(p){var n=p.slice();if(n[g-1])n[g-1]=Object.assign({},n[g-1],{durum:"aktif"});return n;});
        var r=await callAI(buildPrompt(g,aN),tok);
        if(!r||!Array.isArray(r.tatlilar)||r.tatlilar.length===0)throw new Error(g+". gün başarısız.");
        r.tatlilar.forEach(function(d){aN.push(d.isim);});
        aD.push({gunNo:g,menu_adi:r.menu_adi,aciklama:r.aciklama,dishes:r.tatlilar});
        setMenuAdimlar(function(p){var n=p.slice();if(n[g-1])n[g-1]=Object.assign({},n[g-1],{durum:"tamam"});return n;});
      }
      cache.current[hKey]=aD;await stSet("tatli:"+hKey,aD);
      setMenuAdimlar(function(p){var n=p.slice();var li=n.length-1;if(n[li])n[li]=Object.assign({},n[li],{durum:"tamam"});return n;});
      setDays(aD);setStep(3);setActiveDay(0);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  }
  async function generateAlisveris(){
    if(!days||days.length===0)return;setAlisverisLoading(true);
    try{
      var tum=days.flatMap(function(d){return (d.dishes||[]).map(function(x){return x.isim;});});
      var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe tatlı malzeme listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu tatlılar için alışveriş listesi: "+tum.join(", ")+".\nJSON: {\"kategoriler\":[{\"kategori\":\"Un & Tahıl\",\"malzemeler\":[]},{\"kategori\":\"Süt & Yumurta\",\"malzemeler\":[]},{\"kategori\":\"Şeker & Tatlandırıcı\",\"malzemeler\":[]},{\"kategori\":\"Meyve\",\"malzemeler\":[]},{\"kategori\":\"Çikolata & Kakao\",\"malzemeler\":[]},{\"kategori\":\"Kuruyemiş\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Aroma\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
      var body=await res.json();var raw="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var parsed=parseJSON(raw);setAlisverisListesi(parsed&&parsed.kategoriler?parsed.kategoriler:[]);setShowShop(true);
    }catch(e){setError(e.message);}finally{setAlisverisLoading(false);}
  }
  // ── STEP 1 & 2 ──
  if(step===1||step===2){
    return <div style={{paddingBottom:78}}>
      {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
      <TabHeader sub="Şefin Tatlı Dünyası" title="Tatlı Menüsü" desc="Dünya mutfaklarından tatlı tarifleri" col={C.pink}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:0,marginBottom:16,background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
          {[1,2].map(function(s){var on=step===s;return <button key={s} onClick={function(){setStep(s);}} style={{flex:1,padding:"10px",background:on?"var(--accent)":"transparent",color:on?"var(--bg)":"var(--muted)",fontSize:12,fontWeight:on?700:400,border:"none",letterSpacing:"0.05em"}}>{s===1?"Tatlı Türü & Mutfak":"Detay Ayarlar"}</button>;})}
        </div>
        {step===1&&<div>
          <SH label="Tatlı Türü" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {TATLI_KAT.map(function(g){var on=!!selKat[g.id];return <button key={g.id} onClick={function(){tMap(setSelKat,g.id);reset();}} style={{borderRadius:12,padding:"10px 10px",border:"2px solid "+(on?g.col:"var(--border)"),background:on?g.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
              {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:g.col}}>✓</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{g.emoji}</span>
                <span style={{fontSize:11,fontWeight:on?700:500,color:on?C.cream:"var(--muted)"}}>{g.label}</span>
              </div>
            </button>;})}
          </div>
          <SH label="Mutfak" sub="Boş = Türk mutfağı"/>
          {TATLI_MUTFAK.map(function(gr){return <div key={gr.group} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"var(--muted)",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>{gr.group}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
              {gr.items.map(function(c){var on=selMutfak.indexOf(c.id)>-1;return <button key={c.id} onClick={function(){toggleMutfak(c.id);reset();}} style={{borderRadius:9,padding:"8px 5px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:18}}>{TATLI_CE[c.id]||"🍰"}</span>
                <span style={{fontSize:10,color:on?C.cream:"var(--muted)"}}>{c.l}</span>
              </button>;})}
            </div>
          </div>;})}
          <SH label="Stil"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:5,marginBottom:18}}>
            {TATLI_STIL.map(function(s){var on=stil===s.id;return <button key={s.id} onClick={function(){setStil(s.id);reset();}} style={{borderRadius:10,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:18}}>{s.emoji}</div>
              <div style={{fontSize:11,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{s.label}</div>
              <div style={{fontSize:9,color:C.dim}}>{s.desc}</div>
            </button>;})}
          </div>
        </div>}
        {step===2&&<div>
          <SH label="Zorluk"/>
          <div style={{display:"flex",gap:6,marginBottom:18}}>
            {TATLI_ZORLUK.map(function(z){var on=zorluk===z.id;return <button key={z.id} onClick={function(){setZorluk(z.id);reset();}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?z.col:"var(--border)"),background:on?z.col+"14":"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:14}}>{z.emoji}</div><div style={{fontSize:11,color:on?z.col:C.muted}}>{z.label}</div><div style={{fontSize:9,color:C.dim}}>{z.desc}</div>
            </button>;})}
          </div>
          <SH label="Alerjen & Diyet"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5,marginBottom:18}}>
            {TATLI_ALERJEN.map(function(a){var on=!!alerjen[a.id];return <button key={a.id} onClick={function(){tMap(setAlerjen,a.id);reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:14}}>{a.emoji}</span><span style={{fontSize:11,flex:1}}>{a.label}</span>
              <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:on?C.gold:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:on?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
            </button>;})}
          </div>
          <SH label="Özel Ekstralar"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {TATLI_EKSTRA.map(function(e){var on=!!ekstra[e.id];return <button key={e.id} onClick={function(){tMap(setEkstra,e.id);reset();}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{e.emoji}</span>{e.label}
            </button>;})}
          </div>
          <SH label="Tatlı Dengesi"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:18}}>
            {TATLI_DENGE.map(function(d){var on=!!denge[d.id];return <button key={d.id} onClick={function(){setDenge(function(p){var n=Object.assign({},p);n[d.id]=!n[d.id];return n;});reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?d.br:"var(--border)"),background:on?d.bg:"var(--card)",color:on?d.col:C.muted,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:14}}>{d.emoji}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?d.col:C.cream}}>{d.label}</span>
              </div>
              <div style={{fontSize:9,color:on?d.col:C.dim,lineHeight:1.4}}>{d.desc}</div>
            </button>;})}
          </div>
          <SH label="Mevsim Önceliği"/>
          <button onClick={function(){setPazarOncelik(!pazarOncelik);reset();}} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(pazarOncelik?C.green+"66":"var(--border)"),background:pazarOncelik?"rgba(76,175,122,0.06)":"var(--card)",display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <span style={{fontSize:16}}>{pazarOncelik?"🍓":"🌍"}</span>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontSize:12,color:C.cream,fontWeight:600}}>Mevsim Meyveleri</div>
              <div style={{fontSize:10,color:C.dim}}>{_mPd.tema?_mPd.tema+" — "+_mPd.urunler.slice(0,3).join(", "):"Mevsimsel meyvelere öncelik ver"}</div>
            </div>
            <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:pazarOncelik?C.green:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:pazarOncelik?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
          </button>
          <div style={{display:"flex",gap:12,marginBottom:18}}>
            <div style={{flex:1}}>
              <SH label="Kişi Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,4,6,8,10,12].map(function(n){var on=kisi===n;return <button key={n} onClick={function(){setKisi(n);reset();}} style={{width:34,height:34,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{n}</button>;})}
              </div>
            </div>
            <div style={{flex:1}}>
              <SH label="Tatlı Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[3,4,5,6,7,8,10].map(function(n){var on=kalem===n;return <button key={n} onClick={function(){setKalem(n);reset();}} style={{width:34,height:34,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{n}</button>;})}
              </div>
            </div>
          </div>
          <SH label="Gün Sayısı"/>
          <div style={{display:"flex",gap:5,marginBottom:18}}>
            {[1,2,3,5,7].map(function(n){var on=gunSayisi===n;return <button key={n} onClick={function(){setGunSayisi(n);reset();}} style={{flex:1,padding:"8px",borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400,textAlign:"center"}}>{n} gün</button>;})}
          </div>
        </div>}
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>{loadingDay?loadingDay+". gün hazırlanıyor…":"Tatlı menüsü hazırlanıyor…"}</span>:"🍰 "+gunSayisi+" Günlük Tatlı Menüsü Oluştur"}
        </GoldBtn>
        {loading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{menuAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }
  // ── STEP 3: Results ──
  var cDay=days&&days[activeDay];
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Tatlı Programı" title={cDay&&cDay.menu_adi||"Tatlı Menüsü"} desc={cDay&&cDay.aciklama||""} col={C.pink}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={function(){setStep(1);setDays(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.pink,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Menü</button>
        <button onClick={generateAlisveris} disabled={alisverisLoading} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>{alisverisLoading?<Spinner size={12}/>:"🛒"} Malzeme Listesi</button>
      </div>
      {gunSayisi>1&&<div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {days&&days.map(function(d,i){var on=activeDay===i;return <button key={i} onClick={function(){setActiveDay(i);setOpenIdx(null);}} style={{flexShrink:0,padding:"7px 14px",borderRadius:50,border:"1.5px solid "+(on?C.pink:"var(--border)"),background:on?C.pink+"14":"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{d.menu_adi||i+1+". Gün"}</button>;})}
      </div>}
      {cDay&&<div className="up">
        <div style={{textAlign:"center",marginBottom:8,fontSize:10,color:C.pink,opacity:0.7}}>👆 Tarif detayı için kartlara tıklayın</div>
        {(cDay.dishes||[]).map(function(d,i){var open=openIdx===i;var col=C.pink;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:24}}>{d.emoji||"🍰"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{d.isim}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>{d.aciklama}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                {d.kalori&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(236,72,153,0.1)",color:C.pink}}>🔥 {d.kalori}</span>}
                {d.sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {d.sure}</span>}
                {d.zorluk&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{d.zorluk}</span>}
                {d.mensei&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>{d.mensei}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Tarif</span>}
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            <div style={{marginTop:10,marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Malzemeler ({kisi} kişilik)</div>
              {(d.malzemeler||[]).map(function(m,j){return typeof m==="object"?<div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{color:col,fontSize:8}}>◆</span><span style={{color:col,minWidth:48,fontSize:12}}>{m.miktar}</span><span style={{color:C.muted,fontSize:12,flex:1}}>{m.isim}</span></div>:<span key={j} style={{fontSize:11,padding:"4px 9px",borderRadius:50,background:col+"0A",border:"1px solid "+col+"18",color:C.muted,display:"inline-block",marginBottom:3,marginRight:3}}>{m}</span>;})}
            </div>
            {(d.hazirlanis||[]).length>0&&<div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Hazırlanış</div>
              {(d.hazirlanis||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
            </div>}
            {d.sef_notu&&<div style={{padding:"8px 11px",background:col+"0A",borderRadius:8,border:"1px solid "+col+"18",fontSize:12,color:col,fontStyle:"italic",marginBottom:8}}>👨‍🍳 {d.sef_notu}</div>}
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button onClick={function(){if(props&&props.onToggleFav)props.onToggleFav(d);}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>🤍 Favorile</button>
              <button onClick={function(){var malzText=Array.isArray(d.malzemeler)?(d.malzemeler.map(function(m){return typeof m==="object"?m.miktar+" "+m.isim:m;})).join(", "):"";var hazText=(d.hazirlanis||[]).join("\n");if(navigator.share){navigator.share({title:d.isim,text:d.isim+"\n"+malzText+"\n"+hazText});}else{navigator.clipboard.writeText(d.isim+"\n"+malzText+"\n"+hazText);}}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤 Paylaş</button>
            </div>
            <DishActionButtons dish={d} col={C.pink} dishType="tatlı"/>
          </div>}
        </div>;})}
      </div>}
      {showShop&&alisverisListesi.length>0&&<div style={{marginTop:14,background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:C.cream}}>🛒 Tatlı Malzeme Listesi</div>
          <button onClick={function(){setShowShop(false);}} style={{background:"none",border:"none",color:C.muted,fontSize:16}}>✕</button>
        </div>
        {alisverisListesi.map(function(kat,ki){return <div key={ki} style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:5}}>{kat.kategori}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {(kat.malzemeler||[]).map(function(m,mi){return <span key={mi} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"var(--card2)",color:C.muted,border:"1px solid var(--border)"}}>{m}</span>;})}
          </div>
        </div>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: EKMEK HAZIRLAMA MENÜSÜ
// ══════════════════════════════════════════════════════════════
function EkmekTab(props){
  var [selKat,setSelKat]=useState({});
  var [selMutfak,setSelMutfak]=useState([]);
  var [maya,setMaya]=useState("kuru_maya");
  var [selUn,setSelUn]=useState({});
  var [stil,setStil]=useState("ev_e");
  var [zorluk,setZorluk]=useState("kolay_e");
  var [alerjen,setAlerjen]=useState({});
  var [ekstra,setEkstra]=useState({});
  var [denge,setDenge]=useState({});
  var [kisi,setKisi]=useState(4);
  var [kalem,setKalem]=useState(3);
  var [gunSayisi,setGunSayisi]=useState(1);
  var [pazarOncelik,setPazarOncelik]=useState(true);
  var [step,setStep]=useState(1);
  var [days,setDays]=useState(null);
  var [loading,setLoading]=useState(false);
  var [loadingDay,setLoadingDay]=useState(null);
  var [menuAdimlar,setMenuAdimlar]=useState([]);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var [activeDay,setActiveDay]=useState(0);
  var [alisverisListesi,setAlisverisListesi]=useState([]);
  var [alisverisLoading,setAlisverisLoading]=useState(false);
  var [showShop,setShowShop]=useState(false);
  var cache=useRef({});
  useEffect(function(){
    stGet("ekmek_last_settings").then(function(s){
      if(!s||typeof s!=="object")return;
      if(s.selKat&&typeof s.selKat==="object")setSelKat(s.selKat);
      if(s.selMutfak&&Array.isArray(s.selMutfak))setSelMutfak(s.selMutfak);
      if(s.maya)setMaya(s.maya);
      if(s.selUn&&typeof s.selUn==="object")setSelUn(s.selUn);
      if(s.stil)setStil(s.stil);
      if(s.zorluk)setZorluk(s.zorluk);
      if(s.alerjen&&typeof s.alerjen==="object")setAlerjen(s.alerjen);
      if(s.ekstra&&typeof s.ekstra==="object")setEkstra(s.ekstra);
      if(s.denge&&typeof s.denge==="object")setDenge(s.denge);
      if(s.kisi)setKisi(s.kisi);
      if(s.kalem)setKalem(s.kalem);
      if(s.gunSayisi&&s.gunSayisi>=1&&s.gunSayisi<=10)setGunSayisi(s.gunSayisi);
      if(s.pazarOncelik!==undefined)setPazarOncelik(!!s.pazarOncelik);
    });
  },[]);
  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function toggleMutfak(id){setSelMutfak(function(p){return p.indexOf(id)>-1?p.filter(function(x){return x!==id;}):p.concat([id]);});}
  function reset(){setDays(null);setOpenIdx(null);}
  var _mAy=new Date().getMonth()+1,_mPd=PAZAR_AY[_mAy]||{tema:"",urunler:[]};
  var hKey=JSON.stringify({selKat,selMutfak,maya,selUn,stil,zorluk,alerjen,ekstra,denge,kisi,kalem,gunSayisi,pazarOncelik});
  useEffect(function(){
    stGet("ekmek:"+hKey).then(function(cached){
      if(cached&&!days){setDays(cached);setStep(3);setActiveDay(0);}
    });
  },[hKey]);
  function buildPrompt(gNo,exN){
    var katArr=Object.keys(selKat).filter(function(k){return selKat[k];});
    var katLabels=katArr.map(function(k){var f=EKMEK_KAT.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var mutfakLabels=selMutfak.map(function(k){var found=null;EKMEK_MUTFAK.forEach(function(g){g.items.forEach(function(it){if(it.id===k)found=it.l;});});return found||k;}).join(", ");
    var mayaLbl=(EKMEK_MAYA.find(function(x){return x.id===maya;})||{}).label||"Kuru Maya";
    var unArr=Object.keys(selUn).filter(function(k){return selUn[k];});
    var unLabels=unArr.map(function(k){var f=EKMEK_UN.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var stilLbl=(EKMEK_STIL.find(function(x){return x.id===stil;})||{}).label||"Ev";
    var zorLbl=(EKMEK_ZORLUK.find(function(x){return x.id===zorluk;})||{}).label||"Kolay";
    var alerjenArr=Object.keys(alerjen).filter(function(k){return alerjen[k];});
    var alerjenLabels=alerjenArr.map(function(k){var f=EKMEK_ALERJEN.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var ekstraArr=Object.keys(ekstra).filter(function(k){return ekstra[k];});
    var ekstraLabels=ekstraArr.map(function(k){var f=EKMEK_EKSTRA.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var dengeArr=Object.keys(denge).filter(function(k){return denge[k];});
    var dengeLabels=dengeArr.map(function(k){var d=EKMEK_DENGE.find(function(x){return x.id===k;});return d?d.desc:"";}).filter(Boolean).join(". ");
    var pazarStr=pazarOncelik&&_mPd.urunler&&_mPd.urunler.length?"\nMevsimsel ürünleri kullan: "+_mPd.urunler.join(", ")+".":"";
    return "Sen dünyaca ünlü ekmek ustası ve fırıncısın. Gün "+gNo+"/"+gunSayisi+" için tam "+kalem+" adet ekmek tarifi oluştur.\n"+
      (katLabels?"Ekmek Türleri: "+katLabels+"\n":"")+
      (mutfakLabels?"Mutfak: "+mutfakLabels+"\n":"Mutfak: Türk\n")+
      "Maya: "+mayaLbl+"\n"+
      (unLabels?"Un Tercihi: "+unLabels+"\n":"")+
      "Stil: "+stilLbl+" | Zorluk: "+zorLbl+" | Porsiyon: "+kisi+" kişilik\n"+
      (alerjenLabels?"Alerjen: "+alerjenLabels+"\n":"")+
      (ekstraLabels?"Katkı: "+ekstraLabels+"\n":"")+
      (dengeLabels?"Denge: "+dengeLabels+"\n":"")+
      (exN.length?"\nBu ekmekleri TEKRARLAMA: "+exN.join(", ")+"\n":"")+
      pazarStr+
      "\nHer tarif için yoğurma, mayalama ve pişirme sürelerini ayrı belirt. Adım adım hazırlanış talimatları yaz. Malzeme miktarlarını kesin belirt."+
      "\nContinue JSON:\n\"menu_adi\":\"ekmek menü adı\",\"aciklama\":\"kısa açıklama\","+
      "\"ekmekler\":[{\"isim\":\"ekmek adı\",\"emoji\":\"1 emoji\",\"aciklama\":\"1 cümle\","+
      "\"malzemeler\":[{\"isim\":\"malzeme\",\"miktar\":\"miktar\"}],"+
      "\"hazirlanis\":[\"1. adım\",\"2. adım\",\"3. adım\"],"+
      "\"yogurma\":\"X dk\",\"mayalama\":\"X dk\",\"pisirme\":\"X dk\",\"toplam_sure\":\"X dk\","+
      "\"zorluk\":\"Kolay/Orta/Zor\",\"kalori\":\"XXX kcal/dilim\","+
      "\"porsiyon\":\"X kişilik\",\"mensei\":\"ülke\",\"ogun\":\"ekmek\",\"sef_notu\":\"1 cümle ipucu\""+
      "}]}\nHepsi Türkçe, tekrarsız, yaratıcı.";
  }
  async function generate(){
    setLoading(true);setError(null);setDays(null);setOpenIdx(null);setActiveDay(0);
    await stSet("ekmek_last_settings",{selKat,selMutfak,maya,selUn,stil,zorluk,alerjen,ekstra,denge,kisi,kalem,gunSayisi,pazarOncelik});
    if(cache.current[hKey]){setDays(cache.current[hKey]);setStep(3);setLoading(false);return;}
    var allSteps=[];
    for(var gi=1;gi<=gunSayisi;gi++)allSteps.push({label:gi+". gün ekmek menüsü",durum:"bekliyor"});
    allSteps.push({label:"Menü kaydediliyor",durum:"bekliyor"});
    setMenuAdimlar(allSteps);
    try{
      var aD=[],aN=[];
      var tok=kalem<=3?700:kalem<=5?1000:1400;
      for(var g=1;g<=gunSayisi;g++){
        setLoadingDay(g);
        setMenuAdimlar(function(p){var n=p.slice();if(n[g-1])n[g-1]=Object.assign({},n[g-1],{durum:"aktif"});return n;});
        var r=await callAI(buildPrompt(g,aN),tok);
        if(!r||!Array.isArray(r.ekmekler)||r.ekmekler.length===0)throw new Error(g+". gün başarısız.");
        r.ekmekler.forEach(function(d){aN.push(d.isim);});
        aD.push({gunNo:g,menu_adi:r.menu_adi,aciklama:r.aciklama,dishes:r.ekmekler});
        setMenuAdimlar(function(p){var n=p.slice();if(n[g-1])n[g-1]=Object.assign({},n[g-1],{durum:"tamam"});return n;});
      }
      cache.current[hKey]=aD;await stSet("ekmek:"+hKey,aD);
      setMenuAdimlar(function(p){var n=p.slice();var li=n.length-1;if(n[li])n[li]=Object.assign({},n[li],{durum:"tamam"});return n;});
      setDays(aD);setStep(3);setActiveDay(0);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  }
  async function generateAlisveris(){
    if(!days||days.length===0)return;setAlisverisLoading(true);
    try{
      var tum=days.flatMap(function(d){return (d.dishes||[]).map(function(x){return x.isim;});});
      var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe ekmek malzeme listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu ekmekler için alışveriş listesi: "+tum.join(", ")+".\nJSON: {\"kategoriler\":[{\"kategori\":\"Un & Tahıl\",\"malzemeler\":[]},{\"kategori\":\"Maya & Kabartıcı\",\"malzemeler\":[]},{\"kategori\":\"Süt & Yağ\",\"malzemeler\":[]},{\"kategori\":\"Tohum & Kuruyemiş\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Aroma\",\"malzemeler\":[]},{\"kategori\":\"Peynir & Zeytin\",\"malzemeler\":[]},{\"kategori\":\"Diğer\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
      var body=await res.json();var raw="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var parsed=parseJSON(raw);setAlisverisListesi(parsed&&parsed.kategoriler?parsed.kategoriler:[]);setShowShop(true);
    }catch(e){setError(e.message);}finally{setAlisverisLoading(false);}
  }
  // ── STEP 1 & 2 ──
  if(step===1||step===2){
    return <div style={{paddingBottom:78}}>
      {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
      <TabHeader sub="Fırından Sofraya" title="Ekmek Atölyesi" desc="Dünya mutfaklarından ekmek tarifleri" col={C.orange}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:0,marginBottom:16,background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
          {[1,2].map(function(s){var on=step===s;return <button key={s} onClick={function(){setStep(s);}} style={{flex:1,padding:"10px",background:on?"var(--accent)":"transparent",color:on?"var(--bg)":"var(--muted)",fontSize:12,fontWeight:on?700:400,border:"none",letterSpacing:"0.05em"}}>{s===1?"Ekmek Türü & Mutfak":"Detay Ayarlar"}</button>;})}
        </div>
        {step===1&&<div>
          <SH label="Ekmek Türü" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {EKMEK_KAT.map(function(g){var on=!!selKat[g.id];return <button key={g.id} onClick={function(){tMap(setSelKat,g.id);reset();}} style={{borderRadius:12,padding:"10px 10px",border:"2px solid "+(on?g.col:"var(--border)"),background:on?g.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
              {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:g.col}}>✓</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{g.emoji}</span>
                <span style={{fontSize:11,fontWeight:on?700:500,color:on?C.cream:"var(--muted)"}}>{g.label}</span>
              </div>
            </button>;})}
          </div>
          <SH label="Mutfak" sub="Boş = Türk mutfağı"/>
          {EKMEK_MUTFAK.map(function(gr){return <div key={gr.group} style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"var(--muted)",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>{gr.group}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
              {gr.items.map(function(c){var on=selMutfak.indexOf(c.id)>-1;return <button key={c.id} onClick={function(){toggleMutfak(c.id);reset();}} style={{borderRadius:9,padding:"8px 5px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:18}}>{EKMEK_CE[c.id]||"🍞"}</span>
                <span style={{fontSize:10,color:on?C.cream:"var(--muted)"}}>{c.l}</span>
              </button>;})}
            </div>
          </div>;})}
          <SH label="Maya Türü"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:5,marginBottom:18}}>
            {EKMEK_MAYA.map(function(m){var on=maya===m.id;return <button key={m.id} onClick={function(){setMaya(m.id);reset();}} style={{borderRadius:10,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:18}}>{m.emoji}</div>
              <div style={{fontSize:11,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{m.label}</div>
              <div style={{fontSize:9,color:C.dim}}>{m.desc}</div>
            </button>;})}
          </div>
          <SH label="Stil"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:5,marginBottom:18}}>
            {EKMEK_STIL.map(function(s){var on=stil===s.id;return <button key={s.id} onClick={function(){setStil(s.id);reset();}} style={{borderRadius:10,padding:"10px 6px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:18}}>{s.emoji}</div>
              <div style={{fontSize:11,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{s.label}</div>
              <div style={{fontSize:9,color:C.dim}}>{s.desc}</div>
            </button>;})}
          </div>
        </div>}
        {step===2&&<div>
          <SH label="Un Tercihi" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:18}}>
            {EKMEK_UN.map(function(u){var on=!!selUn[u.id];return <button key={u.id} onClick={function(){tMap(setSelUn,u.id);reset();}} style={{padding:"8px 6px",borderRadius:10,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:16}}>{u.emoji}</div>
              <div style={{fontSize:10,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{u.label}</div>
            </button>;})}
          </div>
          <SH label="Zorluk"/>
          <div style={{display:"flex",gap:6,marginBottom:18}}>
            {EKMEK_ZORLUK.map(function(z){var on=zorluk===z.id;return <button key={z.id} onClick={function(){setZorluk(z.id);reset();}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?z.col:"var(--border)"),background:on?z.col+"14":"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:14}}>{z.emoji}</div><div style={{fontSize:11,color:on?z.col:C.muted}}>{z.label}</div><div style={{fontSize:9,color:C.dim}}>{z.desc}</div>
            </button>;})}
          </div>
          <SH label="Alerjen & Diyet"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:5,marginBottom:18}}>
            {EKMEK_ALERJEN.map(function(a){var on=!!alerjen[a.id];return <button key={a.id} onClick={function(){tMap(setAlerjen,a.id);reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:14}}>{a.emoji}</span><span style={{fontSize:11,flex:1}}>{a.label}</span>
              <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:on?C.gold:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:on?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
            </button>;})}
          </div>
          <SH label="Katkı Malzemeleri"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {EKMEK_EKSTRA.map(function(e){var on=!!ekstra[e.id];return <button key={e.id} onClick={function(){tMap(setEkstra,e.id);reset();}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{e.emoji}</span>{e.label}
            </button>;})}
          </div>
          <SH label="Ekmek Dengesi"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:18}}>
            {EKMEK_DENGE.map(function(d){var on=!!denge[d.id];return <button key={d.id} onClick={function(){setDenge(function(p){var n=Object.assign({},p);n[d.id]=!n[d.id];return n;});reset();}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?d.br:"var(--border)"),background:on?d.bg:"var(--card)",color:on?d.col:C.muted,textAlign:"left"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                <span style={{fontSize:14}}>{d.emoji}</span>
                <span style={{fontSize:11,fontWeight:700,color:on?d.col:C.cream}}>{d.label}</span>
              </div>
              <div style={{fontSize:9,color:on?d.col:C.dim,lineHeight:1.4}}>{d.desc}</div>
            </button>;})}
          </div>
          <SH label="Mevsim Önceliği"/>
          <button onClick={function(){setPazarOncelik(!pazarOncelik);reset();}} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid "+(pazarOncelik?C.green+"66":"var(--border)"),background:pazarOncelik?"rgba(76,175,122,0.06)":"var(--card)",display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <span style={{fontSize:16}}>{pazarOncelik?"🌾":"🌍"}</span>
            <div style={{flex:1,textAlign:"left"}}>
              <div style={{fontSize:12,color:C.cream,fontWeight:600}}>Mevsim Ürünleri</div>
              <div style={{fontSize:10,color:C.dim}}>{_mPd.tema?_mPd.tema+" — mevsimsel malzemelere öncelik":"Mevsimsel malzemelere öncelik ver"}</div>
            </div>
            <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:pazarOncelik?C.green:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:pazarOncelik?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
          </button>
          <div style={{display:"flex",gap:12,marginBottom:18}}>
            <div style={{flex:1}}>
              <SH label="Kişi Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,4,6,8,10,12].map(function(n){var on=kisi===n;return <button key={n} onClick={function(){setKisi(n);reset();}} style={{width:34,height:34,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{n}</button>;})}
              </div>
            </div>
            <div style={{flex:1}}>
              <SH label="Ekmek Sayısı"/>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                {[1,2,3,4,5,6].map(function(n){var on=kalem===n;return <button key={n} onClick={function(){setKalem(n);reset();}} style={{width:34,height:34,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{n}</button>;})}
              </div>
            </div>
          </div>
          <SH label="Gün Sayısı"/>
          <div style={{display:"flex",gap:5,marginBottom:18}}>
            {[1,2,3,5,7].map(function(n){var on=gunSayisi===n;return <button key={n} onClick={function(){setGunSayisi(n);reset();}} style={{flex:1,padding:"8px",borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400,textAlign:"center"}}>{n} gün</button>;})}
          </div>
        </div>}
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>{loadingDay?loadingDay+". gün hazırlanıyor…":"Ekmek menüsü hazırlanıyor…"}</span>:"🍞 "+gunSayisi+" Günlük Ekmek Menüsü Oluştur"}
        </GoldBtn>
        {loading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{menuAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }
  // ── STEP 3: Results ──
  var cDay=days&&days[activeDay];
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Fırın Programı" title={cDay&&cDay.menu_adi||"Ekmek Menüsü"} desc={cDay&&cDay.aciklama||""} col={C.orange}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={function(){setStep(1);setDays(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.orange,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Menü</button>
        <button onClick={generateAlisveris} disabled={alisverisLoading} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>{alisverisLoading?<Spinner size={12}/>:"🛒"} Malzeme Listesi</button>
      </div>
      {gunSayisi>1&&<div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:4}}>
        {days&&days.map(function(d,i){var on=activeDay===i;return <button key={i} onClick={function(){setActiveDay(i);setOpenIdx(null);}} style={{flexShrink:0,padding:"7px 14px",borderRadius:50,border:"1.5px solid "+(on?C.orange:"var(--border)"),background:on?C.orange+"14":"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{d.menu_adi||i+1+". Gün"}</button>;})}
      </div>}
      {cDay&&<div className="up">
        <div style={{textAlign:"center",marginBottom:8,fontSize:10,color:C.orange,opacity:0.7}}>👆 Tarif detayı için kartlara tıklayın</div>
        {(cDay.dishes||[]).map(function(d,i){var open=openIdx===i;var col=C.orange;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:24}}>{d.emoji||"🍞"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{d.isim}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>{d.aciklama}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                {d.kalori&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(234,154,60,0.1)",color:C.orange}}>🔥 {d.kalori}</span>}
                {d.toplam_sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {d.toplam_sure}</span>}
                {d.zorluk&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{d.zorluk}</span>}
                {d.mensei&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>{d.mensei}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Tarif</span>}
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            <div style={{marginTop:10,marginBottom:4}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Süreler</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                {d.yogurma&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"rgba(234,154,60,0.08)",border:"1px solid rgba(234,154,60,0.2)",color:C.muted}}>🤲 Yoğurma: {d.yogurma}</span>}
                {d.mayalama&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"rgba(155,127,212,0.08)",border:"1px solid rgba(155,127,212,0.2)",color:C.muted}}>⏳ Mayalama: {d.mayalama}</span>}
                {d.pisirme&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"rgba(224,82,82,0.08)",border:"1px solid rgba(224,82,82,0.2)",color:C.muted}}>🔥 Pişirme: {d.pisirme}</span>}
              </div>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Malzemeler ({kisi} kişilik)</div>
              {(d.malzemeler||[]).map(function(m,j){return typeof m==="object"?<div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{color:col,fontSize:8}}>◆</span><span style={{color:col,minWidth:48,fontSize:12}}>{m.miktar}</span><span style={{color:C.muted,fontSize:12,flex:1}}>{m.isim}</span></div>:<span key={j} style={{fontSize:11,padding:"4px 9px",borderRadius:50,background:col+"0A",border:"1px solid "+col+"18",color:C.muted,display:"inline-block",marginBottom:3,marginRight:3}}>{m}</span>;})}
            </div>
            {(d.hazirlanis||[]).length>0&&<div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Hazırlanış</div>
              {(d.hazirlanis||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
            </div>}
            {d.sef_notu&&<div style={{padding:"8px 11px",background:col+"0A",borderRadius:8,border:"1px solid "+col+"18",fontSize:12,color:col,fontStyle:"italic",marginBottom:8}}>👨‍🍳 {d.sef_notu}</div>}
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button onClick={function(){if(props&&props.onToggleFav)props.onToggleFav(d);}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>🤍 Favorile</button>
              <button onClick={function(){var malzText=Array.isArray(d.malzemeler)?(d.malzemeler.map(function(m){return typeof m==="object"?m.miktar+" "+m.isim:m;})).join(", "):"";var hazText=(d.hazirlanis||[]).join("\n");if(navigator.share){navigator.share({title:d.isim,text:d.isim+"\n"+malzText+"\n"+hazText});}else{navigator.clipboard.writeText(d.isim+"\n"+malzText+"\n"+hazText);}}} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤 Paylaş</button>
            </div>
            <DishActionButtons dish={d} col={C.orange} dishType="ekmek"/>
          </div>}
        </div>;})}
      </div>}
      {showShop&&alisverisListesi.length>0&&<div style={{marginTop:14,background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:C.cream}}>🛒 Ekmek Malzeme Listesi</div>
          <button onClick={function(){setShowShop(false);}} style={{background:"none",border:"none",color:C.muted,fontSize:16}}>✕</button>
        </div>
        {alisverisListesi.map(function(kat,ki){return <div key={ki} style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:5}}>{kat.kategori}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {(kat.malzemeler||[]).map(function(m,mi){return <span key={mi} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"var(--card2)",color:C.muted,border:"1px solid var(--border)"}}>{m}</span>;})}
          </div>
        </div>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: ŞEF DÜNYASI — ÜNLÜ ŞEFLER & MİCHELİN
// ══════════════════════════════════════════════════════════════
function SefDunyasiTab(props){
  var [mode,setMode]=useState("sefler");
  // ── Şefler modu state ──
  var [selSef,setSelSef]=useState({});
  var [selMutfakTur,setSelMutfakTur]=useState({});
  var [sefZorluk,setSefZorluk]=useState("hepsi");
  var [sefAdet,setSefAdet]=useState(3);
  var [sefStep,setSefStep]=useState(1);
  var [sefDays,setSefDays]=useState(null);
  var [sefLoading,setSefLoading]=useState(false);
  var [sefError,setSefError]=useState(null);
  var [sefOpenIdx,setSefOpenIdx]=useState(null);
  var [sefAdimlar,setSefAdimlar]=useState([]);
  var [sefAlisveris,setSefAlisveris]=useState([]);
  var [sefAlisverisLoading,setSefAlisverisLoading]=useState(false);
  var [sefShowShop,setSefShowShop]=useState(false);
  var [sefTarifIdx,setSefTarifIdx]=useState(null);
  var [sefTarifData,setSefTarifData]=useState({});
  var [sefTarifLoading,setSefTarifLoading]=useState(false);
  var sefCache=useRef({});
  // ── Michelin modu state ──
  var [selBolge,setSelBolge]=useState([]);
  var [selYildiz,setSelYildiz]=useState({});
  var [micMutfak,setMicMutfak]=useState({});
  var [micAdet,setMicAdet]=useState(3);
  var [micStep,setMicStep]=useState(1);
  var [micDays,setMicDays]=useState(null);
  var [micLoading,setMicLoading]=useState(false);
  var [micError,setMicError]=useState(null);
  var [micOpenIdx,setMicOpenIdx]=useState(null);
  var [micAdimlar,setMicAdimlar]=useState([]);
  var [evdeIdx,setEvdeIdx]=useState(null);
  var [evdeData,setEvdeData]=useState(null);
  var [evdeLoading,setEvdeLoading]=useState(false);
  var [micTarifIdx,setMicTarifIdx]=useState(null);
  var [micTarifData,setMicTarifData]=useState({});
  var [micTarifLoading,setMicTarifLoading]=useState(false);
  var micCache=useRef({});
  // ── Gurme modu state ──
  var [selGurme,setSelGurme]=useState({});
  var [gurmeAdet,setGurmeAdet]=useState(5);
  var [gurmeStep,setGurmeStep]=useState(1);
  var [gurmeDays,setGurmeDays]=useState(null);
  var [gurmeLoading,setGurmeLoading]=useState(false);
  var [gurmeError,setGurmeError]=useState(null);
  var [gurmeOpenIdx,setGurmeOpenIdx]=useState(null);
  var [gurmeAdimlar,setGurmeAdimlar]=useState([]);
  var [gurmeEvdeIdx,setGurmeEvdeIdx]=useState(null);
  var [gurmeEvdeData,setGurmeEvdeData]=useState(null);
  var [gurmeEvdeLoading,setGurmeEvdeLoading]=useState(false);
  var [gurmeTarifIdx,setGurmeTarifIdx]=useState(null);
  var [gurmeTarifData,setGurmeTarifData]=useState({});
  var [gurmeTarifLoading,setGurmeTarifLoading]=useState(false);
  var gurmeCache=useRef({});
  // ── Persist ──
  useEffect(function(){
    stGet("sefdunya_last").then(function(s){
      if(!s||typeof s!=="object")return;
      if(s.mode)setMode(s.mode);
      if(s.selSef&&typeof s.selSef==="object")setSelSef(s.selSef);
      if(s.selMutfakTur&&typeof s.selMutfakTur==="object")setSelMutfakTur(s.selMutfakTur);
      if(s.sefZorluk)setSefZorluk(s.sefZorluk);
      if(s.sefAdet)setSefAdet(s.sefAdet);
      if(s.selBolge&&Array.isArray(s.selBolge))setSelBolge(s.selBolge);
      if(s.selYildiz&&typeof s.selYildiz==="object")setSelYildiz(s.selYildiz);
      if(s.micMutfak&&typeof s.micMutfak==="object")setMicMutfak(s.micMutfak);
      if(s.micAdet)setMicAdet(s.micAdet);
      if(s.selGurme&&typeof s.selGurme==="object")setSelGurme(s.selGurme);
      if(s.gurmeAdet)setGurmeAdet(s.gurmeAdet);
    });
  },[]);
  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function toggleBolge(id){setSelBolge(function(p){return p.indexOf(id)>-1?p.filter(function(x){return x!==id;}):p.concat([id]);});}

  // ── Şef filtresi ──
  var filteredSefler=UNLU_SEFLER;
  var aktifMutfak=Object.keys(selMutfakTur).filter(function(k){return selMutfakTur[k];});
  if(aktifMutfak.length>0){
    filteredSefler=UNLU_SEFLER.filter(function(s){
      return aktifMutfak.some(function(m){
        var lbl=(SEF_MUTFAK_TUR.find(function(x){return x.id===m;})||{}).label||"";
        return s.uzmanlik.toLowerCase().indexOf(lbl.toLowerCase())>-1;
      });
    });
    if(filteredSefler.length===0)filteredSefler=UNLU_SEFLER;
  }

  // ── Şefler: build prompt ──
  var sefHKey=JSON.stringify({selSef,selMutfakTur,sefZorluk,sefAdet});
  useEffect(function(){
    stGet("sef:"+sefHKey).then(function(cached){
      if(cached&&!sefDays){setSefDays(cached);setSefStep(2);}
    });
  },[sefHKey]);
  function buildSefPrompt(){
    var secili=Object.keys(selSef).filter(function(k){return selSef[k];});
    var sefInfo=secili.map(function(id){var s=UNLU_SEFLER.find(function(x){return x.id===id;});return s?s.isim+" ("+s.ulke+", "+s.uzmanlik+")":"";}).filter(Boolean);
    var zorLbl=sefZorluk==="hepsi"?"Her zorluk seviyesi":sefZorluk==="kolay"?"Kolay (evde yapılabilir)":sefZorluk==="orta"?"Orta":sefZorluk==="usta"?"Usta işi (profesyonel)":"Her seviye";
    return "Sen dünyaca ünlü şeflerin mutfaklarını ve imza yemeklerini bilen bir gastronomi uzmanısın.\n"+
      "Şu şefler için toplam "+sefAdet+" adet İMZA TARİFİ oluştur: "+sefInfo.join(", ")+".\n"+
      "Her tarif, o şefin gerçek tarzını ve felsefesini yansıtsın.\n"+
      "Zorluk: "+zorLbl+"\n"+
      "Her tarif için:\n- Şefin bu yemeğe neden özel olduğunu 1-2 cümleyle anlat\n- Özel tekniklerini belirt\n- \"Şefin Sırrı\" olarak profesyonel bir ipucu ver\n"+
      "\nContinue JSON:\n\"baslik\":\"koleksiyon adı\",\"aciklama\":\"kısa açıklama\","+
      "\"tarifler\":[{\"isim\":\"yemek adı\",\"emoji\":\"1 emoji\",\"sef\":\"şef adı\","+
      "\"hikaye\":\"bu yemek neden özel, 1-2 cümle\","+
      "\"malzemeler\":[\"malzeme1\",\"malzeme2\",\"malzeme3\",\"malzeme4\",\"malzeme5\"],"+
      "\"teknik\":\"özel pişirme tekniği\",\"sefin_sirri\":\"profesyonel ipucu\","+
      "\"sure\":\"X dk\",\"zorluk\":\"Kolay/Orta/Zor\",\"kalori\":\"XXX kcal\","+
      "\"mensei\":\"ülke\"}]}\nHepsi Türkçe, tekrarsız, yaratıcı. Tam "+sefAdet+" tarif olmalı.";
  }
  async function generateSef(){
    var secili=Object.keys(selSef).filter(function(k){return selSef[k];});
    if(secili.length===0){setSefError("En az bir şef seçiniz.");return;}
    setSefLoading(true);setSefError(null);setSefDays(null);setSefOpenIdx(null);
    await stSet("sefdunya_last",{mode,selSef,selMutfakTur,sefZorluk,sefAdet,selBolge,selYildiz,micMutfak,micAdet,selGurme,gurmeAdet});
    if(sefCache.current[sefHKey]){setSefDays(sefCache.current[sefHKey]);setSefStep(2);setSefLoading(false);return;}
    setSefAdimlar([{label:"Şeflerin imza tarifleri araştırılıyor",durum:"aktif"},{label:"Tarifler hazırlanıyor",durum:"bekliyor"}]);
    try{
      var tok=sefAdet<=3?800:sefAdet<=5?1200:sefAdet<=7?1800:sefAdet<=10?2400:sefAdet<=15?3200:4000;
      var r=await callAI(buildSefPrompt(),tok);
      if(!r||!Array.isArray(r.tarifler)||r.tarifler.length===0)throw new Error("Tarif oluşturulamadı.");
      setSefAdimlar([{label:"Şeflerin imza tarifleri araştırılıyor",durum:"tamam"},{label:"Tarifler hazırlanıyor",durum:"tamam"}]);
      var result={baslik:r.baslik,aciklama:r.aciklama,dishes:r.tarifler};
      sefCache.current[sefHKey]=result;await stSet("sef:"+sefHKey,result);
      setSefDays(result);setSefStep(2);
    }catch(e){setSefError(e.message);}finally{setSefLoading(false);}
  }
  async function generateSefAlisveris(){
    if(!sefDays||!sefDays.dishes)return;setSefAlisverisLoading(true);
    try{
      var tum=sefDays.dishes.map(function(x){return x.isim+" ("+x.sef+")";});
      var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe yemek malzeme listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu şef tarifleri için alışveriş listesi: "+tum.join(", ")+".\nJSON: {\"kategoriler\":[{\"kategori\":\"Et & Balık\",\"malzemeler\":[]},{\"kategori\":\"Sebze & Meyve\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Sos\",\"malzemeler\":[]},{\"kategori\":\"Süt Ürünü\",\"malzemeler\":[]},{\"kategori\":\"Kuru Gıda\",\"malzemeler\":[]},{\"kategori\":\"Özel Malzeme\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
      var body=await res.json();var raw="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var parsed=parseJSON(raw);setSefAlisveris(parsed&&parsed.kategoriler?parsed.kategoriler:[]);setSefShowShop(true);
    }catch(e){setSefError(e.message);}finally{setSefAlisverisLoading(false);}
  }

  // ── Michelin: build prompt ──
  var micHKey=JSON.stringify({selBolge,selYildiz,micMutfak,micAdet});
  useEffect(function(){
    stGet("mic:"+micHKey).then(function(cached){
      if(cached&&!micDays){setMicDays(cached);setMicStep(2);}
    });
  },[micHKey]);
  function buildMicPrompt(){
    var bolgeLabels=selBolge.map(function(k){var found=null;MICHELIN_BOLGE.forEach(function(g){g.items.forEach(function(it){if(it.id===k)found=it.l;});});return found||k;}).join(", ");
    var yildizArr=Object.keys(selYildiz).filter(function(k){return selYildiz[k];});
    var yildizLabels=yildizArr.map(function(k){var y=MICHELIN_YILDIZ.find(function(x){return x.id===k;});return y?y.label:"";}).filter(Boolean).join(", ");
    var mutfakArr=Object.keys(micMutfak).filter(function(k){return micMutfak[k];});
    var mutfakLabels=mutfakArr.map(function(k){var f=SEF_MUTFAK_TUR.find(function(x){return x.id===k;});return f?f.label:"";}).filter(Boolean).join(", ");
    return "Sen Michelin rehberi uzmanısın. Dünya çapındaki Michelin yıldızlı restoranları ve imza yemeklerini biliyorsun.\n"+
      (bolgeLabels?"Bölge: "+bolgeLabels+"\n":"Tüm dünya\n")+
      (yildizLabels?"Yıldız: "+yildizLabels+"\n":"Tüm yıldız seviyeleri\n")+
      (mutfakLabels?"Mutfak Türü: "+mutfakLabels+"\n":"")+
      "Toplam "+micAdet+" adet Michelin yıldızlı restoran ve onların imza yemeklerini listele.\n"+
      "Türkiye'den de mutlaka restoran dahil et.\n"+
      "\nContinue JSON:\n\"baslik\":\"koleksiyon adı\",\"aciklama\":\"kısa açıklama\","+
      "\"restoranlar\":[{\"restoran\":\"restoran adı\",\"sef\":\"baş şef adı\",\"emoji\":\"1 emoji\","+
      "\"yildiz\":1,\"sehir\":\"şehir\",\"ulke\":\"ülke\",\"mutfak\":\"mutfak türü\","+
      "\"hikaye\":\"restoran hakkında 1-2 cümle\","+
      "\"imza_yemek\":{\"isim\":\"yemek adı\",\"aciklama\":\"1 cümle\","+
      "\"malzemeler\":[\"malzeme1\",\"malzeme2\",\"malzeme3\"],"+
      "\"teknik\":\"özel teknik\",\"fiyat_aralik\":\"$$-$$$$\"}}]}\n"+
      "Hepsi Türkçe, tekrarsız, yaratıcı. Tam "+micAdet+" restoran olmalı.";
  }
  async function generateMic(){
    setMicLoading(true);setMicError(null);setMicDays(null);setMicOpenIdx(null);setEvdeIdx(null);setEvdeData(null);
    await stSet("sefdunya_last",{mode,selSef,selMutfakTur,sefZorluk,sefAdet,selBolge,selYildiz,micMutfak,micAdet,selGurme,gurmeAdet});
    if(micCache.current[micHKey]){setMicDays(micCache.current[micHKey]);setMicStep(2);setMicLoading(false);return;}
    setMicAdimlar([{label:"Michelin rehberi taranıyor",durum:"aktif"},{label:"Restoranlar listeleniyor",durum:"bekliyor"}]);
    try{
      var tok=micAdet<=3?800:micAdet<=5?1200:micAdet<=7?1800:micAdet<=10?2400:micAdet<=15?3200:4000;
      var r=await callAI(buildMicPrompt(),tok);
      if(!r||!Array.isArray(r.restoranlar)||r.restoranlar.length===0)throw new Error("Restoran listesi oluşturulamadı.");
      setMicAdimlar([{label:"Michelin rehberi taranıyor",durum:"tamam"},{label:"Restoranlar listeleniyor",durum:"tamam"}]);
      var result={baslik:r.baslik,aciklama:r.aciklama,dishes:r.restoranlar};
      micCache.current[micHKey]=result;await stSet("mic:"+micHKey,result);
      setMicDays(result);setMicStep(2);
    }catch(e){setMicError(e.message);}finally{setMicLoading(false);}
  }
  async function evdeDene(restoran){
    setEvdeLoading(true);setEvdeData(null);
    try{
      var r=await callAI("Sen ev aşçısı için tarif uyarlayan bir şefsin.\n"+
        "Michelin yıldızlı \""+restoran.restoran+"\" restoranının \""+restoran.imza_yemek.isim+"\" yemeğini evde yapılabilir hale getir.\n"+
        "Orijinal tekniği basitleştir ama tadı koru.\n"+
        "Continue JSON:\n\"isim\":\"ev versiyonu adı\",\"orijinal\":\""+restoran.imza_yemek.isim+"\","+
        "\"malzemeler\":[{\"miktar\":\"ölçü\",\"isim\":\"malzeme\"}],"+
        "\"adimlar\":[\"adım1\",\"adım2\",\"adım3\"],"+
        "\"sure\":\"X dk\",\"zorluk\":\"Kolay/Orta\",\"ipucu\":\"profesyonel ipucu\","+
        "\"fark\":\"orijinalden farkı\"}\nTürkçe.",800);
      setEvdeData(r);
    }catch(e){setMicError(e.message);}finally{setEvdeLoading(false);}
  }

  // ── Gurme: build prompt ──
  var gurmeHKey=JSON.stringify({selGurme,gurmeAdet});
  useEffect(function(){
    stGet("gurme:"+gurmeHKey).then(function(cached){
      if(cached&&!gurmeDays){setGurmeDays(cached);setGurmeStep(2);}
    });
  },[gurmeHKey]);
  function buildGurmePrompt(){
    var secili=Object.keys(selGurme).filter(function(k){return selGurme[k];});
    var gurmeInfo=secili.map(function(id){var g=GURME_LIST.find(function(x){return x.id===id;});return g?g.isim+" ("+g.ulke+", "+g.uzmanlik+")":"";}).filter(Boolean);
    return "Sen dünyaca ünlü yemek eleştirmenlerini, gurmeleri ve onların favori restoranlarını çok iyi bilen bir gastronomi uzmanısın.\n"+
      "Şu gurmelerin favori restoranlarını ve o restoranların imza yemeklerini listele: "+gurmeInfo.join(", ")+".\n"+
      "Her gurme için en az 1-2 favori restoran belirt. Toplam "+gurmeAdet+" restoran olmalı.\n"+
      "Her restoran için: gurmenin neden sevdiğini, imza yemeklerini, şehir ve ülke bilgisini ver.\n"+
      "\nContinue JSON:\n\"baslik\":\"koleksiyon adı\",\"aciklama\":\"kısa açıklama\","+
      "\"restoranlar\":[{\"restoran\":\"restoran adı\",\"gurme\":\"gurme adı\",\"emoji\":\"1 emoji\","+
      "\"sehir\":\"şehir\",\"ulke\":\"ülke\",\"mutfak\":\"mutfak türü\","+
      "\"neden_sever\":\"gurmenin bu restoranı neden sevdiği, 1-2 cümle\","+
      "\"imza_yemekler\":[{\"isim\":\"yemek adı\",\"aciklama\":\"1 cümle\",\"fiyat\":\"yaklaşık fiyat\"}],"+
      "\"atmosfer\":\"mekan hakkında 1 cümle\",\"puan\":\"gurmenin verdiği puan veya yorum özeti\","+
      "\"fiyat_aralik\":\"$$-$$$$\",\"rezervasyon\":\"gerekli/önerilir/gerekmez\""+
      "}]}\nHepsi Türkçe, tekrarsız, yaratıcı. Tam "+gurmeAdet+" restoran olmalı.";
  }
  async function generateGurme(){
    var secili=Object.keys(selGurme).filter(function(k){return selGurme[k];});
    if(secili.length===0){setGurmeError("En az bir gurme seçiniz.");return;}
    setGurmeLoading(true);setGurmeError(null);setGurmeDays(null);setGurmeOpenIdx(null);setGurmeEvdeIdx(null);setGurmeEvdeData(null);
    await stSet("sefdunya_last",{mode,selSef,selMutfakTur,sefZorluk,sefAdet,selBolge,selYildiz,micMutfak,micAdet,selGurme,gurmeAdet});
    if(gurmeCache.current[gurmeHKey]){setGurmeDays(gurmeCache.current[gurmeHKey]);setGurmeStep(2);setGurmeLoading(false);return;}
    setGurmeAdimlar([{label:"Gurmelerin favori restoranları araştırılıyor",durum:"aktif"},{label:"Restoranlar listeleniyor",durum:"bekliyor"}]);
    try{
      var tok=gurmeAdet<=3?800:gurmeAdet<=5?1200:gurmeAdet<=7?1800:gurmeAdet<=10?2400:gurmeAdet<=15?3200:4000;
      var r=await callAI(buildGurmePrompt(),tok);
      if(!r||!Array.isArray(r.restoranlar)||r.restoranlar.length===0)throw new Error("Restoran listesi oluşturulamadı.");
      setGurmeAdimlar([{label:"Gurmelerin favori restoranları araştırılıyor",durum:"tamam"},{label:"Restoranlar listeleniyor",durum:"tamam"}]);
      var result={baslik:r.baslik,aciklama:r.aciklama,dishes:r.restoranlar};
      gurmeCache.current[gurmeHKey]=result;await stSet("gurme:"+gurmeHKey,result);
      setGurmeDays(result);setGurmeStep(2);
    }catch(e){setGurmeError(e.message);}finally{setGurmeLoading(false);}
  }
  async function gurmeEvdeDene(restoran){
    setGurmeEvdeLoading(true);setGurmeEvdeData(null);
    try{
      var yemekIsim=(restoran.imza_yemekler&&restoran.imza_yemekler[0])?restoran.imza_yemekler[0].isim:"imza yemeği";
      var r=await callAI("Sen ev aşçısı için tarif uyarlayan bir şefsin.\n"+
        "\""+restoran.restoran+"\" restoranının \""+yemekIsim+"\" yemeğini evde yapılabilir hale getir.\n"+
        "Orijinal tekniği basitleştir ama tadı koru.\n"+
        "Continue JSON:\n\"isim\":\"ev versiyonu adı\",\"orijinal\":\""+yemekIsim+"\","+
        "\"malzemeler\":[{\"miktar\":\"ölçü\",\"isim\":\"malzeme\"}],"+
        "\"adimlar\":[\"adım1\",\"adım2\",\"adım3\"],"+
        "\"sure\":\"X dk\",\"zorluk\":\"Kolay/Orta\",\"ipucu\":\"profesyonel ipucu\","+
        "\"fark\":\"orijinalden farkı\"}\nTürkçe.",800);
      setGurmeEvdeData(r);
    }catch(e){setGurmeError(e.message);}finally{setGurmeEvdeLoading(false);}
  }

  // ── Şef: Tarif Hazırla ──
  function sefTarifHazirla(dish,idx){
    if(sefTarifData[idx]){setSefTarifIdx(sefTarifIdx===idx?null:idx);return;}
    setSefTarifIdx(idx);setSefTarifLoading(true);
    callAI("Sen dünyaca ünlü şef "+dish.sef+"'in mutfağını bilen bir gastronomi uzmanısın.\n"+
      "\""+dish.isim+"\" yemeğinin tam tarifini adım adım hazırla.\n"+
      "Continue JSON:\n\"isim\":\""+dish.isim+"\",\"sef\":\""+dish.sef+"\","+
      "\"hazirlik_suresi\":\"X dk\",\"pisirme_suresi\":\"X dk\",\"toplam_sure\":\"X dk\","+
      "\"porsiyon\":\"X kişilik\",\"zorluk\":\"Kolay/Orta/Zor\","+
      "\"malzemeler\":[{\"miktar\":\"ölçü\",\"isim\":\"malzeme adı\"}],"+
      "\"hazirlanis\":[{\"adim\":1,\"baslik\":\"kısa başlık\",\"aciklama\":\"detaylı açıklama\"}],"+
      "\"sefin_ipuclari\":[\"ipucu1\",\"ipucu2\"],"+
      "\"servis\":\"servis önerisi\",\"kalori\":\"yaklaşık kalori\"}\nTürkçe, detaylı.",1500)
    .then(function(r){setSefTarifData(function(p){var n=Object.assign({},p);n[idx]=r;return n;});})
    .catch(function(e){setSefError(e.message);})
    .finally(function(){setSefTarifLoading(false);});
  }
  // ── Michelin: Tarif Hazırla ──
  function micTarifHazirla(restoran,idx){
    if(micTarifData[idx]){setMicTarifIdx(micTarifIdx===idx?null:idx);return;}
    setMicTarifIdx(idx);setMicTarifLoading(true);
    var yemekIsim=restoran.imza_yemek?restoran.imza_yemek.isim:"imza yemeği";
    callAI("Sen Michelin yıldızlı \""+restoran.restoran+"\" restoranının \""+yemekIsim+"\" yemeğini bilen bir gastronomi uzmanısın.\n"+
      "Bu yemeğin detaylı tarifini adım adım hazırla. Profesyonel düzeyde olsun.\n"+
      "Continue JSON:\n\"isim\":\""+yemekIsim+"\",\"restoran\":\""+restoran.restoran+"\",\"sef\":\""+restoran.sef+"\","+
      "\"hazirlik_suresi\":\"X dk\",\"pisirme_suresi\":\"X dk\",\"toplam_sure\":\"X dk\","+
      "\"porsiyon\":\"X kişilik\",\"zorluk\":\"Orta/Zor/Usta\","+
      "\"malzemeler\":[{\"miktar\":\"ölçü\",\"isim\":\"malzeme adı\"}],"+
      "\"hazirlanis\":[{\"adim\":1,\"baslik\":\"kısa başlık\",\"aciklama\":\"detaylı açıklama\"}],"+
      "\"sefin_ipuclari\":[\"ipucu1\",\"ipucu2\"],"+
      "\"plating\":\"sunum/tabak düzeni açıklaması\","+
      "\"servis\":\"servis önerisi\",\"kalori\":\"yaklaşık kalori\"}\nTürkçe, detaylı.",1500)
    .then(function(r){setMicTarifData(function(p){var n=Object.assign({},p);n[idx]=r;return n;});})
    .catch(function(e){setMicError(e.message);})
    .finally(function(){setMicTarifLoading(false);});
  }
  // ── Gurme: Tarif Hazırla ──
  function gurmeTarifHazirla(restoran,yemekIsim,idx){
    if(gurmeTarifData[idx]){setGurmeTarifIdx(gurmeTarifIdx===idx?null:idx);return;}
    setGurmeTarifIdx(idx);setGurmeTarifLoading(true);
    callAI("Sen \""+restoran.restoran+"\" restoranının \""+yemekIsim+"\" yemeğini bilen bir gastronomi uzmanısın.\n"+
      "Bu yemeğin detaylı tarifini adım adım hazırla.\n"+
      "Continue JSON:\n\"isim\":\""+yemekIsim+"\",\"restoran\":\""+restoran.restoran+"\","+
      "\"hazirlik_suresi\":\"X dk\",\"pisirme_suresi\":\"X dk\",\"toplam_sure\":\"X dk\","+
      "\"porsiyon\":\"X kişilik\",\"zorluk\":\"Kolay/Orta/Zor\","+
      "\"malzemeler\":[{\"miktar\":\"ölçü\",\"isim\":\"malzeme adı\"}],"+
      "\"hazirlanis\":[{\"adim\":1,\"baslik\":\"kısa başlık\",\"aciklama\":\"detaylı açıklama\"}],"+
      "\"sefin_ipuclari\":[\"ipucu1\",\"ipucu2\"],"+
      "\"servis\":\"servis önerisi\",\"kalori\":\"yaklaşık kalori\"}\nTürkçe, detaylı.",1500)
    .then(function(r){setGurmeTarifData(function(p){var n=Object.assign({},p);n[idx]=r;return n;});})
    .catch(function(e){setGurmeError(e.message);})
    .finally(function(){setGurmeTarifLoading(false);});
  }

  // ══ RENDER ══
  var accentCol=mode==="sefler"?C.gold:mode==="michelin"?C.red:C.purple;

  // ── Şefler: Step 1 ──
  if(mode==="sefler"&&sefStep===1){
    return <div style={{paddingBottom:78}}>
      {sefLoading&&<MenuYuklemeEkrani adimlar={sefAdimlar}/>}
      <TabHeader sub="Dünyaca Ünlü Şefler" title="Şef Dünyası" desc="Ünlü şeflerin imza tarifleri & Michelin restoranları" col={C.gold}/>
      <div style={{padding:"0 16px"}}>
        {/* Mode switch */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{id:"sefler",label:"👨‍🍳 Şefler",c:C.gold},{id:"michelin",label:"⭐ Michelin",c:C.red},{id:"gurme",label:"🍷 Gurme",c:C.purple}].map(function(m){var on=mode===m.id;return <button key={m.id} onClick={function(){setMode(m.id);}} style={{flex:1,padding:"10px 6px",background:on?m.c:"var(--card)",color:on?"#fff":"var(--muted)",fontSize:11,fontWeight:on?700:500,border:"2px solid "+(on?m.c:"var(--border)"),borderRadius:10,letterSpacing:"0.03em"}}>{m.label}</button>;})}
        </div>
        {/* Mutfak türü filtre */}
        <SH label="Ülke / Mutfak Filtresi" sub="Şefleri filtrele (isteğe bağlı)"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {SEF_MUTFAK_ULKE.map(function(m){var on=!!selMutfakTur[m.id];return <button key={m.id} onClick={function(){tMap(setSelMutfakTur,m.id);}} style={{padding:"6px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:13}}>{m.emoji}</span>{m.label}
          </button>;})}
        </div>
        <SH label="Uzmanlık Alanı" sub="Yemek çeşidi filtresi"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
          {SEF_MUTFAK_CESIT.map(function(m){var on=!!selMutfakTur[m.id];return <button key={m.id} onClick={function(){tMap(setSelMutfakTur,m.id);}} style={{padding:"6px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:13}}>{m.emoji}</span>{m.label}
          </button>;})}
        </div>
        {/* Şef seçimi */}
        <SH label="Şef Seçimi" sub={"Birden fazla seçebilirsiniz ("+filteredSefler.length+" şef)"}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
          {filteredSefler.map(function(s){var on=!!selSef[s.id];return <button key={s.id} onClick={function(){tMap(setSelSef,s.id);}} style={{borderRadius:12,padding:"10px",border:"2px solid "+(on?s.col:"var(--border)"),background:on?s.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
            {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:s.col}}>✓</span>}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:22}}>{s.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:on?700:600,color:on?C.cream:"var(--muted)",fontFamily:"'Playfair Display',serif"}}>{s.isim}</div>
                <div style={{fontSize:9,color:C.dim}}>{s.ulke}</div>
              </div>
            </div>
            <div style={{fontSize:9,color:on?s.col:C.dim,lineHeight:1.3}}>{s.uzmanlik}</div>
            {s.yildiz!=="—"&&<div style={{fontSize:8,color:C.gold,marginTop:2}}>⭐ {s.yildiz}</div>}
          </button>;})}
        </div>
        {/* Ayarlar */}
        <div style={{display:"flex",gap:12,marginBottom:18}}>
          <div style={{flex:1}}>
            <SH label="Tarif Sayısı"/>
            <div style={{display:"flex",gap:4}}>
              {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(function(n){var on=sefAdet===n;return <button key={n} onClick={function(){setSefAdet(n);}} style={{width:30,height:30,borderRadius:9,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{n}</button>;})}
            </div>
          </div>
          <div style={{flex:1}}>
            <SH label="Zorluk"/>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {[{id:"hepsi",l:"Hepsi"},{id:"kolay",l:"Kolay"},{id:"orta",l:"Orta"},{id:"usta",l:"Usta"}].map(function(z){var on=sefZorluk===z.id;return <button key={z.id} onClick={function(){setSefZorluk(z.id);}} style={{padding:"6px 10px",borderRadius:8,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{z.l}</button>;})}
            </div>
          </div>
        </div>
        <ErrBox msg={sefError}/>
        <GoldBtn onClick={generateSef} loading={sefLoading} disabled={sefLoading}>
          {sefLoading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Şeflerin tarifleri hazırlanıyor…</span>:"👨‍🍳 İmza Tarifleri Oluştur"}
        </GoldBtn>
        {sefLoading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{sefAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }

  // ── Şefler: Step 2 (Results) ──
  if(mode==="sefler"&&sefStep===2&&sefDays){
    return <div style={{paddingBottom:60}}>
      <TabHeader sub="Şef Koleksiyonu" title={sefDays.baslik||"İmza Tarifleri"} desc={sefDays.aciklama||""} col={C.gold}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <button onClick={function(){setSefStep(1);setSefDays(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Arama</button>
          <button onClick={generateSefAlisveris} disabled={sefAlisverisLoading} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>{sefAlisverisLoading?<Spinner size={12}/>:"🛒"} Malzeme Listesi</button>
        </div>
        <div style={{textAlign:"center",marginBottom:8,fontSize:10,color:C.gold,opacity:0.7}}>👆 Tarif detayı için kartlara tıklayın</div>
        {(sefDays.dishes||[]).map(function(d,i){var open=sefOpenIdx===i;var col=C.gold;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setSefOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:24}}>{d.emoji||"👨‍🍳"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{d.isim}</div>
              <div style={{fontSize:11,color:C.gold,fontWeight:600}}>{d.sef}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{d.hikaye}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
                {d.kalori&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(212,168,67,0.1)",color:C.gold}}>🔥 {d.kalori}</span>}
                {d.sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {d.sure}</span>}
                {d.zorluk&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{d.zorluk}</span>}
                {d.mensei&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>{d.mensei}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Tarif</span>}
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            {d.teknik&&<div style={{marginTop:10,marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Özel Teknik</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.5,padding:"8px 10px",background:col+"08",borderRadius:8,border:"1px solid "+col+"15"}}>{d.teknik}</div>
            </div>}
            {d.sefin_sirri&&<div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:"#F59E0B",textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Şefin Sırrı</div>
              <div style={{fontSize:11,color:"#F59E0B",lineHeight:1.5,padding:"8px 10px",background:"rgba(245,158,11,0.06)",borderRadius:8,border:"1px solid rgba(245,158,11,0.15)",fontStyle:"italic"}}>💡 {d.sefin_sirri}</div>
            </div>}
            <div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Malzemeler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {(d.malzemeler||[]).map(function(m,j){return <span key={j} style={{fontSize:11,padding:"4px 9px",borderRadius:50,background:col+"0A",border:"1px solid "+col+"18",color:C.muted}}>{m}</span>;})}
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button onClick={function(){sefTarifHazirla(d,i);}} disabled={sefTarifLoading&&sefTarifIdx===i} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+C.gold+"44",background:C.goldDim,color:C.gold,fontSize:11,fontWeight:600}}>
                {sefTarifLoading&&sefTarifIdx===i?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Spinner size={12}/>Hazırlanıyor…</span>:"📋 Tarif Hazırla"}
              </button>
              <button onClick={function(){if(props&&props.onToggleFav)props.onToggleFav(d);}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>🤍</button>
              <button onClick={function(){if(navigator.share){navigator.share({title:d.isim+" — "+d.sef,text:d.isim+"\nŞef: "+d.sef+"\n"+(d.malzemeler||[]).join(", ")});}else{navigator.clipboard.writeText(d.isim+"\nŞef: "+d.sef+"\n"+(d.malzemeler||[]).join(", "));}}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤</button>
            </div>
            {sefTarifIdx===i&&sefTarifData[i]&&<div style={{marginTop:10,background:C.goldDim,border:"1px solid "+C.gold+"30",borderRadius:10,padding:12}}>
              <div style={{fontSize:13,fontWeight:700,color:C.gold,marginBottom:8}}>📋 {sefTarifData[i].isim}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {sefTarifData[i].hazirlik_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔪 Hazırlık: {sefTarifData[i].hazirlik_suresi}</span>}
                {sefTarifData[i].pisirme_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>🔥 Pişirme: {sefTarifData[i].pisirme_suresi}</span>}
                {sefTarifData[i].porsiyon&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>👥 {sefTarifData[i].porsiyon}</span>}
                {sefTarifData[i].kalori&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>🔥 {sefTarifData[i].kalori}</span>}
              </div>
              <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Malzemeler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                {(sefTarifData[i].malzemeler||[]).map(function(m,j){return <span key={j} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:C.gold+"0A",border:"1px solid "+C.gold+"18",color:C.muted}}>{typeof m==="object"?m.miktar+" "+m.isim:m}</span>;})}
              </div>
              <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Hazırlanışı</div>
              {(sefTarifData[i].hazirlanis||[]).map(function(a,j){return <div key={j} style={{display:"flex",gap:8,marginBottom:8,padding:"8px 10px",background:"var(--card)",borderRadius:8,border:"1px solid var(--border)"}}>
                <span style={{fontSize:16,fontWeight:700,color:C.gold,flexShrink:0,width:24,textAlign:"center"}}>{a.adim||j+1}</span>
                <div style={{flex:1}}>
                  {a.baslik&&<div style={{fontSize:11,fontWeight:700,color:C.cream,marginBottom:2}}>{a.baslik}</div>}
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{a.aciklama}</div>
                </div>
              </div>;})}
              {sefTarifData[i].sefin_ipuclari&&sefTarifData[i].sefin_ipuclari.length>0&&<div style={{marginTop:6}}>
                <div style={{fontSize:9,color:"#F59E0B",textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Şefin İpuçları</div>
                {sefTarifData[i].sefin_ipuclari.map(function(tip,j){return <div key={j} style={{fontSize:10,color:"#F59E0B",lineHeight:1.5,marginBottom:3,fontStyle:"italic"}}>💡 {tip}</div>;})}
              </div>}
              {sefTarifData[i].servis&&<div style={{marginTop:6,fontSize:10,color:C.dim}}>🍽️ Servis: {sefTarifData[i].servis}</div>}
            </div>}
          </div>}
        </div>;})}
        {sefShowShop&&sefAlisveris.length>0&&<div style={{marginTop:14,background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:C.cream}}>🛒 Şef Tarifleri Malzeme Listesi</div>
            <button onClick={function(){setSefShowShop(false);}} style={{background:"none",border:"none",color:C.muted,fontSize:16}}>✕</button>
          </div>
          {sefAlisveris.map(function(kat,ki){return <div key={ki} style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:C.gold,marginBottom:5}}>{kat.kategori}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {(kat.malzemeler||[]).map(function(m,mi){return <span key={mi} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"var(--card2)",color:C.muted,border:"1px solid var(--border)"}}>{m}</span>;})}
            </div>
          </div>;})}
        </div>}
      </div>
    </div>;
  }

  // ── Michelin: Step 1 ──
  if(mode==="michelin"&&micStep===1){
    return <div style={{paddingBottom:78}}>
      {micLoading&&<MenuYuklemeEkrani adimlar={micAdimlar}/>}
      <TabHeader sub="Michelin Yıldızlı Restoranlar" title="Şef Dünyası" desc="Dünyanın en prestijli restoranları ve imza yemekleri" col={C.red}/>
      <div style={{padding:"0 16px"}}>
        {/* Mode switch */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{id:"sefler",label:"👨‍🍳 Şefler",c:C.gold},{id:"michelin",label:"⭐ Michelin",c:C.red},{id:"gurme",label:"🍷 Gurme",c:C.purple}].map(function(m){var on=mode===m.id;return <button key={m.id} onClick={function(){setMode(m.id);}} style={{flex:1,padding:"10px 6px",background:on?m.c:"var(--card)",color:on?"#fff":"var(--muted)",fontSize:11,fontWeight:on?700:500,border:"2px solid "+(on?m.c:"var(--border)"),borderRadius:10,letterSpacing:"0.03em"}}>{m.label}</button>;})}
        </div>
        {/* Bölge seçimi */}
        <SH label="Bölge" sub="Boş = Tüm dünya (Türkiye dahil)"/>
        {MICHELIN_BOLGE.map(function(gr){return <div key={gr.group} style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"var(--muted)",fontWeight:600,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.1em"}}>{gr.group}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
            {gr.items.map(function(c){var on=selBolge.indexOf(c.id)>-1;return <button key={c.id} onClick={function(){toggleBolge(c.id);}} style={{borderRadius:9,padding:"8px 5px",border:"1.5px solid "+(on?C.red:"var(--border)"),background:on?C.red+"14":"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:18}}>{MICHELIN_CE[c.id]||"🌍"}</span>
              <span style={{fontSize:10,color:on?C.cream:"var(--muted)"}}>{c.l}</span>
            </button>;})}
          </div>
        </div>;})}
        {/* Yıldız sayısı */}
        <SH label="Yıldız Sayısı" sub="Birden fazla seçebilirsiniz"/>
        <div style={{display:"flex",gap:6,marginBottom:18}}>
          {MICHELIN_YILDIZ.map(function(y){var on=!!selYildiz[y.id];return <button key={y.id} onClick={function(){tMap(setSelYildiz,y.id);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?y.col:"var(--border)"),background:on?y.col+"14":"var(--card)",textAlign:"center"}}>
            <div style={{fontSize:14}}>{y.emoji}</div>
            <div style={{fontSize:11,color:on?y.col:C.muted,fontWeight:on?700:400}}>{y.label}</div>
            <div style={{fontSize:9,color:C.dim}}>{y.desc}</div>
          </button>;})}
        </div>
        {/* Mutfak filtre */}
        <SH label="Ülke / Mutfak" sub="İsteğe bağlı filtre"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
          {SEF_MUTFAK_ULKE.map(function(m){var on=!!micMutfak[m.id];return <button key={m.id} onClick={function(){tMap(setMicMutfak,m.id);}} style={{padding:"6px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.red:"var(--border)"),background:on?C.red+"14":"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:13}}>{m.emoji}</span>{m.label}
          </button>;})}
        </div>
        <SH label="Uzmanlık Alanı" sub="Yemek çeşidi filtresi"/>
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:16}}>
          {SEF_MUTFAK_CESIT.map(function(m){var on=!!micMutfak[m.id];return <button key={m.id} onClick={function(){tMap(setMicMutfak,m.id);}} style={{padding:"6px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.red:"var(--border)"),background:on?C.red+"14":"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:13}}>{m.emoji}</span>{m.label}
          </button>;})}
        </div>
        {/* Adet */}
        <SH label="Restoran Sayısı"/>
        <div style={{display:"flex",gap:4,marginBottom:18}}>
          {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(function(n){var on=micAdet===n;return <button key={n} onClick={function(){setMicAdet(n);}} style={{width:30,height:30,borderRadius:9,border:"1.5px solid "+(on?C.red:"var(--border)"),background:on?C.red+"14":"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{n}</button>;})}
        </div>
        <ErrBox msg={micError}/>
        <GoldBtn onClick={generateMic} loading={micLoading} disabled={micLoading}>
          {micLoading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Michelin restoranları araştırılıyor…</span>:"⭐ Michelin Restoranlarını Keşfet"}
        </GoldBtn>
        {micLoading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{micAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }

  // ── Michelin: Step 2 (Results) ──
  if(mode==="michelin"&&micStep===2&&micDays){
    return <div style={{paddingBottom:60}}>
      <TabHeader sub="Michelin Rehberi" title={micDays.baslik||"Michelin Restoranları"} desc={micDays.aciklama||""} col={C.red}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <button onClick={function(){setMicStep(1);setMicDays(null);setEvdeIdx(null);setEvdeData(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.red,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Arama</button>
        </div>
        <div style={{textAlign:"center",marginBottom:8,fontSize:10,color:C.red,opacity:0.7}}>👆 Detay için kartlara tıklayın</div>
        {(micDays.dishes||[]).map(function(d,i){var open=micOpenIdx===i;var col=C.red;var yArr="⭐".repeat(d.yildiz||1);return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setMicOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:24}}>{d.emoji||"🍽️"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{d.restoran}</span>
                <span style={{fontSize:10,color:C.gold}}>{yArr}</span>
              </div>
              <div style={{fontSize:11,color:col,fontWeight:600}}>{d.sef}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:3}}>
                {d.sehir&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>📍 {d.sehir}, {d.ulke}</span>}
                {d.mutfak&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>{d.mutfak}</span>}
                {d.imza_yemek&&d.imza_yemek.fiyat_aralik&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(76,175,122,0.1)",color:C.green}}>{d.imza_yemek.fiyat_aralik}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Detay</span>}
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            {d.hikaye&&<div style={{fontSize:11,color:C.muted,lineHeight:1.5,marginTop:10,marginBottom:10,padding:"8px 10px",background:col+"08",borderRadius:8,fontStyle:"italic"}}>{d.hikaye}</div>}
            {d.imza_yemek&&<div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>İmza Yemek: {d.imza_yemek.isim}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:6}}>{d.imza_yemek.aciklama}</div>
              {d.imza_yemek.teknik&&<div style={{fontSize:10,color:C.dim,marginBottom:6}}>🔪 Teknik: {d.imza_yemek.teknik}</div>}
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {(d.imza_yemek.malzemeler||[]).map(function(m,j){return <span key={j} style={{fontSize:11,padding:"4px 9px",borderRadius:50,background:col+"0A",border:"1px solid "+col+"18",color:C.muted}}>{m}</span>;})}
              </div>
            </div>}
            <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
              <button onClick={function(){micTarifHazirla(d,i);}} disabled={micTarifLoading&&micTarifIdx===i} style={{flex:1,minWidth:"45%",padding:"8px",borderRadius:9,border:"1px solid "+C.red+"44",background:C.red+"08",color:C.red,fontSize:11,fontWeight:600}}>
                {micTarifLoading&&micTarifIdx===i?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Spinner size={12}/>Hazırlanıyor…</span>:"📋 Tarif Hazırla"}
              </button>
              <button onClick={function(){setEvdeIdx(i);evdeDene(d);}} disabled={evdeLoading&&evdeIdx===i} style={{flex:1,minWidth:"45%",padding:"8px",borderRadius:9,border:"1px solid "+C.green+"44",background:C.green+"08",color:C.green,fontSize:11,fontWeight:600}}>
                {evdeLoading&&evdeIdx===i?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Spinner size={12}/>Hazırlanıyor…</span>:"🏠 Evde Dene"}
              </button>
              <button onClick={function(){if(props&&props.onToggleFav)props.onToggleFav(d);}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>🤍</button>
              <button onClick={function(){if(navigator.share){navigator.share({title:d.restoran,text:d.restoran+" — "+d.sef+"\n"+yArr+"\n"+(d.imza_yemek?d.imza_yemek.isim:"")});}else{navigator.clipboard.writeText(d.restoran+" — "+d.sef+"\n"+(d.imza_yemek?d.imza_yemek.isim:""));}}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤</button>
            </div>
            {micTarifIdx===i&&micTarifData[i]&&<div style={{marginTop:10,background:C.red+"08",border:"1px solid "+C.red+"30",borderRadius:10,padding:12}}>
              <div style={{fontSize:13,fontWeight:700,color:C.red,marginBottom:8}}>📋 {micTarifData[i].isim}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                {micTarifData[i].hazirlik_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔪 Hazırlık: {micTarifData[i].hazirlik_suresi}</span>}
                {micTarifData[i].pisirme_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>🔥 Pişirme: {micTarifData[i].pisirme_suresi}</span>}
                {micTarifData[i].porsiyon&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>👥 {micTarifData[i].porsiyon}</span>}
                {micTarifData[i].kalori&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>🔥 {micTarifData[i].kalori}</span>}
              </div>
              <div style={{fontSize:9,color:C.red,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Malzemeler</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
                {(micTarifData[i].malzemeler||[]).map(function(m,j){return <span key={j} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:C.red+"0A",border:"1px solid "+C.red+"18",color:C.muted}}>{typeof m==="object"?m.miktar+" "+m.isim:m}</span>;})}
              </div>
              <div style={{fontSize:9,color:C.red,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>Hazırlanışı</div>
              {(micTarifData[i].hazirlanis||[]).map(function(a,j){return <div key={j} style={{display:"flex",gap:8,marginBottom:8,padding:"8px 10px",background:"var(--card)",borderRadius:8,border:"1px solid var(--border)"}}>
                <span style={{fontSize:16,fontWeight:700,color:C.red,flexShrink:0,width:24,textAlign:"center"}}>{a.adim||j+1}</span>
                <div style={{flex:1}}>
                  {a.baslik&&<div style={{fontSize:11,fontWeight:700,color:C.cream,marginBottom:2}}>{a.baslik}</div>}
                  <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{a.aciklama}</div>
                </div>
              </div>;})}
              {micTarifData[i].sefin_ipuclari&&micTarifData[i].sefin_ipuclari.length>0&&<div style={{marginTop:6}}>
                <div style={{fontSize:9,color:"#F59E0B",textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Şefin İpuçları</div>
                {micTarifData[i].sefin_ipuclari.map(function(tip,j){return <div key={j} style={{fontSize:10,color:"#F59E0B",lineHeight:1.5,marginBottom:3,fontStyle:"italic"}}>💡 {tip}</div>;})}
              </div>}
              {micTarifData[i].plating&&<div style={{marginTop:6,fontSize:10,color:C.dim}}>🎨 Sunum: {micTarifData[i].plating}</div>}
              {micTarifData[i].servis&&<div style={{marginTop:4,fontSize:10,color:C.dim}}>🍽️ Servis: {micTarifData[i].servis}</div>}
            </div>}
            {evdeIdx===i&&evdeData&&<div style={{marginTop:10,background:"rgba(76,175,122,0.04)",border:"1px solid rgba(76,175,122,0.2)",borderRadius:10,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:6}}>🏠 Ev Versiyonu: {evdeData.isim}</div>
              {evdeData.fark&&<div style={{fontSize:10,color:C.dim,marginBottom:8,fontStyle:"italic"}}>Orijinalden fark: {evdeData.fark}</div>}
              {evdeData.malzemeler&&<div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Malzemeler</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {evdeData.malzemeler.map(function(m,j){return <span key={j} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"rgba(76,175,122,0.08)",border:"1px solid rgba(76,175,122,0.15)",color:C.muted}}>{typeof m==="object"?m.miktar+" "+m.isim:m}</span>;})}
                </div>
              </div>}
              {evdeData.adimlar&&<div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Yapılışı</div>
                {evdeData.adimlar.map(function(a,j){return <div key={j} style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:4,display:"flex",gap:6}}>
                  <span style={{color:C.green,fontWeight:700,flexShrink:0}}>{j+1}.</span><span>{a}</span>
                </div>;})}
              </div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {evdeData.sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {evdeData.sure}</span>}
                {evdeData.zorluk&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{evdeData.zorluk}</span>}
              </div>
              {evdeData.ipucu&&<div style={{marginTop:6,fontSize:10,color:"#F59E0B",fontStyle:"italic"}}>💡 {evdeData.ipucu}</div>}
            </div>}
          </div>}
        </div>;})}
      </div>
    </div>;
  }

  // ── Gurme: Step 1 ──
  if(mode==="gurme"&&gurmeStep===1){
    return <div style={{paddingBottom:78}}>
      {gurmeLoading&&<MenuYuklemeEkrani adimlar={gurmeAdimlar}/>}
      <TabHeader sub="Ünlü Gurmeler & Eleştirmenler" title="Şef Dünyası" desc="Dünyaca ünlü gurmelerin favori restoranları & imza yemekleri" col={C.purple}/>
      <div style={{padding:"0 16px"}}>
        {/* Mode switch */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{id:"sefler",label:"👨‍🍳 Şefler",c:C.gold},{id:"michelin",label:"⭐ Michelin",c:C.red},{id:"gurme",label:"🍷 Gurme",c:C.purple}].map(function(m){var on=mode===m.id;return <button key={m.id} onClick={function(){setMode(m.id);}} style={{flex:1,padding:"10px 6px",background:on?m.c:"var(--card)",color:on?"#fff":"var(--muted)",fontSize:11,fontWeight:on?700:500,border:"2px solid "+(on?m.c:"var(--border)"),borderRadius:10,letterSpacing:"0.03em"}}>{m.label}</button>;})}
        </div>
        {/* Gurme seçimi */}
        <SH label="Gurme Seçimi" sub={"Birden fazla seçebilirsiniz ("+GURME_LIST.length+" gurme)"}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
          {GURME_LIST.map(function(g){var on=!!selGurme[g.id];return <button key={g.id} onClick={function(){tMap(setSelGurme,g.id);}} style={{borderRadius:12,padding:"10px",border:"2px solid "+(on?g.col:"var(--border)"),background:on?g.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
            {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:g.col}}>✓</span>}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:22}}>{g.emoji}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:on?700:600,color:on?C.cream:"var(--muted)",fontFamily:"'Playfair Display',serif"}}>{g.isim}</div>
                <div style={{fontSize:9,color:C.dim}}>{g.ulke}</div>
              </div>
            </div>
            <div style={{fontSize:9,color:on?g.col:C.dim,lineHeight:1.3}}>{g.uzmanlik}</div>
            <div style={{fontSize:8,color:C.muted,marginTop:2,lineHeight:1.3,fontStyle:"italic"}}>{g.bio}</div>
          </button>;})}
        </div>
        {/* Adet */}
        <SH label="Restoran Sayısı"/>
        <div style={{display:"flex",gap:4,marginBottom:18,flexWrap:"wrap"}}>
          {[1,2,3,4,5,6,7,8,9,10,12,15,20].map(function(n){var on=gurmeAdet===n;return <button key={n} onClick={function(){setGurmeAdet(n);}} style={{width:30,height:30,borderRadius:9,border:"1.5px solid "+(on?C.purple:"var(--border)"),background:on?C.purple+"14":"var(--card)",color:on?C.cream:C.muted,fontSize:11,fontWeight:on?700:400}}>{n}</button>;})}
        </div>
        <ErrBox msg={gurmeError}/>
        <GoldBtn onClick={generateGurme} loading={gurmeLoading} disabled={gurmeLoading}>
          {gurmeLoading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Gurmelerin favorileri araştırılıyor…</span>:"🍷 Gurme Favorilerini Keşfet"}
        </GoldBtn>
        {gurmeLoading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{gurmeAdimlar.map(function(a,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:9,background:"var(--card)",border:"1px solid var(--border)"}}>
          <span style={{fontSize:12}}>{a.durum==="tamam"?"✅":a.durum==="aktif"?"⏳":"⬜"}</span>
          <span style={{fontSize:12,color:a.durum==="aktif"?C.cream:C.muted}}>{a.label}</span>
        </div>;})}  </div>}
      </div>
    </div>;
  }

  // ── Gurme: Step 2 (Results) ──
  if(mode==="gurme"&&gurmeStep===2&&gurmeDays){
    return <div style={{paddingBottom:60}}>
      <TabHeader sub="Gurme Rehberi" title={gurmeDays.baslik||"Gurme Favorileri"} desc={gurmeDays.aciklama||""} col={C.purple}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          <button onClick={function(){setGurmeStep(1);setGurmeDays(null);setGurmeEvdeIdx(null);setGurmeEvdeData(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.purple,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Arama</button>
        </div>
        <div style={{textAlign:"center",marginBottom:8,fontSize:10,color:C.purple,opacity:0.7}}>👆 Detay için kartlara tıklayın</div>
        {(gurmeDays.dishes||[]).map(function(d,i){var open=gurmeOpenIdx===i;var col=C.purple;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setGurmeOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:24}}>{d.emoji||"🍽️"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{d.restoran}</span>
              </div>
              <div style={{fontSize:11,color:col,fontWeight:600}}>🍷 {d.gurme}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:3}}>
                {d.sehir&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>📍 {d.sehir}, {d.ulke}</span>}
                {d.mutfak&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>{d.mutfak}</span>}
                {d.fiyat_aralik&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(76,175,122,0.1)",color:C.green}}>{d.fiyat_aralik}</span>}
                {d.rezervasyon&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>📋 {d.rezervasyon}</span>}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,flexShrink:0}}>
              {!open&&<span style={{fontSize:8,color:col,fontWeight:600}}>📖 Detay</span>}
              <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
            </div>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            {d.neden_sever&&<div style={{fontSize:11,color:C.muted,lineHeight:1.5,marginTop:10,marginBottom:10,padding:"8px 10px",background:col+"08",borderRadius:8,fontStyle:"italic"}}>💬 "{d.neden_sever}"<span style={{display:"block",fontSize:10,color:col,marginTop:3,fontWeight:600}}>— {d.gurme}</span></div>}
            {d.atmosfer&&<div style={{fontSize:11,color:C.dim,marginBottom:8,padding:"6px 10px",background:"var(--card2)",borderRadius:8}}>🏛️ {d.atmosfer}</div>}
            {d.puan&&<div style={{fontSize:11,color:C.gold,marginBottom:8,padding:"6px 10px",background:C.goldDim,borderRadius:8}}>⭐ {d.puan}</div>}
            {d.imza_yemekler&&d.imza_yemekler.length>0&&<div style={{marginBottom:10}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:6}}>İmza Yemekler</div>
              {d.imza_yemekler.map(function(y,j){var tarifKey=i+"_"+j;return <div key={j} style={{padding:"8px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid "+col+"12",marginBottom:5}}>
                <div style={{display:"flex",gap:8}}>
                  <span style={{fontSize:16,flexShrink:0}}>🍽️</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.cream}}>{y.isim}</div>
                    <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{y.aciklama}</div>
                    {y.fiyat&&<div style={{fontSize:10,color:C.green,marginTop:2}}>{y.fiyat}</div>}
                  </div>
                </div>
                <button onClick={function(){gurmeTarifHazirla(d,y.isim,tarifKey);}} disabled={gurmeTarifLoading&&gurmeTarifIdx===tarifKey} style={{marginTop:6,width:"100%",padding:"7px",borderRadius:8,border:"1px solid "+col+"44",background:col+"08",color:col,fontSize:11,fontWeight:600}}>
                  {gurmeTarifLoading&&gurmeTarifIdx===tarifKey?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Spinner size={12}/>Hazırlanıyor…</span>:"📋 "+y.isim+" Tarifi"}
                </button>
                {gurmeTarifIdx===tarifKey&&gurmeTarifData[tarifKey]&&<div style={{marginTop:8,background:col+"08",border:"1px solid "+col+"30",borderRadius:8,padding:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:col,marginBottom:6}}>📋 {gurmeTarifData[tarifKey].isim}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                    {gurmeTarifData[tarifKey].hazirlik_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔪 {gurmeTarifData[tarifKey].hazirlik_suresi}</span>}
                    {gurmeTarifData[tarifKey].pisirme_suresi&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>🔥 {gurmeTarifData[tarifKey].pisirme_suresi}</span>}
                    {gurmeTarifData[tarifKey].porsiyon&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>👥 {gurmeTarifData[tarifKey].porsiyon}</span>}
                    {gurmeTarifData[tarifKey].kalori&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>🔥 {gurmeTarifData[tarifKey].kalori}</span>}
                  </div>
                  <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Malzemeler</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                    {(gurmeTarifData[tarifKey].malzemeler||[]).map(function(m,k){return <span key={k} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:col+"0A",border:"1px solid "+col+"18",color:C.muted}}>{typeof m==="object"?m.miktar+" "+m.isim:m}</span>;})}
                  </div>
                  <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Hazırlanışı</div>
                  {(gurmeTarifData[tarifKey].hazirlanis||[]).map(function(a,k){return <div key={k} style={{display:"flex",gap:8,marginBottom:6,padding:"6px 8px",background:"var(--card)",borderRadius:7,border:"1px solid var(--border)"}}>
                    <span style={{fontSize:14,fontWeight:700,color:col,flexShrink:0,width:20,textAlign:"center"}}>{a.adim||k+1}</span>
                    <div style={{flex:1}}>
                      {a.baslik&&<div style={{fontSize:11,fontWeight:700,color:C.cream,marginBottom:2}}>{a.baslik}</div>}
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{a.aciklama}</div>
                    </div>
                  </div>;})}
                  {gurmeTarifData[tarifKey].sefin_ipuclari&&gurmeTarifData[tarifKey].sefin_ipuclari.length>0&&<div style={{marginTop:4}}>
                    {gurmeTarifData[tarifKey].sefin_ipuclari.map(function(tip,k){return <div key={k} style={{fontSize:10,color:"#F59E0B",lineHeight:1.5,marginBottom:2,fontStyle:"italic"}}>💡 {tip}</div>;})}
                  </div>}
                  {gurmeTarifData[tarifKey].servis&&<div style={{marginTop:4,fontSize:10,color:C.dim}}>🍽️ Servis: {gurmeTarifData[tarifKey].servis}</div>}
                </div>}
              </div>;})}
            </div>}
            <div style={{display:"flex",gap:6,marginTop:8}}>
              <button onClick={function(){setGurmeEvdeIdx(i);gurmeEvdeDene(d);}} disabled={gurmeEvdeLoading&&gurmeEvdeIdx===i} style={{flex:1,padding:"8px",borderRadius:9,border:"1px solid "+C.green+"44",background:C.green+"08",color:C.green,fontSize:11,fontWeight:600}}>
                {gurmeEvdeLoading&&gurmeEvdeIdx===i?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Spinner size={12}/>Hazırlanıyor…</span>:"🏠 Evde Dene"}
              </button>
              <button onClick={function(){if(props&&props.onToggleFav)props.onToggleFav(d);}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>🤍</button>
              <button onClick={function(){var txt=d.restoran+" — "+d.gurme+"\n"+(d.imza_yemekler||[]).map(function(y){return y.isim;}).join(", ");if(navigator.share){navigator.share({title:d.restoran,text:txt});}else{navigator.clipboard.writeText(txt);}}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>📤</button>
            </div>
            {gurmeEvdeIdx===i&&gurmeEvdeData&&<div style={{marginTop:10,background:"rgba(76,175,122,0.04)",border:"1px solid rgba(76,175,122,0.2)",borderRadius:10,padding:12}}>
              <div style={{fontSize:12,fontWeight:700,color:C.green,marginBottom:6}}>🏠 Ev Versiyonu: {gurmeEvdeData.isim}</div>
              {gurmeEvdeData.fark&&<div style={{fontSize:10,color:C.dim,marginBottom:8,fontStyle:"italic"}}>Orijinalden fark: {gurmeEvdeData.fark}</div>}
              {gurmeEvdeData.malzemeler&&<div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Malzemeler</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {gurmeEvdeData.malzemeler.map(function(m,j){return <span key={j} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"rgba(76,175,122,0.08)",border:"1px solid rgba(76,175,122,0.15)",color:C.muted}}>{typeof m==="object"?m.miktar+" "+m.isim:m}</span>;})}
                </div>
              </div>}
              {gurmeEvdeData.adimlar&&<div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:4}}>Yapılışı</div>
                {gurmeEvdeData.adimlar.map(function(a,j){return <div key={j} style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:4,display:"flex",gap:6}}>
                  <span style={{color:C.green,fontWeight:700,flexShrink:0}}>{j+1}.</span><span>{a}</span>
                </div>;})}
              </div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {gurmeEvdeData.sure&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏱ {gurmeEvdeData.sure}</span>}
                {gurmeEvdeData.zorluk&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{gurmeEvdeData.zorluk}</span>}
              </div>
              {gurmeEvdeData.ipucu&&<div style={{marginTop:6,fontSize:10,color:"#F59E0B",fontStyle:"italic"}}>💡 {gurmeEvdeData.ipucu}</div>}
            </div>}
          </div>}
        </div>;})}
      </div>
    </div>;
  }

  // ── Fallback: mode switch only ──
  return <div style={{paddingBottom:78}}>
    <TabHeader sub="Dünyaca Ünlü" title="Şef Dünyası" desc="Ünlü şeflerin tarifleri, Michelin restoranları & gurme favorileri" col={C.gold}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[{id:"sefler",label:"👨‍🍳 Şefler",c:C.gold},{id:"michelin",label:"⭐ Michelin",c:C.red},{id:"gurme",label:"🍷 Gurme",c:C.purple}].map(function(m){var on=mode===m.id;return <button key={m.id} onClick={function(){setMode(m.id);}} style={{flex:1,padding:"10px 6px",background:on?m.c:"var(--card)",color:on?"#fff":"var(--muted)",fontSize:11,fontWeight:on?700:500,border:"2px solid "+(on?m.c:"var(--border)"),borderRadius:10,letterSpacing:"0.03em"}}>{m.label}</button>;})}
      </div>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: FONKSİYONEL TIP & GIDA TAKVİYESİ
// ══════════════════════════════════════════════════════════════
function FonksiyonelTipTab(){
  var [selSorun,setSelSorun]=useState({});
  var [selTakviye,setSelTakviye]=useState({});
  var [cinsiyet,setCinsiyet]=useState("");
  var [yas,setYas]=useState("");
  var [kronik,setKronik]=useState({});
  var [beslenme,setBeslenme]=useState("normal");
  var [ozelNot,setOzelNot]=useState("");
  var [step,setStep]=useState(1);
  var [loading,setLoading]=useState(false);
  var [data,setData]=useState(null);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  var [openOgun,setOpenOgun]=useState(null);
  var [saved,setSaved]=useState([]);
  var [detayIdx,setDetayIdx]=useState(null);
  var [detayLoading,setDetayLoading]=useState(false);
  var [detayData,setDetayData]=useState({});
  var [soruText,setSoruText]=useState("");
  var [soruLoading,setSoruLoading]=useState(false);
  var [soruCevap,setSoruCevap]=useState([]);
  useEffect(function(){stGet("fonktip_saved").then(function(s){if(s)setSaved(s);});},[]);
  function tS(id){setSelSorun(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function tT(id){setSelTakviye(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function tK(id){setKronik(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function generate(){
    var sorunArr=Object.keys(selSorun).filter(function(k){return selSorun[k];});
    if(sorunArr.length===0){setError("En az 1 sağlık sorunu seçin.");return;}
    setLoading(true);setError(null);setData(null);setOpenIdx(null);setOpenOgun(null);
    var sorunLabels=sorunArr.map(function(k){var f=FONK_SORUN.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var takviyeArr=Object.keys(selTakviye).filter(function(k){return selTakviye[k];});
    var takviyeLabels=takviyeArr.map(function(k){var f=FONK_TAKVIYE_KAT.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var kronikArr=Object.keys(kronik).filter(function(k){return kronik[k];});
    var kronikLabels=kronikArr.map(function(k){var f=FONK_KRONIK.find(function(x){return x.id===k;});return f?f.label:k;}).join(", ");
    var cinsLbl=cinsiyet?(FONK_CINSIYET.find(function(x){return x.id===cinsiyet;})||{}).label:"";
    var yasLbl=yas?(FONK_YAS.find(function(x){return x.id===yas;})||{}).label:"";
    var besLbl=(BESLENME.find(function(x){return x.id===beslenme;})||{}).label||"Normal";
    var prompt="Sen fonksiyonel tıp uzmanı, klinik beslenme uzmanı ve fitoterapistsin. Kanıta dayalı, detaylı bir takviye ve beslenme protokolü oluştur.\n\n"+
      "Sağlık Sorunları: "+sorunLabels+"\n"+
      (takviyeLabels?"İlgilenilen Takviye Kategorileri: "+takviyeLabels+"\n":"")+
      (cinsLbl?"Cinsiyet: "+cinsLbl+"\n":"")+(yasLbl?"Yaş: "+yasLbl+"\n":"")+
      (kronikLabels?"Kronik Durumlar: "+kronikLabels+"\n":"")+
      "Beslenme: "+besLbl+"\n"+
      (ozelNot?"Özel Not: "+ozelNot+"\n":"")+
      "\nHer takviye için: hangi besinlerden doğal olarak alınabilir, günlük doz, ne zaman alınmalı, hangi formda (tablet/toz/likit/doğal kaynak), olası etkileşimler ve dikkat edilecekler.\n"+
      "Ayrıca destekleyici beslenme menüsü oluştur: sabah, öğle, akşam ve ara öğünlerde hangi besinler bu takviye ihtiyacını karşılar.\n\n"+
      "Continue JSON:\n"+
      "\"baslik\":\"Fonksiyonel Tıp Protokolü\","+
      "\"ozet\":\"genel durum analizi 2-3 cümle\","+
      "\"takviyeler\":[{"+
        "\"isim\":\"takviye adı\",\"emoji\":\"1 emoji\",\"kategori\":\"vitamin/mineral/vb\","+
        "\"gunluk_doz\":\"miktar ve birim\",\"ne_zaman\":\"sabah aç/tok/gece vb\","+
        "\"form\":\"tablet/toz/likit/doğal kaynak\","+
        "\"neden\":\"neden gerekli 1 cümle\","+
        "\"dogal_kaynaklar\":[{\"besin\":\"gıda adı\",\"miktar\":\"100g'da miktar\",\"porsiyon\":\"günlük önerilen porsiyon\"}],"+
        "\"etkilesimler\":\"dikkat/ilaç etkileşimi\","+
        "\"sure\":\"kullanım süresi\",\"renk\":\"#hexcolor\""+
      "}],"+
      "\"beslenme_plani\":{"+
        "\"sabah\":{\"baslik\":\"Kahvaltı\",\"aciklama\":\"neden bu öğün\",\"besinler\":[{\"isim\":\"yiyecek\",\"miktar\":\"porsiyon\",\"fayda\":\"hangi takviyeye katkı\"}]},"+
        "\"ara1\":{\"baslik\":\"Kuşluk\",\"aciklama\":\"ara öğün\",\"besinler\":[{\"isim\":\"y\",\"miktar\":\"m\",\"fayda\":\"f\"}]},"+
        "\"ogle\":{\"baslik\":\"Öğle\",\"aciklama\":\"neden\",\"besinler\":[{\"isim\":\"y\",\"miktar\":\"m\",\"fayda\":\"f\"}]},"+
        "\"ara2\":{\"baslik\":\"İkindi\",\"aciklama\":\"ara öğün\",\"besinler\":[{\"isim\":\"y\",\"miktar\":\"m\",\"fayda\":\"f\"}]},"+
        "\"aksam\":{\"baslik\":\"Akşam\",\"aciklama\":\"neden\",\"besinler\":[{\"isim\":\"y\",\"miktar\":\"m\",\"fayda\":\"f\"}]}"+
      "},"+
      "\"onemli_uyarilar\":[\"uyarı1\",\"uyarı2\"],"+
      "\"takip\":\"kontrol önerisi\"\n"+
      "}\nHepsi Türkçe, bilimsel ve pratik.";
    callAI(prompt,2000)
      .then(function(r){setData(r);setStep(3);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }
  function saveProtocol(){
    if(!data)return;
    var entry={date:new Date().toLocaleDateString("tr-TR"),baslik:data.baslik||"Protokol",sorunlar:Object.keys(selSorun).filter(function(k){return selSorun[k];}),data:data};
    setSaved(function(p){var nw=[entry].concat(p).slice(0,10);stSet("fonktip_saved",nw);return nw;});
  }
  function fetchDetay(idx){
    if(detayData[idx]){setDetayIdx(detayIdx===idx?null:idx);return;}
    var t=(data&&data.takviyeler||[])[idx];if(!t)return;
    setDetayIdx(idx);setDetayLoading(true);
    callAI("Sen fonksiyonel tıp ve biyokimya uzmanısın. '"+t.isim+"' takviyesi hakkında akademik düzeyde detaylı bilgi ver.\n"+
      "Continue JSON:\n\"isim\":\""+t.isim+"\",\"bilimsel_adi\":\"Latin/kimyasal adı\",\"mekanizma\":\"vücutta nasıl çalışır 2-3 cümle\","+
      "\"arastirmalar\":[{\"baslik\":\"çalışma başlığı\",\"sonuc\":\"sonuç özeti\",\"kaynak\":\"dergi/yıl\"}],"+
      "\"biyoyararlilik\":\"emilim ve biyoyararlanım bilgisi\","+
      "\"eksiklik_belirtileri\":[\"belirti1\",\"belirti2\"],"+
      "\"fazlalik_riskleri\":\"aşırı doz riskleri\","+
      "\"ideal_kombinasyonlar\":[{\"takviye\":\"isim\",\"neden\":\"sinerji açıklaması\"}],"+
      "\"kontrendikasyonlar\":\"kimler kullanmamalı\","+
      "\"saklama\":\"saklama koşulları\"}\nTürkçe, bilimsel.",1200)
      .then(function(r){setDetayData(function(p){var n=Object.assign({},p);n[idx]=r;return n;});})
      .catch(function(e){setError(e.message);})
      .finally(function(){setDetayLoading(false);});
  }
  function soruSor(){
    if(!soruText.trim()||!data)return;
    setSoruLoading(true);
    var ctx="Protokol: "+(data.baslik||"")+".\nTakviyeler: "+(data.takviyeler||[]).map(function(t){return t.isim+" ("+t.gunluk_doz+")";}).join(", ")+".";
    callAI("Sen fonksiyonel tıp uzmanısın. Kullanıcı sana bir soru soruyor. Bağlam:\n"+ctx+"\n\nSoru: "+soruText+"\n\nContinue JSON:\n\"soru\":\""+soruText.replace(/"/g,"'")+"\",\"cevap\":\"detaylı cevap\",\"oneriler\":[\"öneri1\",\"öneri2\"],\"uyari\":\"varsa uyarı veya boş string\"}\nTürkçe, bilimsel.",800)
      .then(function(r){setSoruCevap(function(p){return p.concat([r]);});setSoruText("");})
      .catch(function(e){setError(e.message);})
      .finally(function(){setSoruLoading(false);});
  }
  // ── STEP 1 & 2: Selection ──
  if(step===1||step===2){
    return <div style={{paddingBottom:78}}>
      <TabHeader sub="Kanıta Dayalı Beslenme" title="Fonksiyonel Tıp" desc="Takviye, doğal kaynak ve destekleyici beslenme protokolü" col={"#2DD4BF"}/>
      <div style={{padding:"0 16px"}}>
        <div style={{display:"flex",gap:0,marginBottom:16,background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
          {[1,2].map(function(s){var on=step===s;return <button key={s} onClick={function(){setStep(s);}} style={{flex:1,padding:"10px",background:on?"var(--accent)":"transparent",color:on?"var(--bg)":"var(--muted)",fontSize:12,fontWeight:on?700:400,border:"none",letterSpacing:"0.05em"}}>{s===1?"Sorun & Takviye":"Profil & Detay"}</button>;})}
        </div>
        {step===1&&<div>
          <SH label="Sağlık Sorunları" sub="Birden fazla seçebilirsiniz"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {FONK_SORUN.map(function(s){var on=!!selSorun[s.id];return <button key={s.id} onClick={function(){tS(s.id);}} style={{borderRadius:12,padding:"10px 10px",border:"2px solid "+(on?s.col:"var(--border)"),background:on?s.col+"14":"var(--card)",textAlign:"left",position:"relative"}}>
              {on&&<span style={{position:"absolute",top:6,right:8,fontSize:10,color:s.col}}>✓</span>}
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{s.emoji}</span>
                <span style={{fontSize:12,fontWeight:on?700:500,color:on?C.cream:"var(--muted)"}}>{s.label}</span>
              </div>
            </button>;})}
          </div>
          <SH label="Takviye Kategorisi" sub="İlgilendiğiniz takviye türlerini seçin (isteğe bağlı)"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
            {FONK_TAKVIYE_KAT.map(function(t){var on=!!selTakviye[t.id];return <button key={t.id} onClick={function(){tT(t.id);}} style={{borderRadius:10,padding:"9px 10px",border:"1.5px solid "+(on?t.col:"var(--border)"),background:on?t.col+"14":"var(--card)",display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:16}}>{t.emoji}</span>
              <span style={{fontSize:11,fontWeight:on?700:400,color:on?C.cream:C.muted,flex:1}}>{t.label}</span>
              {on&&<span style={{fontSize:9,color:t.col}}>✓</span>}
            </button>;})}
          </div>
          <SH label="Beslenme Tipi"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {BESLENME.map(function(b){var on=beslenme===b.id;return <button key={b.id} onClick={function(){setBeslenme(b.id);}} style={{padding:"7px 13px",borderRadius:50,fontSize:12,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,display:"inline-flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{b.emoji}</span>{b.label}
            </button>;})}
          </div>
        </div>}
        {step===2&&<div>
          <SH label="Cinsiyet"/>
          <div style={{display:"flex",gap:6,marginBottom:18}}>
            {FONK_CINSIYET.map(function(c){var on=cinsiyet===c.id;return <button key={c.id} onClick={function(){setCinsiyet(c.id);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",textAlign:"center"}}>
              <div style={{fontSize:20}}>{c.emoji}</div><div style={{fontSize:12,color:on?C.cream:C.muted,fontWeight:on?700:400}}>{c.label}</div>
            </button>;})}
          </div>
          <SH label="Yaş Aralığı"/>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:18}}>
            {FONK_YAS.map(function(y){var on=yas===y.id;return <button key={y.id} onClick={function(){setYas(y.id);}} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",color:on?C.cream:C.muted,fontSize:12,fontWeight:on?700:400}}>{y.label}</button>;})}
          </div>
          <SH label="Kronik Durumlar" sub="Varsa seçin"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:18}}>
            {FONK_KRONIK.map(function(k){var on=!!kronik[k.id];return <button key={k.id} onClick={function(){tK(k.id);}} style={{padding:"8px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.cream:C.muted,display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:14}}>{k.emoji}</span><span style={{fontSize:11,flex:1}}>{k.label}</span>
              <span style={{width:22,height:13,borderRadius:7,flexShrink:0,display:"inline-block",background:on?C.gold:"rgba(255,255,255,0.07)",position:"relative"}}><span style={{position:"absolute",top:1.5,left:on?10:2,width:9,height:9,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/></span>
            </button>;})}
          </div>
          <SH label="Özel Not" sub="Ek bilgi, kullandığınız ilaçlar vb."/>
          <textarea value={ozelNot} onChange={function(e){setOzelNot(e.target.value);}} placeholder="Örn: Tiroid ilacı kullanıyorum, hamilelik planlıyorum..." rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:12,resize:"vertical",marginBottom:18,fontFamily:"inherit"}}/>
        </div>}
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Protokol hazırlanıyor…</span>:"🔬 Fonksiyonel Tıp Protokolü Oluştur"}
        </GoldBtn>
      </div>
    </div>;
  }
  // ── STEP 3: Results ──
  var ogunSira=["sabah","ara1","ogle","ara2","aksam"];
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Kişisel Protokol" title={data&&data.baslik||"Fonksiyonel Tıp Protokolü"} desc="Takviye & destekleyici beslenme planı" col={"#2DD4BF"}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <button onClick={function(){setStep(1);setData(null);}} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.teal,fontSize:11,fontWeight:600,padding:"7px 12px"}}>← Yeni Protokol</button>
        <button onClick={saveProtocol} style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:"1px solid var(--border)",borderRadius:9,color:C.gold,fontSize:11,fontWeight:600,padding:"7px 12px"}}>💾 Kaydet</button>
      </div>
      {data&&data.ozet&&<div style={{padding:"12px 14px",borderRadius:11,background:"rgba(45,212,191,0.06)",border:"1px solid rgba(45,212,191,0.2)",marginBottom:16,fontSize:12,color:"#2DD4BF",lineHeight:1.6}}>{data.ozet}</div>}
      {data&&(data.takviyeler||[]).length>0&&<div style={{marginBottom:18}}>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:20,height:2,background:C.gold,borderRadius:2}}/>💊 TAKVİYE PROTOKOLÜ<span style={{width:20,height:2,background:C.gold,borderRadius:2}}/>
        </div>
        {data.takviyeler.map(function(t,i){var col=t.renk||"#2DD4BF";var open=openIdx===i;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:7}}>
          <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"12px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:col+"18",border:"1px solid "+col+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{t.emoji||"💊"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{t.isim}</span>
                {t.kategori&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:col+"14",color:col}}>{t.kategori}</span>}
              </div>
              <div style={{fontSize:11,color:col,marginTop:2}}>{t.neden}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:3}}>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(76,175,122,0.1)",color:C.green}}>📏 {t.gunluk_doz}</span>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>⏰ {t.ne_zaman}</span>
                {t.form&&<span style={{fontSize:9,padding:"2px 7px",borderRadius:50,background:"rgba(245,158,11,0.1)",color:"#F59E0B"}}>{t.form}</span>}
              </div>
            </div>
            <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 14px",borderTop:"1px solid "+col+"20"}}>
            {(t.dogal_kaynaklar||[]).length>0&&<div style={{marginTop:10,marginBottom:10}}>
              <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>🌿 Doğal Besin Kaynakları</div>
              {t.dogal_kaynaklar.map(function(dk,j){return <div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,padding:"6px 10px",background:"rgba(76,175,122,0.04)",borderRadius:8,border:"1px solid rgba(76,175,122,0.1)"}}>
                <span style={{color:C.green,fontSize:8}}>◆</span>
                <span style={{color:C.cream,fontSize:12,fontWeight:600,minWidth:80}}>{dk.besin}</span>
                <span style={{color:C.muted,fontSize:11,flex:1}}>{dk.miktar}</span>
                <span style={{color:C.green,fontSize:10,fontStyle:"italic"}}>{dk.porsiyon}</span>
              </div>;})}
            </div>}
            {t.sure&&<div style={{fontSize:11,color:C.muted,marginBottom:6}}>📅 Kullanım süresi: <span style={{color:C.cream,fontWeight:600}}>{t.sure}</span></div>}
            {t.etkilesimler&&<div style={{padding:"8px 11px",background:"rgba(224,82,82,0.05)",borderRadius:8,border:"1px solid rgba(224,82,82,0.15)",fontSize:11,color:C.red,marginTop:6}}>⚠️ {t.etkilesimler}</div>}
            <button onClick={function(){fetchDetay(i);}} disabled={detayLoading&&detayIdx===i} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:8,border:"1px solid rgba(45,212,191,0.3)",background:"rgba(45,212,191,0.06)",color:"#2DD4BF",fontSize:11,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
              {detayLoading&&detayIdx===i?<><Spinner size={12} color="#2DD4BF"/>Akademik detay yükleniyor…</>:<>{detayIdx===i&&detayData[i]?"▲ Detayı Gizle":"📚 Akademik Detay"}</>}
            </button>
            {detayIdx===i&&detayData[i]&&<div className="up" style={{marginTop:8,padding:"12px",background:"rgba(45,212,191,0.03)",borderRadius:10,border:"1px solid rgba(45,212,191,0.15)"}}>
              {detayData[i].bilimsel_adi&&<div style={{fontSize:11,color:C.muted,marginBottom:6,fontStyle:"italic"}}>Bilimsel: {detayData[i].bilimsel_adi}</div>}
              {detayData[i].mekanizma&&<div style={{fontSize:12,color:C.cream,lineHeight:1.6,marginBottom:8}}>{detayData[i].mekanizma}</div>}
              {(detayData[i].arastirmalar||[]).length>0&&<div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:"#2DD4BF",textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:5}}>📖 Bilimsel Araştırmalar</div>
                {detayData[i].arastirmalar.map(function(a,ai){return <div key={ai} style={{padding:"6px 10px",background:"var(--card)",borderRadius:7,border:"1px solid var(--border)",marginBottom:4}}>
                  <div style={{fontSize:11,color:C.cream,fontWeight:600}}>{a.baslik}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.sonuc}</div>
                  {a.kaynak&&<div style={{fontSize:9,color:"#2DD4BF",marginTop:2,fontStyle:"italic"}}>{a.kaynak}</div>}
                </div>;})}
              </div>}
              {detayData[i].biyoyararlilik&&<div style={{fontSize:11,color:C.muted,marginBottom:6}}>🧬 Biyoyararlanım: <span style={{color:C.cream}}>{detayData[i].biyoyararlilik}</span></div>}
              {(detayData[i].eksiklik_belirtileri||[]).length>0&&<div style={{marginBottom:6}}>
                <div style={{fontSize:10,color:C.red,fontWeight:600,marginBottom:3}}>Eksiklik Belirtileri:</div>
                {detayData[i].eksiklik_belirtileri.map(function(b,bi){return <div key={bi} style={{fontSize:11,color:C.muted}}>• {b}</div>;})}
              </div>}
              {detayData[i].fazlalik_riskleri&&<div style={{fontSize:11,color:C.red,marginBottom:6}}>⚠️ Fazlalık: {detayData[i].fazlalik_riskleri}</div>}
              {(detayData[i].ideal_kombinasyonlar||[]).length>0&&<div style={{marginBottom:6}}>
                <div style={{fontSize:10,color:C.green,fontWeight:600,marginBottom:3}}>Sinerji Kombinasyonları:</div>
                {detayData[i].ideal_kombinasyonlar.map(function(k,ki){return <div key={ki} style={{fontSize:11,color:C.muted}}>✦ {k.takviye}: <span style={{color:"#2DD4BF"}}>{k.neden}</span></div>;})}
              </div>}
              {detayData[i].kontrendikasyonlar&&<div style={{fontSize:11,color:C.orange,marginBottom:4}}>🚫 Kontrendikasyon: {detayData[i].kontrendikasyonlar}</div>}
              {detayData[i].saklama&&<div style={{fontSize:11,color:C.muted}}>📦 Saklama: {detayData[i].saklama}</div>}
            </div>}
          </div>}
        </div>;})}
      </div>}
      {data&&data.beslenme_plani&&<div style={{marginBottom:18}}>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:"#4CAF7A",fontWeight:700,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          <span style={{width:20,height:2,background:"#4CAF7A",borderRadius:2}}/>🍽️ DESTEKLEYİCİ BESLENME PLANI<span style={{width:20,height:2,background:"#4CAF7A",borderRadius:2}}/>
        </div>
        {ogunSira.map(function(key,oi){var og=data.beslenme_plani[key];if(!og)return null;var open=openOgun===key;return <div key={key} style={{background:"var(--card)",borderRadius:12,border:"1px solid "+(open?"rgba(76,175,122,0.3)":"var(--border)"),overflow:"hidden",marginBottom:6}}>
          <button onClick={function(){setOpenOgun(open?null:key);}} style={{width:"100%",padding:"11px 14px",background:"transparent",border:"none",textAlign:"left",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>{key==="sabah"?"🌅":key==="ara1"?"🍎":key==="ogle"?"☀️":key==="ara2"?"🥜":"🌙"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.cream}}>{og.baslik}</div>
              <div style={{fontSize:10,color:C.muted}}>{og.aciklama}</div>
            </div>
            <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
          </button>
          {open&&<div className="up" style={{padding:"0 14px 12px",borderTop:"1px solid rgba(76,175,122,0.15)"}}>
            {(og.besinler||[]).map(function(b,bi){return <div key={bi} style={{display:"flex",gap:6,alignItems:"center",marginBottom:5,marginTop:bi===0?8:0}}>
              <span style={{color:C.green,fontSize:8}}>◆</span>
              <span style={{color:C.cream,fontSize:12,fontWeight:600,minWidth:70}}>{b.isim}</span>
              <span style={{color:C.muted,fontSize:11}}>{b.miktar}</span>
              <span style={{fontSize:10,color:"#2DD4BF",fontStyle:"italic",marginLeft:"auto"}}>{b.fayda}</span>
            </div>;})}
          </div>}
        </div>;})}
      </div>}
      {data&&(data.onemli_uyarilar||[]).length>0&&<div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:7}}>⚠️ Önemli Uyarılar</div>
        {data.onemli_uyarilar.map(function(u,i){return <div key={i} style={{padding:"8px 12px",borderRadius:8,background:"rgba(224,82,82,0.04)",border:"1px solid rgba(224,82,82,0.12)",marginBottom:4,fontSize:12,color:C.muted,lineHeight:1.5}}>• {u}</div>;})}
      </div>}
      {data&&data.takip&&<div style={{padding:"10px 14px",borderRadius:10,background:"rgba(91,163,208,0.06)",border:"1px solid rgba(91,163,208,0.2)",fontSize:12,color:C.blue,lineHeight:1.5,marginBottom:14}}>📋 Takip: {data.takip}</div>}
      {data&&<div style={{marginBottom:18,background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:16}}>
        <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:C.purple,fontWeight:700,marginBottom:10}}>💬 Soru & Cevap</div>
        {soruCevap.map(function(sc,si){return <div key={si} style={{marginBottom:10}}>
          <div style={{padding:"8px 12px",background:"rgba(155,127,212,0.06)",borderRadius:"10px 10px 10px 2px",border:"1px solid rgba(155,127,212,0.15)",marginBottom:4}}>
            <div style={{fontSize:11,color:C.cream,fontWeight:600}}>🙋 {sc.soru}</div>
          </div>
          <div style={{padding:"8px 12px",background:"rgba(45,212,191,0.04)",borderRadius:"10px 10px 2px 10px",border:"1px solid rgba(45,212,191,0.12)"}}>
            <div style={{fontSize:12,color:C.cream,lineHeight:1.6}}>{sc.cevap}</div>
            {(sc.oneriler||[]).length>0&&<div style={{marginTop:6}}>{sc.oneriler.map(function(o,oi){return <div key={oi} style={{fontSize:11,color:C.green}}>✦ {o}</div>;})}</div>}
            {sc.uyari&&<div style={{fontSize:11,color:C.red,marginTop:4}}>⚠️ {sc.uyari}</div>}
          </div>
        </div>;})}
        <div style={{display:"flex",gap:6,marginTop:soruCevap.length?8:0}}>
          <input value={soruText} onChange={function(e){setSoruText(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey)soruSor();}} placeholder="Protokol hakkında sorunuz..." style={{flex:1,padding:"10px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",color:C.cream,fontSize:12}}/>
          <button onClick={soruSor} disabled={soruLoading||!soruText.trim()} style={{padding:"10px 16px",borderRadius:10,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600,flexShrink:0}}>
            {soruLoading?<Spinner size={14}/>:"Sor"}
          </button>
        </div>
      </div>}
      {saved.length>0&&<div style={{marginTop:10}}>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:600,marginBottom:8}}>💾 Kayıtlı Protokoller ({saved.length})</div>
        {saved.map(function(s,i){return <button key={i} onClick={function(){setData(s.data);}} style={{display:"block",width:"100%",padding:"8px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",marginBottom:4,textAlign:"left"}}>
          <span style={{fontSize:12,color:C.cream}}>{s.baslik}</span>
          <span style={{fontSize:10,color:C.muted,marginLeft:8}}>{s.date}</span>
        </button>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: FOTOĞRAF ANALİZİ
// ══════════════════════════════════════════════════════════════
function FotoTab(){
  var [imgSrc,setImgSrc]=useState(null);
  var [b64,setB64]=useState(null);
  var [mtype,setMtype]=useState("image/jpeg");
  var [loading,setLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [error,setError]=useState(null);
  var fileRef=useRef(null);
  function handleFile(e){var f=e.target.files&&e.target.files[0];if(!f) return;setResult(null);setError(null);setMtype(f.type||"image/jpeg");toBase64(f).then(function(base){setB64(base);setImgSrc(URL.createObjectURL(f));});}
  function analyze(){
    if(!b64) return;setLoading(true);setError(null);setResult(null);
    callAIVision(b64,mtype,"Analyze this food image in Turkish. Continue JSON:\n\"yemek_adi\":\"s\",\"tahmin_kalori\":\"s\",\"porsiyon\":\"s\",\"besinler\":{\"protein\":\"Xg\",\"karbonhidrat\":\"Xg\",\"yag\":\"Xg\",\"lif\":\"Xg\"},\"icindekiler\":[\"s\"],\"saglik_puani\":8,\"saglik_yorum\":\"s\",\"iyilestirme\":[\"s\"],\"ilginc\":\"s\"}",800)
      .then(function(r){setResult(r);}).catch(function(e){setError("Analiz başarısız: "+e.message);}).finally(function(){setLoading(false);});
  }
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="AI Kalori Analizi" title="Fotoğraf Analizi" desc="Fotoğraftan kalori ve besin değerleri" col={C.purple}/>
    <div style={{padding:"0 16px"}}>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>
      <div onClick={function(){if(fileRef.current) fileRef.current.click();}} style={{border:"2px dashed "+(imgSrc?C.purple:"var(--border)"),borderRadius:13,padding:imgSrc?"0":"32px 20px",textAlign:"center",cursor:"pointer",background:"var(--card)",overflow:"hidden",marginBottom:12}}>
        {imgSrc?<img src={imgSrc} alt="food" style={{width:"100%",maxHeight:280,objectFit:"contain",display:"block"}}/>:
        <div><div style={{fontSize:40,marginBottom:9}}>📸</div><div style={{fontSize:13,color:C.muted,marginBottom:2}}>Fotoğraf seçin</div><div style={{fontSize:11,color:"var(--dim)"}}>JPG · PNG · WebP</div></div>}
      </div>
      {imgSrc&&<div style={{display:"flex",gap:7,marginBottom:12}}>
        <button onClick={function(){if(fileRef.current) fileRef.current.click();}} style={{flex:1,padding:"9px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:12}}>📷 Değiştir</button>
        <button onClick={analyze} disabled={loading} style={{flex:2,padding:"9px",borderRadius:9,border:"1.5px solid rgba(155,127,212,0.5)",background:"rgba(155,127,212,0.1)",color:loading?"var(--dim)":C.purple,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:6}}><Spinner size={13} color={C.purple}/>Analiz ediliyor…</span>:"🔬 Analiz Et"}
        </button>
      </div>}
      <ErrBox msg={error}/>
      {result&&<div className="up">
        <div style={{background:"linear-gradient(135deg,rgba(155,127,212,0.12),rgba(155,127,212,0.04))",borderRadius:13,padding:"14px 16px",border:"1px solid rgba(155,127,212,0.25)",marginBottom:10}}>
          <div style={{fontSize:18,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:2}}>{result.yemek_adi}</div>
          <div style={{fontSize:12,color:C.muted}}>{result.porsiyon}</div>
          <div style={{display:"flex",gap:8,marginTop:9,flexWrap:"wrap"}}>
            <div style={{padding:"8px 12px",borderRadius:10,background:"rgba(155,127,212,0.15)",border:"1px solid rgba(155,127,212,0.25)",textAlign:"center",minWidth:70}}>
              <div style={{fontSize:18,fontWeight:700,color:C.purple}}>{result.tahmin_kalori}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:1}}>Kalori</div>
            </div>
            {result.besinler&&Object.entries(result.besinler).map(function(en,i){var cols=[C.blue,C.orange,C.red,C.green];var lbs={protein:"Protein",karbonhidrat:"Karb",yag:"Yağ",lif:"Lif"};return <div key={i} style={{padding:"8px 12px",borderRadius:10,background:cols[i%4]+"12",border:"1px solid "+cols[i%4]+"22",textAlign:"center",minWidth:60}}>
              <div style={{fontSize:15,fontWeight:700,color:cols[i%4]}}>{en[1]}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:1}}>{lbs[en[0]]||en[0]}</div>
            </div>;})}
          </div>
        </div>
        {result.saglik_puani&&<div style={{background:"var(--card)",borderRadius:10,padding:"12px 14px",border:"1px solid var(--border)",marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,color:C.cream}}>Sağlık Puanı</div>
            <div style={{fontSize:18,fontWeight:700,color:result.saglik_puani>=7?C.green:result.saglik_puani>=5?"#F59E0B":C.red}}>{result.saglik_puani}/10</div>
          </div>
          <div style={{height:6,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
            <div style={{height:"100%",width:(result.saglik_puani*10)+"%",background:result.saglik_puani>=7?C.green:result.saglik_puani>=5?"#F59E0B":C.red,borderRadius:4}}/>
          </div>
          {result.saglik_yorum?<div style={{fontSize:12,color:C.muted,marginTop:6,fontStyle:"italic"}}>{result.saglik_yorum}</div>:null}
        </div>}
        {result.icindekiler&&result.icindekiler.length>0&&<div style={{marginBottom:9}}>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:6,fontWeight:600}}>Malzemeler</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{result.icindekiler.map(function(m,i){return <span key={i} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>✦ {m}</span>;})}</div>
        </div>}
        {result.iyilestirme&&result.iyilestirme.length>0&&<div style={{background:"rgba(76,175,122,0.06)",borderRadius:10,padding:"11px 14px",border:"1px solid rgba(76,175,122,0.15)"}}>
          <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:6}}>💡 İyileştirme</div>
          {result.iyilestirme.map(function(s,i){return <div key={i} style={{fontSize:12,color:C.muted,display:"flex",gap:5,marginBottom:3}}><span style={{color:C.green}}>→</span>{s}</div>;})}
        </div>}
        {result.ilginc?<div style={{marginTop:8,padding:"9px 13px",background:C.goldDim,borderRadius:9,border:"1px solid rgba(212,168,67,0.15)",fontSize:12,color:C.gold,fontStyle:"italic"}}>✨ {result.ilginc}</div>:null}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: FAVORİLER & GEÇMİŞ
// ══════════════════════════════════════════════════════════════
// TAB: BESLENME TAKİBİ

// ─── HEDEF (Goal System) ──────────────────────────────────────
function HedefView(props){
  var [protHedef,setProtHedef]=useState(0);
  var [karbHedef,setKarbHedef]=useState(0);
  var [yagHedef,setYagHedef]=useState(0);
  var [lifHedef,setLifHedef]=useState(30);
  var [suHedef,setSuHedef]=useState(2500);
  var [saved,setSaved]=useState(false);
  useEffect(function(){
    stGet("hedef_makro").then(function(h){
      if(h){setProtHedef(h.protein||0);setKarbHedef(h.karbonhidrat||0);setYagHedef(h.yag||0);setLifHedef(h.lif||30);setSuHedef(h.su||2500);setSaved(true);}
      else{setProtHedef(props.makroHedef.protein);setKarbHedef(props.makroHedef.karbonhidrat);setYagHedef(props.makroHedef.yag);setLifHedef(props.makroHedef.lif);}
    });
  },[]);
  function save(){stSet("hedef_makro",{protein:protHedef,karbonhidrat:karbHedef,yag:yagHedef,lif:lifHedef,su:suHedef,kalori:props.hedef});setSaved(true);}
  function autoCalc(){
    var k=props.hedef||2000;
    setProtHedef(Math.round(k*0.25/4));setKarbHedef(Math.round(k*0.5/4));setYagHedef(Math.round(k*0.25/9));setLifHedef(30);
  }
  return <div className="up">
    <div style={{background:"linear-gradient(135deg,rgba(212,168,67,0.1),rgba(212,168,67,0.04))",borderRadius:14,border:"1px solid rgba(212,168,67,0.2)",padding:"16px 18px",marginBottom:14}}>
      <div style={{fontSize:10,color:C.gold,letterSpacing:"0.2em",fontWeight:700,marginBottom:10}}>🎯 GÜNLÜK HEDEFLER</div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:12,color:C.muted}}>Kalori Hedefi</span>
          <span style={{fontSize:18,fontWeight:700,color:C.cream}}>{props.hedef} kcal</span>
        </div>
        <input type="range" min={1200} max={4000} step={50} value={props.hedef} onChange={function(e){props.setHedef(parseInt(e.target.value));}} style={{width:"100%",accentColor:C.gold}}/>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim}}><span>1200</span><span>4000</span></div>
      </div>
      <button onClick={autoCalc} style={{width:"100%",padding:"8px",borderRadius:9,border:"1px solid "+C.borderG,background:C.goldDim,color:C.goldL,fontSize:11,fontWeight:600,marginBottom:12}}>⚡ Makroları Otomatik Hesapla</button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[{l:"Protein (g)",v:protHedef,s:setProtHedef,c:C.red,mx:300},{l:"Karbonhidrat (g)",v:karbHedef,s:setKarbHedef,c:C.blue,mx:500},{l:"Yağ (g)",v:yagHedef,s:setYagHedef,c:"#F59E0B",mx:200},{l:"Lif (g)",v:lifHedef,s:setLifHedef,c:C.green,mx:60}].map(function(m){return <div key={m.l} style={{background:"var(--card)",borderRadius:10,padding:"10px 12px",border:"1px solid var(--border)"}}>
          <div style={{fontSize:10,color:m.c,fontWeight:600,marginBottom:4}}>{m.l}</div>
          <input type="number" value={m.v} onChange={function(e){m.s(parseInt(e.target.value)||0);}} style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:14,fontWeight:700}}/>
        </div>;})}
      </div>
      <div style={{marginTop:10,background:"var(--card)",borderRadius:10,padding:"10px 12px",border:"1px solid var(--border)"}}>
        <div style={{fontSize:10,color:C.teal,fontWeight:600,marginBottom:4}}>💧 Su Hedefi (ml)</div>
        <input type="number" value={suHedef} onChange={function(e){setSuHedef(parseInt(e.target.value)||0);}} style={{width:"100%",padding:"6px 8px",borderRadius:7,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:14,fontWeight:700}}/>
      </div>
    </div>
    <button onClick={save} style={{width:"100%",padding:"12px",borderRadius:11,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:13,fontWeight:600}}>{saved?"✓ Kaydedildi — Güncelle":"💾 Hedefleri Kaydet"}</button>
  </div>;
}

// ─── BMI CALCULATOR ──────────────────────────────────────────
function BmiView(){
  var [boy,setBoy]=useState("");
  var [kilo,setKilo]=useState("");
  var [yas,setYas]=useState("");
  var [cinsiyet,setCinsiyet]=useState("erkek");
  var [bmiHist,setBmiHist]=useState([]);
  useEffect(function(){
    stGet("saglik_prof").then(function(p){if(p){setBoy(p.boy||"");setKilo(p.kilo||"");setYas(p.yas||"");}});
    stGet("bmi_hist").then(function(h){setBmiHist(h||[]);});
  },[]);
  var h=parseFloat(boy)||0,w=parseFloat(kilo)||0,a=parseFloat(yas)||30;
  var bmi=h>0&&w>0?w/((h/100)*(h/100)):0;
  var bmiStr=bmi>0?bmi.toFixed(1):"—";
  var bmiCat=bmi<18.5?"Zayıf":bmi<25?"Normal":bmi<30?"Kilolu":"Obez";
  var bmiCol=bmi<18.5?C.blue:bmi<25?C.green:bmi<30?"#F59E0B":C.red;
  var bmr=cinsiyet==="erkek"?10*w+6.25*h-5*a+5:10*w+6.25*h-5*a-161;
  var idealKg=22*((h/100)*(h/100));
  function saveBmi(){
    if(!bmi) return;
    var entry={date:new Date().toISOString().slice(0,10),bmi:parseFloat(bmiStr),kilo:w};
    var nh=bmiHist.concat([entry]);if(nh.length>60)nh=nh.slice(-60);
    setBmiHist(nh);stSet("bmi_hist",nh);
    stSet("saglik_prof",{boy:boy,kilo:kilo,yas:yas,cinsiyet:cinsiyet});
  }
  return <div className="up">
    <div style={{background:"linear-gradient(135deg,rgba(91,163,208,0.1),rgba(91,163,208,0.04))",borderRadius:14,border:"1px solid rgba(91,163,208,0.2)",padding:"16px 18px",marginBottom:14}}>
      <div style={{fontSize:10,color:C.blue,letterSpacing:"0.2em",fontWeight:700,marginBottom:10}}>⚖️ BMI & VÜCUT ANALİZİ</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Boy (cm)</div><input type="number" value={boy} onChange={function(e){setBoy(e.target.value);}} placeholder="170" style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:14}}/></div>
        <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Kilo (kg)</div><input type="number" value={kilo} onChange={function(e){setKilo(e.target.value);}} placeholder="70" style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:14}}/></div>
        <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Yaş</div><input type="number" value={yas} onChange={function(e){setYas(e.target.value);}} placeholder="30" style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:14}}/></div>
        <div><div style={{fontSize:10,color:C.muted,marginBottom:3}}>Cinsiyet</div><div style={{display:"flex",gap:4}}>{[["erkek","♂"],["kadin","♀"]].map(function(c){var on=cinsiyet===c[0];return <button key={c[0]} onClick={function(){setCinsiyet(c[0]);}} style={{flex:1,padding:"8px",borderRadius:8,border:"1.5px solid "+(on?C.blue:"var(--border)"),background:on?"rgba(91,163,208,0.1)":"var(--card2)",color:on?C.blue:C.muted,fontSize:14,fontWeight:700}}>{c[1]}</button>;})}</div></div>
      </div>
      {bmi>0&&<div>
        <div style={{textAlign:"center",marginBottom:10}}>
          <div style={{fontSize:42,fontWeight:700,color:bmiCol,fontFamily:"'Playfair Display',serif"}}>{bmiStr}</div>
          <div style={{fontSize:14,fontWeight:600,color:bmiCol}}>{bmiCat}</div>
        </div>
        <div style={{height:8,borderRadius:4,background:"var(--border)",position:"relative",marginBottom:6}}>
          <div style={{position:"absolute",left:0,top:0,height:"100%",width:"37.5%",background:C.blue,borderRadius:"4px 0 0 4px"}}/>
          <div style={{position:"absolute",left:"37.5%",top:0,height:"100%",width:"12.5%",background:C.green}}/>
          <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:"12.5%",background:"#F59E0B"}}/>
          <div style={{position:"absolute",left:"62.5%",top:0,height:"100%",width:"37.5%",background:C.red,borderRadius:"0 4px 4px 0"}}/>
          <div style={{position:"absolute",top:-3,left:Math.min(95,Math.max(2,(bmi/40)*100))+"%",width:14,height:14,borderRadius:"50%",background:"#fff",border:"2px solid "+bmiCol,transform:"translateX(-50%)"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:C.dim,marginBottom:12}}><span>Zayıf</span><span>Normal</span><span>Kilolu</span><span>Obez</span></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
          <div style={{background:"var(--card)",borderRadius:9,padding:"10px",border:"1px solid var(--border)",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>BMR</div>
            <div style={{fontSize:16,fontWeight:700,color:C.cream}}>{Math.round(bmr)}</div>
            <div style={{fontSize:9,color:C.dim}}>kcal/gün</div>
          </div>
          <div style={{background:"var(--card)",borderRadius:9,padding:"10px",border:"1px solid var(--border)",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>İdeal</div>
            <div style={{fontSize:16,fontWeight:700,color:C.green}}>{Math.round(idealKg)}</div>
            <div style={{fontSize:9,color:C.dim}}>kg</div>
          </div>
          <div style={{background:"var(--card)",borderRadius:9,padding:"10px",border:"1px solid var(--border)",textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,marginBottom:2}}>Fark</div>
            <div style={{fontSize:16,fontWeight:700,color:w>idealKg?C.red:C.blue}}>{w>idealKg?"+":""}{Math.round(w-idealKg)}</div>
            <div style={{fontSize:9,color:C.dim}}>kg</div>
          </div>
        </div>
        <button onClick={saveBmi} style={{width:"100%",padding:"10px",borderRadius:9,border:"1px solid rgba(91,163,208,0.4)",background:"rgba(91,163,208,0.1)",color:C.blue,fontSize:12,fontWeight:600}}>📊 Kaydet & Geçmişe Ekle</button>
      </div>}
    </div>
    {bmiHist.length>1&&<div style={{background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:"14px",marginBottom:10}}>
      <div style={{fontSize:10,color:C.blue,letterSpacing:"0.2em",fontWeight:700,marginBottom:10}}>📈 KİLO TRENDİ</div>
      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:80}}>
        {bmiHist.slice(-20).map(function(e,i){var minK=Math.min.apply(null,bmiHist.slice(-20).map(function(x){return x.kilo;}));var maxK=Math.max.apply(null,bmiHist.slice(-20).map(function(x){return x.kilo;}));var range=maxK-minK||1;var pct=((e.kilo-minK)/range)*100;return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
          <div style={{fontSize:7,color:C.dim}}>{e.kilo}</div>
          <div style={{width:"70%",height:Math.max(4,pct*0.7)+"%",background:"linear-gradient(180deg,"+C.blue+","+C.blue+"55)",borderRadius:2}}/>
          <div style={{fontSize:7,color:C.dim}}>{e.date.slice(5)}</div>
        </div>;})}
      </div>
    </div>}
  </div>;
}

// ─── BİRİM ÇEVİRİCİ ──────────────────────────────────────────
var CEVIRICI_DATA=[
  {cat:"Hacim",items:[{from:"bardak",to:"ml",factor:236.59,emoji:"🥛"},{from:"çay bardağı",to:"ml",factor:100,emoji:"🍵"},{from:"su bardağı",to:"ml",factor:200,emoji:"💧"},{from:"yemek kaşığı",to:"ml",factor:15,emoji:"🥄"},{from:"tatlı kaşığı",to:"ml",factor:5,emoji:"🥄"},{from:"litre",to:"ml",factor:1000,emoji:"🧪"}]},
  {cat:"Ağırlık",items:[{from:"pound",to:"gram",factor:453.6,emoji:"⚖️"},{from:"ons",to:"gram",factor:28.35,emoji:"⚖️"},{from:"kg",to:"gram",factor:1000,emoji:"⚖️"}]},
  {cat:"Sıcaklık",items:[{from:"°F",to:"°C",factor:0,emoji:"🌡️",custom:true}]},
];
function CeviriciView(){
  var [val,setVal]=useState("");
  var [selUnit,setSelUnit]=useState(0);
  var allUnits=CEVIRICI_DATA.flatMap(function(c){return c.items;});
  var cur=allUnits[selUnit]||allUnits[0];
  var numVal=parseFloat(val)||0;
  var result=cur.custom?Math.round((numVal-32)*5/9*10)/10:Math.round(numVal*cur.factor*100)/100;

  // Common ingredient weights
  var MALZEME_OLCU=[
    {isim:"Un",bardak:"120g",kasik:"8g"},{isim:"Şeker",bardak:"200g",kasik:"13g"},
    {isim:"Tuz",kasik:"6g"},{isim:"Zeytinyağı",kasik:"14ml"},
    {isim:"Tereyağı",kasik:"14g"},{isim:"Süt",bardak:"240ml"},
    {isim:"Pirinç",bardak:"185g"},{isim:"Bal",kasik:"21g"},
  ];

  return <div className="up">
    <div style={{background:"linear-gradient(135deg,rgba(155,127,212,0.1),rgba(155,127,212,0.04))",borderRadius:14,border:"1px solid rgba(155,127,212,0.2)",padding:"16px 18px",marginBottom:14}}>
      <div style={{fontSize:10,color:C.purple,letterSpacing:"0.2em",fontWeight:700,marginBottom:12}}>📐 BİRİM ÇEVİRİCİ</div>
      <input type="number" value={val} onChange={function(e){setVal(e.target.value);}} placeholder="Değer girin" style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:"var(--cream)",fontSize:18,fontWeight:700,textAlign:"center",marginBottom:10}}/>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
        {allUnits.map(function(u,i){var on=selUnit===i;return <button key={i} onClick={function(){setSelUnit(i);}} style={{padding:"6px 10px",borderRadius:50,fontSize:11,border:"1.5px solid "+(on?C.purple+"88":"var(--border)"),background:on?C.purple+"18":"transparent",color:on?C.purple:C.muted}}>{u.emoji} {u.from} → {u.to}</button>;})}
      </div>
      {numVal>0&&<div style={{textAlign:"center",padding:"16px",background:"var(--card)",borderRadius:12,border:"1px solid var(--border)"}}>
        <div style={{fontSize:13,color:C.muted,marginBottom:4}}>{numVal} {cur.from} =</div>
        <div style={{fontSize:32,fontWeight:700,color:C.purple,fontFamily:"'Playfair Display',serif"}}>{result}</div>
        <div style={{fontSize:14,color:C.muted}}>{cur.to}</div>
      </div>}
    </div>
    <div style={{background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:"14px"}}>
      <div style={{fontSize:10,color:C.gold,letterSpacing:"0.2em",fontWeight:700,marginBottom:10}}>🥄 MALZEME ÖLÇÜ TABLOSU</div>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:0}}>
        <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:9,color:C.dim,fontWeight:700}}>Malzeme</div>
        <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:9,color:C.dim,fontWeight:700}}>1 Bardak</div>
        <div style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:9,color:C.dim,fontWeight:700}}>1 Y. Kaşık</div>
        {MALZEME_OLCU.map(function(m,i){return [
          <div key={i+"a"} style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:12,color:C.cream}}>{m.isim}</div>,
          <div key={i+"b"} style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:12,color:C.muted}}>{m.bardak||"—"}</div>,
          <div key={i+"c"} style={{padding:"6px 8px",borderBottom:"1px solid var(--border)",fontSize:12,color:C.muted}}>{m.kasik||"—"}</div>,
        ];})}
      </div>
    </div>
  </div>;
}

// ─── MANUEL YEMEK EKLEME ──────────────────────────────────────
function ManuelEkle(props){
  var [open,setOpen]=useState(false);
  var [isim,setIsim]=useState("");
  var [kalori,setKalori]=useState("");
  var [ogun,setOgun]=useState("Öğle");
  var [ld,setLd]=useState(false);
  var OGUNLER2=["Kahvaltı","Öğle","Akşam","Ara Öğün"];
  async function ekle(){
    if(!isim.trim()||!kalori.trim()) return;
    setLd(true);
    await props.onAdd({isim:isim.trim(),kalori:kalori+" kcal",ogun:ogun});
    setIsim("");setKalori("");setOpen(false);setLd(false);
  }
  if(!open) return <button onClick={function(){setOpen(true);}} style={{width:"100%",padding:"10px",borderRadius:11,border:"2px dashed rgba(212,168,67,0.3)",background:"rgba(212,168,67,0.05)",color:C.gold,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>+ Manuel Yemek Ekle</button>;
  return <div className="up" style={{background:"var(--card)",borderRadius:13,padding:"14px 15px",border:"1px solid rgba(212,168,67,0.25)"}}>
    <div style={{fontSize:11,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:10}}>Manuel Ekle</div>
    <input value={isim} onChange={function(e){setIsim(e.target.value);}} placeholder="Yemek adı (örn. Mercimek çorbası)" style={{width:"100%",padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13,marginBottom:7}}/>
    <div style={{display:"flex",gap:7,marginBottom:7}}>
      <input value={kalori} onChange={function(e){setKalori(e.target.value);}} placeholder="Kalori" type="number" style={{flex:1,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13}}/>
      <select value={ogun} onChange={function(e){setOgun(e.target.value);}} style={{flex:1,padding:"9px 11px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13}}>
        {OGUNLER2.map(function(o){return <option key={o} value={o}>{o}</option>;})}
      </select>
    </div>
    <div style={{display:"flex",gap:7}}>
      <button onClick={function(){setOpen(false);}} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>İptal</button>
      <button onClick={ekle} disabled={ld} style={{flex:2,padding:"9px",borderRadius:9,border:"none",background:"linear-gradient(135deg,"+C.gold+","+C.goldL+")",color:"#000",fontSize:12,fontWeight:700,opacity:ld?0.7:1}}>{ld?"Ekleniyor...":"✓ Ekle"}</button>
    </div>
  </div>;
}
function TakipTab(){
  var [view,setView]=useState("bugun");
  var [bugun,setBugun]=useState(null);
  var [hafta,setHafta]=useState(null);
  var [hedef,setHedef]=useState(2000);
  var [loading,setLoading]=useState(true);
  var [aiOzet,setAiOzet]=useState(null);
  var [aiLoad,setAiLoad]=useState(false);
  var [stats,setStats]=useState(null);
  var [trend,setTrend]=useState(null);
  function loadTrend(){
    var d30=[];for(var ii=29;ii>=0;ii--){var dd=new Date();dd.setDate(dd.getDate()-ii);d30.push(dd.toISOString().slice(0,10));}
    Promise.all(d30.map(function(d){return stGet("nutri:"+d).then(function(r){return {date:d,kal:(r||[]).reduce(function(a,x){var m=String(x.kalori||"").match(/[0-9]+/);return a+(m?parseInt(m[0]):0);},0),protein:(r||[]).reduce(function(a,x){return a+(x.protein||0);},0),count:(r||[]).length};});})).then(function(data){setTrend(data);});
  }
  var [su,setSu]=useState(0);
  useEffect(function(){stGet("su:"+new Date().toISOString().slice(0,10)).then(function(s){setSu(s||0);});},[]);
  var [disarida,setDisarida]=useState({kahvalti:false,ogle:false,aksam:false});
  useEffect(function(){var t=new Date().toISOString().slice(0,10);stGet("takip_disarida:"+t).then(function(r){setDisarida(r||{kahvalti:false,ogle:false,aksam:false});});},[]);
  async function toggleDisarida(ogun){var t=new Date().toISOString().slice(0,10);setDisarida(function(p){var n=Object.assign({},p);n[ogun]=!n[ogun];stSet("takip_disarida:"+t,n);return n;});}
  async function addSu(ml){var n=su+ml;setSu(n);await stSet("su:"+new Date().toISOString().slice(0,10),n);}
  var GUNLER=["Pzt","Sal","Car","Per","Cum","Cmt","Paz"];
  function parseKal(str){if(!str) return 0; var m=String(str).match(/[0-9]+/); return m?parseInt(m[0]):0;}
  useEffect(function(){
    var today=new Date().toISOString().slice(0,10);
    Promise.all([stGet("nutri:"+today),stGet("saglik_prof")]).then(function(rs){
      setBugun(rs[0]||[]);
      if(rs[1]&&rs[1].kilo&&rs[1].boy&&rs[1].yas){var w=parseFloat(rs[1].kilo)||70,h=parseFloat(rs[1].boy)||170,a=parseFloat(rs[1].yas)||30;setHedef(Math.round(10*w+6.25*h-5*a+5));}
      var days=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days.push(d.toISOString().slice(0,10));}
      Promise.all(days.map(function(d){return stGet("nutri:"+d).then(function(r){return {date:d,items:r||[]};});})).then(function(week){setHafta(week);setLoading(false);});
    });
  },[]);
  function doAiOzet(){
    if(aiOzet){setAiOzet(null);return;}
    setAiLoad(true);
    // 7 günlük veri topla
    var days7=[];for(var i=6;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days7.push(d.toISOString().slice(0,10));}
    Promise.all(days7.map(function(d){return stGet("nutri:"+d).then(function(r){return {date:d,items:r||[]};});})).then(function(week){
      var totalK=week.reduce(function(a,d){return a+d.items.reduce(function(b,x){var m=String(x.kalori||"").match(/[0-9]+/);return b+(m?parseInt(m[0]):0);},0);},0);
      var avgK=Math.round(totalK/Math.max(1,week.filter(function(d){return d.items.length>0;}).length));
      var allDishes=week.flatMap(function(d){return d.items.map(function(x){return x.isim;});}).filter(Boolean);
      var totalProt=week.reduce(function(a,d){return a+d.items.reduce(function(b,x){return b+(x.protein||0);},0);},0);
      var suData=[];
      Promise.all(days7.map(function(d){return stGet("su:"+d).then(function(r){return r||0;});})).then(function(suArr){
        var avgSu=Math.round(suArr.reduce(function(a,x){return a+x;},0)/7);
        var ctx="7 günlük veri: Ortalama kalori="+avgK+" kcal, Toplam protein="+Math.round(totalProt/7)+"g/gün, Ortalama su="+avgSu+"ml/gün, Yenilen yemekler: "+allDishes.slice(0,12).join(", ")+". Hedef kalori="+hedef+" kcal.";
        callAI("Turk beslenme uzmani. "+ctx+" JSON sadece: genel_skor:number, genel_yorum:string, iyi_yanlar:[string], eksikler:[string], haftalik_oneriler:[{baslik:string,aciklama:string}], yarin_onerisi:string.",700)
          .then(function(r){setAiOzet(r);setAiLoad(false);}).catch(function(){setAiLoad(false);});
      }).catch(function(){setAiLoad(false);});
    }).catch(function(){setAiLoad(false);});
  }
  function loadStats(){
    stGet("stats:mis").then(function(s){if(s) setStats(s);else stGet("stats:misafir").then(function(s2){if(s2) setStats(s2);});});
  }
  var bugunKal=(bugun||[]).reduce(function(a,d){return a+parseKal(d.kalori);},0);
  var bugunMakro=(bugun||[]).reduce(function(a,d){return {protein:a.protein+(d.protein||0),karbonhidrat:a.karbonhidrat+(d.karbonhidrat||0),yag:a.yag+(d.yag||0),lif:a.lif+(d.lif||0)};},{protein:0,karbonhidrat:0,yag:0,lif:0});
  var makroHedef={protein:Math.round(hedef*0.25/4),karbonhidrat:Math.round(hedef*0.5/4),yag:Math.round(hedef*0.25/9),lif:30};
  var bugunMikro={vitaminC:(bugun||[]).reduce(function(a,d){return a+(d.vitamin_c||0);},0),demir:(bugun||[]).reduce(function(a,d){return a+(d.demir||0);},0),kalsiyum:(bugun||[]).reduce(function(a,d){return a+(d.kalsiyum||0);},0),magnezyum:(bugun||[]).reduce(function(a,d){return a+(d.magnezyum||0);},0)};
  var mikrGunluk={vitaminC:90,demir:18,kalsiyum:1000,magnezyum:400};
  var hedefPct=Math.min(100,Math.round((bugunKal/hedef)*100));
  var hedefCol=hedefPct<60?C.blue:hedefPct<90?C.green:hedefPct<110?"#F59E0B":C.red;
  var circumference=2*Math.PI*32;
  return <div style={{paddingBottom:60}}>
    <div style={{background:"var(--card)",padding:"20px 20px 0",borderBottom:"1px solid rgba(91,163,208,0.2)"}}>
      <div style={{fontSize:10,letterSpacing:"0.35em",color:C.blue,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>BESLENME TAKİBİ</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.cream,marginBottom:14}}>Kalori & <em style={{color:"#93C5FD"}}>Makro Özet</em></h2>
      <div style={{display:"flex",gap:5,paddingBottom:12,overflowX:"auto"}}>
        {[["bugun","📅","Bugün"],["hafta","📊","Hafta"],["hedef","🎯","Hedef"],["bmi","⚖️","BMI"],["trend","📈","Trend"],["analiz","🤖","AI"],["cevirici","📐","Çevirici"],["stats","🏆","Stats"],["bulten","📰","Bülten"]].map(function(t){var ac=view===t[0];return <button key={t[0]} onClick={function(){setView(t[0]);if(t[0]==="analiz") doAiOzet();if(t[0]==="stats") loadStats();if(t[0]==="trend") loadTrend();}} style={{padding:"7px 14px",borderRadius:50,fontSize:12,border:"1.5px solid "+(ac?"rgba(91,163,208,0.5)":"var(--border)"),background:ac?"rgba(91,163,208,0.1)":"transparent",color:ac?C.blue:C.muted,fontWeight:ac?600:400,flexShrink:0}}>
          {t[1]} {t[2]}
        </button>;})}
      </div>
    </div>
    <div style={{padding:"16px"}}>
      {loading&&<div style={{textAlign:"center",padding:40}}><Spinner size={24} color={C.blue}/></div>}
      {!loading&&view==="bugun"&&<div className="up">
        <div style={{background:"linear-gradient(135deg,rgba(91,163,208,0.1),rgba(91,163,208,0.04))",borderRadius:16,border:"1px solid rgba(91,163,208,0.2)",padding:"18px 20px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{position:"relative",width:82,height:82,flexShrink:0}}>
              <svg width="82" height="82" style={{transform:"rotate(-90deg)"}}>
                <circle cx="41" cy="41" r="32" fill="none" stroke="rgba(91,163,208,0.15)" strokeWidth="7"/>
                <circle cx="41" cy="41" r="32" fill="none" stroke={hedefCol} strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={String(circumference)} strokeDashoffset={String(circumference*(1-hedefPct/100))}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                <div style={{fontSize:17,fontWeight:700,color:C.cream,lineHeight:1}}>{hedefPct}</div>
                <div style={{fontSize:9,color:C.muted}}>%</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:24,fontWeight:700,color:C.cream,marginBottom:2}}>{bugunKal}<span style={{fontSize:12,color:C.muted,fontWeight:400}}> kcal</span></div>
              <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Hedef: {hedef} kcal</div>
              <div style={{height:5,borderRadius:3,background:"rgba(91,163,208,0.12)",overflow:"hidden",marginBottom:5}}>
                <div style={{height:"100%",width:hedefPct+"%",background:"linear-gradient(90deg,"+C.blue+","+hedefCol+")",borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:hedefCol,fontWeight:600}}>
                {hedefPct<60?"Daha fazla ye":hedefPct<90?"İyi gidiyorsun ✓":hedefPct<110?"Hedefe ulaştın 🎯":"Hedefi geçtin ⚠"}
              </div>
            </div>
          </div>
        </div>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Bugün dışarıda yediklerim</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {[{k:"kahvalti",l:"Kahvaltı"},{k:"ogle",l:"Öğle"},{k:"aksam",l:"Akşam"}].map(function(o){var ac=disarida[o.k];return <button key={o.k} onClick={function(){toggleDisarida(o.k);}} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(ac?"rgba(212,168,67,0.5)":"var(--border)"),background:ac?C.goldDim:"var(--card)",color:ac?C.goldL:C.muted,fontSize:12,fontWeight:ac?700:400}}>{ac?"✓ ":""}{o.l}</button>;})}
        </div>
        {(!bugun||bugun.length===0)?<div style={{textAlign:"center",padding:"30px 20px",background:"var(--card)",borderRadius:13,border:"1px solid var(--border)"}}>
          <div style={{fontSize:36,marginBottom:8}}>📋</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:4}}>Bugün yemek eklenmedi</div>
          <div style={{fontSize:11,color:"var(--dim)"}}>Menü oluşturduğunuzda otomatik eklenir</div>
        </div>:
        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:600,marginBottom:10}}>Bugünün Yemekleri</div>
          {bugun.map(function(item,i){var kal=parseKal(item.kalori);var oCol=OGUN_COL[item.ogun]||C.gold;return <div key={i} className="up" style={{animationDelay:i*0.04+"s",background:"var(--card)",borderRadius:11,padding:"10px 13px",border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,marginBottom:5}}>
            <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,background:oCol}}/>
            <div style={{flex:1,fontSize:13,color:C.cream}}>{item.isim}</div>
            {item.ogun?<span style={{fontSize:10,padding:"2px 6px",borderRadius:50,background:oCol+"18",color:oCol}}>{item.ogun}</span>:null}
            {kal>0?<span style={{fontSize:12,fontWeight:600,color:C.purple}}>{kal}</span>:null}
          </div>;})}
        </div>}
      </div>}
      {!loading&&view==="hafta"&&<div className="up">
        {hafta&&(function(){
          var totalK=hafta.reduce(function(a,d){return a+d.items.reduce(function(b,x){var m=String(x.kalori||"").match(/[0-9]+/);return b+(m?parseInt(m[0]):0);},0);},0);
          var daysWithData=hafta.filter(function(d){return d.items.length>0;}).length;
          var avgK=daysWithData?Math.round(totalK/daysWithData):0;
          var totalP=hafta.reduce(function(a,d){return a+d.items.reduce(function(b,x){return b+(x.protein||0);},0);},0);
          var avgP=daysWithData?Math.round(totalP/daysWithData):0;
          var hedefPctHafta=hedef>0?Math.round((avgK/hedef)*100):0;
          var barWidthHafta=hedef>0?Math.min(100,hedefPctHafta):0;
          var hedefBarBlock=hedef>0?(<div style={{marginTop:10}}><div style={{height:6,borderRadius:3,background:"rgba(91,163,208,0.15)",overflow:"hidden"}}><div style={{height:"100%",width:barWidthHafta+"%",background:C.blue,borderRadius:3}}></div></div><div style={{fontSize:10,color:C.muted,marginTop:4}}>Ortalama günlük hedefe göre: %{hedefPctHafta}</div></div>):null;
          return <div style={{background:"linear-gradient(135deg,rgba(91,163,208,0.12),rgba(91,163,208,0.04))",borderRadius:14,border:"1px solid rgba(91,163,208,0.25)",padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:10,color:C.blue,letterSpacing:"0.2em",fontWeight:700,marginBottom:10}}>BU HAFTA ÖZETİ</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Toplam kalori</div><div style={{fontSize:20,fontWeight:700,color:C.cream}}>{totalK} <span style={{fontSize:12,fontWeight:400,color:C.muted}}>kcal</span></div></div>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Ort. kalori/gün</div><div style={{fontSize:20,fontWeight:700,color:C.cream}}>{avgK} <span style={{fontSize:12,fontWeight:400,color:C.muted}}>kcal</span></div></div>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Ort. protein/gün</div><div style={{fontSize:20,fontWeight:700,color:C.cream}}>{avgP} <span style={{fontSize:12,fontWeight:400,color:C.muted}}>g</span></div></div>
              <div><div style={{fontSize:11,color:C.muted,marginBottom:2}}>Veri gün sayısı</div><div style={{fontSize:20,fontWeight:700,color:C.cream}}>{daysWithData}/7</div></div>
            </div>
            {hedefBarBlock}
          </div>;
        })()}
        <div style={{background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:"16px",marginBottom:14}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:600,marginBottom:14}}>7 Günlük Kalori</div>
          <div style={{display:"flex",gap:5,alignItems:"flex-end",height:110}}>
            {(hafta||[]).map(function(day,i){
              var kal=day.items.reduce(function(a,d){return a+parseKal(d.kalori);},0);
              var pct=hedef>0?Math.min(100,Math.round((kal/hedef)*100)):0;
              var isToday=day.date===new Date().toISOString().slice(0,10);
              var col=pct===0?"var(--dim)":pct<60?C.blue:pct<90?C.green:pct<110?"#F59E0B":C.red;
              var dIdx=new Date(day.date+"T12:00:00").getDay();
              var dName=GUNLER[dIdx===0?6:dIdx-1];
              return <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                {kal>0?<div style={{fontSize:8,color:isToday?C.gold:C.muted,fontWeight:isToday?700:400}}>{kal}</div>:<div style={{fontSize:8,color:"transparent"}}>0</div>}
                <div style={{width:"100%",height:80,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                  <div style={{width:"70%",height:Math.max(3,pct*0.8)+"%",background:isToday?"linear-gradient(180deg,"+C.gold+",rgba(212,168,67,0.4))":"linear-gradient(180deg,"+col+","+col+"66)",borderRadius:"3px 3px 2px 2px"}}/>
                </div>
                <div style={{fontSize:9,color:isToday?C.gold:C.muted,fontWeight:isToday?700:400}}>{dName}</div>
              </div>;
            })}
          </div>
        </div>
        {hafta&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
          {[
            {label:"Haftalık Toplam",val:hafta.reduce(function(a,d){return a+d.items.reduce(function(b,x){return b+parseKal(x.kalori);},0);},0)+" kcal",col:C.purple,emoji:"🔥"},
            {label:"Günlük Ort.",val:Math.round(hafta.reduce(function(a,d){return a+d.items.reduce(function(b,x){return b+parseKal(x.kalori);},0);},0)/7)+" kcal",col:C.blue,emoji:"📊"},
            {label:"Aktif Gün",val:hafta.filter(function(d){return d.items.length>0;}).length+"/7",col:C.green,emoji:"✅"},
            {label:"Toplam Yemek",val:hafta.reduce(function(a,d){return a+d.items.length;},0)+" adet",col:C.gold,emoji:"🍽️"},
          ].map(function(s,i){return <div key={i} style={{background:"var(--card)",borderRadius:11,padding:"12px 13px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:18,marginBottom:4}}>{s.emoji}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.col,marginBottom:1}}>{s.val}</div>
            <div style={{fontSize:10,color:C.muted}}>{s.label}</div>
          </div>;})}
        </div>}
      </div>}
      {view==="analiz"&&<div className="up">
        {aiLoad&&<div style={{textAlign:"center",padding:"30px"}}><Spinner size={22} color={C.blue}/><div style={{fontSize:12,color:C.muted,marginTop:10}}>Analiz ediliyor…</div></div>}
        {!aiLoad&&!aiOzet&&<div style={{textAlign:"center",padding:"30px 20px",background:"var(--card)",borderRadius:13,border:"1px solid var(--border)"}}>
          <div style={{fontSize:36,marginBottom:8}}>🤖</div>
          <div style={{fontSize:13,color:C.muted}}>{(!bugun||bugun.length===0)?"Analiz için önce menü oluşturun":"Analiz yükleniyor…"}</div>
        </div>}
        {aiOzet&&<div>
          {aiOzet.genel_yorum?<div style={{padding:"13px 15px",background:"rgba(91,163,208,0.07)",borderRadius:12,border:"1px solid rgba(91,163,208,0.2)",fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:12,fontStyle:"italic"}}>💬 {aiOzet.genel_yorum}</div>:null}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:12}}>
            <div style={{background:"rgba(76,175,122,0.06)",borderRadius:11,padding:"12px 13px",border:"1px solid rgba(76,175,122,0.18)"}}>
              <div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>İyi Yanlar</div>
              {(aiOzet.iyi_yanlar||[]).map(function(s,i){return <div key={i} style={{fontSize:12,color:C.muted,display:"flex",gap:5,marginBottom:4}}><span style={{color:C.green}}>✓</span>{s}</div>;})}
            </div>
            <div style={{background:"rgba(224,82,82,0.05)",borderRadius:11,padding:"12px 13px",border:"1px solid rgba(224,82,82,0.15)"}}>
              <div style={{fontSize:9,color:C.red,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:8}}>Eksikler</div>
              {(aiOzet.eksikler||[]).map(function(s,i){return <div key={i} style={{fontSize:12,color:C.muted,display:"flex",gap:5,marginBottom:4}}><span style={{color:C.red}}>!</span>{s}</div>;})}
            </div>
          </div>
          {aiOzet.yarin_onerisi?<div style={{padding:"11px 14px",background:C.goldDim,borderRadius:11,border:"1px solid rgba(212,168,67,0.2)",fontSize:13,color:C.gold,lineHeight:1.65}}>🌅 Yarın: {aiOzet.yarin_onerisi}</div>:null}
        </div>}
      </div>}
      {view==="hedef"&&<HedefView hedef={hedef} setHedef={setHedef} makroHedef={makroHedef}/>}
      {view==="bmi"&&<BmiView/>}
      {view==="cevirici"&&<CeviriciView/>}
      {view==="bulten"&&<BultenView/>}
    </div>
  </div>;
}


// ─── YEMEK GÜNLÜĞÜ ────────────────────────────────────────────
var RUHHAL=[
  {emoji:"😊",label:"Harika",col:"#4CAF7A"},
  {emoji:"🙂",label:"İyi",col:"#D4A843"},
  {emoji:"😐",label:"Orta",col:"#9CA3AF"},
  {emoji:"😔",label:"Kötü",col:"#F97316"},
  {emoji:"😤",label:"Stresli",col:"#E05252"},
];
var NEDEN=[
  {id:"aclik",label:"Açlık",emoji:"🍽️"},
  {id:"stres",label:"Stres",emoji:"😰"},
  {id:"aliskanlik",label:"Alışkanlık",emoji:"🔄"},
  {id:"sosyal",label:"Sosyal",emoji:"👥"},
  {id:"sikinti",label:"Can Sıkıntısı",emoji:"😑"},
  {id:"odul",label:"Ödül",emoji:"🎉"},
];

function YemekGunlugu(){
  var today=new Date().toISOString().slice(0,10);
  var [selDate,setSelDate]=useState(today);
  var [entry,setEntry]=useState(null);
  var [editMode,setEditMode]=useState(false);
  var [form,setForm]=useState({ruhhal:1,aclik:3,nedenler:[],not:"",yemekler:[]});
  var [meals,setMeals]=useState([]);
  var [monthData,setMonthData]=useState({});
  var [aiAn,setAiAn]=useState(null);
  var [aiLd,setAiLd]=useState(false);
  var [view,setView]=useState("takvim");
  var [mealRatings,setMealRatings]=useState({});

  // Load month data for calendar
  useEffect(function(){
    var now=new Date();
    var days=[];
    var y=now.getFullYear(),mo=now.getMonth();
    var dim=new Date(y,mo+1,0).getDate();
    for(var i=1;i<=dim;i++) days.push(y+"-"+(String(mo+1).padStart(2,"0"))+"-"+(String(i).padStart(2,"0")));
    Promise.all(days.map(function(d){return stGet("journal:"+d).then(function(r){return [d,r];});})).then(function(rs){
      var md={};rs.forEach(function(r){if(r[1]) md[r[0]]=r[1];});setMonthData(md);
    });
  },[]);

  // Load selected date
  useEffect(function(){
    stGet("journal:"+selDate).then(function(e){setEntry(e||null);if(e) setMealRatings(e.ratings||{});else setMealRatings({});});
    stGet("nutri:"+selDate).then(function(m){setMeals(m||[]);});
  },[selDate]);

  async function saveEntry(){
    var e=Object.assign({},form,{date:selDate,savedAt:new Date().toISOString(),ratings:mealRatings});
    await stSet("journal:"+selDate,e);
    setEntry(e);setEditMode(false);
    setMonthData(function(p){var n=Object.assign({},p);n[selDate]=e;return n;});
  }

  function startEdit(){
    if(entry) setForm({ruhhal:entry.ruhhal||1,aclik:entry.aclik||3,nedenler:entry.nedenler||[],not:entry.not||"",yemekler:entry.yemekler||[]});
    else setForm({ruhhal:1,aclik:3,nedenler:[],not:"",yemekler:meals.map(function(m){return m.isim;})});
    setEditMode(true);
  }

  function toggleNeden(id){
    setForm(function(f){var n=f.nedenler.slice();var i=n.indexOf(id);if(i>-1) n.splice(i,1);else n.push(id);return Object.assign({},f,{nedenler:n});});
  }

  async function doAiAnaliz(){
    setAiLd(true);setAiAn(null);
    var entries=Object.values(monthData).filter(function(e){return e;});
    if(entries.length<3){alert("En az 3 günlük giriş gerekiyor.");setAiLd(false);return;}
    var summary=entries.map(function(e){
      return e.date.slice(5)+" ruhhal:"+RUHHAL[e.ruhhal||1].label+" aclik:"+e.aclik+" nedenler:"+(e.nedenler||[]).join(",");
    }).join(" | ");
    callAI("Beslenme psikologu. Bu aylık yemek gunlugu: "+summary+". JSON: genel_degerlendirme:string, duygusal_yeme_skoru:number(0-10), iyi_gun_sayisi:number, zor_gun_sayisi:number, pattern:[{baslik,aciklama}], oneriler:[string].",600)
      .then(function(r){setAiAn(r);setAiLd(false);}).catch(function(){setAiLd(false);});
  }

  // Calendar
  var now2=new Date();
  var y2=now2.getFullYear(),mo2=now2.getMonth();
  var firstDay=new Date(y2,mo2,1).getDay();
  var daysInMonth=new Date(y2,mo2+1,0).getDate();
  var AYLAR=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var GUNLER2=["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

  return <div style={{paddingBottom:80}}>
    <div style={{padding:"0 16px"}}>
      {/* View toggle */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["takvim","📅","Takvim"],["analiz","🧠","AI Analiz"]].map(function(t){
          var ac=view===t[0];
          return <button key={t[0]} onClick={function(){setView(t[0]);if(t[0]==="analiz") doAiAnaliz();}} style={{flex:1,padding:"8px",borderRadius:10,border:"1.5px solid "+(ac?"rgba(212,168,67,0.5)":"var(--border)"),background:ac?C.goldDim:"transparent",color:ac?C.goldL:C.muted,fontSize:12,fontWeight:ac?700:400}}>
            {t[1]} {t[2]}
          </button>;
        })}
      </div>

      {view==="takvim"&&<div>
        {/* Calendar Grid */}
        <div style={{background:"var(--card)",borderRadius:13,padding:"14px",border:"1px solid var(--border)",marginBottom:12}}>
          <div style={{textAlign:"center",fontSize:13,fontWeight:700,color:C.cream,marginBottom:10}}>
            {AYLAR[mo2]} {y2}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
            {GUNLER2.map(function(g){return <div key={g} style={{textAlign:"center",fontSize:9,color:C.dim,padding:"3px 0"}}>{g}</div>;})}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {Array.from({length:(firstDay===0?6:firstDay-1)}).map(function(_,i){return <div key={"e"+i}/>;})}
            {Array.from({length:daysInMonth}).map(function(_,i){
              var day=i+1;
              var dateStr=y2+"-"+(String(mo2+1).padStart(2,"0"))+"-"+(String(day).padStart(2,"0"));
              var e=monthData[dateStr];
              var isToday=dateStr===today;
              var isSel=dateStr===selDate;
              var rh=e?RUHHAL[e.ruhhal||1]:null;
              return <button key={day} onClick={function(){setSelDate(dateStr);setEditMode(false);}} style={{aspectRatio:"1",borderRadius:8,border:"1.5px solid "+(isSel?"rgba(212,168,67,0.6)":isToday?"rgba(212,168,67,0.25)":"transparent"),background:isSel?C.goldDim:e?(rh.col+"18"):"transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:0,position:"relative"}}>
                <span style={{fontSize:11,fontWeight:isToday||isSel?700:400,color:isSel?C.goldL:isToday?C.gold:C.muted}}>{day}</span>
                {e&&<span style={{fontSize:8}}>{rh.emoji}</span>}
                {isToday&&!e&&<div style={{width:4,height:4,borderRadius:"50%",background:C.gold,marginTop:1}}/>}
              </button>;
            })}
          </div>
          <div style={{display:"flex",gap:8,marginTop:10,justifyContent:"center",flexWrap:"wrap"}}>
            {RUHHAL.map(function(r){return <div key={r.label} style={{display:"flex",alignItems:"center",gap:3,fontSize:9,color:C.muted}}><span>{r.emoji}</span>{r.label}</div>;})}
          </div>
        </div>

        {/* Selected day */}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>
            {selDate===today?"Bugün":selDate.slice(5).replace("-","/")} — {entry?"Giriş var":"Giriş yok"}
          </div>

          {!editMode&&<div>
            {entry?<div className="up" style={{background:"var(--card)",borderRadius:13,border:"1px solid var(--border)",padding:"14px 16px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <span style={{fontSize:28}}>{RUHHAL[entry.ruhhal||1].emoji}</span>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:C.cream}}>{RUHHAL[entry.ruhhal||1].label}</div>
                  <div style={{fontSize:11,color:C.muted}}>Açlık seviyesi: {"⚫".repeat(entry.aclik||3)+"⚪".repeat(5-(entry.aclik||3))}</div>
                </div>
                <button onClick={startEdit} style={{marginLeft:"auto",padding:"5px 10px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:11}}>✏️ Düzenle</button>
              </div>
              {(entry.nedenler||[]).length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                {(entry.nedenler||[]).map(function(id){var n=NEDEN.find(function(x){return x.id===id;})||{emoji:"?",label:id};return <span key={id} style={{fontSize:11,padding:"3px 9px",borderRadius:50,background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.2)",color:C.gold}}>{n.emoji} {n.label}</span>;})}
              </div>}
              {entry.not&&<div style={{fontSize:12,color:C.muted,lineHeight:1.65,padding:"9px 11px",background:"var(--card2)",borderRadius:9,fontStyle:"italic"}}>"{entry.not}"</div>}
              {/* Meal ratings */}
              {meals.length>0&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:7}}>Yemek Puanları</div>
                {meals.map(function(m,i){var rat=mealRatings[m.isim]||0;return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:12,flex:1,color:C.cream}}>{m.isim}</span>
                  <div style={{display:"flex",gap:2}}>
                    {[1,2,3,4,5].map(function(s){return <span key={s} style={{fontSize:14,cursor:"pointer",opacity:s<=rat?1:0.25}}>⭐</span>;})}
                  </div>
                </div>;})}
              </div>}
            </div>:<div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>📝</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:14}}>{selDate===today?"Bugünü nasıl değerlendiriyorsun?":"Bu güne ait giriş yok."}</div>
              <button onClick={startEdit} style={{padding:"10px 22px",borderRadius:11,border:"none",background:"linear-gradient(135deg,"+C.gold+","+C.goldL+")",color:"#000",fontSize:13,fontWeight:700}}>
                {selDate===today?"✍️ Günlük Yaz":"📎 Giriş Ekle"}
              </button>
            </div>}
          </div>}

          {editMode&&<div className="up" style={{background:"var(--card)",borderRadius:13,border:"1px solid rgba(212,168,67,0.25)",padding:"15px 16px"}}>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.18em",marginBottom:12}}>
              {selDate===today?"Bugünkü Giriş":"Giriş — "+selDate.slice(5)}
            </div>
            {/* Ruh hali */}
            <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Nasıl hissediyorsun?</div>
            <div style={{display:"flex",gap:6,marginBottom:14}}>
              {RUHHAL.map(function(r,i){var sel=form.ruhhal===i;return <button key={i} onClick={function(){setForm(function(f){return Object.assign({},f,{ruhhal:i});});}} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"2px solid "+(sel?r.col+"88":"var(--border)"),background:sel?r.col+"15":"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <span style={{fontSize:20}}>{r.emoji}</span>
                <span style={{fontSize:9,color:sel?r.col:C.dim}}>{r.label}</span>
              </button>;})}
            </div>
            {/* Açlık */}
            <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Açlık seviyesi (bugün genel)</div>
            <div style={{display:"flex",gap:5,marginBottom:14}}>
              {[1,2,3,4,5].map(function(n){var sel=form.aclik>=n;return <button key={n} onClick={function(){setForm(function(f){return Object.assign({},f,{aclik:n});});}} style={{flex:1,padding:"8px",borderRadius:9,border:"1.5px solid "+(sel?"rgba(249,115,22,0.5)":"var(--border)"),background:sel?"rgba(249,115,22,0.1)":"transparent",fontSize:11,color:sel?C.orange:C.dim,fontWeight:sel?700:400}}>{n}</button>;})}
            </div>
            {/* Neden yedim */}
            <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Bugün neden yedim? (birden fazla seçilebilir)</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
              {NEDEN.map(function(n){var sel=(form.nedenler||[]).indexOf(n.id)!==-1;return <button key={n.id} onClick={function(){toggleNeden(n.id);}} style={{padding:"6px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(sel?"rgba(212,168,67,0.5)":"var(--border)"),background:sel?C.goldDim:"transparent",color:sel?C.goldL:C.muted,fontWeight:sel?600:400}}>
                {n.emoji} {n.label}
              </button>;})}
            </div>
            {/* Yemek puanları */}
            {meals.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Yemeklerini puanla</div>
              {meals.map(function(m,i){var rat=mealRatings[m.isim]||0;return <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,padding:"7px 10px",background:"var(--card2)",borderRadius:9}}>
                <span style={{fontSize:12,flex:1,color:C.cream}}>{m.isim}</span>
                <div style={{display:"flex",gap:3}}>
                  {[1,2,3,4,5].map(function(s){return <button key={s} onClick={function(){setMealRatings(function(p){var n=Object.assign({},p);n[m.isim]=s;return n;});}} style={{background:"transparent",border:"none",fontSize:16,cursor:"pointer",opacity:s<=rat?1:0.2,padding:2}}>⭐</button>;})}
                </div>
              </div>;})}
            </div>}
            {/* Not */}
            <div style={{fontSize:11,color:C.muted,marginBottom:7}}>Notlar (opsiyonel)</div>
            <textarea value={form.not} onChange={function(e){setForm(function(f){return Object.assign({},f,{not:e.target.value});});}} placeholder={"Bugün mercimek çorbası biraz tuzlu geldi, yarın daha az tuz koyacağım…"} rows={3} style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:12,lineHeight:1.6,resize:"vertical"}}/>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={function(){setEditMode(false);}} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>İptal</button>
              <button onClick={saveEntry} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,"+C.gold+","+C.goldL+")",color:"#000",fontSize:13,fontWeight:700}}>💾 Kaydet</button>
            </div>
          </div>}
        </div>

        {/* Recent entries */}
        {!editMode&&Object.keys(monthData).length>0&&<div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:600,marginBottom:8}}>Son Giriş</div>
          {Object.entries(monthData).sort(function(a,b){return b[0].localeCompare(a[0]);}).slice(0,3).map(function(kv){
            var e=kv[1],d=kv[0];var rh=RUHHAL[e.ruhhal||1];
            return <div key={d} onClick={function(){setSelDate(d);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",background:"var(--card)",borderRadius:11,border:"1px solid var(--border)",marginBottom:6,cursor:"pointer"}}>
              <span style={{fontSize:20}}>{rh.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:C.cream}}>{d===today?"Bugün":d.slice(5).replace("-","/")} — {rh.label}</div>
                {e.not&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{e.not.slice(0,50)}{e.not.length>50?"…":""}</div>}
              </div>
              {(e.nedenler||[]).length>0&&<div style={{display:"flex",gap:2}}>
                {(e.nedenler||[]).slice(0,2).map(function(id){var n=NEDEN.find(function(x){return x.id===id;})||{emoji:"?"};return <span key={id} style={{fontSize:14}}>{n.emoji}</span>;})}
              </div>}
            </div>;
          })}
        </div>}
      </div>}

      {view==="analiz"&&<div className="up">
        {aiLd&&<div style={{textAlign:"center",padding:"24px"}}><Spinner size={20} color={C.gold}/><div style={{fontSize:12,color:C.muted,marginTop:8}}>Aylık örüntüler analiz ediliyor…</div></div>}
        {!aiLd&&!aiAn&&<div style={{textAlign:"center",padding:"30px",background:"var(--card)",borderRadius:13,border:"1px solid var(--border)"}}>
          <div style={{fontSize:36,marginBottom:8}}>🧠</div>
          <div style={{fontSize:13,color:C.muted}}>En az 3 günlük giriş gerekiyor</div>
        </div>}
        {aiAn&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{background:"var(--card)",borderRadius:13,padding:"16px",border:"1px solid var(--border)",display:"flex",gap:12,alignItems:"center"}}>
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{fontSize:28,fontWeight:700,color:(aiAn.duygusal_yeme_skoru||0)>=7?C.red:(aiAn.duygusal_yeme_skoru||0)>=4?C.orange:C.green}}>{aiAn.duygusal_yeme_skoru||0}</div>
              <div style={{fontSize:9,color:C.muted}}>Duygusal Yeme</div>
              <div style={{fontSize:8,color:C.dim}}>/10</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,color:C.muted,lineHeight:1.65}}>{aiAn.genel_degerlendirme}</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{background:"rgba(76,175,122,0.08)",borderRadius:11,padding:"12px",border:"1px solid rgba(76,175,122,0.2)"}}>
              <div style={{fontSize:22,fontWeight:700,color:C.green}}>{aiAn.iyi_gun_sayisi||0}</div>
              <div style={{fontSize:10,color:C.muted}}>İyi gün</div>
            </div>
            <div style={{background:"rgba(224,82,82,0.08)",borderRadius:11,padding:"12px",border:"1px solid rgba(224,82,82,0.2)"}}>
              <div style={{fontSize:22,fontWeight:700,color:C.red}}>{aiAn.zor_gun_sayisi||0}</div>
              <div style={{fontSize:10,color:C.muted}}>Zor gün</div>
            </div>
          </div>
          {(aiAn.pattern||[]).length>0&&<div style={{background:"var(--card)",borderRadius:13,padding:"14px",border:"1px solid rgba(212,168,67,0.2)"}}>
            <div style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:600,marginBottom:9}}>🔍 Örüntüler</div>
            {(aiAn.pattern||[]).map(function(p,i){return <div key={i} style={{padding:"8px 10px",background:"var(--card2)",borderRadius:9,border:"1px solid var(--border)",marginBottom:6}}>
              <div style={{fontSize:12,fontWeight:700,color:C.cream,marginBottom:2}}>{p.baslik||p}</div>
              {p.aciklama&&<div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{p.aciklama}</div>}
            </div>;})}
          </div>}
          {(aiAn.oneriler||[]).length>0&&<div style={{background:"rgba(91,163,208,0.06)",borderRadius:13,padding:"14px",border:"1px solid rgba(91,163,208,0.2)"}}>
            <div style={{fontSize:10,color:C.blue,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:600,marginBottom:9}}>💡 Öneriler</div>
            {(aiAn.oneriler||[]).map(function(o,i){return <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid var(--border)"}}>
              <span style={{color:C.blue,fontSize:12,flexShrink:0}}>→</span>
              <span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{o}</span>
            </div>;})}
          </div>}
          <button onClick={function(){setAiAn(null);doAiAnaliz();}} style={{padding:"9px",borderRadius:9,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>↺ Yenile</button>
        </div>}
      </div>}
    </div>
  </div>;
}

function FavorilerTab(props){
  var [section,setSection]=useState("fav");
  var [history,setHistory]=useState(null);
  var [editingNoteFor,setEditingNoteFor]=useState(null);
  var [noteDraft,setNoteDraft]=useState("");
  useEffect(function(){stGet("menu_hist").then(function(h){setHistory(h||[]);});},[]);

  var favorites=props.favorites||[];
  var lists=props.lists||[];

  function removeFav(dish){ props.onToggleFav(dish); }

  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Koleksiyonum" title="Favoriler" desc="Kayıtlı yemekler, listeler ve geçmiş" col={C.red}/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["fav","❤️","Favori",""+favorites.length],["listeler","📋","Liste",""+lists.length],["gecmis","📅","Geçmiş",""],["gunluk","📖","Günlük",""]].map(function(t){
          var ac=section===t[0];
          return <button key={t[0]} onClick={function(){setSection(t[0]);}} style={{flex:1,padding:"9px 4px",borderRadius:11,border:"2px solid "+(ac?"rgba(224,82,82,0.5)":"var(--border)"),background:ac?"rgba(224,82,82,0.08)":"var(--card)",color:ac?C.red:C.muted,fontSize:11,fontWeight:ac?700:400,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:18}}>{t[1]}</span><span>{t[2]}</span>
            {t[3]?<span style={{fontSize:9,background:ac?"rgba(224,82,82,0.15)":"var(--card2)",padding:"1px 6px",borderRadius:50,color:ac?C.red:C.muted}}>{t[3]}</span>:null}
          </button>;
        })}
      </div>
      {props.onExportData&&<div style={{marginBottom:14,display:"flex",justifyContent:"flex-end"}}>
        <button onClick={props.onExportData} style={{padding:"7px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted,fontSize:11}}>📥 Verilerimi dışa aktar (JSON)</button>
      </div>}

      {section==="fav"&&<div>
        {favorites.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:10}}>🤍</div><div style={{fontSize:14,color:C.muted}}>Henüz favori tarifin yok</div><div style={{fontSize:12,color:"var(--dim)",marginTop:5,marginBottom:16}}>Menüden bir yemeğe kalp basarak ekleyebilirsin.</div>{props.onGoToMenu&&<button onClick={props.onGoToMenu} style={{padding:"12px 24px",borderRadius:12,border:"2px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:14,fontWeight:700}}>🍽️ Menüye Git</button>}</div>:
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {favorites.map(function(dish,i){
            var col=OGUN_COL[dish.ogun]||C.gold;
            return <div key={i} className="up" style={{animationDelay:i*0.04+"s",background:"var(--card)",borderRadius:13,padding:"13px 15px",border:"1px solid var(--border)",borderLeft:"4px solid "+col,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:3}}>{dish.isim}</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:5}}>
                  {dish.ogun?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:col+"18",color:col}}>{dish.ogun}</span>:null}
                  {dish.sure?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {dish.sure}</span>:null}
                  {dish.kalori?<span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔥 {dish.kalori}</span>:null}
                  <SkorBadge skor={calcSaglikSkor(dish)}/>
                </div>
                <div style={{marginBottom:4}}><StarRating value={dish.puan||0} onChange={function(n){if(props.onUpdateFavNote){var upd=Object.assign({},dish,{puan:n});props.onToggleFav(dish);setTimeout(function(){props.onToggleFav(upd);},50);}}} size={14}/></div>
                <p style={{fontSize:12,color:C.muted,fontStyle:"italic",lineHeight:1.5}}>{dish.aciklama}</p>
                {editingNoteFor===dish.isim?<div style={{marginTop:8}}><textarea value={noteDraft} onChange={function(e){setNoteDraft(e.target.value);}} placeholder="Az tuz, fırın 180°…" rows={2} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:12,resize:"none"}}/><div style={{display:"flex",gap:6,marginTop:6}}><button onClick={function(){props.onUpdateFavNote&&props.onUpdateFavNote(dish,noteDraft.trim());setEditingNoteFor(null);}} style={{padding:"5px 12px",borderRadius:8,fontSize:11,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL}}>Kaydet</button><button onClick={function(){setEditingNoteFor(null);setNoteDraft("");}} style={{padding:"5px 12px",borderRadius:8,fontSize:11,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted}}>İptal</button></div></div>:<div style={{marginTop:6}}>{dish.notlarim?<div style={{fontSize:11,color:C.gold,fontStyle:"italic",padding:"6px 10px",background:"rgba(212,168,67,0.08)",borderRadius:8,border:"1px solid rgba(212,168,67,0.2)"}}>📝 {dish.notlarim}</div>:null}<button onClick={function(){setEditingNoteFor(dish.isim);setNoteDraft(dish.notlarim||"");}} style={{marginTop:4,padding:"4px 10px",borderRadius:6,fontSize:10,border:"1px solid var(--border)",background:"transparent",color:C.muted}}>{dish.notlarim?"Notu düzenle":"📝 Not ekle"}</button></div>}
                {dish.savedAt?<div style={{fontSize:10,color:"var(--dim)",marginTop:4}}>Kaydedildi: {new Date(dish.savedAt).toLocaleDateString("tr-TR")}</div>:null}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <button onClick={function(){shareMenu(dish.isim+"\n"+dish.aciklama,"Favori Yemeğim");}} style={{padding:"5px 9px",borderRadius:8,fontSize:11,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted}}>📤</button>
                <button onClick={function(){removeFav(dish);}} style={{padding:"5px 9px",borderRadius:8,fontSize:11,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red}}>🗑</button>
              </div>
            </div>;
          })}
        </div>}
      </div>}

      {section==="listeler"&&<div>
        {lists.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:10}}>📋</div><div style={{fontSize:14,color:C.muted}}>Henüz liste yok</div><div style={{fontSize:12,color:"var(--dim)",marginTop:5}}>Tarif kartlarındaki 📋 butonu ile ekleyin</div></div>:
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {lists.map(function(lst,i){return <div key={i} style={{background:"var(--card)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,borderBottom:lst.dishes.length>0?"1px solid var(--border)":"none"}}>
              <div style={{fontSize:22}}>📋</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:C.cream}}>{lst.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{lst.dishes.length} yemek</div>
              </div>
            </div>
            {lst.dishes.map(function(d,j){return <div key={j} style={{padding:"9px 14px",borderBottom:j<lst.dishes.length-1?"1px solid var(--border)":"none",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:C.cream,flex:1}}>{d.isim}</span>
              {d.sure?<span style={{fontSize:10,color:C.muted}}>⏱ {d.sure}</span>:null}
            </div>;})}
          </div>;})}
        </div>}
      </div>}

      {section==="gecmis"&&<div>
        {!history?<div style={{textAlign:"center",padding:30}}><Spinner size={22}/></div>:
        history.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:10}}>📅</div><div style={{fontSize:14,color:C.muted}}>Henüz geçmiş yok</div><div style={{fontSize:12,color:"var(--dim)",marginTop:5}}>Menü oluşturdukça burada görünür</div></div>:
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {history.map(function(h,i){return <div key={i} className="up" style={{animationDelay:i*0.04+"s",background:"var(--card)",borderRadius:12,padding:"12px 14px",border:"1px solid var(--border)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,flexShrink:0,background:C.goldDim,border:"1px solid "+C.borderG,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🍽️</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:C.cream,marginBottom:2}}>{h.label||"Menü"}</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,color:C.muted}}>{h.date}</span>
                  {h.days?<span style={{fontSize:10,padding:"1px 6px",borderRadius:50,background:C.goldDim,color:C.gold}}>{h.days} gün</span>:null}
                  {h.dishes?<span style={{fontSize:10,padding:"1px 6px",borderRadius:50,background:"var(--card2)",color:C.muted}}>{h.dishes} yemek/gün</span>:null}
                  <span style={{fontSize:10,color:C.blue}}>{h.ogun}</span>
                </div>
              </div>
            </div>
          </div>;})}
        </div>}
      </div>}
      {section==="gunluk"&&<YemekGunlugu/>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: CHAT
// ══════════════════════════════════════════════════════════════
function ChatTab(){
  var [messages,setMessages]=useState([{role:"assistant",content:"Merhaba! Ben Master Chef AI 👨‍🍳\n\nYemek, tarif, beslenme veya mutfak hakkında her sorunuzu yanıtlarım. Nasıl yardımcı olabilirim?"}]);
  var [input,setInput]=useState("");
  var [loading,setLoading]=useState(false);
  var [listening,setListening]=useState(false);
  var bottomRef=useRef(null);
  var SpeechRecognition=typeof window!=="undefined"&&(window.SpeechRecognition||window.webkitSpeechRecognition);
  function startVoice(){
    if(!SpeechRecognition||listening||loading) return;
    var rec=new SpeechRecognition();rec.lang="tr-TR";rec.continuous=false;rec.interimResults=false;
    rec.onstart=function(){setListening(true);};
    rec.onend=function(){setListening(false);};
    rec.onresult=function(e){var t=e.results[0]&&e.results[0][0]?e.results[0][0].transcript:"";if(t){setInput(function(prev){return prev?prev+" "+t:t;});} setListening(false);};
    rec.onerror=function(){setListening(false);};
    try{rec.start();}catch(err){setListening(false);}
  }
  useEffect(function(){if(bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);
  function send(){
    if (!input.trim()||loading) return;
    var um={role:"user",content:input.trim()};
    setMessages(function(p){return p.concat([um]);});
    setInput("");setLoading(true);
    var apiMsgs=messages.concat([um]).map(function(m){return {role:m.role,content:m.content};});
    callAIText("Sen Master Chef AI'sın. Türkçe konuşan, deneyimli ve samimi bir şefsin. Yemek, tarif, beslenme ve mutfak teknikleri konularında yardım et. Motive edici ol ve emojiler kullan. Yanıtını düz metin olarak yaz, JSON döndürme.",apiMsgs,700)
      .then(function(r){var txt=typeof r==="string"?r:(r&&typeof r==="object"?(r.message||r.text||r.cevap||r.reply||r.answer||r.content||(r.sentiment&&r.topic?r.sentiment+" — "+r.topic:null)||JSON.stringify(r)):String(r)); setMessages(function(p){return p.concat([{role:"assistant",content:txt||"Yanıt alındı."}]);});})
      .catch(function(e){var msg=e.message||""; if(msg==="HTTP 404") msg="API proxy bulunamadı (404). Yerel için 'npm run dev' kullanın; canlıda Vercel'de api klasörünün dağıtıldığından emin olun."; setMessages(function(p){return p.concat([{role:"assistant",content:"⚠ Hata: "+msg}]);});})
      .finally(function(){setLoading(false);});
  }
  function retryLast(){var lastUserIdx=-1;for(var i=messages.length-1;i>=0;i--)if(messages[i].role==="user"){lastUserIdx=i;break;}if(lastUserIdx<0||messages.length<2||loading)return;var content=messages[lastUserIdx].content;var prevMsgs=messages.slice(0,lastUserIdx);var apiMsgs=prevMsgs.concat([{role:"user",content:content}]).map(function(m){return {role:m.role,content:m.content};});setMessages(prevMsgs.concat([{role:"user",content:content}]));setLoading(true);callAIText("Sen Master Chef AI'sın. Türkçe konuşan, deneyimli ve samimi bir şefsin. Yemek, tarif, beslenme ve mutfak teknikleri konularında yardım et. Motive edici ol ve emojiler kullan. Yanıtını düz metin olarak yaz, JSON döndürme.",apiMsgs,700).then(function(r){var txt=typeof r==="string"?r:(r&&typeof r==="object"?(r.message||r.text||r.cevap||r.reply||r.answer||r.content||(r.sentiment&&r.topic?r.sentiment+" — "+r.topic:null)||JSON.stringify(r)):String(r));setMessages(function(p){return p.concat([{role:"assistant",content:txt||"Yanıt alındı."}]);});}).catch(function(e){var msg=e.message||"";if(msg==="HTTP 404")msg="API proxy bulunamadı (404).";setMessages(function(p){return p.concat([{role:"assistant",content:"⚠ Hata: "+msg}]);});}).finally(function(){setLoading(false);});}
  var lastMsg=messages[messages.length-1];var isErrorMsg=lastMsg&&lastMsg.role==="assistant"&&typeof lastMsg.content==="string"&&(lastMsg.content.startsWith("⚠ Hata:")||lastMsg.content.startsWith("⚠️"));
  var QUICK=["🍝 Kolay makarna tarifi","🥗 Diyet için ne yemeliyim?","🍲 Artık yemekten ne yapabilirim?","🥩 Biftek nasıl pişirilir?","🫙 Domates sosu püf noktası"];
  return <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 70px)"}}>
    <div style={{background:"var(--card)",padding:"16px 20px 13px",borderBottom:"1px solid rgba(91,163,208,0.2)"}}>
      <div style={{fontSize:10,letterSpacing:"0.35em",color:C.blue,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>✦ AI Şef ✦</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:19,fontWeight:700,color:C.cream}}>Şef ile <em style={{color:"#93C5FD"}}>Konuş</em></h2>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"12px 16px 6px"}}>
      {messages.length===1&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {QUICK.map(function(q,i){return <button key={i} onClick={function(){setInput(q);}} style={{padding:"6px 11px",borderRadius:50,fontSize:11,border:"1.5px solid var(--border)",background:"var(--card)",color:C.muted}}>{q}</button>;})}
      </div>}
      {messages.map(function(m,i){var isUser=m.role==="user";return <div key={i} className="up" style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",marginBottom:9}}>
        <div style={{maxWidth:"86%",padding:"10px 14px",borderRadius:isUser?"13px 13px 3px 13px":"13px 13px 13px 3px",background:isUser?"linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.09))":"var(--card)",border:"1px solid "+(isUser?"rgba(212,168,67,0.28)":"var(--border)"),color:isUser?C.cream:"var(--cream)",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap"}}>
          {!isUser&&<div style={{fontSize:9,color:C.blue,fontWeight:700,letterSpacing:"0.12em",marginBottom:3}}>👨‍🍳 MASTER CHEF AI</div>}
          {typeof m.content==="string"?m.content:String(m.content)}
        </div>
      </div>;})}
      {isErrorMsg&&!loading&&<div style={{display:"flex",justifyContent:"flex-start",marginBottom:9}}><button onClick={retryLast} style={{padding:"6px 14px",borderRadius:9,border:"1px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tekrar dene</button></div>}
      {loading&&<div style={{display:"flex",justifyContent:"flex-start",marginBottom:9}}>
        <div style={{padding:"11px 15px",borderRadius:"13px 13px 13px 3px",background:"var(--card)",border:"1px solid var(--border)"}}>
          <div style={{display:"flex",gap:4}}>
            {[0,0.2,0.4].map(function(d,i){return <span key={i} style={{width:5,height:5,borderRadius:"50%",background:C.blue,animation:"pulse 1s "+d+"s infinite"}}/>;} )}
          </div>
        </div>
      </div>}
      <div ref={bottomRef}/>
    </div>
    <div style={{padding:"7px 16px 13px",borderTop:"1px solid var(--border)",background:"var(--bg)"}}>
      <div style={{display:"flex",gap:6}}>
        {SpeechRecognition&&<button onClick={startVoice} disabled={loading} title="Sesli soru" aria-label="Sesli soru sor" style={{width:44,height:44,borderRadius:10,border:"1.5px solid "+(listening?"rgba(224,82,82,0.5)":"var(--border)"),background:listening?"rgba(224,82,82,0.1)":"var(--card)",color:listening?C.red:C.muted,fontSize:18,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>🎤</button>}
        <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Sorunuzu yazın…" style={{flex:1,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 14px",color:C.cream,fontSize:13,outline:"none"}} aria-label="Mesaj yaz"/>
        <button onClick={send} disabled={loading||!input.trim()} style={{width:44,height:44,borderRadius:10,border:"1.5px solid rgba(91,163,208,0.4)",background:loading||!input.trim()?"transparent":"rgba(91,163,208,0.12)",color:loading||!input.trim()?"var(--dim)":C.blue,fontSize:16,flexShrink:0}} aria-label="Gönder">➤</button>
      </div>
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// TAB: HİKAYESİ OLAN YEMEKLER
// ══════════════════════════════════════════════════════════════
var HIKAYE_MUTFAKLAR=[{id:"turk",label:"Türk",emoji:"🫕"},{id:"italyan",label:"İtalyan",emoji:"🍕"},{id:"fransiz",label:"Fransız",emoji:"🥐"},{id:"japon",label:"Japon",emoji:"🍜"},{id:"hint",label:"Hint",emoji:"🍛"},{id:"akdeniz",label:"Akdeniz",emoji:"🐟"},{id:"meksika",label:"Meksika",emoji:"🌮"},{id:"karisik",label:"Hepsinden karışık",emoji:"🌍"}];
function HikayeTab(props){
  var [mutfak,setMutfak]=useState("turk");
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState(null);
  var [yemekler,setYemekler]=useState(null);
  var [acik,setAcik]=useState(null);
  function getir(){
    setError(null);setYemekler(null);setLoading(true);
    var mutfakLabel=HIKAYE_MUTFAKLAR.find(function(m){return m.id===mutfak;});
    var mutfakAdi=mutfakLabel?mutfakLabel.label:"Türk";
    var prompt="Sen yemek kültürü uzmanısın. "+mutfakAdi+" mutfağından (veya karışık seçildiyse dünya mutfaklarından) hikayesi olan, nerede meşhur olduğu bilinen, nasıl yapıldığı ve özelliği anlatılabilecek 4 yemek seç. Her biri için: isim (Türkçe), nerede_meşhur (şehir/bölge/ülke), hikaye (2-4 cümle, kökeni/efsanesi), nasil_yapilir (kısa özet, 1-2 cümle), ozellik (neyle ünlü, tadı, sunumu). Sadece JSON döndür. JSON formatı: {\"yemekler\":[{\"isim\":\"string\",\"nerede_meşhur\":\"string\",\"hikaye\":\"string\",\"nasil_yapilir\":\"string\",\"ozellik\":\"string\"}]}";
    callAI(prompt,1000).then(function(r){
      var list=r&&r.yemekler?r.yemekler:Array.isArray(r)?r:[];
      setYemekler(list.length?list:null);
      if(list.length) setAcik(0); else setError("Yemek listesi alınamadı.");
    }).catch(function(e){setError(e.message||"Hata oluştu.");}).finally(function(){setLoading(false);});
  }
  return <div style={{paddingBottom:80}}>
    <div style={{background:"var(--card)",padding:"20px 20px 16px",borderBottom:"1px solid rgba(212,168,67,0.2)"}}>
      <div style={{fontSize:10,letterSpacing:"0.35em",color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>✦ Hikaye Serisi ✦</div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.cream,marginBottom:4}}>Hikayesi Olan <em style={{color:C.goldL}}>Yemekler</em></h2>
      <p style={{fontSize:12,color:C.muted}}>Nerede meşhur, nasıl yapılıyor, özelliği ne? Her yemeğin kısa hikayesi.</p>
    </div>
    <div style={{padding:"16px"}}>
      <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:10}}>Mutfak seç</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
        {HIKAYE_MUTFAKLAR.map(function(m){var ac=mutfak===m.id;return <button key={m.id} onClick={function(){setMutfak(m.id);setYemekler(null);setError(null);}} style={{padding:"8px 14px",borderRadius:10,border:"1.5px solid "+(ac?C.gold:"var(--border)"),background:ac?C.goldDim:"var(--card)",color:ac?C.goldL:C.muted,fontSize:12,fontWeight:ac?700:400}}>{m.emoji} {m.label}</button>;})}
      </div>
      <ErrBox msg={error} onRetry={getir}/>
      <button onClick={getir} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:13,border:"2px solid rgba(212,168,67,0.5)",background:loading?"rgba(212,168,67,0.06)":"linear-gradient(135deg,rgba(212,168,67,0.22),rgba(212,168,67,0.08))",color:loading?"#666":C.goldL,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        {loading?<><Spinner size={18}/> Hikayeler getiriliyor…</>:"📜 Hikayeli yemekler getir"}
      </button>
      {yemekler&&yemekler.length>0&&<div style={{marginTop:20,display:"flex",flexDirection:"column",gap:12}}>
        {yemekler.map(function(y,i){var isOpen=acik===i;return <div key={i} className="up" style={{animationDelay:i*0.05+"s",background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden"}}>
          <button onClick={function(){setAcik(acik===i?null:i);}} style={{width:"100%",padding:"14px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:12,border:"none",background:"transparent",color:C.cream,cursor:"pointer"}}>
            <span style={{fontSize:24}}>🍽️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{y.isim||"Yemek"}</div>
              <div style={{fontSize:11,color:C.gold,marginTop:2}}>📍 {y.nerede_meşhur||"—"}</div>
            </div>
            <span style={{fontSize:18,color:C.muted,transform:isOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▼</span>
          </button>
          {isOpen&&<div style={{padding:"0 16px 16px",borderTop:"1px solid var(--border)"}}>
            {y.hikaye&&<div style={{marginTop:12}}><div style={{fontSize:10,color:C.gold,letterSpacing:"0.12em",marginBottom:6}}>HİKAYE</div><p style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{y.hikaye}</p></div>}
            {y.nasil_yapilir&&<div style={{marginTop:12}}><div style={{fontSize:10,color:C.blue,letterSpacing:"0.12em",marginBottom:6}}>NASIL YAPILIR</div><p style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{y.nasil_yapilir}</p></div>}
            {y.ozellik&&<div style={{marginTop:12}}><div style={{fontSize:10,color:C.purple,letterSpacing:"0.12em",marginBottom:6}}>ÖZELLİĞİ</div><p style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{y.ozellik}</p></div>}
          </div>}
        </div>;})}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
function Auth(props){
  var [mode,setMode]=useState("login");
  var [un,setUn]=useState("");
  var [pw,setPw]=useState("");
  var [pw2,setPw2]=useState("");
  var [err,setErr]=useState("");
  var [ld,setLd]=useState(false);
  function go(){
    setErr("");
    if (!un.trim()||!pw.trim()){setErr("Kullanıcı adı ve şifre girin.");return;}
    setLd(true);
    var key="u:"+un.trim().toLowerCase();
    if (mode==="register"){
      if (pw!==pw2){setErr("Şifreler eşleşmiyor.");setLd(false);return;}
      stGet(key).then(function(ex){
        if (ex){setErr("Bu kullanıcı adı alınmış.");setLd(false);return;}
        stSet(key,{pw:pw}).then(function(){props.onLogin(un.trim().toLowerCase(),false);});
      }).catch(function(e){setErr(e.message);setLd(false);});
    }else{
      stGet(key).then(function(u){
        if (!u||u.pw!==pw){setErr("Hatalı giriş.");setLd(false);return;}
        props.onLogin(un.trim().toLowerCase(),false);
      }).catch(function(e){setErr(e.message);setLd(false);});
    }
  }
  return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
    <div style={{position:"absolute",top:"-10vh",left:"50%",transform:"translateX(-50%)",width:"80vw",height:"60vh",background:"radial-gradient(ellipse,rgba(212,168,67,0.07) 0%,transparent 70%)",pointerEvents:"none"}}/>
    <div className="up" style={{width:"100%",maxWidth:400,position:"relative",zIndex:1}}>
      <div style={{textAlign:"center",marginBottom:26}}>
        <div style={{fontSize:55,marginBottom:9}}>👨‍🍳</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:700,color:C.cream,margin:"0 0 5px",lineHeight:1.2}}>Master Chef<br/><em style={{color:C.goldL,fontWeight:400}}>Planner</em></h1>
        <p style={{fontSize:12,color:C.muted}}>Kişisel yapay zeka şefiniz</p>
        <div style={{width:36,height:2,background:"linear-gradient(90deg,transparent,"+C.gold+",transparent)",margin:"10px auto"}}/>
      </div>
      <button onClick={function(){props.onLogin("misafir",true);}} style={{width:"100%",padding:"14px",borderRadius:13,border:"2px solid "+C.borderG,background:"linear-gradient(135deg,rgba(212,168,67,0.18),rgba(212,168,67,0.06))",color:C.goldL,fontSize:14,fontWeight:600,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:9}}>
        <span style={{fontSize:20}}>👤</span> Misafir Olarak Dene →
      </button>
      <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
        <div style={{flex:1,height:1,background:"var(--border)"}}/><span style={{fontSize:11,color:C.muted}}>veya hesabınla</span><div style={{flex:1,height:1,background:"var(--border)"}}/>
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:13,padding:18}}>
        <div style={{display:"flex",gap:4,marginBottom:14,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:3}}>
          {[["login","🔑 Giriş"],["register","✨ Kayıt"]].map(function(m){return <button key={m[0]} onClick={function(){setMode(m[0]);setErr("");}} style={{flex:1,padding:"7px",borderRadius:6,border:"none",fontSize:12,background:mode===m[0]?C.goldDim:"transparent",color:mode===m[0]?C.goldL:C.muted,fontWeight:mode===m[0]?600:400}}>{m[1]}</button>;})}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[{icon:"👤",ph:"Kullanıcı adı",val:un,set:setUn,type:"text"},{icon:"🔒",ph:"Şifre",val:pw,set:setPw,type:"password"}].concat(mode==="register"?[{icon:"🔒",ph:"Şifre tekrar",val:pw2,set:setPw2,type:"password"}]:[]).map(function(f,i){return <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 13px",background:"var(--card2)",border:"1.5px solid var(--border)",borderRadius:10}}>
            <span style={{fontSize:15,flexShrink:0}}>{f.icon}</span>
            <input type={f.type} placeholder={f.ph} value={f.val} onChange={function(e){f.set(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter") go();}} style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.cream,fontSize:12}}/>
          </div>;})}
          {err?<div style={{fontSize:12,color:C.red,padding:"7px 11px",background:"rgba(224,82,82,0.08)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}>{err}</div>:null}
          <button onClick={go} disabled={ld} style={{padding:"11px",borderRadius:10,border:"1.5px solid rgba(212,168,67,0.35)",background:ld?"rgba(212,168,67,0.03)":"linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.07))",color:ld?"#444":C.goldL,fontSize:13,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {ld?<span style={{display:"flex",alignItems:"center",gap:6}}><Spinner size={12}/>İşleniyor…</span>:mode==="login"?"Giriş Yap":"Hesap Oluştur"}
          </button>
        </div>
      </div>
    </div>
  </div>;
}



// ══════════════════════════════════════════════════════════════
// KÜR MODÜLÜ — ÇOK KATMANLI TIP EKOLLERİ
// ══════════════════════════════════════════════════════════════

const KUR_HEDEFLER=[
  {id:"temizlik",label:"Detoks & Temizlik",emoji:"🧹",desc:"Bağırsak, karaciğer, böbrek"},
  {id:"bagisiklik",label:"Bağışıklık",emoji:"🛡️",desc:"Savunma sistemini güçlendir"},
  {id:"enerji",label:"Enerji & Canlılık",emoji:"⚡",desc:"Yorgunluk, halsizlik, vitalite"},
  {id:"sindirim",label:"Sindirim & Bağırsak",emoji:"🫃",desc:"Şişkinlik, gaz, bağırsak florası"},
  {id:"inflamasyon",label:"İnflamasyon Azaltma",emoji:"🔥",desc:"Eklem, kronik ağrı, ödem"},
  {id:"zihin",label:"Zihin & Odaklanma",emoji:"🧠",desc:"Beyin sisi, konsantrasyon, hafıza"},
  {id:"uyku",label:"Uyku Kalitesi",emoji:"🌙",desc:"Uykusuzluk, derin uyku"},
  {id:"kilo",label:"Metabolizma & Kilo",emoji:"⚖️",desc:"Hızlandırma, denge, yağ yakımı"},
  {id:"cilt",label:"Cilt & Saç",emoji:"✨",desc:"Akne, soluk cilt, saç dökülmesi"},
  {id:"hormon",label:"Hormon Dengesi",emoji:"🌀",desc:"Stres, kortizol, tiroid"},
  {id:"kalp",label:"Kalp & Damar",emoji:"❤️",desc:"Kolesterol, tansiyon, dolaşım"},
  {id:"eklem",label:"Eklem & Kas",emoji:"🦴",desc:"Artrit, sertlik, kasılma"},
];

const KUR_EKOLLER=[
  {id:"ibni_sina",label:"İbn-i Sina",emoji:"📜",col:"#D4A843",desc:"El-Kanun · 4 Hümor · Mizaç tedavisi"},
  {id:"tibbi_nebevi",label:"Tıbbı Nebevi",emoji:"☪️",col:"#4CAF7A",desc:"Hz. Peygamber öğretisi · Şifalı bitkiler"},
  {id:"cin",label:"Çin Tıbbı (TCM)",emoji:"☯️",col:"#E05252",desc:"5 Element · Yin-Yang · Qi dengesi"},
  {id:"ayurveda",label:"Ayurveda",emoji:"🪷",col:"#F97316",desc:"Dosha dengesi · Vata-Pitta-Kapha · Prana"},
  {id:"modern",label:"Fonksiyonel Tıp",emoji:"🔬",col:"#5BA3D0",desc:"Kanıta dayalı · Besin biyokimyası"},
  {id:"akdeniz",label:"Akdeniz Tıbbı",emoji:"🫒",col:"#2DD4BF",desc:"Zeytinyağı · Bitkisel zenginlik"},
];

const KUR_SURE=[
  {id:"7",label:"7 Gün",emoji:"⚡",desc:"Hızlı başlangıç"},
  {id:"21",label:"21 Gün",emoji:"🔄",desc:"Alışkanlık kürü"},
  {id:"40",label:"40 Gün",emoji:"🌱",desc:"Derin dönüşüm"},
  {id:"90",label:"3 Ay",emoji:"🏆",desc:"Kalıcı değişim"},
];

const KUR_YAS=[
  {id:"18-25",label:"18–25"},
  {id:"26-35",label:"26–35"},
  {id:"36-45",label:"36–45"},
  {id:"46-55",label:"46–55"},
  {id:"56+",label:"56+"},
];

const KUR_AKTIVITE=[
  {id:"sedanter",label:"Sedanter (masa başı)"},
  {id:"hafif",label:"Hafif aktif (yürüyüş)"},
  {id:"orta",label:"Orta aktif (haftada 3–4 egzersiz)"},
  {id:"aktif",label:"Aktif (haftada 5+ egzersiz)"},
];

const KUR_KISITLAR=[
  {id:"vejetaryen",label:"🥦 Vejetaryen"},
  {id:"vegan",label:"🌱 Vegan"},
  {id:"glutensiz",label:"🌾 Glütensiz"},
  {id:"laktoz",label:"🥛 Laktozsuz"},
  {id:"seker_yok",label:"🍬 Şeker tüketmiyorum"},
  {id:"et_yok",label:"🥩 Kırmızı et yemiyorum"},
];

const KUR_KRONIK=[
  {id:"diyabet",label:"💉 Diyabet"},
  {id:"tansiyon",label:"❤️ Yüksek tansiyon"},
  {id:"tiroid",label:"🦋 Tiroid hastalığı"},
  {id:"kolon",label:"🫃 İBS / Kolon"},
  {id:"karaciger",label:"🫀 Karaciğer sorunu"},
  {id:"bobrek",label:"💧 Böbrek sorunu"},
  {id:"osteoporoz",label:"🦴 Osteoporoz"},
  {id:"depresyon",label:"🧠 Depresyon / Anksiyete"},
];

function KurDetay({kur}){
  // Normalize protocol fields (support both flat and nested schema)
  if(kur.protokol&&!kur.sabah_protokolu){
    kur=Object.assign({},kur,{
      sabah_protokolu:kur.protokol.sabah||[],
      ogle_protokolu:kur.protokol.ogle||[],
      aksam_protokolu:kur.protokol.aksam||[],
      gece_protokolu:kur.protokol.gece||[]
    });
  }
  if(kur.beslenme&&!kur.yiyecekler){kur=Object.assign({},kur,{yiyecekler:kur.beslenme});}
  var renk=kur.ekol_renk||C.gold;
  var [acikBlok,setAcikBlok]=useState("sabah");
  var protokoller=[
    {id:"sabah",label:"☀️ Sabah",data:kur.sabah_protokolu},
    {id:"ogle",label:"🌤 Öğle",data:kur.ogle_protokolu},
    {id:"aksam",label:"🌆 Akşam",data:kur.aksam_protokolu},
    {id:"gece",label:"🌙 Gece",data:kur.gece_protokolu},
  ].filter(function(p){return p.data&&p.data.length>0;});
  return <div className="up" style={{background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden",marginBottom:16}}>
    <div style={{padding:"14px 16px",background:"linear-gradient(135deg,rgba(212,168,67,0.08),transparent)",borderBottom:"1px solid var(--border)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{fontSize:28}}>{kur.ekol_emoji||"🌿"}</span>
        <div><div style={{fontSize:15,fontWeight:700,color:renk,fontFamily:"'Playfair Display',serif"}}>{kur.ekol}</div><div style={{fontSize:10,color:C.dim}}>{kur.sure}</div></div>
      </div>
      <div style={{fontSize:12,color:C.muted,lineHeight:1.7,padding:"9px 12px",background:"rgba(255,255,255,0.03)",borderRadius:9,border:"1px solid var(--border)"}}>{kur.felsefe}</div>
    </div>
    <div style={{padding:"12px 16px"}}>
      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>Günlük Protokol</div>
      <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
        {protokoller.map(function(p){var on=acikBlok===p.id;return <button key={p.id} onClick={function(){setAcikBlok(p.id);}} style={{flex:1,minWidth:60,padding:"6px 4px",borderRadius:8,border:"1px solid "+(on?renk:"var(--border)"),background:on?"rgba(212,168,67,0.07)":"transparent",color:on?renk:C.dim,fontSize:10,fontWeight:on?700:400}}>{p.label}</button>;})}
      </div>
      {protokoller.filter(function(p){return p.id===acikBlok;}).map(function(p){return <div key={p.id}>{(p.data||[]).map(function(adim,i){return <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1.5px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:C.gold,flexShrink:0}}>{i+1}</div><div style={{fontSize:13,color:C.muted,lineHeight:1.6,paddingTop:2}}>{adim}</div></div>;})} </div>;})}
    </div>
    {kur.bitkiler&&kur.bitkiler.length>0&&<div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>🌿 Bitkisel Protokol</div>
      {(kur.bitkiler||[]).map(function(b,i){return <div key={i} style={{padding:"9px 11px",background:"rgba(76,175,122,0.05)",borderRadius:9,border:"1px solid rgba(76,175,122,0.15)",marginBottom:5}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}><span style={{fontSize:12,fontWeight:700,color:C.green}}>{b.isim}</span><span style={{fontSize:10,color:C.dim,padding:"1px 6px",borderRadius:50,background:"rgba(76,175,122,0.1)"}}>{b.zaman}</span></div>
        <div style={{fontSize:11,color:C.muted}}>{b.kullanim} — <span style={{color:C.gold}}>{b.doz}</span></div>
      </div>;})}
    </div>}
    {kur.yiyecekler&&<div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{padding:"10px",background:"rgba(76,175,122,0.05)",borderRadius:10,border:"1px solid rgba(76,175,122,0.2)"}}><div style={{fontSize:9,color:C.green,fontWeight:700,marginBottom:5}}>✅ TÜKET</div><div style={{fontSize:11,color:C.muted,lineHeight:1.7}}>{kur.yiyecekler.tuketime}</div></div>
        <div style={{padding:"10px",background:"rgba(224,82,82,0.05)",borderRadius:10,border:"1px solid rgba(224,82,82,0.2)"}}><div style={{fontSize:9,color:C.red,fontWeight:700,marginBottom:5}}>🚫 KAÇIN</div><div style={{fontSize:11,color:C.muted,lineHeight:1.7}}>{kur.yiyecekler.kacinilacak}</div></div>
      </div>
    </div>}
    {kur.yasam_tarz&&kur.yasam_tarz.length>0&&<div style={{padding:"12px 16px",borderTop:"1px solid var(--border)"}}>
      <div style={{fontSize:9,color:"#5BA3D0",textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>💫 Yaşam Tarzı</div>
      {(kur.yasam_tarz||[]).map(function(y,i){return <div key={i} style={{display:"flex",gap:10,marginBottom:6}}><span style={{color:"#5BA3D0",flexShrink:0,fontSize:14}}>○</span><span style={{fontSize:13,color:C.muted,lineHeight:1.5}}>{y}</span></div>;})}
    </div>}
    <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {kur.beklenen_sonuc&&<div style={{padding:"9px 10px",background:"rgba(212,168,67,0.05)",borderRadius:9,border:"1px solid rgba(212,168,67,0.15)"}}><div style={{fontSize:9,color:C.gold,fontWeight:700,marginBottom:3}}>⏳ BEKLENEN SONUÇ</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{kur.beklenen_sonuc}</div></div>}
      {kur.dikkat&&<div style={{padding:"9px 10px",background:"rgba(224,82,82,0.05)",borderRadius:9,border:"1px solid rgba(224,82,82,0.15)"}}><div style={{fontSize:9,color:C.red,fontWeight:700,marginBottom:3}}>⚠️ DİKKAT</div><div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{kur.dikkat}</div></div>}
    </div>
    {kur.kritik_kural&&<div style={{padding:"11px 16px",borderTop:"1px solid var(--border)",background:"rgba(212,168,67,0.04)"}}><div style={{fontSize:11,color:C.gold,fontStyle:"italic",lineHeight:1.6}}>🔑 "{kur.kritik_kural}"</div></div>}
  </div>;
}

function KurTab(){
  var [step,setStep]=useState(1);
  var [hedefler,setHedefler]=useState({});
  var [ekoller,setEkoller]=useState({});
  var [sure,setSure]=useState("21");
  var [sorun,setSorun]=useState("");
  // Profile state
  var [cinsiyet,setCinsiyet]=useState("");
  var [yas,setYas]=useState("");
  var [aktivite,setAktivite]=useState("");
  var [kisitlar,setKisitlar]=useState({});
  var [kronik,setKronik]=useState({});
  var [hamileMi,setHamileMi]=useState(false);
  var [stresGun,setStresGun]=useState("");
  // App state
  var [loading,setLoading]=useState(false);
  var [result,setResult]=useState(null);
  var [error,setError]=useState(null);
  var [acikEkol,setAcikEkol]=useState(null);
  var [savedKurler,setSavedKurler]=useState([]);
  var [showSaved,setShowSaved]=useState(false);
  var kurSonucRef=useRef(null);

  useEffect(function(){
    stGet("kurler").then(function(d){if(d) setSavedKurler(d);});
  },[]);
  useEffect(function(){
    if(step===3&&result&&kurSonucRef.current){kurSonucRef.current.scrollIntoView({behavior:"smooth",block:"start"});}
  },[step,result]);

  var secHedefler=Object.keys(hedefler).filter(function(k){return hedefler[k];});
  var secEkoller=Object.keys(ekoller).filter(function(k){return ekoller[k];});
  var secKisitlar=Object.keys(kisitlar).filter(function(k){return kisitlar[k];});
  var secKronik=Object.keys(kronik).filter(function(k){return kronik[k];});

  function toggleMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}

  var [loadingEkol,setLoadingEkol]=useState("");
  var [adimlar,setAdimlar]=useState([]);

  async function generate(){
    if(!sorun.trim()||secHedefler.length===0){setError("Lütfen en az 1 hedef seçin ve sorunuzu yazın.");return;}
    setLoading(true);setError(null);setResult(null);setAcikEkol(null);setLoadingEkol("");
    var eListPre=secEkoller.length>0?secEkoller.map(function(k){return KUR_EKOLLER.find(function(x){return x.id===k;})||{label:k};}):KUR_EKOLLER;
    var initSteps=[{label:"Profil ve hedefler analiz ediliyor",durum:"bekliyor"}];
    eListPre.forEach(function(e){initSteps.push({label:(e.label||e.id)+" kürü hazırlanıyor",durum:"bekliyor"});});
    initSteps.push({label:"Genel özet ve sinerji analizi",durum:"bekliyor"});
    initSteps.push({label:"Kür programı hazır ✨",durum:"bekliyor"});
    setAdimlar(initSteps);
    var hLabels=secHedefler.map(function(k){return (KUR_HEDEFLER.find(function(x){return x.id===k;})||{label:k}).label;}).join(", ");
    var eList=secEkoller.length>0?secEkoller.map(function(k){return KUR_EKOLLER.find(function(x){return x.id===k;})||{id:k,label:k};}):KUR_EKOLLER;
    var profil="Yaş:"+(yas||"?")+", Cinsiyet:"+(cinsiyet||"?")+", Aktivite:"+(aktivite||"?")+(secKisitlar.length?" Kısıt:"+secKisitlar.join(","):"")+(secKronik.length?" Kronik:"+secKronik.join(","):"")+(hamileMi?" Hamile":"")+(stresGun?" Stres:"+stresGun+"/10":"");
    function updAdimByLabel(label,durum){
      setAdimlar(function(prev){
        var idx=prev.findIndex(function(a){return a.label===label;});
        if(idx>=0){var n=prev.slice();n[idx]={label:label,durum:durum};return n;}
        return prev;
      });
    }
    var collected=[];
    try{
      updAdimByLabel("Profil ve hedefler analiz ediliyor","aktif");
      await sleep(300);
      updAdimByLabel("Profil ve hedefler analiz ediliyor","tamam");
      for(var ei=0;ei<eList.length;ei++){
        var ekol=eList[ei];
        var ekolAdi=ekol.label||ekol.id;
        var ekolRenk=ekol.col||"#D4A843";
        var eLabel=ekolAdi+" kürü hazırlanıyor";
        updAdimByLabel(eLabel,"aktif");
        setLoadingEkol(ekolAdi);
        // Ultra minimal system prompt
        var sys="Sen "+ekolAdi+" uzmanısın. Sadece JSON döndür, başka hiçbir şey yazma.";
        // Minimal user prompt - fields with ? placeholder, no long example values
        var usr="Sorun:"+sorun+"\nHedef:"+hLabels+"\nProfil:"+profil+"\nSüre:"+sure+"gün\n\nJSON (her değer max 8 kelime, liste max 3 madde):\n{\"ekol\":\""+ekolAdi+"\",\"ekol_emoji\":\"?\",\"ekol_renk\":\""+ekolRenk+"\",\"sure\":\""+sure+" gün\",\"felsefe\":\"?\",\"protokol\":{\"sabah\":[\"?\"],\"ogle\":[\"?\"],\"aksam\":[\"?\"],\"gece\":[\"?\"]},\"beslenme\":{\"tuketime\":\"?\",\"kacinilacak\":\"?\"},\"bitkiler\":[{\"isim\":\"?\",\"doz\":\"?\",\"zaman\":\"?\"}],\"yasam_tarz\":[\"?\"],\"kritik_kural\":\"?\",\"dikkat\":\"?\"}";
        var res=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:sys,messages:[{role:"user",content:usr},{role:"assistant",content:"{"}]})});
        if(!res.ok){var em=await res.text();throw new Error("API hata: "+res.status);}
        var body=await res.json();
        var rawText="{"+(body.content||[]).map(function(b){return b.text||"";}).join("").trim();
        var parsed=parseJSON(rawText);
        if(!parsed||typeof parsed!=="object")throw new Error(ekolAdi+" yanıtı işlenemedi");
        if(!parsed.ekol)parsed.ekol=ekolAdi;
        if(!parsed.ekol_renk)parsed.ekol_renk=ekolRenk;
        // Normalize protokol -> sabah/ogle/aksam/gece arrays
        if(parsed.protokol&&!parsed.sabah_protokolu){
          parsed.sabah_protokolu=parsed.protokol.sabah||[];
          parsed.ogle_protokolu=parsed.protokol.ogle||[];
          parsed.aksam_protokolu=parsed.protokol.aksam||[];
          parsed.gece_protokolu=parsed.protokol.gece||[];
        }
        if(parsed.beslenme&&!parsed.yiyecekler){parsed.yiyecekler=parsed.beslenme;}
        collected.push(parsed);
        updAdimByLabel(eLabel,"tamam");
      }
      updAdimByLabel("Genel özet ve sinerji analizi","aktif");
      setLoadingEkol("Özet hazırlanıyor");
      var cokluKur=collected.length>1;
      var sumPrompt="Kürler:"+collected.map(function(k){return k.ekol;}).join(",")+". Sorun:"+sorun+"\nJSON:{\"baslik\":\"?\",\"ozet\":\"?\",\"genel_oneriler\":[\"?\",\"?\",\"?\"],\"sinerji\":\"?\"}";
      if(cokluKur){
        sumPrompt="Aşağıdaki "+collected.length+" farklı tıp ekolünden kür programları var. Hepsinin ortak özelliklerini ve her ekolün kendine özgü farklarını çıkar. Kürler:"+collected.map(function(k){return k.ekol;}).join(", ")+". Sorun:"+sorun+"\nJSON (Türkçe, kısa maddeler): {\"baslik\":\"?\",\"ozet\":\"?\",\"genel_oneriler\":[\"?\",\"?\",\"?\"],\"sinerji\":\"?\",\"ortak_ozellikler\":[\"?\",\"?\",\"?\"],\"farklar\":[{\"ekol\":\"ekol adı\",\"ozellikler\":[\"?\",\"?\"]}]}";
      }
      var sumRes=await fetch(apiUrl("v1/messages"),{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:cokluKur?700:400,system:"Bütünleştirici hekim. Sadece JSON.",messages:[{role:"user",content:sumPrompt},{role:"assistant",content:"{"}]})});
      var sumBody=await sumRes.json();
      var sumRaw="{"+(sumBody.content||[]).map(function(b){return b.text||"";}).join("").trim();
      var sumP=parseJSON(sumRaw);
      updAdimByLabel("Genel özet ve sinerji analizi","tamam");
      updAdimByLabel("Kür programı hazır ✨","tamam");
      var finalResult=Object.assign({baslik:sorun.slice(0,30)+" Kür Programı",ozet:"",genel_oneriler:[],sinerji:""},sumP||{},{kurler:collected});
      setResult(finalResult);
      setStep(3);
      var newSaved=[{id:Date.now(),sorun:sorun,hedefler:hLabels,tarih:new Date().toLocaleDateString("tr-TR"),sure:sure,kur:finalResult},...(savedKurler||[]).slice(0,9)];
      setSavedKurler(newSaved);stSet("kurler",newSaved);
    }catch(e){setError(e.message||"Hata oluştu, tekrar dene");}
    finally{setLoading(false);setLoadingEkol("");}
  }


  // ── STEP 1: HEDEF ────────────────────────────────────────────
  if(step===1) return <div style={{paddingBottom:68}}>
    <TabHeader sub="Şifa Kürü" title="Ne için kür hazırlayalım?" isDark={true}/>
    <div style={{padding:"0 16px"}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:14,lineHeight:1.7}}>Kür hedefini seç, ardından sorununu ve profilini anlat. Farklı tıp ekollerinden kişiselleştirilmiş protokoller oluşturulacak.</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:20}}>
        {KUR_HEDEFLER.map(function(h){var on=!!hedefler[h.id];return <button key={h.id} onClick={function(){toggleMap(setHedefler,h.id);}} style={{padding:"10px",borderRadius:12,border:"1.5px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",textAlign:"left",cursor:"pointer"}}>
          <div style={{fontSize:20,marginBottom:3}}>{h.emoji}</div>
          <div style={{fontSize:12,fontWeight:700,color:on?C.gold:C.cream,marginBottom:2}}>{h.label}</div>
          <div style={{fontSize:9,color:C.dim,lineHeight:1.4}}>{h.desc}</div>
        </button>;})}
      </div>
      {savedKurler.length>0&&<><button onClick={function(){setShowSaved(!showSaved);}} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(212,168,67,0.2)",background:"rgba(212,168,67,0.04)",color:C.gold,fontSize:12,marginBottom:8,display:"flex",alignItems:"center",gap:7}}>
        <span>📂</span><span style={{flex:1,textAlign:"left"}}>Kayıtlı Kürlerim ({savedKurler.length})</span><span style={{fontSize:10}}>{showSaved?"▲":"▼"}</span>
      </button>
      {showSaved&&<div style={{marginBottom:12}}>{savedKurler.map(function(k,i){return <div key={i} onClick={function(){setSorun(k.sorun);setResult(k.kur);setStep(3);}} style={{padding:"10px 12px",background:"var(--card)",borderRadius:10,border:"1px solid rgba(212,168,67,0.15)",marginBottom:5,cursor:"pointer"}}>
        <div style={{fontSize:12,fontWeight:700,color:C.cream}}>{k.sorun.slice(0,55)}{k.sorun.length>55?"...":""}</div>
        <div style={{display:"flex",gap:10,marginTop:2}}><span style={{fontSize:10,color:C.gold}}>{k.hedefler.slice(0,40)}</span><span style={{fontSize:10,color:C.dim,marginLeft:"auto"}}>{k.tarih} · {k.sure}g</span></div>
      </div>;})} </div>}</>}
      <button onClick={function(){if(secHedefler.length>0) setStep(2);}} disabled={secHedefler.length===0} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:secHedefler.length>0?C.gold:"var(--border)",color:secHedefler.length>0?"#000":C.dim,fontSize:14,fontWeight:700}}>
        {secHedefler.length===0?"En az 1 hedef seç →":"Devam →  "+secHedefler.length+" hedef seçildi"}
      </button>
    </div>
  </div>;

  // ── STEP 2: PROFİL + SORUN ─────────────────────────────────
  if(step===2) return <div style={{paddingBottom:68}}>
    {loading&&<KurYuklemeEkrani adimlar={adimlar} loadingEkol={loadingEkol}/>}

    <TabHeader sub="Şifa Kürü" title="Profil & Sorun" isDark={true}/>
    <div style={{padding:"0 16px"}}>
      <button onClick={function(){setStep(1);}} style={{background:"transparent",border:"none",color:C.muted,fontSize:12,padding:"0 0 10px",display:"flex",alignItems:"center",gap:5}}>← Hedeflere dön</button>
      <div style={{marginBottom:12,padding:"10px 13px",background:"rgba(212,168,67,0.05)",borderRadius:11,border:"1px solid rgba(212,168,67,0.15)"}}>
        <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.2em",fontWeight:700,marginBottom:5}}>Seçilen Hedefler</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{secHedefler.map(function(k){var h=KUR_HEDEFLER.find(function(x){return x.id===k;})||{};return <span key={k} style={{fontSize:11,padding:"3px 8px",borderRadius:50,background:"rgba(212,168,67,0.12)",border:"1px solid rgba(212,168,67,0.25)",color:C.gold}}>{h.emoji} {h.label}</span>;})}</div>
      </div>

      <div style={{marginBottom:4,fontSize:11,color:C.muted,fontWeight:600}}>Sorununu detaylı anlat *</div>
      <textarea value={sorun} onChange={function(e){setSorun(e.target.value);}} placeholder="Örn: 3 aydır şişkinlik ve gaz problemim var. Sabah kalkınca midem sert, tuvalet düzensiz, yedikten sonra ağır hissediyorum..." rows={4} style={{width:"100%",padding:"11px 13px",borderRadius:11,border:"1px solid rgba(212,168,67,0.25)",background:"var(--card)",color:C.cream,fontSize:13,lineHeight:1.6,resize:"none",boxSizing:"border-box",marginBottom:14}}/>

      <div style={{padding:"12px 14px",background:"var(--card2,var(--card))",borderRadius:12,border:"1px solid var(--border)",marginBottom:12}}>
        <div style={{fontSize:10,color:C.gold,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:10}}>👤 Kişisel Profil</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Cinsiyet</div>
          <div style={{display:"flex",gap:6}}>
            {[["kadin","👩 Kadın"],["erkek","👨 Erkek"],["belirtmek_istemiyorum","— Belirtmek istemiyorum"]].map(function(opt){var on=cinsiyet===opt[0];return <button key={opt[0]} onClick={function(){setCinsiyet(on?"":opt[0]);}} style={{flex:1,padding:"7px 4px",borderRadius:9,border:"1px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"transparent",color:on?C.gold:C.muted,fontSize:10,fontWeight:on?700:400}}>{opt[1]}</button>;})}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Yaş Grubu</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {KUR_YAS.map(function(y){var on=yas===y.id;return <button key={y.id} onClick={function(){setYas(on?"":y.id);}} style={{padding:"6px 11px",borderRadius:8,border:"1px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"transparent",color:on?C.gold:C.muted,fontSize:11,fontWeight:on?700:400}}>{y.label}</button>;})}
          </div>
        </div>
        {cinsiyet==="kadin"&&<div style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 11px",background:"rgba(236,72,153,0.05)",borderRadius:9,border:"1px solid rgba(236,72,153,0.15)"}}>
            <input type="checkbox" checked={hamileMi} onChange={function(e){setHamileMi(e.target.checked);}} id="hamile_cb" style={{accentColor:C.gold}}/>
            <label htmlFor="hamile_cb" style={{fontSize:12,color:C.muted}}>🤰 Hamile veya emziriyor</label>
          </div>
        </div>}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Aktivite Düzeyi</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {KUR_AKTIVITE.map(function(a){var on=aktivite===a.id;return <button key={a.id} onClick={function(){setAktivite(on?"":a.id);}} style={{padding:"8px 12px",borderRadius:9,border:"1px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.07)":"transparent",color:on?C.gold:C.muted,fontSize:11,textAlign:"left",fontWeight:on?700:400}}>{a.label}</button>;})}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Beslenme Kısıtları / Tercihler</div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {KUR_KISITLAR.map(function(k){var on=!!kisitlar[k.id];return <button key={k.id} onClick={function(){toggleMap(setKisitlar,k.id);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.07)":"transparent",color:on?C.gold:C.muted,fontSize:11,fontWeight:on?700:400}}>{k.label}</button>;})}
          </div>
        </div>
        <div style={{marginBottom:6}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Mevcut Kronik Durumlar</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {KUR_KRONIK.map(function(k){var on=!!kronik[k.id];return <button key={k.id} onClick={function(){toggleMap(setKronik,k.id);}} style={{padding:"6px 9px",borderRadius:8,border:"1px solid "+(on?"rgba(224,82,82,0.4)":"var(--border)"),background:on?"rgba(224,82,82,0.06)":"transparent",color:on?C.red:C.muted,fontSize:10,textAlign:"left",fontWeight:on?700:400}}>{k.label}</button>;})}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>Günlük Stres Seviyesi</div>
          <div style={{display:"flex",gap:5}}>
            {["1","2","3","4","5","6","7","8","9","10"].map(function(n){var on=stresGun===n;return <button key={n} onClick={function(){setStresGun(on?"":n);}} style={{flex:1,padding:"5px 2px",borderRadius:7,border:"1px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?("rgba("+(n>="7"?"224,82,82":"212,168,67")+",0.1)"):"transparent",color:on?(n>="7"?C.red:C.gold):C.dim,fontSize:10,fontWeight:on?700:400}}>{n}</button>;})}
          </div>
        </div>
      </div>

      <div style={{marginBottom:8,fontSize:11,color:C.muted,fontWeight:600}}>Kür Süresi</div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {KUR_SURE.map(function(s){var on=sure===s.id;return <button key={s.id} onClick={function(){setSure(s.id);}} style={{flex:1,padding:"9px 4px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?C.gold:C.muted,fontSize:10,fontWeight:on?700:400,textAlign:"center"}}><div style={{fontSize:14,marginBottom:2}}>{s.emoji}</div><div style={{fontWeight:700}}>{s.label}</div><div style={{fontSize:8,color:C.dim,marginTop:1}}>{s.desc}</div></button>;})}
      </div>
      <div style={{marginBottom:8,fontSize:11,color:C.muted,fontWeight:600}}>Tıp Ekolleri <span style={{color:C.dim,fontWeight:400}}>(boş = hepsi)</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:18}}>
        {KUR_EKOLLER.map(function(e){var on=!!ekoller[e.id];return <button key={e.id} onClick={function(){toggleMap(setEkoller,e.id);}} style={{padding:"9px 10px",borderRadius:10,border:"1.5px solid "+(on?"rgba(212,168,67,0.4)":"var(--border)"),background:on?"rgba(212,168,67,0.06)":"var(--card)",textAlign:"left",cursor:"pointer"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}><span style={{fontSize:16}}>{e.emoji}</span><span style={{fontSize:11,fontWeight:700,color:on?e.col:C.cream}}>{e.label}</span></div>
          <div style={{fontSize:9,color:C.dim,lineHeight:1.3}}>{e.desc}</div>
        </button>;})}
      </div>
      <button onClick={generate} disabled={!sorun.trim()||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:sorun.trim()&&!loading?C.gold:"var(--border)",color:sorun.trim()&&!loading?"#000":C.dim,fontSize:14,fontWeight:700}}>
        {loading?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><Spinner size={16} color="#000"/>Kürler hazırlanıyor…</span>:"✨ Kişiselleştirilmiş Kür Oluştur"}
      </button>
      {error&&<div style={{marginTop:10,padding:"10px 13px",background:"rgba(224,82,82,0.08)",border:"1px solid rgba(224,82,82,0.2)",borderRadius:9,fontSize:12,color:C.red}}>⚠ {error} <button onClick={generate} style={{marginLeft:8,color:C.gold,background:"transparent",border:"none",fontSize:11,textDecoration:"underline",cursor:"pointer"}}>Tekrar dene</button></div>}
    </div>
  </div>;

  // ── STEP 3: SONUÇLAR ────────────────────────────────────────
  if(step===3&&result) return <div ref={kurSonucRef} style={{paddingBottom:68}}>
    <TabHeader sub="Şifa Kürü" title={result.baslik||"Kür Programın"} isDark={true}/>
    <div style={{padding:"0 16px"}}>
      {/* Belirgin "Kürünüz hazır" banner */}
      <div style={{padding:"20px 18px",marginBottom:16,borderRadius:16,background:"linear-gradient(135deg,rgba(212,168,67,0.25),rgba(212,168,67,0.08))",border:"2px solid rgba(212,168,67,0.5)",textAlign:"center",boxShadow:"0 4px 20px rgba(212,168,67,0.15)"}}>
        <div style={{fontSize:36,marginBottom:6}}>🎉</div>
        <div style={{fontSize:18,fontWeight:800,color:C.gold,fontFamily:"'Playfair Display',serif",marginBottom:4}}>Kürünüz Hazır!</div>
        <div style={{fontSize:12,color:C.muted}}>{(result.kurler||[]).length} ekol protokolü aşağıda. Özet ve takvimle birlikte uygulayabilirsiniz.</div>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:12}}>
        <button onClick={function(){setStep(2);setResult(null);setAcikEkol(null);}} style={{padding:"7px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:11}}>← Yeni Kür</button>
        <div style={{flex:1,padding:"7px 12px",borderRadius:9,background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.15)",fontSize:11,color:C.gold,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sorun.slice(0,50)}{sorun.length>50?"...":""}</div>
      </div>
      {result.ozet&&<div style={{padding:"12px 14px",background:"rgba(212,168,67,0.05)",borderRadius:12,border:"1px solid rgba(212,168,67,0.15)",marginBottom:12,fontSize:12,color:C.muted,lineHeight:1.7}}>{result.ozet}</div>}
      <div style={{marginBottom:8,fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700}}>Ekol Seç — Detay Görüntüle</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {(result.kurler||[]).map(function(k,i){var on=acikEkol===i;return <button key={i} onClick={function(){setAcikEkol(on?null:i);}} style={{padding:"7px 13px",borderRadius:50,border:"1.5px solid "+(on?(k.ekol_renk||C.gold):"var(--border)"),background:on?"rgba(212,168,67,0.08)":"var(--card)",color:on?(k.ekol_renk||C.gold):C.muted,fontSize:12,fontWeight:on?700:400,display:"flex",alignItems:"center",gap:5}}><span>{k.ekol_emoji||"🌿"}</span><span>{k.ekol}</span></button>;})}
      </div>
      {acikEkol!==null&&(result.kurler||[])[acikEkol]&&<KurDetay kur={(result.kurler||[])[acikEkol]}/>}
      {acikEkol===null&&<div>
        {(result.kurler||[]).map(function(k,i){return <div key={i} style={{marginBottom:10,background:"var(--card)",borderRadius:12,border:"1px solid var(--border)",overflow:"hidden"}}>
          <div onClick={function(){setAcikEkol(i);}} style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}><span style={{fontSize:22}}>{k.ekol_emoji||"🌿"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:k.ekol_renk||C.gold}}>{k.ekol}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{(k.felsefe||"").slice(0,80)}…</div></div><span style={{fontSize:10,color:C.dim,padding:"4px 8px",borderRadius:6,border:"1px solid var(--border)",flexShrink:0}}>Detay →</span></div>
          {k.kritik_kural&&<div style={{padding:"8px 14px 10px",borderTop:"1px solid var(--border)",background:"rgba(212,168,67,0.03)"}}><span style={{fontSize:11,color:C.gold,fontStyle:"italic"}}>🔑 "{k.kritik_kural}"</span></div>}
        </div>;})}
        {result.sinerji&&<div style={{padding:"12px 14px",background:"rgba(45,212,191,0.05)",borderRadius:12,border:"1px solid rgba(45,212,191,0.2)",marginBottom:10}}><div style={{fontSize:9,color:"#2DD4BF",textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:6}}>🔗 Sinerji</div><div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{result.sinerji}</div></div>}
        {(result.genel_oneriler||[]).length>0&&<div style={{padding:"12px 14px",background:"rgba(76,175,122,0.05)",borderRadius:12,border:"1px solid rgba(76,175,122,0.2)"}}><div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>🌿 Genel Öneriler</div>{result.genel_oneriler.map(function(o,i){return <div key={i} style={{display:"flex",gap:10,marginBottom:6}}><span style={{color:C.green,fontSize:16,flexShrink:0,lineHeight:1.4}}>•</span><span style={{fontSize:13,color:C.muted,lineHeight:1.5}}>{o}</span></div>;})}</div>}
        {/* Çoklu kür seçildiyse: ortak özellikler ve farklar özeti */}
        {(result.kurler||[]).length>1&&(result.ortak_ozellikler||result.farklar)&&<div style={{marginTop:16,padding:"16px 14px",background:"linear-gradient(135deg,rgba(212,168,67,0.08),rgba(91,163,208,0.06))",borderRadius:14,border:"1px solid rgba(212,168,67,0.25)",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:800,color:C.gold,fontFamily:"'Playfair Display',serif",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>📋 Tüm Kürler Özeti</div>
          {(result.ortak_ozellikler||[]).length>0&&<div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.green,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>✓ Ortak Özellikler</div>
            {(result.ortak_ozellikler||[]).map(function(o,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.green,flexShrink:0}}>•</span><span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{o}</span></div>;})}
          </div>}
          {(result.farklar||[]).length>0&&<div>
            <div style={{fontSize:10,color:C.blue,textTransform:"uppercase",letterSpacing:"0.12em",fontWeight:700,marginBottom:8}}>↔ Ekol Bazlı Farklar</div>
            {(result.farklar||[]).map(function(f,i){var ekolAdi=f.ekol||("Ekol "+(i+1));var oz=f.ozellikler||f.ozellikler_listesi||[];if(typeof oz==="string")oz=[oz];return <div key={i} style={{marginBottom:10,padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:10,border:"1px solid var(--border)"}}><div style={{fontSize:11,fontWeight:700,color:C.blue,marginBottom:5}}>{ekolAdi}</div>{oz.map(function(x,xi){return <div key={xi} style={{fontSize:11,color:C.muted,lineHeight:1.5,marginBottom:2}}>· {x}</div>;})}</div>;})}
          </div>}
        </div>}
      </div>}
      <KurTakvimi kur={result} sorun={sorun} sure={sure}/>
    </div>
  </div>;

  return <div style={{paddingBottom:68}}><TabHeader sub="Şifa Kürü" title="Kür Programı" isDark={true}/><div style={{textAlign:"center",padding:40}}><Spinner size={28}/></div></div>;
}


// ══════════════════════════════════════════════════════════════
// ORUÇ TAKİBİ
// ══════════════════════════════════════════════════════════════
const ORUC_MODLAR=[
  {id:"16_8",label:"16:8",emoji:"⏰",oruc:16,desc:"16 saat oruç, 8 saat yeme penceresi"},
  {id:"18_6",label:"18:6",emoji:"🌙",oruc:18,desc:"18 saat oruç, 6 saat yeme penceresi"},
  {id:"5_2",label:"5:2",emoji:"📅",oruc:null,desc:"Haftada 5 normal, 2 gün 500 kcal"},
  {id:"ibni_sina",label:"İbn-i Sina Perhizi",emoji:"📜",oruc:null,desc:"Haftalık 1-3 gün perhiz, bitkisel destek"},
  {id:"ramazan",label:"Ramazan Orucu",emoji:"☪️",oruc:null,desc:"İmsak-iftar arası tam oruç"},
  {id:"omad",label:"OMAD",emoji:"🍽️",oruc:23,desc:"Günde tek öğün — 23 saat oruç"},
];
function OrucTab(){
  var [mod,setMod]=useState(null);
  var [baslangic,setBaslangic]=useState(null);
  var [hedefSaat,setHedefSaat]=useState(null);
  var [simdi,setSimdi]=useState(Date.now());
  var [gecmis,setGecmis]=useState([]);
  var [aiOzet,setAiOzet]=useState(null);
  var [aiLoad,setAiLoad]=useState(false);
  var [not,setNot]=useState("");
  useEffect(function(){
    var iv=setInterval(function(){setSimdi(Date.now());},1000);
    stGet("oruc_gecmis").then(function(d){if(d)setGecmis(d);});
    stGet("oruc_aktif").then(function(d){if(d&&d.baslangic){setMod(d.mod);setBaslangic(d.baslangic);setHedefSaat(d.hedefSaat);}});
    return function(){clearInterval(iv);};
  },[]);
  function baslat(){
    if(!mod)return;
    var b=Date.now();
    var hedef=mod.oruc?b+(mod.oruc*3600000):null;
    setBaslangic(b);setHedefSaat(hedef);
    stSet("oruc_aktif",{mod:mod,baslangic:b,hedefSaat:hedef});
  }
  function bitir(){
    if(!baslangic)return;
    var sure=Math.round((simdi-baslangic)/60000);
    var kayit={modId:mod.id,label:mod.label,baslangic:baslangic,bitis:simdi,sureDk:sure,not:not,tarih:new Date(baslangic).toLocaleDateString("tr-TR")};
    var yeni=[kayit,...gecmis.slice(0,19)];
    setGecmis(yeni);stSet("oruc_gecmis",yeni);
    setBaslangic(null);setHedefSaat(null);setMod(null);setNot("");
    stSet("oruc_aktif",null);
  }
  async function getAiOzet(){
    if(!mod||!baslangic)return;
    setAiLoad(true);
    var gecenDk=Math.round((simdi-baslangic)/60000);
    var p=mod.label+" orucu. "+gecenDk+" dakika gecti. Otofaji, yag yakimi, metabolizma durumunu Türkce kisa anlat. JSON:{\"durum\":\"metabolik durum\",\"otofaji\":\"başladı mı\",\"tavsiyeler\":[\"öneri1\",\"öneri2\",\"öneri3\"],\"dikkat\":\"uyarı\"}";
    try{var r=await callAI(p,400);setAiOzet(r);}catch(e){}
    setAiLoad(false);
  }
  var gecenMs=baslangic?(simdi-baslangic):0;
  var gecenSaat=Math.floor(gecenMs/3600000);
  var gecenDk=Math.floor((gecenMs%3600000)/60000);
  var gecenSn=Math.floor((gecenMs%60000)/1000);
  var pct=hedefSaat&&baslangic?Math.min(100,Math.round(gecenMs/(hedefSaat-baslangic)*100)):null;
  var kalanMs=hedefSaat?Math.max(0,hedefSaat-simdi):null;
  var kalanSaat=kalanMs?Math.floor(kalanMs/3600000):0;
  var kalanDk=kalanMs?Math.floor((kalanMs%3600000)/60000):0;
  var haftalik=gecmis.filter(function(g){return simdi-g.bitis<7*86400000;});
  return <div style={{paddingBottom:68}}>
    <TabHeader sub="Oruç Takibi" title="Aralıklı Oruç & Perhiz"/>
    <div style={{padding:"0 16px"}}>
      {!baslangic&&<div>
        <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:10}}>Mod Seç</div>
        {ORUC_MODLAR.map(function(m){var on=mod&&mod.id===m.id;return <button key={m.id} onClick={function(){setMod(m);}} style={{width:"100%",padding:"11px 14px",borderRadius:11,border:"1.5px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.07)":"var(--card)",textAlign:"left",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <span style={{fontSize:20}}>{m.emoji}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:on?C.gold:C.cream}}>{m.label}</div>
            <div style={{fontSize:11,color:C.dim,marginTop:1}}>{m.desc}</div>
          </div>
          {m.oruc&&<div style={{fontSize:12,fontWeight:700,color:C.gold,padding:"3px 8px",borderRadius:6,background:"rgba(212,168,67,0.1)"}}>{m.oruc}s</div>}
        </button>;})}
        {haftalik.length>0&&<div style={{margin:"12px 0",padding:"12px 14px",background:"var(--card)",borderRadius:12,border:"1px solid var(--border)"}}>
          <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>📊 Bu Hafta</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.gold}}>{haftalik.length}</div><div style={{fontSize:10,color:C.dim}}>Oruç</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.green}}>{Math.floor(haftalik.reduce(function(a,g){return a+g.sureDk;},0)/60)}s</div><div style={{fontSize:10,color:C.dim}}>Toplam</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:700,color:C.blue}}>{haftalik.length>0?Math.round(haftalik.reduce(function(a,g){return a+g.sureDk;},0)/haftalik.length/60*10)/10:0}s</div><div style={{fontSize:10,color:C.dim}}>Ort.</div></div>
          </div>
          {gecmis.slice(0,3).map(function(g,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderTop:"1px solid rgba(255,255,255,0.04)",fontSize:11}}>
            <span style={{color:C.muted}}>{g.tarih} · {g.label}</span>
            <span style={{color:C.gold,fontWeight:700}}>{Math.floor(g.sureDk/60)}s {g.sureDk%60}dk</span>
          </div>;})}
        </div>}
        <button onClick={baslat} disabled={!mod} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:mod?C.gold:"var(--border)",color:mod?"#000":C.dim,fontSize:14,fontWeight:700,marginTop:4}}>{mod?"🌙 Orucu Başlat — "+mod.label:"Mod Seç"}</button>
      </div>}
      {baslangic&&<div>
        <div style={{textAlign:"center",padding:"24px 0 16px"}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8}}>Oruç Süresi</div>
          <div style={{fontSize:52,fontWeight:900,color:C.gold,fontFamily:"'Playfair Display',serif",letterSpacing:"0.05em",fontVariantNumeric:"tabular-nums"}}>{String(gecenSaat).padStart(2,"0")}:{String(gecenDk).padStart(2,"0")}:{String(gecenSn).padStart(2,"0")}</div>
          <div style={{fontSize:12,color:C.dim,marginTop:4}}>{mod&&mod.label}</div>
        </div>
        {pct!==null&&<div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:11}}>
            <span style={{color:C.muted}}>İlerleme: {pct}%</span>
            <span style={{color:C.orange}}>Kalan: {kalanSaat}s {kalanDk}dk</span>
          </div>
          <div style={{height:8,borderRadius:4,background:"rgba(212,168,67,0.12)",overflow:"hidden"}}>
            <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+C.gold+",#F0C96A)",borderRadius:4,transition:"width 1s linear"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:C.dim}}>
            <span>Otofaji: {gecenSaat>=14?"✅ Başladı":"⏳ "+(14-gecenSaat)+"s sonra"}</span>
            <span>Yağ: {gecenSaat>=12?"✅ Aktif":"⏳ "+(12-gecenSaat)+"s"}</span>
          </div>
        </div>}
        <textarea value={not} onChange={function(e){setNot(e.target.value);}} placeholder="Nasıl hissediyorsun? Not ekle…" rows={2} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:12,resize:"none",boxSizing:"border-box",marginBottom:10}}/>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <button onClick={getAiOzet} disabled={aiLoad} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid rgba(212,168,67,0.3)",background:"rgba(212,168,67,0.06)",color:C.gold,fontSize:12}}>{aiLoad?<Spinner size={14}/>:"🧠 Metabolik Durum"}</button>
          <button onClick={bitir} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:C.red,color:"#fff",fontSize:12,fontWeight:700}}>⏹ Orucu Bitir</button>
        </div>
        {aiOzet&&<div style={{padding:"12px 14px",background:"rgba(212,168,67,0.05)",borderRadius:12,border:"1px solid rgba(212,168,67,0.2)"}}>
          <div style={{fontSize:12,color:C.gold,fontWeight:700,marginBottom:4}}>{aiOzet.durum}</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Otofaji: {aiOzet.otofaji}</div>
          {(aiOzet.tavsiyeler||[]).map(function(t,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:3}}><span style={{color:C.green}}>•</span><span style={{fontSize:11,color:C.muted}}>{t}</span></div>;})}
          {aiOzet.dikkat&&<div style={{marginTop:6,fontSize:11,color:C.orange}}>⚠ {aiOzet.dikkat}</div>}
        </div>}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// NEFES & MİNDFULNESS
// ══════════════════════════════════════════════════════════════
const NEFES_MODLAR=[
  {id:"478",label:"4-7-8",emoji:"🌊",col:"#5BA3D0",ic:4,tut:7,ver:8,desc:"Uyku & anksiyete — Dr. Weil"},
  {id:"kutu",label:"Kutu Nefesi",emoji:"⬜",col:"#9B7FD4",ic:4,tut:4,ver:4,desc:"Stres & odak — Navy SEAL"},
  {id:"diyafram",label:"Diyafram",emoji:"🫁",col:"#4CAF7A",ic:4,tut:0,ver:6,desc:"Sinir sistemi dengeleme"},
  {id:"sufi",label:"Sufi Zikir",emoji:"☪️",col:"#D4A843",ic:4,tut:4,ver:4,desc:"Manevi odaklanma"},
  {id:"enerji",label:"Enerji Nefesi",emoji:"⚡",col:"#F97316",ic:2,tut:0,ver:2,desc:"Hızlı enerji yükleme"},
  {id:"sakinles",label:"Sakinleştirme",emoji:"🌸",col:"#EC4899",ic:4,tut:7,ver:8,desc:"Panik & öfke için"},
];
function NefesTab(){
  var [mod,setMod]=useState(null);
  var [faz,setFaz]=useState("hazir");
  var [fazIdx,setFazIdx]=useState(0);
  var [kalan,setKalan]=useState(0);
  var [tur,setTur]=useState(0);
  var [hedefTur,setHedefTur]=useState(5);
  var [animPct,setAnimPct]=useState(0);
  var ivRef=useRef(null);
  var [aiRehber,setAiRehber]=useState(null);
  var [aiLoad,setAiLoad]=useState(false);
  useEffect(function(){return function(){if(ivRef.current)clearInterval(ivRef.current);};}, []);
  function getFazlar(m){
    if(!m)return [];
    var f=[{ad:"Nefes Al",sure:m.ic,renk:C.green}];
    if(m.tut>0)f.push({ad:"Tut",sure:m.tut,renk:C.gold});
    f.push({ad:"Nefes Ver",sure:m.ver,renk:C.blue});
    return f;
  }
  function baslat(){
    if(!mod)return;
    var fazlar=getFazlar(mod);
    if(!fazlar.length)return;
    setFaz("aktif");setFazIdx(0);setTur(0);setAnimPct(0);
    var curFazIdx=0;var curKalan=fazlar[0].sure;
    setKalan(curKalan);
    ivRef.current=setInterval(function(){
      curKalan--;setKalan(curKalan);
      setAnimPct(Math.round((fazlar[curFazIdx].sure-curKalan)/fazlar[curFazIdx].sure*100));
      if(curKalan<=0){
        curFazIdx=(curFazIdx+1)%fazlar.length;
        if(curFazIdx===0){
          setTur(function(t){
            var next=t+1;
            if(next>=hedefTur){clearInterval(ivRef.current);setFaz("bitti");}
            return next;
          });
        }
        setFazIdx(curFazIdx);
        curKalan=fazlar[curFazIdx].sure;
        setKalan(curKalan);setAnimPct(0);
      }
    },1000);
  }
  function durdur(){clearInterval(ivRef.current);setFaz("hazir");setFazIdx(0);setKalan(0);setAnimPct(0);setTur(0);}
  async function getAiRehber(){
    if(!mod)return;setAiLoad(true);
    var p=mod.label+" nefes teknigi. Fizyolojik etkileri, ideal zaman, ipuclari, manevi boyutu Türkce anlat. JSON:{\"etki\":\"etki\",\"ideal_zaman\":\"zaman\",\"ipuclari\":[\"ip1\",\"ip2\",\"ip3\"],\"dikkat\":\"uyari\",\"manevi\":\"boyut\"}";
    try{var r=await callAI(p,400);setAiRehber(r);}catch(e){}
    setAiLoad(false);
  }
  var fazlar=getFazlar(mod);
  var curFaz=fazlar[fazIdx];
  var toplamSure=fazlar.reduce(function(a,f){return a+f.sure;},0);
  var circumference=2*Math.PI*80;
  return <div style={{paddingBottom:68}}>
    <TabHeader sub="Nefes & Meditasyon" title="Bilinçli Nefes"/>
    <div style={{padding:"0 16px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
        {NEFES_MODLAR.map(function(m){var on=mod&&mod.id===m.id;return <button key={m.id} onClick={function(){setMod(m);durdur();setAiRehber(null);}} style={{padding:"10px",borderRadius:11,border:"1.5px solid "+(on?m.col:"var(--border)"),background:on?"rgba(212,168,67,0.06)":"var(--card)",textAlign:"left"}}>
          <div style={{fontSize:18,marginBottom:3}}>{m.emoji}</div>
          <div style={{fontSize:11,fontWeight:700,color:on?m.col:C.cream,marginBottom:2}}>{m.label}</div>
          <div style={{fontSize:9,color:C.dim,lineHeight:1.3}}>{m.desc}</div>
        </button>;})}
      </div>
      {mod&&faz==="hazir"&&<div>
        <div style={{padding:"12px 14px",background:"var(--card)",borderRadius:12,border:"1px solid var(--border)",marginBottom:10}}>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {fazlar.map(function(f,i){return <div key={i} style={{flex:1,padding:"8px",borderRadius:9,background:"rgba(212,168,67,0.05)",border:"1px solid rgba(212,168,67,0.15)",textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:700,color:C.gold}}>{f.sure}s</div>
              <div style={{fontSize:9,color:C.dim}}>{f.ad}</div>
            </div>;})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:C.muted}}>Tur:</span>
            {[3,5,7,10,15].map(function(n){var on=hedefTur===n;return <button key={n} onClick={function(){setHedefTur(n);}} style={{padding:"4px 10px",borderRadius:7,border:"1px solid "+(on?"rgba(212,168,67,0.5)":"var(--border)"),background:on?"rgba(212,168,67,0.08)":"transparent",color:on?C.gold:C.dim,fontSize:11,fontWeight:on?700:400}}>{n}</button>;})}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={baslat} style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:mod.col,color:"#fff",fontSize:13,fontWeight:700}}>▶ {hedefTur} Tur — {Math.round(hedefTur*toplamSure/60)} dk</button>
            <button onClick={getAiRehber} disabled={aiLoad} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid rgba(212,168,67,0.3)",background:"transparent",color:C.gold,fontSize:11}}>{aiLoad?<Spinner size={12}/>:"🧠 Rehber"}</button>
          </div>
        </div>
        {aiRehber&&<div style={{padding:"12px 14px",background:"rgba(212,168,67,0.04)",borderRadius:12,border:"1px solid rgba(212,168,67,0.2)"}}>
          <div style={{fontSize:12,color:C.gold,fontWeight:700,marginBottom:4}}>✨ {aiRehber.etki}</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>⏰ {aiRehber.ideal_zaman}</div>
          {(aiRehber.ipuclari||[]).map(function(ip,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:3}}><span style={{color:C.green}}>•</span><span style={{fontSize:11,color:C.muted}}>{ip}</span></div>;})}
          {aiRehber.manevi&&<div style={{marginTop:6,padding:"7px 10px",background:"rgba(212,168,67,0.07)",borderRadius:8,fontSize:11,color:C.gold,fontStyle:"italic"}}>{aiRehber.manevi}</div>}
        </div>}
      </div>}
      {mod&&faz==="aktif"&&curFaz&&<div style={{textAlign:"center",padding:"16px 0"}}>
        <div style={{position:"relative",width:180,height:180,margin:"0 auto 16px"}}>
          <svg width={180} height={180} style={{position:"absolute",top:0,left:0}}>
            <circle cx={90} cy={90} r={80} fill="none" stroke="rgba(212,168,67,0.1)" strokeWidth={6}/>
            <circle cx={90} cy={90} r={80} fill="none" stroke={curFaz.renk} strokeWidth={6}
              strokeDasharray={String(circumference)} strokeDashoffset={String(circumference*(1-animPct/100))}
              style={{transform:"rotate(-90deg)",transformOrigin:"center",transition:"stroke-dashoffset 0.9s linear"}}/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:44,fontWeight:900,color:curFaz.renk,fontVariantNumeric:"tabular-nums"}}>{kalan}</div>
            <div style={{fontSize:13,color:C.muted,marginTop:4}}>{curFaz.ad}</div>
          </div>
        </div>
        <div style={{fontSize:12,color:C.muted,marginBottom:4}}>{mod.emoji} {mod.label}</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:14}}>Tur {tur+1} / {hedefTur}</div>
        <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.07)",marginBottom:14}}>
          <div style={{height:"100%",width:(tur/hedefTur*100)+"%",background:curFaz.renk,borderRadius:2}}/>
        </div>
        <button onClick={durdur} style={{padding:"10px 24px",borderRadius:10,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red,fontSize:12}}>⏹ Durdur</button>
      </div>}
      {faz==="bitti"&&<div style={{textAlign:"center",padding:"30px 0"}}>
        <div style={{fontSize:50,marginBottom:10}}>🎉</div>
        <div style={{fontSize:20,fontWeight:700,color:C.gold,marginBottom:6,fontFamily:"'Playfair Display',serif"}}>{hedefTur} Tur Tamamlandı!</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:16}}>{mod&&Math.round(hedefTur*toplamSure/60)} dakika {mod&&mod.label}</div>
        <button onClick={durdur} style={{padding:"12px 28px",borderRadius:11,border:"none",background:C.gold,color:"#000",fontSize:13,fontWeight:700}}>🔄 Tekrar</button>
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// KAN DEĞERLERİ
// ══════════════════════════════════════════════════════════════
const KAN_DEGERLER=[
  {id:"b12",label:"B12 (pg/mL)",optimal:"500-900"},
  {id:"d_vit",label:"D Vitamini (ng/mL)",optimal:"50-80"},
  {id:"ferritin",label:"Ferritin (ng/mL)",optimal:"70-150"},
  {id:"tsh",label:"TSH (mIU/L)",optimal:"0.5-2.5"},
  {id:"kortizol",label:"Kortizol (μg/dL)",optimal:"10-18"},
  {id:"glukoz",label:"Açlık Glukozu (mg/dL)",optimal:"70-90"},
  {id:"hba1c",label:"HbA1c (%)",optimal:"<5.2"},
  {id:"magnezyum",label:"Magnezyum (mg/dL)",optimal:"2.0-2.2"},
  {id:"omega3",label:"Omega-3 İndeksi (%)",optimal:">8"},
  {id:"homosistein",label:"Homosistein (μmol/L)",optimal:"<10"},
  {id:"crp",label:"CRP (mg/L)",optimal:"<1"},
  {id:"insulin",label:"Açlık İnsülin (μIU/mL)",optimal:"2-7"},
];
const DURUM_COL={"eksik":C.red,"düşük":C.orange,"normal":C.muted,"iyi":C.green,"optimal":"#60A5FA"};
function KanTab(){
  var [degerler,setDegerler]=useState({});
  var [sonuc,setSonuc]=useState(null);
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState(null);
  var [kayitlar,setKayitlar]=useState([]);
  useEffect(function(){stGet("kan_kayitlar").then(function(d){if(d)setKayitlar(d);});}, []);
  function setDeger(id,val){setDegerler(function(p){var n=Object.assign({},p);n[id]=val;return n;});}
  var doluDegerler=Object.keys(degerler).filter(function(k){return degerler[k]&&degerler[k].toString().trim();});
  async function analyze(){
    if(!doluDegerler.length)return;
    setLoading(true);setError(null);setSonuc(null);
    var liste=doluDegerler.map(function(k){var d=KAN_DEGERLER.find(function(x){return x.id===k;});return d?d.label+": "+degerler[k]:k+": "+degerler[k];}).join(", ");
    var p="Kan degerlerini fonksiyonel tip perspektifinden yorumla. OPTIMAL aralik kullan, normal degil. JSON:{\"genel_durum\":\"degerlendirme\",\"bulgular\":[{\"parametre\":\"ad\",\"deger\":\"deger\",\"durum\":\"eksik/düşük/normal/iyi/optimal\",\"yorum\":\"yorum\",\"oneri\":\"öneri\"}],\"oncelikler\":[\"aksiyon1\",\"aksiyon2\",\"aksiyon3\"],\"takviyeler\":[{\"isim\":\"takviye\",\"doz\":\"doz\",\"neden\":\"neden\"}],\"beslenme\":[\"öneri\"],\"alternatif_tip\":\"Dogu tibbi yorumu\",\"takip\":\"tekrar test zamani\"}\\n\\nDegerler: "+liste;
    try{
      var r=await callAI(p,1200);setSonuc(r);
      var yeni=[{tarih:new Date().toLocaleDateString("tr-TR"),degerler:Object.assign({},degerler),sonuc:r},...kayitlar.slice(0,9)];
      setKayitlar(yeni);stSet("kan_kayitlar",yeni);
    }catch(e){setError(e.message);}
    setLoading(false);
  }
  return <div style={{paddingBottom:68}}>
    {loading&&<LoadingOverlay msg="Kan değerleri analiz ediliyor" eta={18}/>}
    <TabHeader sub="Kan Değerleri" title="Fonksiyonel Analiz"/>
    <div style={{padding:"0 16px"}}>
      {!sonuc&&<div>
        <div style={{marginBottom:10,padding:"10px 13px",background:"rgba(91,163,208,0.06)",borderRadius:11,border:"1px solid rgba(91,163,208,0.2)"}}>
          <div style={{fontSize:11,color:C.blue,lineHeight:1.6}}>🔬 Kan değerlerini <strong>aşağıdaki kutulara</strong> gir, fonksiyonel tıp + Doğu tıbbı yorumu al. <strong>Optimal aralık</strong> baz alınır.</div>
        </div>
        {kayitlar.length>0&&<div style={{marginBottom:10,padding:"10px 13px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)"}}>
          <div style={{fontSize:9,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:7}}>📂 Önceki Analizler</div>
          {kayitlar.slice(0,3).map(function(k,i){return <div key={i} onClick={function(){setDegerler(k.degerler);setSonuc(k.sonuc);}} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
            <span style={{fontSize:11,color:C.muted}}>{k.tarih}</span>
            <span style={{fontSize:11,color:C.gold}}>{Object.keys(k.degerler).length} değer →</span>
          </div>;})}
        </div>}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:8}}>📝 Değerleri buraya girin</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            {KAN_DEGERLER.map(function(d){return <div key={d.id} style={{padding:"12px 14px",background:"var(--card)",borderRadius:10,border:"1.5px solid "+(degerler[d.id]?"rgba(212,168,67,0.35)":"var(--border)"),display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:C.cream}}>{d.label}</div>
                <div style={{fontSize:10,color:C.dim}}>Optimal: {d.optimal}</div>
              </div>
              <input type="number" step="0.1" inputMode="decimal" value={degerler[d.id]||""} onChange={function(e){setDeger(d.id,e.target.value);}} placeholder="Değer yaz" style={{width:88,minWidth:88,padding:"10px 10px",borderRadius:8,border:"1.5px solid "+(degerler[d.id]?"rgba(212,168,67,0.5)":"var(--border)"),background:"rgba(0,0,0,0.35)",color:C.cream,fontSize:14,textAlign:"center",fontWeight:600}}/>
            </div>;})}
          </div>
        </div>
        {error&&<div style={{padding:"10px",background:"rgba(224,82,82,0.08)",borderRadius:9,fontSize:12,color:C.red,marginBottom:10}}>⚠ {error}</div>}
        <button onClick={analyze} disabled={!doluDegerler.length||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:doluDegerler.length?C.blue:"var(--border)",color:doluDegerler.length?"#fff":C.dim,fontSize:14,fontWeight:700}}>🔬 {doluDegerler.length?doluDegerler.length+" Değer Analiz Et":"En az bir değer girin"}</button>
      </div>}
      {sonuc&&<div>
        <div style={{display:"flex",gap:7,marginBottom:10}}>
          <button onClick={function(){setSonuc(null);}} style={{padding:"7px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:11}}>← Yeni</button>
          <div style={{flex:1,padding:"7px 12px",borderRadius:9,background:"rgba(91,163,208,0.07)",border:"1px solid rgba(91,163,208,0.2)",fontSize:11,color:C.blue}}>{(sonuc.genel_durum||"").slice(0,80)}</div>
        </div>
        {(sonuc.bulgular||[]).map(function(b,i){var renk=DURUM_COL[b.durum]||C.muted;return <div key={i} style={{marginBottom:6,padding:"10px 12px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
            <span style={{fontSize:12,fontWeight:700,color:C.cream}}>{b.parametre}</span>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.gold}}>{b.deger}</span>
              <span style={{fontSize:9,padding:"1px 6px",borderRadius:50,background:"rgba(0,0,0,0.3)",border:"1px solid "+renk,color:renk,fontWeight:700,textTransform:"uppercase"}}>{b.durum}</span>
            </div>
          </div>
          <div style={{fontSize:11,color:C.muted,marginBottom:1}}>{b.yorum}</div>
          {b.oneri&&<div style={{fontSize:11,color:C.green}}>→ {b.oneri}</div>}
        </div>;})}
        {(sonuc.oncelikler||[]).length>0&&<div style={{padding:"11px 13px",background:"rgba(224,82,82,0.05)",borderRadius:11,border:"1px solid rgba(224,82,82,0.2)",marginBottom:8}}>
          <div style={{fontSize:9,color:C.red,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>🎯 Aksiyonlar</div>
          {sonuc.oncelikler.map(function(o,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:4}}><span style={{color:C.red,fontWeight:700}}>{i+1}.</span><span style={{fontSize:12,color:C.muted}}>{o}</span></div>;})}
        </div>}
        {(sonuc.takviyeler||[]).length>0&&<div style={{padding:"11px 13px",background:"rgba(76,175,122,0.05)",borderRadius:11,border:"1px solid rgba(76,175,122,0.2)",marginBottom:8}}>
          <div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>💊 Takviye Protokolü</div>
          {sonuc.takviyeler.map(function(t,i){return <div key={i} style={{display:"flex",gap:7,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{fontSize:11,fontWeight:700,color:C.green,minWidth:110}}>{t.isim}</span>
            <span style={{fontSize:11,color:C.gold}}>{t.doz}</span>
            <span style={{fontSize:11,color:C.dim,flex:1}}>— {t.neden}</span>
          </div>;})}
        </div>}
        {sonuc.alternatif_tip&&<div style={{padding:"11px 13px",background:"rgba(212,168,67,0.05)",borderRadius:11,border:"1px solid rgba(212,168,67,0.2)",marginBottom:8}}>
          <div style={{fontSize:9,color:C.gold,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:5}}>🌿 Geleneksel Tıp</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>{sonuc.alternatif_tip}</div>
        </div>}
        {sonuc.takip&&<div style={{padding:"9px 12px",background:"rgba(91,163,208,0.05)",borderRadius:10,border:"1px solid rgba(91,163,208,0.2)"}}>
          <div style={{fontSize:11,color:C.blue}}>📅 Takip: {sonuc.takip}</div>
        </div>}
      </div>}
    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// VÜCUT HARİTASI
// ══════════════════════════════════════════════════════════════
const VUCUT_BOLGELERI=[
  {id:"bas",label:"Baş",x:80,y:22,r:15,renk:"#9B7FD4",semptomlar:["Baş ağrısı","Migren","Baş dönmesi","Kulak çınlaması","Göz yorgunluğu"]},
  {id:"boyun",label:"Boyun",x:80,y:46,r:9,renk:"#F97316",semptomlar:["Boyun gerginliği","Tiroid","Yutma güçlüğü","Lenf şişmesi"]},
  {id:"gogus",label:"Göğüs",x:80,y:76,r:16,renk:"#E05252",semptomlar:["Nefes darlığı","Çarpıntı","Göğüs ağrısı","Öksürük"]},
  {id:"mide",label:"Mide",x:80,y:100,r:12,renk:"#4CAF7A",semptomlar:["Mide yanması","Şişkinlik","Hazımsızlık","Bulantı"]},
  {id:"bagirsak",label:"Bağırsak",x:80,y:118,r:13,renk:"#2DD4BF",semptomlar:["İBS","Kabızlık","İshal","Gaz","Şişkinlik"]},
  {id:"bobrek",label:"Böbrek",x:80,y:138,r:11,renk:"#60A5FA",semptomlar:["Bel ağrısı","Sık idrara çıkma","Ödem","İdrar yolu"]},
  {id:"eklem",label:"Eklem",x:80,y:160,r:10,renk:"#A78BFA",semptomlar:["Eklem ağrısı","Artrit","Kas krampı","Sertlik"]},
  {id:"cilt",label:"Cilt",x:125,y:55,r:10,renk:"#EC4899",semptomlar:["Akne","Egzama","Döküntü","Saç dökülmesi"]},
  {id:"karaciger",label:"Karaciğer",x:65,y:95,r:11,renk:"#D4A843",semptomlar:["Yorgunluk","Sarılık","Sindirim sorunları","Cilt sararması"]},
];
function VucutHaritasiTab(){
  var [secili,setSecili]=useState(null);
  var [semptom,setSemptom]=useState(null);
  var [sonuc,setSonuc]=useState(null);
  var [loading,setLoading]=useState(false);
  var bolge=secili?VUCUT_BOLGELERI.find(function(b){return b.id===secili;}):null;
  async function analize(s){
    setSemptom(s);setSonuc(null);setLoading(true);
    var p="Semptom: '"+bolge.label+"' bölgesinde '"+s+"'. Çin Tıbbı, Ayurveda, İbn-i Sina ve Fonksiyonel Tıp açısından değerlendir. JSON:{\"kök_neden\":\"nedenler\",\"acil_mi\":false,\"cin_tibbi\":\"TCM yorumu\",\"ayurveda\":\"Ayurveda yorumu\",\"ibni_sina\":\"İbn-i Sina yorumu\",\"beslenme\":[\"öneri1\",\"öneri2\"],\"bitkiler\":[\"bitki: kullanım\"],\"yasam_tarz\":[\"öneri\"],\"uyari\":\"acil belirti\"}";
    try{var r=await callAI(p,700);setSonuc(r);}catch(e){}
    setLoading(false);
  }
  return <div style={{paddingBottom:68}}>
    {loading&&<LoadingOverlay msg="Semptom analiz ediliyor" eta={14}/>}
    <TabHeader sub="Vücut Haritası" title="Semptom Analizi"/>
    <div style={{padding:"0 16px"}}>
      {!secili&&<div>
        <div style={{fontSize:12,color:C.muted,marginBottom:12,lineHeight:1.7}}>Şikayetinin olduğu bölgeyi seç — 4 farklı tıp geleneğiyle analiz yapılacak.</div>
        <div style={{position:"relative",width:"100%",paddingBottom:"58%",marginBottom:14,background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",overflow:"hidden"}}>
          <svg viewBox="0 0 160 195" style={{position:"absolute",width:"100%",height:"100%"}}>
            <ellipse cx={80} cy={22} rx={13} ry={13} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" strokeWidth={1}/>
            <rect x={67} y={36} width={26} height={10} rx={3} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={1}/>
            <rect x={63} y={57} width={34} height={50} rx={8} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>
            <rect x={65} y={108} width={30} height={40} rx={6} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth={1}/>
            <line x1={63} y1={67} x2={38} y2={115} stroke="rgba(255,255,255,0.1)" strokeWidth={10} strokeLinecap="round"/>
            <line x1={97} y1={67} x2={122} y2={115} stroke="rgba(255,255,255,0.1)" strokeWidth={10} strokeLinecap="round"/>
            <line x1={70} y1={148} x2={60} y2={195} stroke="rgba(255,255,255,0.1)" strokeWidth={10} strokeLinecap="round"/>
            <line x1={90} y1={148} x2={100} y2={195} stroke="rgba(255,255,255,0.1)" strokeWidth={10} strokeLinecap="round"/>
            {VUCUT_BOLGELERI.map(function(b){return <g key={b.id} onClick={function(){setSecili(b.id);}} style={{cursor:"pointer"}}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={b.renk+"18"} stroke={b.renk} strokeWidth={1.5}/>
              <text x={b.x} y={b.y+1} textAnchor="middle" dominantBaseline="middle" style={{fontSize:"6px",fill:b.renk,fontWeight:"bold",pointerEvents:"none"}}>{b.label}</text>
            </g>;})}
          </svg>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {VUCUT_BOLGELERI.map(function(b){return <button key={b.id} onClick={function(){setSecili(b.id);}} style={{padding:"8px 10px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",display:"flex",alignItems:"center",gap:7,textAlign:"left"}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:b.renk,flexShrink:0}}/>
            <div style={{fontSize:11,color:C.muted}}>{b.label}</div>
          </button>;})}
        </div>
      </div>}
      {secili&&bolge&&!semptom&&<div>
        <button onClick={function(){setSecili(null);setSonuc(null);}} style={{background:"transparent",border:"none",color:C.muted,fontSize:12,padding:"0 0 12px",cursor:"pointer"}}>← Haritaya dön</button>
        <div style={{padding:"12px 14px",background:"var(--card)",borderRadius:12,border:"1.5px solid "+bolge.renk+"44",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700,color:bolge.renk,marginBottom:3,fontFamily:"'Playfair Display',serif"}}>{bolge.label}</div>
          <div style={{fontSize:11,color:C.muted}}>Semptomu seç:</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {bolge.semptomlar.map(function(s){return <button key={s} onClick={function(){analize(s);}} style={{padding:"12px 14px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",textAlign:"left",color:C.muted,fontSize:13,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
            <span style={{color:bolge.renk}}>▸</span>{s}
          </button>;})}
        </div>
      </div>}
      {secili&&bolge&&semptom&&sonuc&&<div>
        <div style={{display:"flex",gap:7,marginBottom:10}}>
          <button onClick={function(){setSemptom(null);setSonuc(null);}} style={{padding:"7px 12px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:11,cursor:"pointer"}}>← Geri</button>
          <div style={{flex:1,padding:"7px 12px",borderRadius:9,background:bolge.renk+"11",border:"1px solid "+bolge.renk+"33",fontSize:11,color:bolge.renk}}>{bolge.label} → {semptom}</div>
        </div>
        {sonuc.acil_mi&&<div style={{padding:"10px 13px",background:"rgba(224,82,82,0.1)",border:"1px solid rgba(224,82,82,0.3)",borderRadius:10,marginBottom:8,fontSize:12,color:C.red,fontWeight:700}}>⚠️ Acil tıbbi değerlendirme gerekebilir!</div>}
        <div style={{padding:"10px 13px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)",marginBottom:7}}>
          <div style={{fontSize:9,color:C.muted,fontWeight:700,marginBottom:3}}>KÖK NEDEN</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{sonuc.kök_neden}</div>
        </div>
        {[["☯️ Çin Tıbbı","cin_tibbi","#E05252"],["🪷 Ayurveda","ayurveda","#F97316"],["📜 İbn-i Sina","ibni_sina","#D4A843"]].map(function(item){return sonuc[item[1]]?<div key={item[1]} style={{padding:"10px 13px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)",marginBottom:6}}>
          <div style={{fontSize:9,color:item[2],fontWeight:700,marginBottom:2}}>{item[0]}</div>
          <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{sonuc[item[1]]}</div>
        </div>:null;})}
        {(sonuc.beslenme||[]).length>0&&<div style={{padding:"10px 13px",background:"rgba(76,175,122,0.05)",borderRadius:10,border:"1px solid rgba(76,175,122,0.2)",marginBottom:6}}>
          <div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:5}}>🥗 Beslenme</div>
          {sonuc.beslenme.map(function(b,i){return <div key={i} style={{display:"flex",gap:6,marginBottom:2}}><span style={{color:C.green}}>•</span><span style={{fontSize:11,color:C.muted}}>{b}</span></div>;})}
        </div>}
        {(sonuc.bitkiler||[]).length>0&&<div style={{padding:"10px 13px",background:"rgba(212,168,67,0.05)",borderRadius:10,border:"1px solid rgba(212,168,67,0.2)"}}>
          <div style={{fontSize:9,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:5}}>🌿 Bitkisel</div>
          {sonuc.bitkiler.map(function(b,i){return <div key={i} style={{display:"flex",gap:6,marginBottom:2}}><span style={{color:C.gold}}>•</span><span style={{fontSize:11,color:C.muted}}>{b}</span></div>;})}
        </div>}
      </div>}
    </div>
  </div>;
}

// ── HAFTALIK BÜLTEN yardımcı fonksiyon ────────────────────────
async function generateHaftalikBulten(){
  var bugun=new Date();
  var kayitlar=[];
  for(var ii=0;ii<7;ii++){
    var dd=new Date(bugun);dd.setDate(dd.getDate()-ii);
    var r=await stGet("nutri:"+dd.toISOString().split("T")[0]);
    if(r&&r.length)kayitlar.push({tarih:dd.toLocaleDateString("tr-TR"),yemekler:r});
  }
  var orucGecmis=await stGet("oruc_gecmis")||[];
  var saglik=await stGet("saglik_prof")||{};
  var journal=[];
  for(var jj=0;jj<7;jj++){
    var dj=new Date(bugun);dj.setDate(dj.getDate()-jj);
    var jv=await stGet("journal:"+dj.toISOString().split("T")[0]);
    if(jv)journal.push(jv);
  }
  var ozet="Beslenme: "+kayitlar.length+" gün kayıtlı. Oruç: "+orucGecmis.filter(function(o){return bugun-o.bitis<7*86400000;}).length+" seans. "+(saglik.yas?"Yaş:"+saglik.yas+", Kilo:"+saglik.kilo+"kg. ":"")+(journal.length?"Ortalama ruh hali: "+Math.round(journal.reduce(function(a,j){return a+(j.ruhhal||3);},0)/journal.length)+"/5":"")+".";
  var p="7 günlük sağlık verilerine göre haftalık bülten yaz. JSON:{\"baslik\":\"Haftalık Sağlık Özeti\",\"puan\":7,\"ozet\":\"2-3 cümle\",\"iyi_giden\":[\"iyi1\",\"iyi2\"],\"gelistirilecek\":[\"eksik1\",\"eksik2\"],\"bu_hafta_one_cikan\":\"dikkat çeken veri\",\"gelecek_hafta\":[\"hedef1\",\"hedef2\",\"hedef3\"],\"tavsiye_kur\":\"önerilen kür\",\"motivasyon\":\"ilham cümlesi\"}\\n\\nVeri: "+ozet;
  return await callAI(p,600);
}

// ── BÜLTEN VIEW ────────────────────────────────────────────────
function BultenView(){
  var [bulten,setBulten]=useState(null);
  var [loading,setLoading]=useState(false);
  var [error,setError]=useState(null);
  var [gecmis,setGecmis]=useState([]);
  useEffect(function(){stGet("bulten_gecmis").then(function(d){if(d)setGecmis(d);});}, []);
  async function olustur(){
    setLoading(true);setError(null);
    try{
      var r=await generateHaftalikBulten();
      if(!r)throw new Error("Bülten oluşturulamadı");
      setBulten(r);
      var yeni=[{tarih:new Date().toLocaleDateString("tr-TR"),bulten:r},...gecmis.slice(0,4)];
      setGecmis(yeni);stSet("bulten_gecmis",yeni);
    }catch(e){setError(e.message);}
    setLoading(false);
  }
  var puanRenk=bulten?(bulten.puan>=8?C.green:bulten.puan>=6?C.gold:C.red):C.muted;
  return <div className="up">
    {loading&&<div style={{textAlign:"center",padding:"30px"}}><Spinner size={20} color={C.gold}/><div style={{fontSize:12,color:C.muted,marginTop:10}}>Haftalık veriler toplanıyor…</div></div>}
    {!loading&&!bulten&&<div>
      {gecmis.length>0&&<div style={{marginBottom:12}}>
        <div style={{fontSize:9,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:7}}>📂 Önceki Bültenler</div>
        {gecmis.map(function(g,i){return <div key={i} onClick={function(){setBulten(g.bulten);}} style={{padding:"8px 12px",background:"var(--card)",borderRadius:9,border:"1px solid var(--border)",marginBottom:5,cursor:"pointer",display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:11,color:C.muted}}>{g.tarih}</span>
          <span style={{fontSize:11,color:C.gold,fontWeight:700}}>Puan: {g.bulten&&g.bulten.puan}/10 →</span>
        </div>;})}
      </div>}
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <div style={{fontSize:36,marginBottom:8}}>📰</div>
        <div style={{fontSize:14,fontWeight:700,color:C.cream,marginBottom:6,fontFamily:"'Playfair Display',serif"}}>Haftalık Sağlık Bülteni</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:16,lineHeight:1.6}}>7 günlük beslenme, oruç ve ruh hali verilerini analiz ederek özet oluştur.</div>
        <button onClick={olustur} style={{padding:"12px 24px",borderRadius:11,border:"none",background:C.gold,color:"#000",fontSize:13,fontWeight:700}}>✨ Bülten Oluştur</button>
      </div>
      {error&&<div style={{padding:"10px",background:"rgba(224,82,82,0.08)",borderRadius:9,fontSize:12,color:C.red}}>{error}</div>}
    </div>}
    {!loading&&bulten&&<div>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"linear-gradient(135deg,rgba(212,168,67,0.08),transparent)",borderRadius:12,border:"1px solid rgba(212,168,67,0.2)",marginBottom:10}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"2px solid "+puanRenk,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",flexShrink:0}}>
          <div style={{fontSize:19,fontWeight:900,color:puanRenk,lineHeight:1}}>{bulten.puan}</div>
          <div style={{fontSize:8,color:C.dim}}>/10</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif",marginBottom:2}}>{bulten.baslik}</div>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{bulten.ozet}</div>
        </div>
      </div>
      {bulten.bu_hafta_one_cikan&&<div style={{padding:"9px 12px",background:"rgba(91,163,208,0.06)",borderRadius:10,border:"1px solid rgba(91,163,208,0.2)",marginBottom:8}}>
        <div style={{fontSize:9,color:C.blue,fontWeight:700,marginBottom:2}}>🔍 ÖNE ÇIKAN</div>
        <div style={{fontSize:12,color:C.muted}}>{bulten.bu_hafta_one_cikan}</div>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:8}}>
        {(bulten.iyi_giden||[]).length>0&&<div style={{padding:"9px",background:"rgba(76,175,122,0.05)",borderRadius:10,border:"1px solid rgba(76,175,122,0.2)"}}>
          <div style={{fontSize:9,color:C.green,fontWeight:700,marginBottom:5}}>✅ İYİ GİDEN</div>
          {bulten.iyi_giden.map(function(s,i){return <div key={i} style={{fontSize:11,color:C.muted,marginBottom:2}}>• {s}</div>;})}
        </div>}
        {(bulten.gelistirilecek||[]).length>0&&<div style={{padding:"9px",background:"rgba(224,82,82,0.05)",borderRadius:10,border:"1px solid rgba(224,82,82,0.2)"}}>
          <div style={{fontSize:9,color:C.red,fontWeight:700,marginBottom:5}}>⬆️ GELİŞTİR</div>
          {bulten.gelistirilecek.map(function(s,i){return <div key={i} style={{fontSize:11,color:C.muted,marginBottom:2}}>• {s}</div>;})}
        </div>}
      </div>
      {(bulten.gelecek_hafta||[]).length>0&&<div style={{padding:"10px 12px",background:"rgba(212,168,67,0.05)",borderRadius:10,border:"1px solid rgba(212,168,67,0.2)",marginBottom:8}}>
        <div style={{fontSize:9,color:C.gold,fontWeight:700,marginBottom:6}}>🎯 GELECEK HAFTA</div>
        {bulten.gelecek_hafta.map(function(h,i){return <div key={i} style={{display:"flex",gap:6,marginBottom:3}}><span style={{color:C.gold,fontWeight:700}}>{i+1}.</span><span style={{fontSize:12,color:C.muted}}>{h}</span></div>;})}
      </div>}
      {bulten.motivasyon&&<div style={{padding:"12px",background:"rgba(212,168,67,0.04)",borderRadius:10,border:"1px solid rgba(212,168,67,0.15)",textAlign:"center"}}>
        <div style={{fontSize:13,color:C.gold,fontStyle:"italic",lineHeight:1.7}}>✨ "{bulten.motivasyon}"</div>
      </div>}
      <button onClick={function(){setBulten(null);}} style={{width:"100%",marginTop:10,padding:"9px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",color:C.muted,fontSize:12,cursor:"pointer"}}>↺ Yeni Bülten</button>
    </div>}
  </div>;
}

// ── KÜR TAKVİMİ ────────────────────────────────────────────────
function KurTakvimi(props){
  var kur=props.kur;var sorun=props.sorun;var sure=props.sure;
  var [tamamlanan,setTamamlanan]=useState({});
  var gunSayisi=parseInt(sure)||21;
  var storKey="kur_takvim_"+(sorun||"").slice(0,20).replace(/\s/g,"_");
  useEffect(function(){stGet(storKey).then(function(d){if(d)setTamamlanan(d||{});});}, [storKey]);
  function toggle(gun){
    var t=Object.assign({},tamamlanan);t[gun]=!t[gun];
    setTamamlanan(t);stSet(storKey,t);
  }
  var tamamSayi=Object.values(tamamlanan).filter(Boolean).length;
  var streak=0;for(var ii=tamamSayi;ii>=1;ii--){if(tamamlanan[ii])streak++;else break;}
  var pct=Math.round(tamamSayi/gunSayisi*100);
  return <div style={{marginTop:14,padding:"13px 14px",background:"var(--card)",borderRadius:13,border:"1px solid rgba(212,168,67,0.2)"}}>
    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif"}}>📅 {gunSayisi} Günlük Kür Takvimi</div>
        {sorun&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>{sorun.slice(0,50)}</div>}
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:700,color:C.gold}}>{streak}🔥</div>
        <div style={{fontSize:8,color:C.dim}}>Streak</div>
      </div>
    </div>
    <div style={{marginBottom:9}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:3}}>
        <span>{tamamSayi}/{gunSayisi} Gün</span><span>{pct}%</span>
      </div>
      <div style={{height:4,borderRadius:2,background:"rgba(212,168,67,0.12)",overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+C.gold+",#F0C96A)",borderRadius:2}}/>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
      {Array.from({length:gunSayisi},function(_,i){var g=i+1;var done=!!tamamlanan[g];var today=g===tamamSayi+1;return <button key={g} onClick={function(){toggle(g);}} style={{aspectRatio:"1",borderRadius:5,border:"1px solid "+(done?"rgba(212,168,67,0.5)":today?"rgba(212,168,67,0.25)":"var(--border)"),background:done?"rgba(212,168,67,0.15)":"transparent",color:done?C.gold:today?C.muted:C.dim,fontSize:9,fontWeight:done?700:400,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        {done?"✓":g}
      </button>;})}
    </div>
    {pct===100&&<div style={{textAlign:"center",marginTop:10,padding:"8px",background:"rgba(76,175,122,0.08)",borderRadius:8}}>
      <span style={{fontSize:12,fontWeight:700,color:C.green}}>🎉 Kür Tamamlandı!</span>
    </div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// AKADEMİ TAB
// ══════════════════════════════════════════════════════════════
const AKADEMI_OKULLAR=[
  {id:"ibni_sina",label:"İbn-i Sina Tıbbı",emoji:"📜",renk:"#D4A843",aciklama:"El-Kanun fi't-Tıbb; dört hümor, mizaç teorisi ve gıda-ilaç bütünlüğü",
   konular:[
    {id:"sina_humor",baslik:"Dört Hümor Teorisi",ozet:"Kan, balgam, sarı safra, kara safra — dengenin ve hastalığın temeli",kategori:"Temel"},
    {id:"sina_mizac",baslik:"Mizaç (Temperament)",ozet:"Sıcak-Kuru, Sıcak-Nemli, Soğuk-Nemli, Soğuk-Kuru ve beslenme",kategori:"Temel"},
    {id:"sina_gida_ilac",baslik:"Gıda İlaçtır",ozet:"Doğru besin, doğru zamanda — tıbbın birinci aracı",kategori:"Temel"},
    {id:"sina_beslenme_tedavi",baslik:"Beslenme Tedavisi",ozet:"Önce diyet, sonra bitki, sonra ilaç — sıra prensibi",kategori:"Tedavi"},
    {id:"sina_mevsim",baslik:"Mevsim ve Mizaç",ozet:"Mevsimsel beslenme ve mizaç uyumu",kategori:"Uygulama"},
    {id:"sina_sindirim",baslik:"Sindirim Ateşi",ozet:"Hazım kuvveti ve mide dostu yaşam",kategori:"Tedavi"},
    {id:"sina_uyku",baslik:"Uyku ve Dinlenme",ozet:"İbn-i Sina'ya göre uyku düzeni ve sağlık",kategori:"Uygulama"},
    {id:"sina_bitkiler",baslik:"Şifalı Bitkiler",ozet:"El-Kanun'dan bitkisel reçeteler ve kullanım",kategori:"Bitki"},
    {id:"sina_su",baslik:"Su Tedavisi",ozet:"İbn-i Sina'nın su içme kuralları ve hidroterapi yöntemleri",kategori:"Tedavi"},
    {id:"sina_hareket",baslik:"Hareket ve Egzersiz",ozet:"Bedeni çalıştırma, yürüyüş ve vücut bakımı prensipleri",kategori:"Uygulama"},
    {id:"sina_nabiz",baslik:"Nabız Teşhisi",ozet:"Nabız okuma sanatı ve hastalık teşhisinde kullanımı",kategori:"Teşhis"},
    {id:"sina_ruh",baslik:"Ruh ve Beden İlişkisi",ozet:"Psikolojik durumun fiziksel sağlığa etkisi",kategori:"Temel"},
    {id:"sina_yaslilık",baslik:"Yaşlanma ve Uzun Ömür",ozet:"Anti-aging stratejileri ve yaşlılıkta beslenme",kategori:"Uygulama"},
    {id:"sina_zehir",baslik:"Zehirler ve Panzehirler",ozet:"Besinlerdeki zararlılar ve doğal çözümler",kategori:"Tedavi"},
    {id:"sina_hamam",baslik:"Hamam ve Terapi",ozet:"Türk hamamı geleneğinin tıbbi temelleri",kategori:"Uygulama"},
    {id:"sina_cocuk",baslik:"Çocuk Sağlığı",ozet:"İbn-i Sina'nın pediatri yaklaşımı ve çocuk beslenmesi",kategori:"Tedavi"},
   ]
  },
  {id:"tibbi_nebevi",label:"Tıbbı Nebevi",emoji:"☪️",renk:"#4CAF7A",aciklama:"Hz. Peygamber'in (s.a.v.) tıp mirası; dua, bitki ve yaşam sünnetleri",
   konular:[
    {id:"nebevi_bal",baslik:"Balın Şifa Gücü",ozet:"Kur'an ve Sünnet'te balın önemi ve modern bilimin doğrulamaları",kategori:"Gıda"},
    {id:"nebevi_hicama",baslik:"Hicama (Hacamat)",ozet:"Nebevi tıbbın en önemli uygulamalarından hacamatın faydaları ve zamanı",kategori:"Tedavi"},
    {id:"nebevi_corekotu",baslik:"Çörek Otu (Habbetüssevda)",ozet:"'Ölümden başka her derde deva' — bilimsel kanıtlar ve kullanım",kategori:"Bitki"},
    {id:"nebevi_oruc",baslik:"Oruç ve Şifa",ozet:"Perşembe-Pazartesi orucu, Ramazan ve şifavi etkileri",kategori:"Pratik"},
    {id:"nebevi_misvak",baslik:"Misvak ve Ağız Sağlığı",ozet:"Diş fırçasından üstün nebevi pratik",kategori:"Pratik"},
    {id:"nebevi_dua",baslik:"Dua ve Şifa",ozet:"Rukye, şifa duaları ve manevi tedavi",kategori:"Manevi"},
    {id:"nebevi_zeytinyagi",baslik:"Zeytinyağı — Mübarek Ağaç",ozet:"'Yiyin ve sürünün' — zeytinyağının iç ve dış kullanımı",kategori:"Gıda"},
    {id:"nebevi_hurma",baslik:"Hurma — Cennet Meyvesi",ozet:"Sahur ve iftar sünneti ile şifavi özellikleri",kategori:"Gıda"},
    {id:"nebevi_zemzem",baslik:"Zemzem Suyu",ozet:"Zemzem'in mineral yapısı ve şifa hadisleri",kategori:"Gıda"},
    {id:"nebevi_kina",baslik:"Kına ve Nebevi Kozmetik",ozet:"Kına, sürme ve nebevi güzellik pratikleri",kategori:"Pratik"},
    {id:"nebevi_sirke",baslik:"Sirke — Güzel Katık",ozet:"Hz. Peygamber'in sevdiği çeşni ve modern faydaları",kategori:"Gıda"},
    {id:"nebevi_zencefil",baslik:"Zencefil",ozet:"Kur'an'da adı geçen bitki ve şifa özellikleri",kategori:"Bitki"},
    {id:"nebevi_mide",baslik:"Midenin Üçte Biri",ozet:"1/3 yemek, 1/3 su, 1/3 nefes — porsiyon prensibi",kategori:"Temel"},
    {id:"nebevi_uyku",baslik:"Nebevi Uyku Düzeni",ozet:"Sağ tarafa yatma, uyku duaları ve gece namazı",kategori:"Pratik"},
    {id:"nebevi_temizlik",baslik:"Temizlik İmandandır",ozet:"Abdest, gusül ve hijyen sünnetleri — bilimsel açıdan",kategori:"Pratik"},
    {id:"nebevi_sabr",baslik:"Sabır ve Hastalık",ozet:"Hastalıklara karşı sabır, şükür ve şifa psikolojisi",kategori:"Manevi"},
   ]
  },
  {id:"ayurveda",label:"Ayurveda",emoji:"🪷",renk:"#9B7FD4",aciklama:"5000 yıllık Hint bilgeliği; dosha dengesi, prakriti ve şifavi yaşam sanatı",
   konular:[
    {id:"ayurveda_dosha",baslik:"Doshas: Vata, Pitta, Kapha",ozet:"Üç dosha ve kişisel constitution analizi",kategori:"Temel"},
    {id:"ayurveda_prakriti",baslik:"Prakriti — Doğal Yapın",ozet:"Kendi doğanı tanı ve ona göre yaşa",kategori:"Temel"},
    {id:"ayurveda_dinacharya",baslik:"Dinacharya — Günlük Rutin",ozet:"Sabah altın saatinden gece ritüeline Ayurvedik gün planı",kategori:"Pratik"},
    {id:"ayurveda_ahara",baslik:"Ayurvedik Beslenme (Ahara)",ozet:"6 tat, sindirim ateşi (agni) ve dosha beslenme rehberi",kategori:"Beslenme"},
    {id:"ayurveda_panchakarma",baslik:"Panchakarma Detox",ozet:"5 arındırma tedavisi — derin temizlenme protokolü",kategori:"Tedavi"},
    {id:"ayurveda_bitkiler",baslik:"Ayurvedik Bitkiler",ozet:"Ashwagandha, Brahmi, Turmeric, Triphala ve diğerleri",kategori:"Bitki"},
    {id:"ayurveda_yoga",baslik:"Yoga ve Pranayama",ozet:"Dosha tipine göre yoga ve nefes pratikleri",kategori:"Hareket"},
    {id:"ayurveda_rtu",baslik:"Ritucharya — Mevsimsel Yaşam",ozet:"Her mevsim için Ayurvedik uyum rehberi",kategori:"Pratik"},
    {id:"ayurveda_agni",baslik:"Agni — Sindirim Ateşi",ozet:"Dört agni tipi, zayıf agni belirtileri ve güçlendirme yolları",kategori:"Temel"},
    {id:"ayurveda_ama",baslik:"Ama — Toksin Birikimi",ozet:"Sindirilmemiş gıdanın toksine dönüşmesi ve temizleme",kategori:"Tedavi"},
    {id:"ayurveda_ojas",baslik:"Ojas — Yaşam Özü",ozet:"Bağışıklığın ve canlılığın kaynağı; artırma yöntemleri",kategori:"Temel"},
    {id:"ayurveda_rasayana",baslik:"Rasayana — Gençleştirme",ozet:"Ayurvedik anti-aging ve doku yenileme formülleri",kategori:"Tedavi"},
    {id:"ayurveda_ghee",baslik:"Ghee — Kutsal Yağ",ozet:"Ghee'nin tıbbi kullanımları, hazırlanışı ve dosha etkileri",kategori:"Gıda"},
    {id:"ayurveda_chai",baslik:"Ayurvedik Çaylar ve İçecekler",ozet:"Altın süt, CCF çayı, tulsi çayı ve terapötik formüller",kategori:"Gıda"},
    {id:"ayurveda_marma",baslik:"Marma Noktaları",ozet:"Ayurvedik akupresür — 107 yaşam noktası",kategori:"Tedavi"},
    {id:"ayurveda_nidra",baslik:"Yoga Nidra — Bilinçli Uyku",ozet:"Derin dinlenme ve iyileşme meditasyonu",kategori:"Hareket"},
   ]
  },
  {id:"cin_tibbi",label:"Çin Tıbbı",emoji:"☯️",renk:"#E05252",aciklama:"Qi, Yin-Yang dengesi ve 5 element teorisi ile bütünsel şifa",
   konular:[
    {id:"cin_qi",baslik:"Qi — Yaşam Enerjisi",ozet:"Qi nedir, nasıl akar ve nasıl dengede tutulur",kategori:"Temel"},
    {id:"cin_yin_yang",baslik:"Yin-Yang Teorisi",ozet:"Zıtların dengesi ve hastalıkla ilişkisi",kategori:"Temel"},
    {id:"cin_5element",baslik:"Beş Element Teorisi",ozet:"Ahşap, Ateş, Toprak, Metal, Su ve organ bağlantıları",kategori:"Temel"},
    {id:"cin_meridyen",baslik:"Meridyenler ve Akupunktur",ozet:"12 ana meridyen ve enerji akış haritası",kategori:"Tedavi"},
    {id:"cin_bitkisel",baslik:"Çin Bitkisel Tıbbı",ozet:"Ginseng, Astragalus, Reishi ve formülasyonlar",kategori:"Bitki"},
    {id:"cin_beslenme",baslik:"Çin Tıbbına Göre Beslenme",ozet:"Gıdaların enerji özellikleri ve organ uyumu",kategori:"Beslenme"},
    {id:"cin_tui_na",baslik:"Tui Na Masajı",ozet:"Terapötik Çin masajı teknikleri",kategori:"Tedavi"},
    {id:"cin_qigong",baslik:"Qigong Pratikleri",ozet:"Nefes, hareket ve meditasyon entegrasyonu",kategori:"Hareket"},
    {id:"cin_tai_chi",baslik:"Tai Chi Chuan",ozet:"Hareketli meditasyon — denge, koordinasyon ve enerji akışı",kategori:"Hareket"},
    {id:"cin_moxibusyon",baslik:"Moxibüsyon Terapisi",ozet:"Pelin otu yakarak meridyen uyarımı ve ısı tedavisi",kategori:"Tedavi"},
    {id:"cin_cupping",baslik:"Kupa Terapisi (Cupping)",ozet:"Kan akışını artırma, ağrı giderme ve detoks yöntemi",kategori:"Tedavi"},
    {id:"cin_tongue",baslik:"Dil Teşhisi",ozet:"Dil rengi, şekli ve kaplamasından hastalık okuma",kategori:"Teşhis"},
    {id:"cin_mevsim_organ",baslik:"Mevsim ve Organ İlişkisi",ozet:"Her mevsimde güçlenen organ ve beslenme stratejisi",kategori:"Beslenme"},
    {id:"cin_goji",baslik:"Goji Berry ve Süper Gıdalar",ozet:"Çin tıbbının en değerli gıdaları ve faydaları",kategori:"Gıda"},
    {id:"cin_mantar",baslik:"Tıbbi Mantarlar",ozet:"Reishi, Chaga, Lion's Mane, Cordyceps — bilgelik mantarları",kategori:"Bitki"},
    {id:"cin_face",baslik:"Yüz Haritalama (Mien Shiang)",ozet:"Yüz bölgelerinden organ sağlığı okuma sanatı",kategori:"Teşhis"},
   ]
  },
  {id:"fonksiyonel_tip",label:"Fonksiyonel Tıp",emoji:"🔬",renk:"#5BA3D0",aciklama:"Hastalığın kök nedenine inen, kişiselleştirilmiş biyoloji tabanlı tıp",
   konular:[
    {id:"ft_gut_aks",baslik:"Bağırsak-Beyin Ekseni",ozet:"Mikrobiyom, serotonin ve ruh sağlığı bağlantısı",kategori:"Sistem"},
    {id:"ft_inflamasyon",baslik:"Kronik İnflamasyon",ozet:"Sessiz iltihap, nedenleri ve doğal çözümleri",kategori:"Patoloji"},
    {id:"ft_mitokondri",baslik:"Mitokondri Optimizasyonu",ozet:"Hücresel enerji fabrikasını güçlendirme",kategori:"Hücre"},
    {id:"ft_hormon",baslik:"Hormon Dengesi",ozet:"Kortizol, insülin, tiroid ve cinsiyet hormonları",kategori:"Sistem"},
    {id:"ft_detoks",baslik:"Detoksifikasyon Yolları",ozet:"Karaciğer fazı 1-2, metilasyon ve toksin atılımı",kategori:"Tedavi"},
    {id:"ft_besin",baslik:"Besin Eksiklikleri",ozet:"D vitamini, Magnezyum, B12, Omega-3 ve test rehberi",kategori:"Tanı"},
    {id:"ft_stres",baslik:"HPA Aksı ve Stres",ozet:"Sürrenal yorgunluk, kortizol ritmi ve iyileşme",kategori:"Sistem"},
    {id:"ft_uyku",baslik:"Uyku Biyolojisi",ozet:"Sirkadiyen ritim, melatonin ve derin uyku optimizasyonu",kategori:"Pratik"},
    {id:"ft_mikrobiyom",baslik:"Mikrobiyom Ekolojisi",ozet:"Bağırsak florası çeşitliliği, disbiyoz ve düzeltme protokolü",kategori:"Sistem"},
    {id:"ft_leaky_gut",baslik:"Geçirgen Bağırsak Sendromu",ozet:"Bağırsak duvarı bütünlüğü, zonulin ve onarım",kategori:"Patoloji"},
    {id:"ft_metilasyon",baslik:"Metilasyon ve MTHFR",ozet:"Genetik polimorfizm, folat döngüsü ve beyin sağlığı",kategori:"Genetik"},
    {id:"ft_otoimmun",baslik:"Otoimmün Hastalıklar",ozet:"Bağışıklık sisteminin kendine saldırması — kök nedenler ve yaklaşım",kategori:"Patoloji"},
    {id:"ft_tiroid",baslik:"Tiroid Sağlığı",ozet:"Hashimoto, hipotiroidi, besinler ve yaşam tarzı müdahaleleri",kategori:"Sistem"},
    {id:"ft_insulin",baslik:"İnsülin Direnci Mekanizması",ozet:"Metabolik sendrom, hücresel enerji ve geri döndürme stratejileri",kategori:"Patoloji"},
    {id:"ft_epigenetik",baslik:"Epigenetik ve Beslenme",ozet:"Genler kader değil — beslenme ile gen ifadesini değiştirme",kategori:"Genetik"},
    {id:"ft_agir_metal",baslik:"Ağır Metal Detoksu",ozet:"Cıva, kurşun, aluminyum — kaynak, test ve arındırma",kategori:"Tedavi"},
   ]
  },
  {id:"beslenme",label:"Beslenme Bilimi",emoji:"🥗",renk:"#4CAF7A",aciklama:"Kanıta dayalı beslenme bilimi ve metabolik sağlık",
   konular:[
    {id:"beslenme_makro",baslik:"Makro Besin Dengesi",ozet:"Karbonhidrat, protein, yağ oranları ve kişisel ihtiyaç",kategori:"Temel"},
    {id:"beslenme_mikro",baslik:"Mikro Besinler",ozet:"Vitamin ve minerallerin kaynak ve işlevleri",kategori:"Temel"},
    {id:"beslenme_anti",baslik:"Anti-inflamatuar Beslenme",ozet:"Omega-3, polifenoller ve renkli gıdalar",kategori:"Diyet"},
    {id:"beslenme_insulin",baslik:"İnsülin Direnci ve Diyet",ozet:"Gliksemik yük, insülin duyarlılığı ve diyet stratejisi",kategori:"Metabolik"},
    {id:"beslenme_ketojenik",baslik:"Ketojenik Beslenme",ozet:"Keto bilimi, faydaları, riskleri ve uygulama",kategori:"Diyet"},
    {id:"beslenme_aralikli",baslik:"Aralıklı Oruç Bilimi",ozet:"16:8, 5:2 ve OMAD — metabolik etkileri",kategori:"Diyet"},
    {id:"beslenme_gut",baslik:"Bağırsak Sağlığı Diyeti",ozet:"Prebiyotik, probiyotik ve fermente gıdalar",kategori:"Bağırsak"},
    {id:"beslenme_yas",baslik:"Yaşa Göre Beslenme",ozet:"Çocuk, yetişkin, hamile ve yaşlı beslenme farklılıkları",kategori:"Dönemsel"},
    {id:"beslenme_protein",baslik:"Protein Bilimi",ozet:"Amino asitler, biyoyararlanım, hayvansal vs bitkisel kaynak",kategori:"Temel"},
    {id:"beslenme_yag",baslik:"Yağ Bilimi",ozet:"Doymuş, doymamış, trans yağ — zararı ve faydası",kategori:"Temel"},
    {id:"beslenme_lif",baslik:"Diyet Lifi ve Prebiyotikler",ozet:"Çözünür ve çözünmez lif, kaynak ve mikrobiyom etkisi",kategori:"Bağırsak"},
    {id:"beslenme_antioksidan",baslik:"Antioksidanlar ve Serbest Radikaller",ozet:"Oksidatif stres, ORAC değeri ve koruyucu gıdalar",kategori:"Temel"},
    {id:"beslenme_fermente",baslik:"Fermente Gıdalar",ozet:"Kefir, kimchi, sauerkraut, miso — yapımı ve faydaları",kategori:"Bağırsak"},
    {id:"beslenme_akdeniz",baslik:"Akdeniz Diyeti",ozet:"Dünyanın en sağlıklı diyeti — bilimsel kanıtlar",kategori:"Diyet"},
    {id:"beslenme_beyin",baslik:"Beyin Beslemesi",ozet:"Omega-3, flavonoidler, BDNF ve kognitif performans",kategori:"Organ"},
    {id:"beslenme_spor",baslik:"Sporcu Beslenmesi",ozet:"Egzersiz öncesi-sonrası beslenme, performans ve toparlanma",kategori:"Dönemsel"},
    {id:"beslenme_hamile",baslik:"Hamilelikte Beslenme",ozet:"Folat, demir, DHA ve trimester bazlı beslenme rehberi",kategori:"Dönemsel"},
    {id:"beslenme_kalp",baslik:"Kalp Sağlığı ve Beslenme",ozet:"Kolesterol, homosistein, potasyum ve kardiyovasküler diyet",kategori:"Organ"},
   ]
  },
  {id:"bitkisel",label:"Bitkisel Şifa",emoji:"🌿",renk:"#2DD4BF",aciklama:"Fitoterapinin gücü — doğanın eczanesi",
   konular:[
    {id:"bitki_adaptogen",baslik:"Adaptogenler",ozet:"Ashwagandha, Rhodiola, Ginseng — stres uyum bitkileri",kategori:"Stres"},
    {id:"bitki_sindirim",baslik:"Sindirim Bitkileri",ozet:"Zencefil, nane, rezene, kimyon ve bağırsak şifası",kategori:"Sindirim"},
    {id:"bitki_uyku",baslik:"Uyku Bitkileri",ozet:"Melisa, papatya, lavanta, valeryan — doğal uyku desteği",kategori:"Uyku"},
    {id:"bitki_bagisiklik",baslik:"Bağışıklık Bitkileri",ozet:"Ekinezya, zerdecal, kara mürver, morinda",kategori:"Bağışıklık"},
    {id:"bitki_kadin",baslik:"Kadın Sağlığı Bitkileri",ozet:"Kediotu, çuha çiçeği, ibe otu — hormonal denge",kategori:"Kadın"},
    {id:"bitki_detoks",baslik:"Detoks Bitkileri",ozet:"Deve dikeni, karahindiba, ısırgan otu ve karaciğer şifası",kategori:"Detoks"},
    {id:"bitki_cay",baslik:"Şifalı Çay Formülleri",ozet:"Sabah, akşam, detoks ve bağışıklık çay blendleri",kategori:"Formül"},
    {id:"bitki_baharat",baslik:"Şifalı Baharatlar",ozet:"Zerdecal, karanfil, tarçın, kişniş — mutfak eczanesi",kategori:"Baharat"},
    {id:"bitki_zerdecal",baslik:"Zerdeçal — Altın Baharat",ozet:"Curcumin'in anti-inflamatuar gücü, biyoyararlanım ve kullanım",kategori:"Baharat"},
    {id:"bitki_acibadem",baslik:"Mushroom Medicine",ozet:"Reishi, Chaga, Lion's Mane, Turkey Tail — tıbbi mantarlar",kategori:"Bağışıklık"},
    {id:"bitki_aromaterapi",baslik:"Aromaterapi ve Uçucu Yağlar",ozet:"Lavanta, çay ağacı, okaliptüs — uygulama ve dozaj",kategori:"Dış Kullanım"},
    {id:"bitki_cilt",baslik:"Cilt Sağlığı Bitkileri",ozet:"Aloe vera, neem, gül suyu — doğal cilt bakımı",kategori:"Dış Kullanım"},
    {id:"bitki_eklem",baslik:"Eklem ve Kas Bitkileri",ozet:"Boswellia, Devil's claw, arnika — doğal ağrı giderme",kategori:"Ağrı"},
    {id:"bitki_zihin",baslik:"Zihin Berraklığı Bitkileri",ozet:"Ginkgo, Bacopa, Gotu kola — hafıza ve odaklanma",kategori:"Beyin"},
    {id:"bitki_donemsel",baslik:"Dönemsel Bitki Kürü",ozet:"İlkbahar detoks, kış bağışıklık, yaz serinletme formülleri",kategori:"Formül"},
    {id:"bitki_tinktur",baslik:"Tinktur ve Ekstre Hazırlama",ozet:"Evde bitki tentürü, yağlı ekstre ve macun yapımı",kategori:"Formül"},
   ]
  },
  {id:"gunluk_pratik",label:"Günlük Pratik",emoji:"🌅",renk:"#F59E0B",aciklama:"Sabah rutini, mevsim geçişi, stres ve uyku — hemen uygulanabilir adımlar",
   konular:[
    {id:"pratik_sabah",baslik:"Sabah Rutini",ozet:"Uyanış, su, hareket ve ilk öğün — güne doğru başlangıç",kategori:"Günlük"},
    {id:"pratik_mevsim",baslik:"Mevsim Geçişlerinde Beslenme",ozet:"İlkbahar, yaz, sonbahar, kış — bedeni mevsime uyumlama",kategori:"Mevsim"},
    {id:"pratik_stres",baslik:"Stres Azaltma Teknikleri",ozet:"Günlük stresi azaltan nefes, beslenme ve hareket",kategori:"Stres"},
    {id:"pratik_uyku",baslik:"Uyku Hijyeni",ozet:"Uyku kalitesini artıran alışkanlıklar ve bitkiler",kategori:"Uyku"},
    {id:"pratik_su",baslik:"Su ve Hidrasyon",ozet:"Günlük su ihtiyacı, zamanlama ve bitkili sular",kategori:"Günlük"},
    {id:"pratik_aralik",baslik:"Aralıklı Oruç Pratiği",ozet:"16:8, 14:10 ve haftalık oruç — uygulama rehberi",kategori:"Oruç"},
    {id:"pratik_ogun",baslik:"Öğün Zamanlaması",ozet:"Sindirim ateşi ve öğün sıklığı — ne zaman yemeli",kategori:"Günlük"},
    {id:"pratik_mevsim_bitki",baslik:"Mevsimsel Bitki Çayları",ozet:"Her mevsime uygun çay ve infüzyon önerileri",kategori:"Mevsim"},
    {id:"pratik_nefes",baslik:"Nefes Teknikleri",ozet:"4-7-8, kutu nefesi, Wim Hof — günlük nefes pratiği",kategori:"Nefes"},
    {id:"pratik_meditasyon",baslik:"Meditasyon Rehberi",ozet:"Başlangıç, farkındalık, body scan ve metta meditasyonu",kategori:"Zihin"},
    {id:"pratik_soğuk",baslik:"Soğuk Terapi",ozet:"Soğuk duş, buz banyosu — Wim Hof metodu ve faydaları",kategori:"Terapi"},
    {id:"pratik_topraklama",baslik:"Topraklama (Earthing)",ozet:"Çıplak ayakla toprağa basma ve elektromanyetik denge",kategori:"Doğa"},
    {id:"pratik_dijital",baslik:"Dijital Detoks",ozet:"Ekran süresi, mavi ışık ve beyin dinlendirme stratejileri",kategori:"Zihin"},
    {id:"pratik_sabah_gunes",baslik:"Sabah Güneşi Pratiği",ozet:"Sirkadiyen ritmi sıfırlayan 10 dakikalık güneş ritueli",kategori:"Günlük"},
    {id:"pratik_yuruyus",baslik:"Bilinçli Yürüyüş",ozet:"Yemek sonrası yürüyüş, doğa yürüyüşü ve metabolik etki",kategori:"Hareket"},
    {id:"pratik_gratitude",baslik:"Şükür Pratiği",ozet:"Günlük şükür defteri, zihinsel sağlık ve mutluluk bilimi",kategori:"Zihin"},
   ]
  },
  {id:"metabolizma",label:"Metabolizma",emoji:"🔥",renk:"#F97316",aciklama:"Metabolik sağlık, enerji üretimi ve hormonal denge",
   konular:[
    {id:"meta_bazal",baslik:"Bazal Metabolizma",ozet:"BMR hesaplama, etkileyen faktörler ve hızlandırma yolları",kategori:"Temel"},
    {id:"meta_insulin_mek",baslik:"İnsülin Mekanizması",ozet:"Kan şekeri regülasyonu, insülin direnci ve geri döndürme",kategori:"Hormon"},
    {id:"meta_tiroid_deep",baslik:"Tiroid ve Metabolizma",ozet:"T3, T4, TSH — tiroid hormonlarının metabolik etkileri",kategori:"Hormon"},
    {id:"meta_kortizol",baslik:"Kortizol ve Stres Metabolizması",ozet:"Kortizol ritmi, belly fat ve doğal dengeleme",kategori:"Hormon"},
    {id:"meta_leptin",baslik:"Leptin ve Ghrelin",ozet:"Açlık-tokluk hormonları ve kilo yönetimi",kategori:"Hormon"},
    {id:"meta_termojenik",baslik:"Termojenik Gıdalar",ozet:"Metabolizmayı hızlandıran besinler ve baharatlar",kategori:"Beslenme"},
    {id:"meta_brown_fat",baslik:"Kahverengi Yağ Dokusu",ozet:"Yağ yakarak ısı üreten doku ve aktive etme yolları",kategori:"Hücre"},
    {id:"meta_autophagy",baslik:"Otofaji — Hücresel Temizlik",ozet:"Oruç ve egzersizle tetiklenen hücre yenileme süreci",kategori:"Hücre"},
    {id:"meta_keto_mek",baslik:"Ketozis Mekanizması",ozet:"Yağ yakımına geçiş, keton cisimleri ve beyin enerjisi",kategori:"Metabolik"},
    {id:"meta_glikojen",baslik:"Glikojen Depoları",ozet:"Kas ve karaciğer glikojeni, spor performansı ve beslenme",kategori:"Metabolik"},
   ]
  },
  {id:"superfoods",label:"Süper Gıdalar",emoji:"🫐",renk:"#8B5CF6",aciklama:"Besin yoğunluğu en yüksek gıdalar ve etkileri",
   konular:[
    {id:"sf_acai",baslik:"Açai ve Berry Ailesİ",ozet:"Antioksidan şampiyonları — blueberry, goji, aronia, açai",kategori:"Meyve"},
    {id:"sf_chia",baslik:"Chia Tohumu",ozet:"Omega-3, lif ve protein deposu — kullanım ve tarifler",kategori:"Tohum"},
    {id:"sf_spirulina",baslik:"Spirulina ve Chlorella",ozet:"Mikroalg süper gıdalar — protein, demir ve detoks",kategori:"Alg"},
    {id:"sf_kefir",baslik:"Kefir — Kafkas Mucizesi",ozet:"Probiyotik zenginliği, yapımı ve sağlık etkileri",kategori:"Fermente"},
    {id:"sf_kemik_suyu",baslik:"Kemik Suyu (Bone Broth)",ozet:"Kolajen, jelatin, glutamin — bağırsak ve eklem şifası",kategori:"Hayvansal"},
    {id:"sf_raw_kakao",baslik:"Ham Kakao",ozet:"Theobromin, magnezyum ve antioksidan — çikolatanın karanlık yüzü",kategori:"Bitki"},
    {id:"sf_bee_pollen",baslik:"Arı Poleni ve Propolis",ozet:"Arı ürünlerinin bağışıklık ve enerji etkileri",kategori:"Arı"},
    {id:"sf_moringa",baslik:"Moringa — Mucize Ağacı",ozet:"90 besin maddesi içeren yaprak — kullanım rehberi",kategori:"Bitki"},
    {id:"sf_avokado",baslik:"Avokado ve Sağlıklı Yağlar",ozet:"Tekli doymamış yağ, potasyum ve besin emilimi",kategori:"Meyve"},
    {id:"sf_ceviz",baslik:"Ceviz ve Beyin Sağlığı",ozet:"Omega-3, melatonin ve nöroprotektif etki",kategori:"Kuruyemiş"},
    {id:"sf_sarimsak",baslik:"Sarımsak — Doğal Antibiyotik",ozet:"Allicin, bağışıklık ve kardiyovasküler koruma",kategori:"Sebze"},
    {id:"sf_zencefil_deep",baslik:"Zencefil Derinlemesine",ozet:"Gingerol, bulantı giderme, anti-inflamatuar ve sindirim",kategori:"Baharat"},
   ]
  },
  {id:"zihin_sagligi",label:"Zihin Sağlığı",emoji:"🧠",renk:"#EC4899",aciklama:"Nörobeslenme, stres yönetimi ve zihinsel performans",
   konular:[
    {id:"zihin_serotonin",baslik:"Serotonin ve Beslenme",ozet:"Mutluluk hormonu, triptofan kaynakları ve bağırsak bağlantısı",kategori:"Nöro"},
    {id:"zihin_dopamin",baslik:"Dopamin Dengesi",ozet:"Motivasyon, ödül sistemi ve doğal dopamin artırma",kategori:"Nöro"},
    {id:"zihin_gaba",baslik:"GABA ve Sakinleşme",ozet:"İnhibitör nörotransmitter, doğal kaynakları ve anksiyete",kategori:"Nöro"},
    {id:"zihin_bdnf",baslik:"BDNF — Beyin Gübresi",ozet:"Nöron büyüme faktörü, egzersiz ve besinlerle artırma",kategori:"Nöro"},
    {id:"zihin_anksiyete",baslik:"Anksiyete ve Beslenme",ozet:"Kaygı azaltan gıdalar, magnezyum ve bağırsak bağlantısı",kategori:"Rahatsızlık"},
    {id:"zihin_depresyon",baslik:"Depresyon ve Diyet",ozet:"Anti-depresan gıdalar, omega-3 ve inflamasyon bağlantısı",kategori:"Rahatsızlık"},
    {id:"zihin_odak",baslik:"Odaklanma ve Dikkat",ozet:"Nootropikler, kafein, L-theanine ve beyin performansı",kategori:"Performans"},
    {id:"zihin_hafiza",baslik:"Hafıza Güçlendirme",ozet:"Hippocampus, besin maddeleri ve hafıza teknikleri",kategori:"Performans"},
    {id:"zihin_sirkadiyen",baslik:"Sirkadiyen Ritim ve Ruh Hali",ozet:"Işık, melatonin ve mevsimlerin ruh haline etkisi",kategori:"Ritim"},
    {id:"zihin_bagırsak_beyin",baslik:"Psikobiyotikler",ozet:"Ruh halini etkileyen probiyotikler ve bağırsak-beyin ekseni",kategori:"Nöro"},
   ]
  },
  {id:"cocuk_beslenme",label:"Çocuk Sağlığı",emoji:"👶",renk:"#06B6D4",aciklama:"Bebeklikten ergenliğe sağlıklı büyüme ve beslenme",
   konular:[
    {id:"cocuk_emzirme",baslik:"Anne Sütü ve Emzirme",ozet:"İlk 6 ay münhasır emzirme, anne sütünün mucizevi bileşimi",kategori:"Bebek"},
    {id:"cocuk_ek_gida",baslik:"Ek Gıdaya Geçiş",ozet:"6. aydan itibaren adım adım beslenme — BLW vs geleneksel",kategori:"Bebek"},
    {id:"cocuk_alerji",baslik:"Gıda Alerjileri",ozet:"En sık alerjenler, tanı, eliminasyon diyeti ve büyüme",kategori:"Alerji"},
    {id:"cocuk_buyume",baslik:"Büyüme ve Gelişim Besinleri",ozet:"Kalsiyum, D vitamini, çinko ve protein — boy uzaması",kategori:"Gelişim"},
    {id:"cocuk_okul",baslik:"Okul Çağı Beslenmesi",ozet:"Beslenme çantası, konsantrasyon artıran gıdalar",kategori:"Gelişim"},
    {id:"cocuk_ergen",baslik:"Ergenlik Dönemi Beslenmesi",ozet:"Hormonal değişim, demir ihtiyacı ve yeme bozuklukları",kategori:"Gelişim"},
    {id:"cocuk_bagisiklik",baslik:"Çocuklarda Bağışıklık",ozet:"Sık hastalanma, probiyotikler ve doğal güçlendirme",kategori:"Bağışıklık"},
    {id:"cocuk_seker",baslik:"Çocuk ve Şeker",ozet:"Gizli şeker tuzakları, DEHB bağlantısı ve sağlıklı alternatifler",kategori:"Risk"},
   ]
  },
  {id:"kadin_sagligi",label:"Kadın Sağlığı",emoji:"🌸",renk:"#F472B6",aciklama:"Hormonal denge, döngüsel beslenme ve kadına özel sağlık",
   konular:[
    {id:"kadin_adet",baslik:"Adet Döngüsü ve Beslenme",ozet:"Foliküler, ovülasyon, luteal, menstrüasyon — döngüsel diyet",kategori:"Döngü"},
    {id:"kadin_pcos",baslik:"PCOS ve Diyet",ozet:"Polikistik over sendromu, insülin direnci ve beslenme stratejisi",kategori:"Rahatsızlık"},
    {id:"kadin_menopoz",baslik:"Menopoz Dönemi",ozet:"Sıcak basma, kemik erimesi ve fitoöstrojen kaynakları",kategori:"Dönem"},
    {id:"kadin_hamile_besin",baslik:"Hamilelik Beslenmesi Detaylı",ozet:"Trimester bazlı besin ihtiyacı, yasak gıdalar ve takviyeler",kategori:"Hamilelik"},
    {id:"kadin_demir",baslik:"Demir Eksikliği ve Kadın",ozet:"Adet kaybı, ferritin, emilim artırma ve bitkisel kaynaklar",kategori:"Mineral"},
    {id:"kadin_endometriozis",baslik:"Endometriozis ve Beslenme",ozet:"Anti-inflamatuar diyet, östrojen metabolizması ve destek",kategori:"Rahatsızlık"},
    {id:"kadin_cilt_sac",baslik:"Cilt ve Saç Beslenmesi",ozet:"Kolajen, biyotin, çinko ve güzellik besinleri",kategori:"Güzellik"},
    {id:"kadin_stres_hormon",baslik:"Kadın Stresi ve Hormonlar",ozet:"Kortizol-progesteron ilişkisi ve kadına özel stres yönetimi",kategori:"Hormon"},
   ]
  },
];

function AkademiTab(){
  var [secilenOkul,setSecilenOkul]=useState(null);
  var [secilenKonu,setSecilenKonu]=useState(null);
  var [icerik,setIcerik]=useState("");
  var [loading,setLoading]=useState(false);
  var [aramaMetni,setAramaMetni]=useState("");
  var [kategoriFiltre,setKategoriFiltre]=useState(null);
  var [detayOkul,setDetayOkul]=useState(null);
  var [favKonular,setFavKonular]=useState(function(){try{return JSON.parse(localStorage.getItem("akademi_fav")||"[]");}catch(e){return [];}});
  var toplamKonu=AKADEMI_OKULLAR.reduce(function(s,o){return s+o.konular.length;},0);

  function toggleFavKonu(konuId){
    setFavKonular(function(prev){
      var next=prev.includes(konuId)?prev.filter(function(k){return k!==konuId;}):prev.concat([konuId]);
      try{localStorage.setItem("akademi_fav",JSON.stringify(next));}catch(e){}
      return next;
    });
  }

  async function konuYukle(okul,konu){
    setSecilenOkul(okul);setSecilenKonu(konu);setIcerik("");setLoading(true);
    try{
      var sys="Sen "+okul.label+" alanında 30 yıllık deneyime sahip, dünyaca ünlü bir akademisyen, araştırmacı ve klinik uygulayıcısın. Hem geleneksel kaynakları hem modern bilimsel çalışmaları mükemmel bilirsin. Türkçe, akıcı ve ansiklopedik derinlikte yaz.";
      var accumulated="";
      await callAIStream(sys,
        "Şu konu hakkında kapsamlı, derinlikli ve bilgi dolu bir Türkçe akademik makale yaz:\n\nKonu: "+konu.baslik+"\nÖzet: "+konu.ozet+"\nOkul: "+okul.label+"\n\nMakale yapısı (tüm bölümleri dahil et):\n1. GİRİŞ — Konunun önemi ve güncelliği (neden önemli?)\n2. TARİHSEL ARKA PLAN — Konunun tarihi kökenleri, önemli isimler ve eserler\n3. BİLİMSEL TEMELLER — Mekanizma, fizyoloji, modern araştırmalar ve kanıtlar\n4. DETAYLİ ANALİZ — Konunun alt dalları, sınıflandırmaları ve derinlemesine inceleme\n5. PRATİK UYGULAMA — Somut örnekler, tarifler, dozajlar ve günlük hayatta kullanım\n6. DİKKAT EDİLMESİ GEREKENLER — Kontrendikasyonlar, riskler ve uyarılar\n7. SONUÇ VE ÖNERİLER — Özet ve okuyucuya eylem planı\n\nKurallar:\n- En az 1000 kelime yaz, derinlik önemli\n- Her bölümü '## Bölüm Adı' formatında başlat\n- Somut sayılar, dozajlar, süreler ve örnekler ver\n- Bilimsel çalışmalara referans ver (yazar, yıl)\n- Pratik ve uygulanabilir tavsiyeler ekle\n- Listeleri ve maddeleri kullan\n- Konuyla ilgili yaygın mitleri çürüt\n- Hem yeni başlayanlar hem ileri seviye için bilgi sun",
        function(chunk){accumulated+=chunk;setIcerik(accumulated);},
        3000
      );
    }catch(e){setIcerik("Yükleme hatası: "+e.message);}
    setLoading(false);
  }

  // Arama filtresi
  var aramaSonuclari=aramaMetni.length>1?AKADEMI_OKULLAR.flatMap(function(okul){
    return okul.konular.filter(function(k){
      return k.baslik.toLowerCase().includes(aramaMetni.toLowerCase())||k.ozet.toLowerCase().includes(aramaMetni.toLowerCase());
    }).map(function(k){return {okul:okul,konu:k};});
  }):[];

  // Konu okuma ekranı
  if(secilenKonu){return <div style={{paddingBottom:68,minHeight:"100vh"}}>
    <div style={{padding:"16px 16px 0"}}>
      <button onClick={function(){setSecilenKonu(null);setIcerik("");setDetayOkul(secilenOkul);}} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",padding:"4px 0",marginBottom:8,fontFamily:"var(--sans)"}}>← {secilenOkul.emoji} {secilenOkul.label}</button>
      <div style={{marginBottom:12,borderBottom:"0.5px solid var(--border)",paddingBottom:14}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
          <div>
            {secilenKonu.kategori&&<div className="ed-eyebrow" style={{marginBottom:6}}>{secilenKonu.kategori}</div>}
            <div style={{fontSize:22,fontWeight:500,color:"var(--text)",fontFamily:"var(--serif)",marginBottom:6,lineHeight:1.2}}>{secilenKonu.baslik}</div>
            <div style={{fontSize:13,color:"var(--muted)",fontFamily:"var(--sans)"}}>{secilenKonu.ozet}</div>
          </div>
          <button onClick={function(){toggleFavKonu(secilenKonu.id);}} style={{background:"transparent",border:"none",fontSize:20,cursor:"pointer",flexShrink:0}}>
            {favKonular.includes(secilenKonu.id)?"❤️":"🤍"}
          </button>
        </div>
      </div>
      {loading&&icerik===""&&<div style={{textAlign:"center",padding:"40px 20px",color:C.muted}}>
        <div style={{fontSize:24,marginBottom:8}}>📖</div>
        <div style={{fontSize:13}}>Makale hazırlanıyor…</div>
        <Spinner size={16} color={secilenOkul.renk}/>
      </div>}
      {icerik&&<div style={{marginBottom:16}}>
        <div style={{fontSize:14,color:"var(--text)",lineHeight:2,whiteSpace:"pre-wrap",fontFamily:"var(--sans)"}}>{icerik.split("\n").map(function(line,li){if(line.startsWith("## "))return <div key={li} style={{fontSize:17,fontWeight:500,color:"var(--text)",fontFamily:"var(--serif)",marginTop:li>0?20:0,marginBottom:6,paddingBottom:4,borderBottom:"0.5px solid var(--border)"}}>{line.replace(/^## /,"")}</div>;if(line.startsWith("# "))return <div key={li} style={{fontSize:20,fontWeight:500,color:"var(--text)",fontFamily:"var(--serif)",marginTop:li>0?24:0,marginBottom:8}}>{line.replace(/^# /,"")}</div>;if(line.startsWith("- "))return <div key={li} style={{paddingLeft:16,position:"relative"}}><span style={{position:"absolute",left:4,color:"var(--accent)"}}>·</span>{line.replace(/^- /,"")}</div>;if(line.startsWith("**")&&line.endsWith("**"))return <div key={li} style={{fontWeight:600,color:"var(--text)",marginTop:8}}>{line.replace(/\*\*/g,"")}</div>;return <span key={li}>{line}{"\n"}</span>;})}{loading&&<span style={{display:"inline-block",width:8,height:16,background:secilenOkul.renk,marginLeft:2,animation:"blink 1s infinite",verticalAlign:"middle"}}/>}</div>
        {!loading&&<div style={{marginTop:16,display:"flex",gap:8}}>
          <button onClick={function(){konuYukle(secilenOkul,secilenKonu);}} style={{padding:"8px 16px",borderRadius:9,background:"rgba(255,255,255,0.06)",border:"1px solid var(--border)",color:C.muted,fontSize:11,cursor:"pointer"}}>🔄 Yeniden Yükle</button>
          <button onClick={function(){
            var txt=secilenKonu.baslik+"\n\n"+icerik;
            if(navigator.share){navigator.share({title:secilenKonu.baslik,text:txt.slice(0,500)+"..."});}
            else{navigator.clipboard&&navigator.clipboard.writeText(txt).then(function(){alert("Kopyalandı!");});}
          }} style={{padding:"8px 16px",borderRadius:9,background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.2)",color:C.gold,fontSize:11,cursor:"pointer"}}>📤 Paylaş</button>
        </div>}
      </div>}
      {!loading&&!icerik&&<button onClick={function(){konuYukle(secilenOkul,secilenKonu);}} style={{width:"100%",padding:"13px",borderRadius:11,background:"linear-gradient(135deg,"+secilenOkul.renk+","+secilenOkul.renk+"aa)",border:"none",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>📚 Makaleyi Yükle</button>}
    </div>
  </div>;}

  // Okul detay ekranı (kategorili konu listesi)
  if(detayOkul&&!secilenKonu){
    var okul=detayOkul;
    var kategoriler=[];
    okul.konular.forEach(function(k){if(k.kategori&&kategoriler.indexOf(k.kategori)===-1)kategoriler.push(k.kategori);});
    var filtrelenmis=kategoriFiltre?okul.konular.filter(function(k){return k.kategori===kategoriFiltre;}):okul.konular;
    return <div style={{paddingBottom:78}}>
      <div style={{padding:"16px 20px 0"}}>
        <button onClick={function(){setDetayOkul(null);setKategoriFiltre(null);}} style={{background:"transparent",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer",padding:"4px 0",marginBottom:8}}>← Tüm Okullar</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
          <span style={{fontSize:32}}>{okul.emoji}</span>
          <div>
            <div style={{fontSize:22,fontWeight:500,color:"var(--text)",fontFamily:"var(--serif)",lineHeight:1.2}}>{okul.label}</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:2}}>{okul.konular.length} konu · {kategoriler.length} kategori</div>
          </div>
        </div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6,marginBottom:16,marginTop:8}}>{okul.aciklama}</div>
        {/* Kategori filtreleri */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
          <button onClick={function(){setKategoriFiltre(null);}} style={{padding:"6px 12px",border:"0.5px solid "+(kategoriFiltre===null?"var(--accent)":"var(--border)"),background:kategoriFiltre===null?"var(--card)":"transparent",color:kategoriFiltre===null?"var(--accent)":"var(--muted)",fontSize:11,cursor:"pointer",fontFamily:"var(--sans)"}}>Tümü ({okul.konular.length})</button>
          {kategoriler.map(function(kat){var cnt=okul.konular.filter(function(k){return k.kategori===kat;}).length;var on=kategoriFiltre===kat;return <button key={kat} onClick={function(){setKategoriFiltre(on?null:kat);}} style={{padding:"6px 12px",border:"0.5px solid "+(on?"var(--accent)":"var(--border)"),background:on?"var(--card)":"transparent",color:on?"var(--accent)":"var(--muted)",fontSize:11,cursor:"pointer",fontFamily:"var(--sans)"}}>{kat} ({cnt})</button>;})}
        </div>
      </div>
      {/* Konu listesi */}
      {filtrelenmis.map(function(konu,ki){var isFav=favKonular.includes(konu.id);return <div key={ki} className="ed-item" onClick={function(){konuYukle(okul,konu);}}>
        <div className="ed-item-num">{String(ki+1).padStart(2,"0")}</div>
        <div className="ed-item-body">
          {konu.kategori&&<div className="ed-item-tag">{konu.kategori}</div>}
          <div className="ed-item-title">{konu.baslik}</div>
          <div className="ed-item-sub">{konu.ozet}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button onClick={function(e){e.stopPropagation();toggleFavKonu(konu.id);}} style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",padding:2}}>{isFav?"❤️":"🤍"}</button>
          <span className="ed-item-arrow">›</span>
        </div>
      </div>;})}
    </div>;
  }

  return <div style={{paddingBottom:78}}>
    <TabHeader sub="SAĞLIK AKADEMİSİ" title="Bilgi, okuma ve pratik." desc={AKADEMI_OKULLAR.length+" okul · "+toplamKonu+" konu"}/>
    <div style={{padding:"0 20px"}}>
      {/* Arama */}
      <div style={{position:"relative",marginBottom:18}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,color:"var(--muted)"}}>🔍</span>
        <input value={aramaMetni} onChange={function(e){setAramaMetni(e.target.value);}} placeholder="Konu ara... dosha, omega-3, hicama..." style={{width:"100%",padding:"12px 14px 12px 42px",border:"none",borderBottom:"1px solid var(--border)",background:"transparent",color:"var(--text)",fontSize:15,boxSizing:"border-box",outline:"none",fontFamily:"var(--serif)"}}/>
      </div>

      {/* Alıntı */}
      {aramaMetni.length<=1&&<div className="ed-pull" style={{marginBottom:20}}>
        <div className="ed-pull-text">"Bedenini tanıyan, hastalığın değil sağlığın efendisi olur." — İbn-i Sina</div>
      </div>}

      {/* Arama sonuçları */}
      {aramaMetni.length>1&&<div style={{marginBottom:20}}>
        <div className="ed-section-hd" style={{padding:"0 0 8px"}}>{aramaSonuclari.length} Sonuç</div>
        {aramaSonuclari.length===0?<div style={{textAlign:"center",padding:24,color:"var(--muted)",fontSize:14}}>Sonuç bulunamadı</div>:
        aramaSonuclari.map(function(sr,i){return <div key={i} className="ed-item" onClick={function(){konuYukle(sr.okul,sr.konu);}}>
          <div className="ed-item-body">
            <div className="ed-item-tag">{sr.okul.emoji} {sr.okul.label}{sr.konu.kategori?" · "+sr.konu.kategori:""}</div>
            <div className="ed-item-title">{sr.konu.baslik}</div>
            <div className="ed-item-sub">{sr.konu.ozet}</div>
          </div>
          <span className="ed-item-arrow">›</span>
        </div>;})
        }
      </div>}

      {/* Favoriler */}
      {aramaMetni.length<=1&&favKonular.length>0&&<div style={{marginBottom:20}}>
        <div className="ed-section-hd" style={{padding:"0 0 8px"}}>❤️ Favorilerim</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {AKADEMI_OKULLAR.flatMap(function(o){return o.konular.map(function(k){return {okul:o,konu:k};});})
           .filter(function(sr){return favKonular.includes(sr.konu.id);})
           .map(function(sr,i){return <button key={i} onClick={function(){konuYukle(sr.okul,sr.konu);}} className="ed-chip on" style={{fontSize:11}}>{sr.konu.baslik}</button>;})
          }
        </div>
      </div>}

      {/* OKULLAR — numaralı liste */}
      {aramaMetni.length<=1&&<div style={{marginBottom:24}}>
        <div className="ed-section-hd" style={{padding:"0 0 12px"}}>OKULLAR</div>
        {AKADEMI_OKULLAR.map(function(okul,oi){
          var num=String(oi+1).padStart(2,"0");
          var cats=[];okul.konular.forEach(function(k){if(k.kategori&&cats.indexOf(k.kategori)===-1)cats.push(k.kategori);});
          return <div key={oi} className="ed-item" onClick={function(){setDetayOkul(okul);setKategoriFiltre(null);}}>
            <div className="ed-item-num">{num}</div>
            <div className="ed-item-body">
              <div className="ed-item-tag">{okul.emoji} {okul.konular.length} konu · {cats.length} kategori</div>
              <div className="ed-item-title">{okul.label}</div>
              <div className="ed-item-sub">{okul.aciklama}</div>
            </div>
            <span className="ed-item-arrow">›</span>
          </div>;
        })}
      </div>}
    </div>
  </div>;
}


// ── MENÜ YÜKLEME EKRANI (checklist) ──────────────────────────
function MenuYuklemeEkrani(props){
  var adimlar=props.adimlar||[];
  var [gecenSn,setGecenSn]=useState(0);
  useEffect(function(){
    var iv=setInterval(function(){setGecenSn(function(s){return s+1;});},1000);
    return function(){clearInterval(iv);};
  },[]);
  var dkStr=gecenSn>=60?Math.floor(gecenSn/60)+"dk "+( gecenSn%60)+"s":gecenSn+"s";
  var tamamSayi=adimlar.filter(function(a){return a.durum==="tamam";}).length;
  var pct=adimlar.length>0?Math.round(tamamSayi/adimlar.length*100):0;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:800,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
    <div style={{width:"100%",maxWidth:360}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:30,marginBottom:6}}>🍽️</div>
        <div style={{fontSize:17,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif",marginBottom:3}}>Menü Hazırlanıyor</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:10}}>Geçen süre: {dkStr}</div>
        <div style={{height:5,borderRadius:3,background:"rgba(212,168,67,0.12)",overflow:"hidden"}}>
          <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+C.gold+",#F0C96A)",borderRadius:3,transition:"width 0.5s"}}/>
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:4}}>{tamamSayi}/{adimlar.length} adım · {pct}%</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:"60vh",overflowY:"auto"}}>
        {adimlar.map(function(a,i){
          var isDone=a.durum==="tamam";
          var isActive=a.durum==="aktif";
          var isPending=a.durum==="bekliyor";
          return <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:isDone?"rgba(76,175,122,0.07)":isActive?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.02)",border:"1px solid "+(isDone?"rgba(76,175,122,0.25)":isActive?"rgba(212,168,67,0.35)":"rgba(255,255,255,0.06)"),transition:"all 0.3s"}}>
            <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"rgba(76,175,122,0.2)":isActive?"rgba(212,168,67,0.15)":"rgba(255,255,255,0.04)",border:"1.5px solid "+(isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.1)")}}>
              {isDone?<span style={{fontSize:12,color:C.green}}>✓</span>:isActive?<Spinner size={11} color={C.gold}/>:<span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>{i+1}</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:isActive?700:isDone?500:400,color:isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.25)"}}>{a.label}</div>
            </div>
          </div>;
        })}
        {adimlar.length===0&&<div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:12}}>Başlatılıyor… <Spinner size={13} color={C.gold}/></div>}
      </div>
    </div>
  </div>;
}


// ── KÜR YÜKLEME EKRANI (checklist) ───────────────────────────
function KurYuklemeEkrani(props){
  var adimlar=props.adimlar||[];
  var loadingEkol=props.loadingEkol||"";
  var [gecenSn,setGecenSn]=useState(0);
  useEffect(function(){
    var iv=setInterval(function(){setGecenSn(function(s){return s+1;});},1000);
    return function(){clearInterval(iv);};
  },[]);
  var dkStr=gecenSn>=60?Math.floor(gecenSn/60)+"dk "+( gecenSn%60)+"s":gecenSn+"s";
  var tamamSayi=adimlar.filter(function(a){return a.durum==="tamam";}).length;
  var pct=adimlar.length>0?Math.round(tamamSayi/adimlar.length*100):0;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:800,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"}}>
    <div style={{width:"100%",maxWidth:360}}>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:32,marginBottom:8}}>🌿</div>
        <div style={{fontSize:17,fontWeight:700,color:C.gold,fontFamily:"'Playfair Display',serif",marginBottom:4}}>Kür Hazırlanıyor</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:8}}>Geçen süre: {dkStr}</div>
        <div style={{height:5,borderRadius:3,background:"rgba(212,168,67,0.12)",overflow:"hidden"}}>
          <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+C.gold+",#F0C96A)",borderRadius:3,transition:"width 0.5s"}}/>
        </div>
        <div style={{fontSize:10,color:C.muted,marginTop:3}}>{tamamSayi}/{adimlar.length} adım · {pct}%</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {adimlar.map(function(a,i){
          var isDone=a.durum==="tamam";
          var isActive=a.durum==="aktif";
          return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:11,background:isDone?"rgba(76,175,122,0.08)":isActive?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.02)",border:"1px solid "+(isDone?"rgba(76,175,122,0.25)":isActive?"rgba(212,168,67,0.35)":"rgba(255,255,255,0.06)"),transition:"all 0.3s"}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"rgba(76,175,122,0.2)":isActive?"rgba(212,168,67,0.15)":"rgba(255,255,255,0.05)",border:"1.5px solid "+(isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.1)")}}>
              {isDone?<span style={{fontSize:13,color:C.green}}>✓</span>:isActive?<Spinner size={12} color={C.gold}/>:<span style={{fontSize:11,color:"rgba(255,255,255,0.25)"}}>{i+1}</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:isActive?700:isDone?600:400,color:isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.25)"}}>{a.label}</div>
              {isActive&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>Yapılıyor…</div>}
            </div>
          </div>;
        })}
        {adimlar.length===0&&<div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:12}}>Başlatılıyor…<Spinner size={14} color={C.gold}/></div>}
      </div>
      {loadingEkol&&<div style={{marginTop:14,padding:"10px 14px",background:"rgba(212,168,67,0.06)",borderRadius:10,border:"1px solid rgba(212,168,67,0.2)",textAlign:"center"}}>
        <div style={{fontSize:11,color:C.muted}}>Şu an: <strong style={{color:C.gold}}>{loadingEkol}</strong></div>
      </div>}
    </div>
  </div>;
}


// ══════════════════════════════════════════════════════════════
// TAB: ARAÇLAR (Tools) — Barkod, Restoran, Foto Tanıma, Koleksiyon, Günlük, AI Öneri, Aile, Alışveriş Birleştirme, Buzdolabı Menü
// ══════════════════════════════════════════════════════════════
function AraclarTab(){
  var [mode,setMode]=useState("menu");
  // Barkod
  var [barkodRes,setBarkodRes]=useState(null);var [barkodLoad,setBarkodLoad]=useState(false);
  // Restoran
  var [restoranQ,setRestoranQ]=useState("");var [restoranData,setRestoranData]=useState(null);var [restoranLoad,setRestoranLoad]=useState(false);var [restoranKat,setRestoranKat]=useState("fine");
  // Foto Tanıma
  var [fotoFile,setFotoFile]=useState(null);var [fotoRes,setFotoRes]=useState(null);var [fotoLoad,setFotoLoad]=useState(false);
  var fotoRef=useRef(null);
  // Koleksiyon
  var [koleksiyonlar,setKoleksiyonlar]=useState([]);var [kolYeni,setKolYeni]=useState("");
  useEffect(function(){stGet("koleksiyonlar").then(function(k){if(k)setKoleksiyonlar(k);});},[]);
  async function saveKol(k){setKoleksiyonlar(k);await stSet("koleksiyonlar",k);}
  // Günlük
  var [gunlukData,setGunlukData]=useState([]);var [gunlukYeni,setGunlukYeni]=useState("");var [gunlukOgun,setGunlukOgun]=useState("Öğle");
  useEffect(function(){stGet("yemek_gunluk").then(function(g){if(g)setGunlukData(g);});},[]);
  async function saveGunluk(g){setGunlukData(g);await stSet("yemek_gunluk",g);}
  // AI Öneri
  var [aiProfil,setAiProfil]=useState(null);var [aiOneriData,setAiOneriData]=useState(null);var [aiOneriLoad,setAiOneriLoad]=useState(false);
  useEffect(function(){stGet("ai_profil").then(function(p){if(p)setAiProfil(p);});},[]);
  // Aile Planlaması
  var [aileProfil,setAileProfil]=useState([]);
  useEffect(function(){stGet("aile_profil").then(function(a){if(a)setAileProfil(a);});},[]);
  async function saveAile(a){setAileProfil(a);await stSet("aile_profil",a);}
  // Alışveriş Birleştirme
  var [birlestirQ,setBirlestirQ]=useState("");var [birlestirData,setBirlestirData]=useState(null);var [birlestirLoad,setBirlestirLoad]=useState(false);
  // Buzdolabı Menü
  var [buzMenuData,setBuzMenuData]=useState(null);var [buzMenuLoad,setBuzMenuLoad]=useState(false);

  var ARAC_MODS=[
    {id:"menu",label:"Ana Sayfa",emoji:"🏠"},
    {id:"koleksiyon",label:"Koleksiyonlar",emoji:"📚"},
    {id:"gunluk",label:"Yemek Günlüğü",emoji:"📖"},
    {id:"foto",label:"Foto Tanıma",emoji:"📸"},
    {id:"barkod",label:"Barkod",emoji:"📱"},
    {id:"restoran",label:"Restoran",emoji:"📍"},
    {id:"aioneri",label:"AI Öneri",emoji:"🤖"},
    {id:"aile",label:"Aile",emoji:"👨‍👩‍👧‍👦"},
    {id:"birlestir",label:"Liste Birleştir",emoji:"🔗"},
    {id:"buzmenu",label:"Buzdolabı Menü",emoji:"🧊"},
  ];

  function doFotoTanima(){
    if(!fotoFile) return;
    setFotoLoad(true);setFotoRes(null);
    toBase64(fotoFile).then(function(b64){
      return callAIVision("Bu fotoğraftaki yemeği tanı. İsmi, tahmini kalori, malzemeleri ve kısa tarifini ver.\nJSON: isim:string, aciklama:string, kalori:string, malzemeler:[string], tarif_adimlar:[string], ulke:string, saglik_notu:string",b64,"image/jpeg",800);
    }).then(function(r){setFotoRes(r);setFotoLoad(false);}).catch(function(){setFotoLoad(false);});
  }

  function doBarkod(code){
    setBarkodLoad(true);setBarkodRes(null);
    callAI("Gida urun uzmani. Bu barkod/urun kodu: '"+code+"'. Bu urunun besin degerleri, icerigi, saglik skoru ve alternatif oneriler ver.\nJSON: urun_adi:string, marka:string, kalori:string, protein:string, karb:string, yag:string, seker:string, tuz:string, icerik:[string], saglik_skoru:string(A-E), uyarilar:[string], alternatifler:[{isim:string,neden:string}]",600).then(function(r){setBarkodRes(r);setBarkodLoad(false);}).catch(function(){setBarkodLoad(false);});
  }

  function doRestoran(){
    if(!restoranQ.trim()) return;
    setRestoranLoad(true);setRestoranData(null);
    var katObj=fI(RESTORAN_KAT,restoranKat)||{};
    callAI("Restoran rehberi. '"+restoranQ+"' bolgesinde "+katObj.label+" kategorisinde en iyi 5 restoran oner. Gercekci ol.\nJSON: restoranlar:[{isim:string, adres:string, puan:string, fiyat_seviye:string, imza_yemek:string, aciklama:string, telefon:string}], bolge_notu:string",600).then(function(r){setRestoranData(r);setRestoranLoad(false);}).catch(function(){setRestoranLoad(false);});
  }

  function doAiOneri(){
    setAiOneriLoad(true);setAiOneriData(null);
    var profilStr=aiProfil?JSON.stringify(aiProfil):"Genel kullanıcı";
    callAI("Kisisel beslenme danismani. Kullanici profili: "+profilStr+". Son yemek gecmisi: "+(gunlukData.slice(-10).map(function(g){return g.yemek;}).join(", ")||"bilinmiyor")+". Bu kullaniciya ozel 5 kisisel tarif ve beslenme onerisi ver. Eksik besinleri telafi et, aliskanliklara gore oner.\nJSON: oneriler:[{isim:string, neden:string, malzemeler:[string], kalori:string, uyum_puani:string}], genel_degerlendirme:string, eksik_besinler:[string], haftalik_plan_ipucu:string",800).then(function(r){setAiOneriData(r);setAiOneriLoad(false);}).catch(function(){setAiOneriLoad(false);});
  }

  function doBirlestir(){
    if(!birlestirQ.trim()) return;
    setBirlestirLoad(true);setBirlestirData(null);
    callAI("Alisveris listesi uzmani. Su tariflerin malzemelerini birlestir, tekrarlari topla ve market reyonlarina gore sirala: "+birlestirQ+"\nJSON: kategoriler:[{reyon:string,malzemeler:[{isim:string,miktar:string}]}], toplam_cesit:number, tasarruf_ipucu:string",600).then(function(r){setBirlestirData(r);setBirlestirLoad(false);}).catch(function(){setBirlestirLoad(false);});
  }

  function doBuzMenu(){
    setBuzMenuLoad(true);setBuzMenuData(null);
    stGet("buzdolabi_items").then(function(items){
      var envanter=(items||[]).map(function(i){return i.isim;}).join(", ")||"bilinmiyor";
      callAI("Yaratici sef. Buzdolabinda su malzemeler var: "+envanter+". Sadece bu malzemelerle (ek alisveris yapmadan) yapilabilecek 5 tarif oner. Her biri icin malzeme, adim ve sure ver.\nJSON: tarifler:[{isim:string, aciklama:string, malzemeler:[{miktar:string,isim:string}], adimlar:[string], sure:string, kalori:string}], ek_alisveris_onerisi:string",900).then(function(r){setBuzMenuData(r);setBuzMenuLoad(false);}).catch(function(){setBuzMenuLoad(false);});
    });
  }

  return <div style={{paddingBottom:78}}>
    <div style={{padding:"18px 20px 0"}}>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:700,color:"var(--cream)",marginBottom:6}}>🧰 Araçlar</h1>
      <p style={{fontSize:13,color:C.muted,marginBottom:14}}>Yemek dünyasının tüm araçları</p>
    </div>
    {/* Mode Switch */}
    <div style={{display:"flex",gap:5,flexWrap:"wrap",padding:"0 20px",marginBottom:16}}>
      {ARAC_MODS.map(function(m){var ac=mode===m.id;return <button key={m.id} onClick={function(){setMode(m.id);}} style={{padding:"6px 12px",borderRadius:10,border:"1.5px solid "+(ac?C.gold:"var(--border)"),background:ac?C.goldDim:"var(--card)",color:ac?C.goldL:C.muted,fontSize:11,fontWeight:ac?600:400,display:"flex",alignItems:"center",gap:4}}>{m.emoji} {m.label}</button>;})}
    </div>
    <div style={{padding:"0 20px"}}>

    {/* Ana Sayfa */}
    {mode==="menu"&&<div className="up">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {ARAC_MODS.filter(function(m){return m.id!=="menu";}).map(function(m){return <button key={m.id} onClick={function(){setMode(m.id);}} style={{padding:"18px 14px",borderRadius:14,border:"1px solid var(--border)",background:"var(--card)",textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:6}}>{m.emoji}</div>
          <div style={{fontSize:13,fontWeight:600,color:C.cream}}>{m.label}</div>
        </button>;})}
      </div>
    </div>}

    {/* Koleksiyon */}
    {mode==="koleksiyon"&&<div className="up">
      <SH label="Tarif Koleksiyonları"/>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input value={kolYeni} onChange={function(e){setKolYeni(e.target.value);}} placeholder="Yeni koleksiyon adı..." style={{flex:1,padding:"9px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:13}}/>
        <button onClick={function(){if(!kolYeni.trim()) return;var k=koleksiyonlar.concat([{id:Date.now().toString(),isim:kolYeni.trim(),tarifler:[],tarih:new Date().toISOString()}]);saveKol(k);setKolYeni("");}} style={{padding:"9px 16px",borderRadius:10,border:"none",background:C.gold,color:"#000",fontSize:12,fontWeight:700}}>+ Ekle</button>
      </div>
      {koleksiyonlar.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted}}>📚 Henüz koleksiyon yok. Yukarıdan yeni bir koleksiyon oluşturun.</div>}
      {koleksiyonlar.map(function(k){return <div key={k.id} style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{k.isim}</div><div style={{fontSize:10,color:C.muted}}>{(k.tarifler||[]).length} tarif · {new Date(k.tarih).toLocaleDateString("tr-TR")}</div></div>
          <button onClick={function(){saveKol(koleksiyonlar.filter(function(x){return x.id!==k.id;}));}} style={{padding:"4px 8px",borderRadius:6,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red,fontSize:10}}>Sil</button>
        </div>
        {(k.tarifler||[]).length>0&&<div style={{marginTop:8,display:"flex",gap:4,flexWrap:"wrap"}}>{k.tarifler.map(function(t,i){return <span key={i} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>{t.isim||t}</span>;})}</div>}
      </div>;})}
    </div>}

    {/* Yemek Günlüğü */}
    {mode==="gunluk"&&<div className="up">
      <SH label="Yemek Günlüğü"/>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {GUNLUK_OGUNLER.map(function(o){return <button key={o} onClick={function(){setGunlukOgun(o);}} style={{padding:"5px 11px",borderRadius:50,fontSize:11,border:"1.5px solid "+(gunlukOgun===o?C.gold:"var(--border)"),background:gunlukOgun===o?C.goldDim:"transparent",color:gunlukOgun===o?C.goldL:C.muted}}>{o}</button>;})}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input value={gunlukYeni} onChange={function(e){setGunlukYeni(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&gunlukYeni.trim()){var g=gunlukData.concat([{yemek:gunlukYeni.trim(),ogun:gunlukOgun,tarih:new Date().toISOString(),id:Date.now().toString()}]);saveGunluk(g);setGunlukYeni("");}}} placeholder="Ne yediniz? (örn: menemen, salata)" style={{flex:1,padding:"9px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:13}}/>
        <button onClick={function(){if(!gunlukYeni.trim()) return;var g=gunlukData.concat([{yemek:gunlukYeni.trim(),ogun:gunlukOgun,tarih:new Date().toISOString(),id:Date.now().toString()}]);saveGunluk(g);setGunlukYeni("");}} style={{padding:"9px 14px",borderRadius:10,border:"none",background:C.gold,color:"#000",fontSize:12,fontWeight:700}}>+ Kaydet</button>
      </div>
      {gunlukData.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted}}>📖 Henüz kayıt yok. Yediklerinizi kaydedin.</div>}
      {gunlukData.slice().reverse().slice(0,20).map(function(g){var d=new Date(g.tarih);return <div key={g.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,marginBottom:6}}>
        <div><div style={{fontSize:13,fontWeight:600,color:C.cream}}>{g.yemek}</div><div style={{fontSize:10,color:C.muted}}>{g.ogun} · {d.toLocaleDateString("tr-TR")} {d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</div></div>
        <button onClick={function(){saveGunluk(gunlukData.filter(function(x){return x.id!==g.id;}));}} style={{fontSize:12,color:C.red,background:"transparent",border:"none"}}>✕</button>
      </div>;})}
    </div>}

    {/* Foto Tanıma */}
    {mode==="foto"&&<div className="up">
      <SH label="Fotoğraftan Yemek Tanıma"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Bir yemeğin fotoğrafını çekin veya yükleyin, AI tanısın.</p>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={function(){fotoRef.current&&fotoRef.current.click();}} style={{flex:1,padding:"16px",borderRadius:14,border:"2px dashed "+(fotoFile?C.gold:"var(--border)"),background:fotoFile?C.goldDim:"var(--card)",color:fotoFile?C.goldL:C.muted,fontSize:13,textAlign:"center"}}>
          {fotoFile?"📸 "+fotoFile.name:"📸 Fotoğraf Seç / Çek"}
        </button>
        <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={function(e){if(e.target.files[0])setFotoFile(e.target.files[0]);}} style={{display:"none"}}/>
      </div>
      <button onClick={doFotoTanima} disabled={!fotoFile||fotoLoad} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:C.gold,color:"#000",fontSize:13,fontWeight:700,marginBottom:14}}>{fotoLoad?"Analiz ediliyor...":"🔍 Tanı"}</button>
      {fotoRes&&<div className="up" style={{padding:"16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14}}>
        <div style={{fontSize:18,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:6}}>{fotoRes.isim||"Tanınan Yemek"}</div>
        {fotoRes.ulke&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple,marginBottom:6,display:"inline-block"}}>🌍 {fotoRes.ulke}</span>}
        <p style={{fontSize:12,color:C.muted,marginBottom:8}}>{fotoRes.aciklama}</p>
        {fotoRes.kalori&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>🔥 {fotoRes.kalori}</span>}
        {fotoRes.saglik_notu&&<div style={{marginTop:8,padding:"8px 12px",background:C.goldDim,borderRadius:8,fontSize:11,color:C.gold}}>💡 {fotoRes.saglik_notu}</div>}
      </div>}
    </div>}

    {/* Barkod */}
    {mode==="barkod"&&<div className="up">
      <SH label="Barkod / Ürün Analizi"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Ürün adını veya barkod numarasını girin, besin değerlerini ve sağlık skorunu öğrenin.</p>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input placeholder="Ürün adı veya barkod (örn: Eti Çikolata)" onChange={function(e){}} onKeyDown={function(e){if(e.key==="Enter")doBarkod(e.target.value);}} style={{flex:1,padding:"10px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:13}}/>
        <button onClick={function(){var inp=document.querySelector("[placeholder*='barkod']");if(inp)doBarkod(inp.value);}} disabled={barkodLoad} style={{padding:"10px 16px",borderRadius:10,border:"none",background:C.gold,color:"#000",fontSize:12,fontWeight:700}}>{barkodLoad?"...":"Ara"}</button>
      </div>
      {barkodLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 0"}}><Spinner size={14} color={C.gold}/><span style={{fontSize:12,color:C.gold}}>Analiz ediliyor…</span></div>}
      {barkodRes&&<div className="up" style={{padding:"16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontSize:16,fontWeight:700,color:C.cream}}>{barkodRes.urun_adi||"Ürün"}</div>{barkodRes.marka&&<div style={{fontSize:11,color:C.muted}}>{barkodRes.marka}</div>}</div>
          {barkodRes.saglik_skoru&&<SkorBadge skor={barkodRes.saglik_skoru}/>}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
          {[{l:"Kalori",v:barkodRes.kalori,c:C.red},{l:"Protein",v:barkodRes.protein,c:C.blue},{l:"Karb",v:barkodRes.karb,c:C.orange},{l:"Yağ",v:barkodRes.yag,c:C.gold},{l:"Şeker",v:barkodRes.seker,c:C.pink},{l:"Tuz",v:barkodRes.tuz,c:C.muted}].map(function(n){return n.v?<div key={n.l} style={{padding:"5px 10px",background:n.c+"15",borderRadius:8,textAlign:"center"}}><div style={{fontSize:8,color:n.c,fontWeight:700,textTransform:"uppercase"}}>{n.l}</div><div style={{fontSize:12,fontWeight:600,color:C.cream}}>{n.v}</div></div>:null;})}
        </div>
        {(barkodRes.uyarilar||[]).length>0&&<div style={{marginBottom:8}}>{barkodRes.uyarilar.map(function(u,i){return <div key={i} style={{fontSize:11,color:C.red,padding:"4px 0"}}>⚠ {u}</div>;})}</div>}
        {(barkodRes.alternatifler||[]).length>0&&<div><div style={{fontSize:9,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>Sağlıklı Alternatifler</div>{barkodRes.alternatifler.map(function(a,i){return <div key={i} style={{padding:"6px 10px",background:"rgba(76,175,122,0.06)",borderRadius:8,marginBottom:4,fontSize:12}}><span style={{fontWeight:600,color:C.cream}}>{a.isim}</span> <span style={{color:C.muted}}>— {a.neden}</span></div>;})}</div>}
      </div>}
    </div>}

    {/* Restoran */}
    {mode==="restoran"&&<div className="up">
      <SH label="Restoran Bulucu"/>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
        {RESTORAN_KAT.map(function(k){var ac=restoranKat===k.id;return <button key={k.id} onClick={function(){setRestoranKat(k.id);}} style={{padding:"5px 10px",borderRadius:50,fontSize:11,border:"1.5px solid "+(ac?C.gold:"var(--border)"),background:ac?C.goldDim:"transparent",color:ac?C.goldL:C.muted}}>{k.emoji} {k.label}</button>;})}
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        <input value={restoranQ} onChange={function(e){setRestoranQ(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")doRestoran();}} placeholder="Şehir veya bölge (örn: Kadıköy, Ankara)" style={{flex:1,padding:"10px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:13}}/>
        <button onClick={doRestoran} disabled={restoranLoad} style={{padding:"10px 16px",borderRadius:10,border:"none",background:C.gold,color:"#000",fontSize:12,fontWeight:700}}>{restoranLoad?"...":"🔍 Ara"}</button>
      </div>
      {restoranLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"10px 0"}}><Spinner size={14} color={C.gold}/><span style={{fontSize:12,color:C.gold}}>Restoranlar aranıyor…</span></div>}
      {restoranData&&<div className="up">
        {(restoranData.restoranlar||[]).map(function(r,i){return <div key={i} style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div><div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{r.isim}</div><div style={{fontSize:11,color:C.muted}}>📍 {r.adres}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:14,fontWeight:700,color:C.gold}}>⭐ {r.puan}</div><div style={{fontSize:10,color:C.muted}}>{r.fiyat_seviye}</div></div>
          </div>
          <p style={{fontSize:12,color:C.muted,marginBottom:6}}>{r.aciklama}</p>
          {r.imza_yemek&&<div style={{padding:"6px 10px",background:C.goldDim,borderRadius:8,fontSize:11,color:C.gold}}>🍽️ İmza: {r.imza_yemek}</div>}
        </div>;})}
        {restoranData.bolge_notu&&<div style={{padding:"10px 14px",background:"var(--card2)",borderRadius:10,fontSize:12,color:C.muted}}>{restoranData.bolge_notu}</div>}
      </div>}
    </div>}

    {/* AI Öneri */}
    {mode==="aioneri"&&<div className="up">
      <SH label="Kişiselleştirilmiş AI Öneriler"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Yemek günlüğünüz ve profilinize göre AI size özel öneriler sunar.</p>
      <button onClick={doAiOneri} disabled={aiOneriLoad} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,"+C.gold+",#F0C96A)",color:"#000",fontSize:14,fontWeight:700,marginBottom:14}}>{aiOneriLoad?"Analiz ediliyor...":"🤖 Benim İçin Öner"}</button>
      {aiOneriLoad&&<div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center",padding:"16px 0"}}><Spinner size={16} color={C.gold}/><span style={{fontSize:13,color:C.gold}}>Profiliniz analiz ediliyor…</span></div>}
      {aiOneriData&&<div className="up">
        {aiOneriData.genel_degerlendirme&&<div style={{padding:"12px 16px",background:C.goldDim,borderRadius:12,marginBottom:12,fontSize:12,color:C.gold,lineHeight:1.6}}>📊 {aiOneriData.genel_degerlendirme}</div>}
        {(aiOneriData.eksik_besinler||[]).length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}><span style={{fontSize:10,color:C.red,fontWeight:600}}>Eksik besinler:</span>{aiOneriData.eksik_besinler.map(function(b,i){return <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(224,82,82,0.1)",color:C.red}}>{b}</span>;})}</div>}
        {(aiOneriData.oneriler||[]).map(function(o,i){return <div key={i} style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{o.isim}</div>
            {o.kalori&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {o.kalori}</span>}
          </div>
          <p style={{fontSize:12,color:C.gold,marginBottom:6}}>{o.neden}</p>
          {o.uyum_puani&&<span style={{fontSize:10,color:C.green}}>Uyum: {o.uyum_puani}</span>}
        </div>;})}
        {aiOneriData.haftalik_plan_ipucu&&<div style={{padding:"10px 14px",background:"var(--card2)",borderRadius:10,fontSize:12,color:C.muted,lineHeight:1.6}}>📅 {aiOneriData.haftalik_plan_ipucu}</div>}
      </div>}
    </div>}

    {/* Aile Planlaması */}
    {mode==="aile"&&<div className="up">
      <SH label="Aile Profili & Planlama"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Aile üyelerinizi ekleyin, herkesin tercihine göre menü oluşturun.</p>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {AILE_ROLLER.map(function(r){return <button key={r.id} onClick={function(){var yeni={id:Date.now().toString(),rol:r.id,isim:"",emoji:r.emoji,label:r.label,tercih:"normal",alerjen:[]};saveAile(aileProfil.concat([yeni]));}} style={{padding:"8px 14px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",fontSize:12,color:C.muted}}>{r.emoji} {r.label} Ekle</button>;})}
      </div>
      {aileProfil.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted}}>👨‍👩‍👧‍👦 Henüz aile üyesi yok. Yukarıdan ekleyin.</div>}
      {aileProfil.map(function(u){return <div key={u.id} style={{padding:"12px 14px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,marginBottom:8,display:"flex",gap:10,alignItems:"center"}}>
        <span style={{fontSize:24}}>{u.emoji}</span>
        <div style={{flex:1}}>
          <input value={u.isim} onChange={function(e){var upd=aileProfil.map(function(x){return x.id===u.id?Object.assign({},x,{isim:e.target.value}):x;});saveAile(upd);}} placeholder={u.label+" adı"} style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid var(--border)",background:"transparent",color:C.cream,fontSize:13,marginBottom:4}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {BESLENME.map(function(b){return <button key={b.id} onClick={function(){var upd=aileProfil.map(function(x){return x.id===u.id?Object.assign({},x,{tercih:b.id}):x;});saveAile(upd);}} style={{fontSize:9,padding:"2px 6px",borderRadius:4,border:"1px solid "+(u.tercih===b.id?C.gold:"var(--border)"),background:u.tercih===b.id?C.goldDim:"transparent",color:u.tercih===b.id?C.goldL:C.muted}}>{b.emoji} {b.label}</button>;})}
          </div>
        </div>
        <button onClick={function(){saveAile(aileProfil.filter(function(x){return x.id!==u.id;}));}} style={{fontSize:14,color:C.red,background:"transparent",border:"none"}}>✕</button>
      </div>;})}
    </div>}

    {/* Alışveriş Birleştirme */}
    {mode==="birlestir"&&<div className="up">
      <SH label="Akıllı Alışveriş Birleştirme"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Birden fazla tarifin malzemelerini birleştirin, tekrarları temizleyin.</p>
      <textarea value={birlestirQ} onChange={function(e){setBirlestirQ(e.target.value);}} rows={4} placeholder={"Tarifleri yazın (her satıra bir tarif veya malzeme listesi):\nÖrn:\nKarnıyarık: patlıcan, kıyma, soğan, domates\nPilav: pirinç, tereyağı, su"} style={{width:"100%",padding:"10px 13px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card)",color:C.cream,fontSize:12,marginBottom:10,resize:"vertical"}}/>
      <button onClick={doBirlestir} disabled={birlestirLoad} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:C.gold,color:"#000",fontSize:13,fontWeight:700,marginBottom:14}}>{birlestirLoad?"Birleştiriliyor...":"🔗 Birleştir & Sırala"}</button>
      {birlestirData&&<div className="up">
        {(birlestirData.kategoriler||[]).map(function(kat,i){return <div key={i} style={{marginBottom:10}}>
          <div style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:6}}>{kat.reyon}</div>
          {(kat.malzemeler||[]).map(function(m,j){return <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid var(--border)",fontSize:12}}><span style={{color:C.cream}}>{m.isim}</span><span style={{color:C.muted}}>{m.miktar}</span></div>;})}
        </div>;})}
        {birlestirData.tasarruf_ipucu&&<div style={{padding:"10px 14px",background:C.goldDim,borderRadius:10,fontSize:12,color:C.gold}}>💡 {birlestirData.tasarruf_ipucu}</div>}
      </div>}
    </div>}

    {/* Buzdolabı Menü */}
    {mode==="buzmenu"&&<div className="up">
      <SH label="Buzdolabından Akıllı Menü"/>
      <p style={{fontSize:12,color:C.muted,marginBottom:12}}>Buzdolabı sekmenizdeki malzemelerle yapılabilecek tarifleri keşfedin.</p>
      <button onClick={doBuzMenu} disabled={buzMenuLoad} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:"linear-gradient(135deg,"+C.teal+",#5BE0C8)",color:"#000",fontSize:14,fontWeight:700,marginBottom:14}}>{buzMenuLoad?"Tarif aranıyor...":"🧊 Buzdolabımdan Menü Oluştur"}</button>
      {buzMenuLoad&&<div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center",padding:"16px 0"}}><Spinner size={16} color={C.teal}/><span style={{fontSize:13,color:C.teal}}>Malzemelerinize uygun tarifler bulunuyor…</span></div>}
      {buzMenuData&&<div className="up">
        {(buzMenuData.tarifler||[]).map(function(t,i){return <div key={i} style={{padding:"14px 16px",background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
            <div style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{t.isim}</div>
            <div style={{display:"flex",gap:4}}>
              {t.sure&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {t.sure}</span>}
              {t.kalori&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {t.kalori}</span>}
            </div>
          </div>
          <p style={{fontSize:12,color:C.muted,marginBottom:6}}>{t.aciklama}</p>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}>{(t.malzemeler||[]).map(function(m,j){return <span key={j} style={{fontSize:10,padding:"3px 8px",borderRadius:50,background:"var(--card2)",border:"1px solid var(--border)",color:C.muted}}>{typeof m==="string"?m:((m.miktar||"")+" "+m.isim).trim()}</span>;})}</div>
          {(t.adimlar||[]).length>0&&<div style={{borderTop:"1px solid var(--border)",paddingTop:8,marginTop:6}}>{t.adimlar.map(function(s,j){return <div key={j} style={{fontSize:11,color:C.muted,marginBottom:3}}><span style={{color:C.teal,fontWeight:700}}>{j+1}.</span> {s}</div>;})}</div>}
        </div>;})}
        {buzMenuData.ek_alisveris_onerisi&&<div style={{padding:"10px 14px",background:C.goldDim,borderRadius:10,fontSize:12,color:C.gold}}>🛒 {buzMenuData.ek_alisveris_onerisi}</div>}
      </div>}
    </div>}

    </div>
  </div>;
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App(){
  var [user,setUser]=useState(null);
  var [isGuest,setIsGuest]=useState(false);
  var [favorites,setFavorites]=useState([]);
  var [lists,setLists]=useState([]);
  var [ready,setReady]=useState(false);
  var [activeTab,setActiveTab]=useState("menu");
  var [theme,setTheme]=useState(getInitialTheme);
  var [themeToast,setThemeToast]=useState("");
  var toastTimerRef=useRef(null);
  var isDark=isThemeDark(theme);
  var [showChangelog,setShowChangelog]=useState(false);
  var [showMoreTabs,setShowMoreTabs]=useState(false);
  var [showShortcuts,setShowShortcuts]=useState(false);
  var [showOnboarding,setShowOnboarding]=useState(false);
  var [onboardingStep,setOnboardingStep]=useState(0);

  useEffect(function(){var last=typeof localStorage!=="undefined"?localStorage.getItem("masterchef_last_version"):null;if(last!==APP_VERSION){setShowChangelog(true);}else{setShowChangelog(false);}},[]);
  useEffect(function(){
    var done=typeof localStorage!=="undefined"&&localStorage.getItem("masterchef_onboarding_done");
    if(!done) setShowOnboarding(true);
  },[]);
  useEffect(function(){
    function onKey(e){
      if(e.key==="?"&&!e.ctrlKey&&!e.metaKey){e.preventDefault();setShowShortcuts(function(s){return !s;});return;}
      if(e.key==="Escape"){setShowChangelog(false);setShowMoreTabs(false);setShowShortcuts(false);return;}
      if(e.target&&(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")) return;
      if(e.key==="m"||e.key==="M"){e.preventDefault();setActiveTab("menu");setShowMoreTabs(false);}
      if(e.key==="f"||e.key==="F"){e.preventDefault();setActiveTab("favoriler");setShowMoreTabs(false);}
    }
    window.addEventListener("keydown",onKey);return function(){window.removeEventListener("keydown",onKey);};
  },[]);
  function closeChangelog(){if(typeof localStorage!=="undefined") localStorage.setItem("masterchef_last_version",APP_VERSION);setShowChangelog(false);}
  function finishOnboarding(){if(typeof localStorage!=="undefined") localStorage.setItem("masterchef_onboarding_done","1");setShowOnboarding(false);}
  function exportFavorilerListe(){var j=JSON.stringify({version:APP_VERSION,exportedAt:new Date().toISOString(),favorites:favorites,lists:lists},null,2);var blob=new Blob([j],{type:"application/json"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="masterchef-favoriler-listeler-"+new Date().toISOString().slice(0,10)+".json";a.click();URL.revokeObjectURL(a.href);}

  useEffect(function(){
    var s=sessionStorage.getItem("chef_u");
    var g=sessionStorage.getItem("chef_guest");
    // theme is initialized via getInitialTheme from localStorage
    if (g){setUser("misafir");setIsGuest(true);setReady(true);}
    else if (s){doLogin(s);}
    else{setReady(true);}
  },[]);

  function doLogin(u){
    setUser(u);setIsGuest(false);sessionStorage.setItem("chef_u",u);
    Promise.all([stGet("fav:"+u),stGet("lst:"+u)]).then(function(rs){setFavorites(rs[0]||[]);setLists(rs[1]||[]);setReady(true);});
  }
  function loginGuest(){setUser("misafir");setIsGuest(true);sessionStorage.setItem("chef_guest","1");setReady(true);}
  function logout(){setUser(null);setIsGuest(false);sessionStorage.removeItem("chef_u");sessionStorage.removeItem("chef_guest");setFavorites([]);setLists([]);setReady(true);}
  function switchTheme(){var t=nextTheme(theme);setTheme(t);try{localStorage.setItem("chef_theme",t.id);}catch(e){}setThemeToast(t.name);if(toastTimerRef.current)clearTimeout(toastTimerRef.current);toastTimerRef.current=setTimeout(function(){setThemeToast("");},1800);}
  async function toggleFav(dish){
    if (isGuest){alert("Favori için hesap açın.");return;}
    var isFav=favorites.some(function(f){return f.isim===dish.isim;});
    var u=isFav?favorites.filter(function(f){return f.isim!==dish.isim;}):favorites.concat([Object.assign({savedAt:new Date().toISOString()},dish)]);
    setFavorites(u);await stSet("fav:"+user,u);
  }
  async function updateFavNote(dish,notlarim){
    if (isGuest) return;
    var u=favorites.map(function(f){if(f.isim!==dish.isim)return f;return Object.assign({},f,{notlarim:notlarim||""});});
    setFavorites(u);await stSet("fav:"+user,u);
  }
  async function addToList(lid,dish){
    var u=lists.map(function(l){if(l.id!==lid) return l;return Object.assign({},l,{dishes:l.dishes.concat([Object.assign({addedAt:new Date().toISOString()},dish)])});});
    setLists(u);await stSet("lst:"+user,u);
  }

  if (!ready) return <div style={{minHeight:"100vh",background:theme.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><style>{makeCSS(theme)}</style><Spinner size={28}/></div>;
  if (!user) return <div style={{minHeight:"100vh",background:"var(--bg)"}}><style>{makeCSS(theme)}</style><Auth onLogin={function(u,g){if(g) loginGuest();else doLogin(u);}}/></div>;


  return <div style={{minHeight:"100vh",background:"var(--bg)",color:C.cream}}>
    <style>{makeCSS(theme)}</style>
    <div className="no-print"><ThemeToggle themeId={theme.id} themeName={theme.name} onToggle={switchTheme}/></div>
    {themeToast&&<div style={{position:"fixed",top:52,right:12,zIndex:700,background:"var(--accent)",color:"var(--bg)",padding:"10px 18px",borderRadius:12,fontSize:13,fontWeight:600,fontFamily:"var(--sans)",animation:"toastIn 0.25s ease",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>{themeToast} <span style={{opacity:0.7,fontSize:11}}>{THEMES.findIndex(function(t){return t.id===theme.id;})+1}/{THEMES.length}</span></div>}
    <div className="no-print" style={{position:"fixed",top:12,right:80,zIndex:600,display:"flex",gap:4,alignItems:"center"}}>
      <button onClick={function(){setShowChangelog(true);}} style={{padding:"4px 8px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:11,color:C.muted}} title="Yenilikler">v{APP_VERSION}</button>
      <div style={{padding:"4px 9px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:11,color:C.muted}}>{isGuest?"👤":user}</div>
      <button onClick={logout} style={{padding:"4px 8px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:11,color:C.muted}}>✕</button>
    </div>
    {showChangelog&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:701,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)closeChangelog();}}>
      <div className="up" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:22,maxWidth:420,width:"100%",maxHeight:"85vh",overflowY:"auto"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:16,fontWeight:700,color:C.cream,marginBottom:4}}>✨ Yenilikler</div>
        <div style={{fontSize:11,color:C.gold,marginBottom:14}}>Sürüm {APP_VERSION}</div>
        <ul style={{fontSize:12,color:C.muted,lineHeight:1.9,marginLeft:16,paddingRight:8,marginBottom:16}}>
          {(CHANGELOG[0]&&CHANGELOG[0].items||[]).map(function(item,i){return <li key={i}>{item}</li>;})}
        </ul>
        <button onClick={closeChangelog} style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tamam</button>
      </div>
    </div>}
    {showShortcuts&&<div className="no-print" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:701,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(){setShowShortcuts(false);}}>
      <div className="up" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:22,maxWidth:320}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:16,fontWeight:700,color:C.cream,marginBottom:12}}>⌨️ Kısayollar</div>
        <div style={{fontSize:12,color:C.muted,lineHeight:2}}><div><kbd style={{padding:"2px 8px",background:"var(--card2)",borderRadius:6}}>M</kbd> Menü</div><div><kbd style={{padding:"2px 8px",background:"var(--card2)",borderRadius:6}}>F</kbd> Favoriler</div><div><kbd style={{padding:"2px 8px",background:"var(--card2)",borderRadius:6}}>?</kbd> Bu pencere</div><div><kbd style={{padding:"2px 8px",background:"var(--card2)",borderRadius:6}}>Esc</kbd> Kapat</div></div>
        <button onClick={function(){setShowShortcuts(false);}} style={{marginTop:12,padding:"8px 16px",borderRadius:9,border:"1.5px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tamam</button>
      </div>
    </div>}
    {showOnboarding&&<div className="no-print" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:702,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div className="up" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:28,maxWidth:360}}>
        <div style={{fontSize:18,fontWeight:700,color:C.cream,marginBottom:8,fontFamily:"'Playfair Display',serif"}}>{onboardingStep===0?"Hoş geldin 👋":onboardingStep===1?"Favoriler ❤️":"Şef sohbeti 💬"}</div>
        <p style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:20}}>{onboardingStep===0?"Menü sekmesinden haftalık menü oluşturabilir, tarifleri inceleyebilirsin.":onboardingStep===1?"Beğendiğin tarifleri favorilere ekleyerek tekrar ulaşabilirsin.":"Şef sekmesinde yemek hakkında soru sorabilirsin."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
          <button onClick={function(){setOnboardingStep(0);finishOnboarding();}} style={{padding:"8px 14px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted,fontSize:12}}>Atla</button>
          {onboardingStep<2?<button onClick={function(){setOnboardingStep(onboardingStep+1);}} style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Sonraki</button>:<button onClick={finishOnboarding} style={{padding:"8px 16px",borderRadius:9,border:"1.5px solid "+C.gold,background:C.goldDim,color:C.goldL,fontSize:12,fontWeight:600}}>Tamam</button>}
        </div>
      </div>
    </div>}
    <div style={{paddingBottom:68}}>
      {activeTab==="menu"&&<MenuTab favorites={favorites} lists={lists} onToggleFav={toggleFav} onAddToList={addToList} isGuest={isGuest} user={user}/>}
      {activeTab==="buzdolabi"&&<BuzdolabiTab/>}
      {activeTab==="alisveris"&&<AlisverisTab/>}
      {activeTab==="puf"&&<PufTab/>}
      {activeTab==="rehber"&&<RehberTab/>}
      {activeTab==="saglik"&&<SaglikTab/>}
      {activeTab==="smoothie"&&<IcecekTab/>}
      {activeTab==="diyet"&&<DiyetTab/>}
      {activeTab==="tatli"&&<TatliTab/>}
      {activeTab==="ekmek"&&<EkmekTab/>}
      {activeTab==="sefdunya"&&<SefDunyasiTab/>}
      {activeTab==="fonktip"&&<FonksiyonelTipTab/>}
      {activeTab==="foto"&&<FotoTab/>}
      {activeTab==="kur"&&<KurTab/>}
      {activeTab==="kan"&&<KanTab/>}
      {activeTab==="vucut"&&<VucutHaritasiTab/>}
      {activeTab==="oruc"&&<OrucTab/>}
      {activeTab==="takip"&&<TakipTab/>}
      {activeTab==="akademi"&&<AkademiTab/>}
      {activeTab==="favoriler"&&<FavorilerTab favorites={favorites} lists={lists} onToggleFav={toggleFav} onUpdateFavNote={updateFavNote} onGoToMenu={function(){setActiveTab("menu");}} onExportData={exportFavorilerListe}/>}
      {activeTab==="chat"&&<ChatTab/>}
      {activeTab==="hikaye"&&<HikayeTab/>}
      {activeTab==="araclar"&&<AraclarTab/>}
      {activeTab==="network"&&<ChefNetworkTab user={user}/>}
      {activeTab==="chefprofil"&&<ChefProfileTab user={user}/>}
      {activeTab==="isler"&&<ChefJobsTab user={user}/>}
      {activeTab==="freelance"&&<ChefFreelanceTab user={user}/>}
      {activeTab==="mesajlar"&&<ChefMessagesTab user={user}/>}
    </div>
    <div className="no-print" style={{position:"fixed",bottom:0,left:0,right:0,background:"var(--nav)",backdropFilter:"blur(12px)",borderTop:"0.5px solid var(--border)",display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",zIndex:500,padding:"8px 0 10px",alignItems:"center",justifyContent:"center"}}>
      {BOTTOM_TABS.slice(0,BOTTOM_TABS_VISIBLE).map(function(t){var ac=activeTab===t.id;return <button key={t.id} onClick={function(){setActiveTab(t.id);setShowMoreTabs(false);}} style={{flex:"0 0 auto",minWidth:56,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"4px 2px",background:"transparent",border:"none",color:ac?"var(--text)":"var(--muted)"}}>
        <span style={{fontSize:ac?20:18,transition:"font-size 0.15s"}}>{t.icon}</span>
        <span style={{fontSize:11,fontWeight:ac?600:400}}>{t.label}</span>
        <span style={{width:16,height:2,borderRadius:2,background:ac?"var(--accent)":"transparent",marginTop:0}}/>
      </button>;})}
      <button onClick={function(){setShowMoreTabs(!showMoreTabs);}} style={{flex:"0 0 auto",minWidth:56,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"4px 2px",background:showMoreTabs?"var(--card2)":"transparent",border:"none",color:BOTTOM_TABS.slice(BOTTOM_TABS_VISIBLE).some(function(t){return activeTab===t.id;})?"var(--text)":"var(--muted)"}} title="Daha fazla sekme">
        <span style={{fontSize:20}}>⋯</span>
        <span style={{fontSize:11,fontWeight:400}}>Daha fazla</span>
        <span style={{width:16,height:2,borderRadius:2,background:BOTTOM_TABS.slice(BOTTOM_TABS_VISIBLE).some(function(t){return activeTab===t.id;})?"var(--accent)":"transparent",marginTop:0}}/>
      </button>
    </div>
    {showMoreTabs&&<div style={{position:"fixed",inset:0,zIndex:502,background:"rgba(0,0,0,0.5)"}} onClick={function(){setShowMoreTabs(false);}}>
      <div style={{position:"fixed",bottom:68,left:12,right:12,background:"var(--card)",borderRadius:16,border:"1px solid var(--border)",padding:16,maxHeight:"60vh",overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}} onClick={function(e){e.stopPropagation();}}>
        {BOTTOM_TABS.slice(BOTTOM_TABS_VISIBLE).map(function(t){var ac=activeTab===t.id;return <button key={t.id} onClick={function(){setActiveTab(t.id);setShowMoreTabs(false);}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"12px 8px",borderRadius:12,border:"1.5px solid "+(ac?"var(--accent)":"var(--border)"),background:ac?"rgba(128,128,128,0.08)":"var(--card2)",color:ac?"var(--text)":"var(--muted)"}}>
          <span style={{fontSize:24}}>{t.icon}</span>
          <span style={{fontSize:10,fontWeight:ac?700:400}}>{t.label}</span>
        </button>;})}
      </div>
    </div>}
  </div>;
}
