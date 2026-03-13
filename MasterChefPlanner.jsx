import { useState, useEffect, useRef, memo } from "react";
import { callAI, callAIStream, callAIText, callAIVision, getAnthropicHeaders, getApiKey, API_BASE } from "./src/api/anthropic.js";
import { parseJSON } from "./src/utils/json.js";

// ─── COLORS (CSS vars for theming) ───────────────────────────
const C = {
  gold:"#D4A843",goldL:"#F0C96A",goldDim:"rgba(212,168,67,0.15)",
  borderG:"rgba(212,168,67,0.25)",
  red:"#E05252",blue:"#5BA3D0",green:"#4CAF7A",purple:"#9B7FD4",
  teal:"#2DD4BF",orange:"#F97316",pink:"#EC4899",
  bg:"var(--bg)",card:"var(--card)",card2:"var(--card2)",
  border:"var(--border)",cream:"var(--cream)",muted:"var(--muted)",dim:"var(--dim)",
};

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
const SMOOTHIE_GOALS=[{id:"enerji",label:"Enerji",emoji:"⚡",col:C.orange},{id:"detoks",label:"Detoks",emoji:"🌿",col:C.green},{id:"kilo",label:"Kilo",emoji:"⚖️",col:C.blue},{id:"guzellik",label:"Güzellik",emoji:"✨",col:C.pink},{id:"bagirsak",label:"Bağırsak",emoji:"🦠",col:C.teal},{id:"uyku",label:"Uyku",emoji:"🌙",col:C.purple}];
const REHBER_TABS=[{id:"saklama",label:"Saklama",emoji:"📦"},{id:"sunum",label:"Sunum",emoji:"🎨"},{id:"eslesme",label:"Eşleşme",emoji:"🍷"},{id:"temizlik",label:"Temizlik",emoji:"🧹"},{id:"stok",label:"Stok",emoji:"🛒"}];
const BOTTOM_TABS=[{id:"menu",icon:"🍽️",label:"Menü"},{id:"kur",icon:"🍵",label:"Kür"},{id:"kan",icon:"🩸",label:"Kan"},{id:"vucut",icon:"🫀",label:"Vücut"},{id:"oruc",icon:"🌙",label:"Oruç"},{id:"nefes",icon:"🫁",label:"Nefes"},{id:"saglik",icon:"🌿",label:"Sağlık"},{id:"smoothie",icon:"🥤",label:"Smoothie"},{id:"foto",icon:"📸",label:"Analiz"},{id:"takip",icon:"📊",label:"Takip"},{id:"favoriler",icon:"❤️",label:"Favoriler"},{id:"chat",icon:"💬",label:"Şef"},{id:"akademi",icon:"📚",label:"Akademi"}];

function makeCSS(isDark) {
  return "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');\n:root{--bg:"+( isDark?"#0A0A0A":"#F5EFE0")+";--card:"+( isDark?"#141414":"#FFFFFF")+";--card2:"+( isDark?"#1A1A1A":"#F0EBE3")+";--border:"+( isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.1)")+";--cream:"+( isDark?"#F5EFE0":"#1A1A1A")+";--muted:"+( isDark?"#666":"#888")+";--dim:"+( isDark?"#333":"#CCC")+"}\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\nbody{background:var(--bg);color:var(--cream);font-family:'Inter',sans-serif}\n::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:"+( isDark?"#333":"#ccc")+";border-radius:5px}\ninput,textarea,button{font-family:'Inter',sans-serif}\ninput::placeholder,textarea::placeholder{color:var(--muted)}\nbutton{cursor:pointer}\n@keyframes spin{to{transform:rotate(360deg)}}\n@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}\n@keyframes pulse{0%,100%{opacity:0.4}50%{opacity:1}}\n@keyframes shimmer{0%{background-position:-800px 0}100%{background-position:800px 0}}\n.up{animation:fadeUp 0.35s ease both}\n.sk{background:linear-gradient(90deg,"+( isDark?"rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%":"rgba(0,0,0,0.03) 25%,rgba(0,0,0,0.07) 50%,rgba(0,0,0,0.03) 75%")+");background-size:800px 100%;animation:shimmer 1.6s infinite linear;border-radius:12px}\nbutton:active{transform:scale(0.97);opacity:0.9}";
}

// ─── UTILS ───────────────────────────────────────────────────
function fI(arr,id){ return arr.find(function(x){ return x.id===id; }); }
function toBase64(file){ return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result.split(",")[1]);};r.onerror=rej;r.readAsDataURL(file);}); }
async function stGet(k){try{var r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch(e){return null;}}
async function stSet(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch(e){}}

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

// ─── SMALL COMPONENTS ────────────────────────────────────────
function Spinner(props){var size=props.size||16,color=props.color||C.gold;return <span style={{display:"inline-block",width:size,height:size,flexShrink:0,borderRadius:"50%",border:"2px solid "+color+"33",borderTopColor:color,animation:"spin 0.7s linear infinite"}}/>;}
function SH(props){return <div style={{marginBottom:12}}><div style={{fontSize:11,letterSpacing:"0.28em",textTransform:"uppercase",color:C.gold,fontWeight:700,marginBottom:4}}>{props.label}</div>{props.sub?<div style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{props.sub}</div>:null}</div>;}
function ErrBox(props){if (!props.msg) return null;return <div style={{padding:"11px 15px",borderRadius:11,border:"1px solid rgba(224,82,82,0.3)",background:"rgba(224,82,82,0.07)",color:C.red,fontSize:13,marginBottom:14}}>⚠ {props.msg}</div>;}
function GoldBtn(props){var ld=props.loading;return <button onClick={props.onClick} disabled={props.disabled} style={{width:"100%",padding:"14px",borderRadius:13,border:"2px solid rgba(212,168,67,"+(ld?"0.15":"0.5")+")",background:ld?"rgba(212,168,67,0.03)":"linear-gradient(135deg,rgba(212,168,67,0.22),rgba(212,168,67,0.08))",color:ld?"#444":C.goldL,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>{props.children}</button>;}
function TabHeader(props){var col=props.col||C.gold;return <div style={{background:"var(--card)",padding:"20px 20px 16px",marginBottom:14,borderBottom:"1px solid "+col+"33"}}><div style={{fontSize:10,letterSpacing:"0.35em",color:col,textTransform:"uppercase",fontWeight:700,marginBottom:6}}>✦ {props.sub} ✦</div><h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:C.cream,marginBottom:4}}>{props.title}</h2><p style={{fontSize:12,color:C.muted}}>{props.desc}</p></div>;}

function ThemeToggle(props){
  return <button onClick={props.onToggle} title={props.isDark?"Aydınlık Mod":"Karanlık Mod"} style={{position:"fixed",top:10,right:props.hasUser?85:10,zIndex:601,width:34,height:34,borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted}}>
    {props.isDark?"☀️":"🌙"}
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
var DetailPanel=memo(function DetailPanel(props){
  var d=props.data,col=props.col;
  var [speaking,setSpeaking]=useState(false);
  var [pisirme,setPisirme]=useState(false);
  function doSpeak(){
    var t=d.isim+". Malzemeler: "+(d.malzemeler||[]).map(function(m){return m.miktar+" "+m.isim;}).join(", ")+". Hazırlanış: "+(d.adimlar||[]).join(". ");
    speak(t); setSpeaking(true);
  }
  function doStop(){ stopSpeech(); setSpeaking(false); }
  return <div style={{background:"var(--card2)",padding:"16px 18px",borderRadius:"0 0 14px 14px",border:"1px solid var(--border)",borderTop:"none"}}>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,alignItems:"center"}}>
      {d.sure?<span style={{padding:"4px 11px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue,fontSize:11}}>⏱ {d.sure}</span>:null}
      {d.porsiyon?<span style={{padding:"4px 11px",borderRadius:50,background:"var(--card)",color:C.muted,fontSize:11}}>🍽 {d.porsiyon}</span>:null}
      {d.kalori?<span style={{padding:"4px 11px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple,fontSize:11}}>🔥 {d.kalori}</span>:null}
      <div style={{flex:1}}/>
      <button onClick={speaking?doStop:doSpeak} style={{padding:"5px 12px",borderRadius:50,fontSize:11,border:"1.5px solid "+(speaking?"rgba(224,82,82,0.4)":"rgba(212,168,67,0.3)"),background:speaking?"rgba(224,82,82,0.08)":C.goldDim,color:speaking?C.red:C.goldL,display:"flex",alignItems:"center",gap:5}}>
        {speaking?"⏹ Durdur":"🔊 Sesli Oku"}
      </button>
      {(d.adimlar||[]).length>0&&<button onClick={function(){setPisirme(true);}} style={{padding:"5px 13px",borderRadius:50,fontSize:11,border:"1.5px solid rgba(76,175,122,0.4)",background:"rgba(76,175,122,0.1)",color:C.green,fontWeight:600}}>👨‍🍳 Pişirmeye Başla</button>}
    </div>
    {pisirme&&<PisirmeModu data={d} col={col} onClose={function(){setPisirme(false);}}/>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:col,fontWeight:700,marginBottom:9}}>Malzemeler</div>
        {(d.malzemeler||[]).map(function(m,i){return <div key={i} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,flexShrink:0,fontSize:9,marginTop:4}}>◆</span><span style={{color:C.muted,minWidth:36,fontSize:12}}>{m.miktar}</span><span style={{color:C.cream,fontSize:12}}>{m.isim}</span></div>;})}
      </div>
      <div>
        <div style={{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:col,fontWeight:700,marginBottom:9}}>Hazırlanış</div>
        {(d.adimlar||[]).map(function(s,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:7}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:18}}>{i+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
      </div>
    </div>
    {d.sef_notu?<div style={{marginTop:12,padding:"10px 14px",background:C.goldDim,borderRadius:9,border:"1px solid rgba(212,168,67,0.2)"}}><span style={{fontSize:10,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.12em"}}>👨‍🍳 Şef Notu  </span><span style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>{d.sef_notu}</span></div>:null}
  </div>;
});

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
  useEffect(function(){if(hasD&&ref.current) setTimeout(function(){ref.current.scrollIntoView({behavior:"smooth",block:"nearest"});},100);},[hasD]);

  function loadPuf(){
    if (pufData){setPufOpen(!pufOpen);return;}
    if (pufErr){setPufOpen(!pufOpen);return;}
    setPufOpen(true);setPufLoad(true);setPufErr(null);
    callAI("Turkish chef. "+dish.isim+" icin 5 pratik pisirme ipucu. Her ipucu 1-2 cumle Turkce. Kisaca tut.\nJSON: baslik string, ipuclari:[{baslik,aciklama}]",900)
      .then(function(r){setPufData(r);setPufLoad(false);})
      .catch(function(e){setPufErr(e&&e.message?e.message:"API hatası");setPufLoad(false);});
  }
  function loadSaglik(){
    if (saglikData){setSaglikOpen(!saglikOpen);return;}
    if (saglikErr){setSaglikOpen(!saglikOpen);return;}
    setSaglikOpen(true);setSaglikLoad(true);setSaglikErr(null);
    var p="Turkish nutritionist. "+dish.isim+" icin kisaca Turkce saglik analizi yap. Maksimum 3 fayda, her aciklama 1 cumle.\nJSON sadece: baslik string, faydalar:[{baslik,aciklama}], dikkat:string, kalori_not:string, oneri:string";
    callAI(p,900)
      .then(function(r){setSaglikData(r);setSaglikLoad(false);})
      .catch(function(e){setSaglikErr(e&&e.message?e.message:"API hatası");setSaglikLoad(false);});
  }
  function loadEslesme(){
    if(eslesmeData){setEslesmeOpen(!eslesmeOpen);return;}
    if(eslesmeErr){setEslesmeOpen(!eslesmeOpen);return;}
    setEslesmeOpen(true);setEslesmeLoad(true);setEslesmeErr(null);
    callAI("Somelier ve yemek uzmani. "+dish.isim+" icin Turkce eslestirme onerileri. Kisaca tut, her aciklama max 1 cumle.\nJSON: icecekler:[{isim,neden}], yan_yemekler:[{isim,neden}], kacinin:string",800)
      .then(function(r){setEslesmeData(r);setEslesmeLoad(false);})
      .catch(function(e){setEslesmeErr(e&&e.message?e.message:"Hata");setEslesmeLoad(false);});
  }
  function loadHazirlik(){
    if(hazirlikData){setHazirlikOpen(!hazirlikOpen);return;}
    if(hazirlikErr){setHazirlikOpen(!hazirlikOpen);return;}
    setHazirlikOpen(true);setHazirlikLoad(true);setHazirlikErr(null);
    callAI("Mutfak uzmani. "+dish.isim+" icin Turkce hazirlik ve saklama plani. Kisa tut.\nJSON: onceden_hazirlik:string, saklama_suresi:string, saklama_yontemi:string, isitma:string, meal_prep:string",800)
      .then(function(r){setHazirlikData(r);setHazirlikLoad(false);})
      .catch(function(e){setHazirlikErr(e&&e.message?e.message:"Hata");setHazirlikLoad(false);});
  }
  function loadVaryasyon(){
    if(varyasyonData){setVaryasyonOpen(!varyasyonOpen);return;}
    if(varyasyonErr){setVaryasyonOpen(!varyasyonOpen);return;}
    setVaryasyonOpen(true);setVaryasyonLoad(true);setVaryasyonErr(null);
    callAI("Yaratici sef. "+dish.isim+" icin Turkce varyasyon ve degisim onerileri. Kisa tut.\nJSON: varyasyonlar:[{isim,aciklama}], malzeme_degisim:[{original,alternatif,neden}], sef_notu:string",900)
      .then(function(r){setVaryasyonData(r);setVaryasyonLoad(false);})
      .catch(function(e){setVaryasyonErr(e&&e.message?e.message:"Hata");setVaryasyonLoad(false);});
  }
  function loadTarih(){
    if(tarihData){setTarihOpen(!tarihOpen);return;}
    if(tarihErr){setTarihOpen(!tarihOpen);return;}
    setTarihOpen(true);setTarihLoad(true);setTarihErr(null);
    callAI("Mutfak tarihcisi. "+dish.isim+" yemeginin Turkce tarih ve kultur bilgisi. Kisa tut.\nJSON: koken:string, tarih:string, yayilim:string, ilginc_bilgi:string",800)
      .then(function(r){setTarihData(r);setTarihLoad(false);})
      .catch(function(e){setTarihErr(e&&e.message?e.message:"Hata");setTarihLoad(false);});
  }
  function loadKimler(){
    if(kimlerData){setKimlerOpen(!kimlerOpen);return;}
    if(kimlerErr){setKimlerOpen(!kimlerOpen);return;}
    setKimlerOpen(true);setKimlerLoad(true);setKimlerErr(null);
    callAI("Diyetisyen. "+dish.isim+" yemegi icin Turkce uygunluk analizi. Kisa tut, her aciklama 1 cumle.\nJSON: uygun:[{grup,neden}], dikkatli:[{grup,neden}], uygun_degil:[{grup,neden}]",800)
      .then(function(r){setKimlerData(r);setKimlerLoad(false);})
      .catch(function(e){setKimlerErr(e&&e.message?e.message:"Hata");setKimlerLoad(false);});
  }
  function loadIkame(){setIkameOpen(!ikameOpen);}
  async function doIkame(){
    if(!ikameSorgu.trim()) return;
    setIkameLoad(true);setIkameErr(null);setIkameData(null);
    callAI("Mutfak uzmani. '"+dish.isim+"' icin '"+ikameSorgu+"' yerine ne kullanilabilir? JSON: orijinal:string, alternatifler:[{isim:string,oran:string,not:string}], en_iyi:string, uyari:string",400)
      .then(function(r){setIkameData(r);setIkameLoad(false);}).catch(function(e){setIkameErr(e.message||"Hata");setIkameLoad(false);});
  }
    return <div ref={ref} className="up" style={{animationDelay:(props.delay||0)+"s"}}>
    <div style={{background:"var(--card)",borderLeft:"4px solid "+col,border:"1px solid var(--border)",borderRadius:hasD?"14px 14px 0 0":14,padding:"14px 16px",display:"flex",gap:12,alignItems:"flex-start",opacity:isRep?0.5:1}}>
      <div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:col+"18",border:"2px solid "+col+"55",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:col,fontWeight:700}}>{index+1}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",marginBottom:4}}>
          <span style={{fontSize:15,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif"}}>{dish.isim}</span>
          {dish.ogun?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:col+"18",color:col,fontWeight:600}}>{dish.ogun}</span>:null}
          {dish.sure?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(91,163,208,0.12)",color:C.blue}}>⏱ {dish.sure}</span>:null}
          {dish.kalori?<span style={{fontSize:10,padding:"2px 8px",borderRadius:50,background:"rgba(155,127,212,0.12)",color:C.purple}}>🔥 {dish.kalori}</span>:null}
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
        </div>
      </div>
    </div>
    {showD&&!isLoad&&detail.data?<DetailPanel data={detail.data} col={col}/>:null}
    {showD&&!isLoad&&detail.error?<div style={{padding:"11px 14px",background:"rgba(224,82,82,0.07)",borderRadius:"0 0 12px 12px",border:"1px solid rgba(224,82,82,0.2)",borderTop:"none",color:C.red,fontSize:12}}>⚠ {detail.error}</div>:null}
    {pufOpen&&<div className="up" style={{background:"rgba(76,175,122,0.05)",borderRadius:"0 0 14px 14px",border:"1px solid rgba(76,175,122,0.2)",borderTop:"none",padding:"13px 16px"}}>
      <div style={{fontSize:10,color:C.green,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.2em",marginBottom:10}}>💡 {dish.isim} — Püf Noktaları</div>
      {pufLoad&&<div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0"}}><Spinner size={13} color={C.green}/><span style={{fontSize:12,color:C.green}}>Hazırlanıyor…</span></div>}
      {pufErr&&<div style={{fontSize:12,color:C.red,padding:"7px 10px",background:"rgba(224,82,82,0.07)",borderRadius:8,border:"1px solid rgba(224,82,82,0.2)"}}><button onClick={function(){setPufData(null);setPufErr(null);loadPuf();}} style={{color:C.gold,background:"transparent",border:"none",fontSize:11,marginLeft:6}}>🔄 Tekrar</button></div>}
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
  </div>;
});

// ─── SHOPPING LIST ───────────────────────────────────────────
function ShoppingList(props){
  var [loading,setLoading]=useState(true);
  var [list,setList]=useState(null);
  var [error,setError]=useState(null);
  var [checked,setChecked]=useState({});
  useEffect(function(){
    var all=props.days.flatMap(function(d){return d.dishes||[];});
    var mats=all.map(function(d){return d.isim+": "+(d.malzemeler||[]).join(", ");}).join("\n");
    callAI("Grocery list in Turkish for:\n"+mats+"\nContinue JSON:\n\"kategoriler\":[{\"ad\":\"Sebzeler\",\"malzemeler\":[{\"isim\":\"soğan\",\"miktar\":\"2 adet\",\"tahmini_fiyat\":12}]}],\"toplam_tahmini\":350,\"not\":\"Fiyatlar Mart 2025 Türkiye ortalama perakende\"}",900)
      .then(function(r){setList(r);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  },[]);
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:999,padding:14}}>
    <div style={{width:"100%",maxWidth:500,background:"var(--card)",borderRadius:"18px 18px 0 0",padding:20,border:"1px solid "+C.borderG,maxHeight:"80vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.cream}}>🛒 Alışveriş Listesi</div>
          {list&&list.toplam_tahmini&&<div style={{fontSize:11,color:C.gold,marginTop:2}}>Tahmini: ~{list.toplam_tahmini} ₺</div>}
        </div>
        <button onClick={props.onClose} style={{background:"transparent",border:"1px solid var(--border)",borderRadius:9,color:C.muted,padding:"5px 10px",fontSize:12}}>✕ Kapat</button>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        {loading?<div style={{textAlign:"center",padding:36}}><Spinner size={26}/></div>:null}
        {error?<div style={{color:C.red,fontSize:13,padding:10}}>⚠ {error}</div>:null}
        {list?(list.kategoriler||[]).map(function(kat,ki){return <div key={ki} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8,paddingBottom:6,borderBottom:"1px solid rgba(212,168,67,0.15)"}}>
            <div style={{flex:1,fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:C.gold,fontWeight:700}}>{kat.ad}</div>
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
  var [menuSub,setMenuSub]=useState("olustur");
  var [imzaMutfak,setImzaMutfak]=useState("türk");
  var [memCtx,setMemCtx]=useState("");
  var [aileProf,setAileProf]=useState([]);
  var [showAile,setShowAile]=useState(false);
  var [showBildirim,setShowBildirim]=useState(false);
  var [denge,setDenge]=useState({});
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
  var cache=useRef({});

  function tMap(setter,id){setter(function(p){var n=Object.assign({},p);n[id]=!n[id];return n;});}
  function reset(){setDays(null);setDetail(null);}
  var oI=fI(OGUNLER,ogun)||{};
  var oL=oI.label||ogun;
  var _mAy=new Date().getMonth()+1,_mPd=PAZAR_AY[_mAy]||{tema:"",urunler:[]};
  var ctx=["Mutfak:"+(selC.length?selC.join(","):"Türk"),"Stil:"+(fI(STILLER,stil)||{}).label,"ImzaMutfak:"+(fI(IMZA_MUTFAK,imzaMutfak)||{}).label,"Beslenme:"+(fI(BESLENME,beslenme)||{}).label,"Baharat:"+(fI(BAHARAT,baharat)||{}).label,"Kişi:"+kisi,"Denge:"+Object.keys(denge).filter(function(k){return denge[k];}).map(function(k){return (DENGE.find(function(d){return d.id===k;})||{label:k}).label;}).join(","),"Mevsim:"+_mPd.tema,"Pazar:"+_mPd.urunler.slice(0,4).join(",")].join("|");
  var hKey=JSON.stringify({selC,ogun,stil,imzaMutfak,zorluk,beslenme,baharat,alerjen,ekstra,kisi,kalem,gunSayisi});

  // Load from persistent storage
  useEffect(function(){
    stGet("menu:"+hKey).then(function(cached){
      if (cached&&!days){ setDays(cached); setStep(3); setActiveDay(0); }
    });
  },[hKey]);

  function buildPrompt(gNo,exN){
    return "Turkish chef. Exactly "+kalem+" dishes for Day "+gNo+"/"+gunSayisi+".\nContext:"+ctx+" | Meal:"+oL+" | Difficulty:"+(fI(ZORLUK,zorluk)||{}).label+" | Servings:"+kisi+(exN.length?"\nDo NOT include: "+exN.join(", "):"")+  (memCtx?"\n"+memCtx:"")+(Object.keys(denge).some(function(k){return denge[k];})?("\\nDENGE: "+Object.keys(denge).filter(function(k){return denge[k];}).map(function(k){var _d=DENGE.find(function(x){return x.id===k;});return _d?_d.desc:"";}).filter(Boolean).join(". ")):"")+"\nContinue JSON:\n\"menu_adi\":\"name\",\"aciklama\":\"desc\",\"yemekler\":[{\"isim\":\"dish\",\"ogun\":\""+oL+"\",\"aciklama\":\"1 sentence\",\"malzemeler\":[\"i1\",\"i2\",\"i3\",\"i4\"],\"sure\":\"X dk\",\"zorluk\":\"Kolay\",\"kalori\":\"XXX kcal\"}]}\nAll Turkish, no duplicates.";
  }

  async function generate(){
    if (!getApiKey()){ setError("Menü oluşturmak için API anahtarı gerekli. Sağ üstten ⚙️ Ayarlar'a girip Anthropic API anahtarını ekleyin."); return; }
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
      var res=await fetch(API_BASE+"/v1/messages",{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:800,system:"Türkçe alışveriş listesi uzmanısın. Sadece JSON döndür.",messages:[{role:"user",content:"Bu yemekler için alışveriş listesi çıkar: "+tumYemekler.join(", ")+".\n\nJSON: {\"kategoriler\":[{\"kategori\":\"Sebze & Meyve\",\"malzemeler\":[\"malzeme1\",\"malzeme2\"]},{\"kategori\":\"Et & Protein\",\"malzemeler\":[]},{\"kategori\":\"Tahıl & Baklagil\",\"malzemeler\":[]},{\"kategori\":\"Süt & Yumurta\",\"malzemeler\":[]},{\"kategori\":\"Baharat & Sos\",\"malzemeler\":[]}]}"},{role:"assistant",content:"{"}]})});
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

  var subBar=<div style={{display:"flex",gap:6,padding:"10px 16px 0"}}>
    {[["olustur","🍽️","Menü Oluştur"],["buzdolabi","🧊","Buzdolabı"]].map(function(t){
      var ac=menuSub===t[0];
      return <button key={t[0]} onClick={function(){setMenuSub(t[0]);}} style={{flex:1,padding:"9px 4px",borderRadius:11,border:"2px solid "+(ac?C.gold:"var(--border)"),background:ac?C.goldDim:"var(--card2)",color:ac?C.goldL:C.muted,fontSize:12,fontWeight:ac?700:400,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        <span style={{fontSize:15}}>{t[1]}</span><span>{t[2]}</span>
      </button>;
    })}
  </div>;

  if (menuSub==="buzdolabi") return <div style={{paddingBottom:60}}>{subBar}<div style={{padding:"14px 16px 0"}}><BuzdolabiPanel/></div></div>;

  if (step===1||step===2) return <div style={{paddingBottom:60}}>
    {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
    {subBar}
    <div style={{padding:"14px 16px 0"}}>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["1","Öğün & Mutfak"],["2","Detaylar"]].map(function(s,i){var ac=step===i+1;return <div key={i} onClick={function(){setStep(i+1);}} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:50,background:ac?C.goldDim:"transparent",border:"1.5px solid "+(ac?C.gold:"var(--border)"),cursor:"pointer"}}>
          <span style={{width:18,height:18,borderRadius:"50%",background:ac?C.gold:"var(--dim)",color:ac?"#000":"var(--muted)",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{s[0]}</span>
          <span style={{fontSize:12,color:ac?C.cream:C.muted}}>{s[1]}</span>
        </div>;})}
      </div>
      {step===1&&<div className="up">
        <SH label="Öğün"/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8,marginBottom:18}}>
          {OGUNLER.map(function(o){return <button key={o.id} onClick={function(){setOgun(o.id);reset();}} style={{borderRadius:13,overflow:"hidden",border:"2px solid "+(ogun===o.id?C.gold:"transparent"),background:ogun===o.id?C.goldDim:"var(--card)",padding:0}}>
            <div style={{background:o.img.bg,height:65,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>{o.img.emoji}</div>
            <div style={{padding:"6px",textAlign:"center"}}><span style={{fontSize:11,fontWeight:600,color:ogun===o.id?C.cream:"var(--muted)"}}>{o.label}</span></div>
          </button>;})}
        </div>
        <SH label="Mutfak" sub="Boş = Türk mutfağı"/>
        {CUISINES.map(function(gr){return <div key={gr.group} style={{marginBottom:14}}>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,marginBottom:6}}>{gr.group}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))",gap:5}}>
            {gr.items.map(function(c){var on=selC.indexOf(c.id)>-1;return <button key={c.id} onClick={function(){setSelC(function(p){return p.indexOf(c.id)>-1?p.filter(function(x){return x!==c.id;}):p.concat([c.id]);});reset();}} style={{borderRadius:9,padding:"8px 5px",border:"1.5px solid "+(on?C.gold:"var(--border)"),background:on?C.goldDim:"var(--card)",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:18}}>{CE[c.id]||"🍴"}</span>
              <span style={{fontSize:10,color:on?C.cream:"var(--muted)"}}>{c.l}</span>
            </button>;})}
          </div>
        </div>;})}
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
        <ErrBox msg={error}/>
        <GoldBtn onClick={generate} loading={loading} disabled={loading}>
          {loading?<span style={{display:"flex",alignItems:"center",gap:10}}><Spinner size={16}/>{loadingDay?loadingDay+". gün…":"Başlıyor…"}</span>:"✦ "+gunSayisi+"×"+kalem+" Yemeklik Menü Oluştur"}
        </GoldBtn>
      </div>}
    </div>
  </div>;

  return <div style={{paddingBottom:60}}>
    {loading&&<MenuYuklemeEkrani adimlar={menuAdimlar}/>}
    {subBar}
    <div style={{display:"flex",gap:6,padding:"10px 16px 8px",flexWrap:"wrap",alignItems:"center"}}>
      <button onClick={function(){setStep(2);reset();}} style={{padding:"6px 12px",borderRadius:9,border:"1.5px solid var(--border)",background:"transparent",color:C.muted,fontSize:12}}>← Ayarlar</button>
      <div style={{flex:1}}/>
      <button onClick={doShare} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid "+C.borderG,background:C.goldDim,color:C.goldL,fontSize:12}}>📤 Paylaş</button>
      <button onClick={function(){if(days&&days[activeDay]) exportMenuCard(days[activeDay],true);}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid rgba(155,127,212,0.4)",background:"rgba(155,127,212,0.1)",color:C.purple,fontSize:12}}>🖼️ PNG</button>
      <button onClick={function(){setShowBildirim(!showBildirim);}} style={{padding:"6px 10px",borderRadius:9,border:"1.5px solid "+(showBildirim?"rgba(45,212,191,0.4)":"var(--border)"),background:showBildirim?"rgba(45,212,191,0.1)":"transparent",color:showBildirim?C.teal:C.muted,fontSize:13}}>🔔</button>
      <button onClick={function(){setShowShop(true);}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--card)",color:C.muted,fontSize:12}}>🛒 Alışveriş</button>
      <button onClick={function(){reset();generate();}} style={{padding:"6px 11px",borderRadius:9,border:"1.5px solid "+C.borderG,background:C.goldDim,color:C.goldL,fontSize:12}}>🔄</button>
    </div>
    {oI.img&&<div style={{margin:"0 16px 12px",borderRadius:16,overflow:"hidden",position:"relative",height:130}}>
      <div style={{background:oI.img.bg,width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{fontSize:55}}>{oI.img.emoji}</div></div>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 30%,rgba(10,10,10,0.9) 100%)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"10px 14px"}}>
        <div style={{fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold,marginBottom:2,fontWeight:700}}>{kisi} Kişilik · {(fI(STILLER,stil)||{}).label}</div>
        {cDay&&<div style={{fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif",color:C.cream}}>{cDay.menu_adi}</div>}
      </div>
    </div>}
    {gunSayisi>1&&<div style={{display:"flex",gap:5,padding:"0 16px",marginBottom:10,overflowX:"auto"}}>
      {(days||[]).map(function(d,i){return <button key={i} onClick={function(){setActiveDay(i);}} style={{flexShrink:0,padding:"5px 13px",borderRadius:50,border:"1.5px solid "+(activeDay===i?C.gold:"var(--border)"),background:activeDay===i?C.goldDim:"var(--card)",color:activeDay===i?C.goldL:C.muted,fontSize:12,fontWeight:activeDay===i?700:400}}>{i+1}. Gün</button>;})}
    </div>}
    <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:8}}>
      {cDay&&cDay.dishes.map(function(d,i){return <DishCard key={d.isim+"-"+i} dish={d} index={i} dayIndex={activeDay} detail={detail} repIdx={repIdx} favorites={props.favorites} onDetail={hDetail} onReplace={hReplace} onFav={tFav} onList={setListDish} delay={i*0.05}/>;})}
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
// TAB: SMOOTHİE
// ══════════════════════════════════════════════════════════════
function SmoothieTab(){
  var [goal,setGoal]=useState("enerji");
  var [loading,setLoading]=useState(false);
  var [data,setData]=useState(null);
  var [error,setError]=useState(null);
  var [openIdx,setOpenIdx]=useState(null);
  function generate(){
    setLoading(true);setError(null);setData(null);setOpenIdx(null);
    var gl=(fI(SMOOTHIE_GOALS,goal)||{}).label||goal;
    callAI("Nutritionist. 5 smoothie recipes for: "+gl+".\nContinue JSON:\n\"baslik\":\"Smoothie — "+gl+"\",\"tarifler\":[{\"isim\":\"Turkish name\",\"emoji\":\"1 emoji\",\"hedef\":\"benefit\",\"malzemeler\":[{\"isim\":\"s\",\"miktar\":\"s\",\"neden\":\"s\"}],\"hazirlanis\":[\"s1\",\"s2\"],\"besin\":{\"kalori\":\"XXX kcal\",\"protein\":\"Xg\",\"lif\":\"Xg\"},\"ipucu\":\"s\",\"renk\":\"#hexcolor\"}]}\nAll Turkish.",1200)
      .then(function(r){setData(r);}).catch(function(e){setError(e.message);}).finally(function(){setLoading(false);});
  }
  return <div style={{paddingBottom:60}}>
    <TabHeader sub="Sağlıklı İçecekler" title="Smoothie Tarifleri" desc="Hedefe göre kişiselleştirilmiş tarifler" col={C.teal}/>
    <div style={{padding:"0 16px"}}>
      <SH label="Hedefiniz"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(105px,1fr))",gap:7,marginBottom:16}}>
        {SMOOTHIE_GOALS.map(function(g){var on=goal===g.id;return <button key={g.id} onClick={function(){setGoal(g.id);}} style={{borderRadius:12,padding:"12px 8px",border:"2px solid "+(on?g.col:"var(--border)"),background:on?g.col+"14":"var(--card)",textAlign:"center"}}>
          <div style={{fontSize:24,marginBottom:4}}>{g.emoji}</div><div style={{fontSize:11,fontWeight:600,color:on?C.cream:"var(--muted)"}}>{g.label}</div>
        </button>;})}
      </div>
      <ErrBox msg={error}/>
      <GoldBtn onClick={generate} loading={loading} disabled={loading}>
        {loading?<span style={{display:"flex",alignItems:"center",gap:9}}><Spinner size={16}/>Tarifler hazırlanıyor…</span>:"🥤 5 Smoothie Tarifi Oluştur"}
      </GoldBtn>
      {loading&&<div style={{display:"flex",flexDirection:"column",gap:7,marginTop:12}}>{[0,1,2,3,4].map(function(i){return <div key={i} className="sk" style={{height:75,animationDelay:i*0.08+"s"}}/>;})}  </div>}
      {data&&<div className="up" style={{marginTop:16}}>
        <div style={{textAlign:"center",marginBottom:14,fontSize:10,letterSpacing:"0.25em",color:C.teal,textTransform:"uppercase",fontWeight:700}}>{data.baslik}</div>
        {(data.tarifler||[]).map(function(sm,i){var col=sm.renk||C.teal;var open=openIdx===i;return <div key={i} style={{background:"var(--card)",borderRadius:13,border:"1px solid "+(open?col+"44":"var(--border)"),overflow:"hidden",marginBottom:8}}>
          <button onClick={function(){setOpenIdx(open?null:i);}} style={{width:"100%",padding:"13px 15px",background:"transparent",border:"none",textAlign:"left",display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:40,height:40,borderRadius:10,flexShrink:0,background:col+"18",border:"1px solid "+col+"33",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{sm.emoji||"🥤"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:C.cream,fontFamily:"'Playfair Display',serif",marginBottom:2}}>{sm.isim}</div>
              <div style={{fontSize:12,color:col,marginBottom:3}}>{sm.hedef}</div>
              {sm.besin&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {sm.besin.kalori?<span style={{fontSize:10,padding:"2px 6px",borderRadius:50,background:"rgba(155,127,212,0.1)",color:C.purple}}>🔥 {sm.besin.kalori}</span>:null}
                {sm.besin.protein?<span style={{fontSize:10,padding:"2px 6px",borderRadius:50,background:"rgba(91,163,208,0.1)",color:C.blue}}>P: {sm.besin.protein}</span>:null}
                {sm.besin.lif?<span style={{fontSize:10,padding:"2px 6px",borderRadius:50,background:"rgba(76,175,122,0.1)",color:C.green}}>L: {sm.besin.lif}</span>:null}
              </div>}
            </div>
            <span style={{fontSize:10,color:C.muted,transform:open?"rotate(180deg)":"none",transition:"transform 0.2s"}}>▾</span>
          </button>
          {open&&<div className="up" style={{padding:"0 15px 15px",borderTop:"1px solid "+col+"20"}}>
            <div style={{marginTop:10,marginBottom:9}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Malzemeler</div>
              {(sm.malzemeler||[]).map(function(m,j){return <div key={j} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}><span style={{color:col,fontSize:8}}>◆</span><span style={{color:C.muted,minWidth:48,fontSize:12}}>{m.miktar}</span><span style={{color:C.cream,fontSize:12,flex:1}}>{m.isim}</span>{m.neden?<span style={{fontSize:10,color:col,fontStyle:"italic"}}>{m.neden}</span>:null}</div>;})}
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:9,color:col,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700,marginBottom:7}}>Hazırlanış</div>
              {(sm.hazirlanis||[]).map(function(s,j){return <div key={j} style={{display:"flex",gap:7,marginBottom:5}}><span style={{color:col,fontWeight:700,fontSize:11,flexShrink:0,width:16}}>{j+1}.</span><span style={{color:C.muted,fontSize:12,lineHeight:1.6}}>{s}</span></div>;})}
            </div>
            {sm.ipucu?<div style={{padding:"8px 11px",background:col+"0A",borderRadius:8,border:"1px solid "+col+"18",fontSize:12,color:col,fontStyle:"italic"}}>💡 {sm.ipucu}</div>:null}
          </div>}
        </div>;})}
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
  var [trend,setTrend]=useState(null);
  function loadTrend(){
    var days30=[];for(var i=29;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);days30.push(d.toISOString().slice(0,10));}
    Promise.all(days30.map(function(d){return stGet("nutri:"+d).then(function(r){return {date:d,kal:(r||[]).reduce(function(a,x){var m=String(x.kalori||"").match(/[0-9]+/);return a+(m?parseInt(m[0]):0);},0),protein:(r||[]).reduce(function(a,x){return a+(x.protein||0);},0),count:(r||[]).length};});})).then(function(data){setTrend(data);});
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
      <div style={{display:"flex",gap:5,paddingBottom:12}}>
        {[["bugun","📅","Bugün"],["hafta","📊","Hafta"],["trend","📈","Trend"],["analiz","🤖","AI"],["stats","🏆","Stats"],["bulten","📰","Bülten"]].map(function(t){var ac=view===t[0];return <button key={t[0]} onClick={function(){setView(t[0]);if(t[0]==="analiz") doAiOzet();if(t[0]==="stats") loadStats();if(t[0]==="trend") loadTrend();}} style={{padding:"7px 14px",borderRadius:50,fontSize:12,border:"1.5px solid "+(ac?"rgba(91,163,208,0.5)":"var(--border)"),background:ac?"rgba(91,163,208,0.1)":"transparent",color:ac?C.blue:C.muted,fontWeight:ac?600:400}}>
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

      {section==="fav"&&<div>
        {favorites.length===0?<div style={{textAlign:"center",padding:"40px 20px"}}><div style={{fontSize:40,marginBottom:10}}>🤍</div><div style={{fontSize:14,color:C.muted}}>Henüz favori yok</div><div style={{fontSize:12,color:"var(--dim)",marginTop:5}}>Tarif kartlarındaki ❤️ butonunu kullanın</div></div>:
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
                </div>
                <p style={{fontSize:12,color:C.muted,fontStyle:"italic",lineHeight:1.5}}>{dish.aciklama}</p>
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
  var bottomRef=useRef(null);
  useEffect(function(){if(bottomRef.current) bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);
  function send(){
    if (!input.trim()||loading) return;
    var um={role:"user",content:input.trim()};
    setMessages(function(p){return p.concat([um]);});
    setInput("");setLoading(true);
    var apiMsgs=messages.concat([um]).map(function(m){return {role:m.role,content:m.content};});
    callAIText("Sen Master Chef AI'sın. Türkçe konuşan, deneyimli ve samimi bir şefsin. Yemek, tarif, beslenme ve mutfak teknikleri konularında yardım et. Motive edici ol ve emojiler kullan.",apiMsgs,700)
      .then(function(r){setMessages(function(p){return p.concat([{role:"assistant",content:r}]);});})
      .catch(function(e){setMessages(function(p){return p.concat([{role:"assistant",content:"⚠ Hata: "+e.message}]);});})
      .finally(function(){setLoading(false);});
  }
  var QUICK=["🍝 Kolay makarna tarifi","🥗 Diyet için ne yemeliyim?","🥩 Biftek nasıl pişirilir?","🫙 Domates sosu püf noktası"];
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
          {m.content}
        </div>
      </div>;})}
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
        <input value={input} onChange={function(e){setInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Sorunuzu yazın…" style={{flex:1,background:"var(--card)",border:"1.5px solid var(--border)",borderRadius:10,padding:"10px 14px",color:C.cream,fontSize:13,outline:"none"}}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{width:44,height:44,borderRadius:10,border:"1.5px solid rgba(91,163,208,0.4)",background:loading||!input.trim()?"transparent":"rgba(91,163,208,0.12)",color:loading||!input.trim()?"var(--dim)":C.blue,fontSize:16,flexShrink:0}}>➤</button>
      </div>
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
      {protokoller.filter(function(p){return p.id===acikBlok;}).map(function(p){return <div key={p.id}>{(p.data||[]).map(function(adim,i){return <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}><div style={{width:22,height:22,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1.5px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.gold,flexShrink:0}}>{i+1}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6,paddingTop:2}}>{adim}</div></div>;})} </div>;})}
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
      {(kur.yasam_tarz||[]).map(function(y,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:"#5BA3D0",flexShrink:0}}>○</span><span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{y}</span></div>;})}
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

  useEffect(function(){
    stGet("kurler").then(function(d){if(d) setSavedKurler(d);});
  },[]);

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
        var res=await fetch(API_BASE+"/v1/messages",{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1200,system:sys,messages:[{role:"user",content:usr},{role:"assistant",content:"{"}]})});
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
      var sumRes=await fetch(API_BASE+"/v1/messages",{method:"POST",headers:getAnthropicHeaders(),body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,system:"Bütünleştirici hekim. Sadece JSON.",messages:[{role:"user",content:"Kürler:"+collected.map(function(k){return k.ekol;}).join(",")+". Sorun:"+sorun+"\nJSON:{\"baslik\":\"?\",\"ozet\":\"?\",\"genel_oneriler\":[\"?\",\"?\",\"?\"],\"sinerji\":\"?\"}"},{role:"assistant",content:"{"}]})});
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
  if(step===3&&result) return <div style={{paddingBottom:68}}>
    <TabHeader sub="Şifa Kürü" title={result.baslik||"Kür Programın"} isDark={true}/>
    <div style={{padding:"0 16px"}}>
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
        {(result.genel_oneriler||[]).length>0&&<div style={{padding:"12px 14px",background:"rgba(76,175,122,0.05)",borderRadius:12,border:"1px solid rgba(76,175,122,0.2)"}}><div style={{fontSize:9,color:C.green,textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:700,marginBottom:8}}>🌿 Genel Öneriler</div>{result.genel_oneriler.map(function(o,i){return <div key={i} style={{display:"flex",gap:8,marginBottom:5}}><span style={{color:C.green,fontSize:12,flexShrink:0}}>•</span><span style={{fontSize:12,color:C.muted,lineHeight:1.5}}>{o}</span></div>;})}</div>}
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
          <div style={{fontSize:11,color:C.blue,lineHeight:1.6}}>🔬 Kan değerlerini gir, fonksiyonel tıp + Doğu tıbbı yorumu al. <strong>Optimal aralık</strong> baz alınır.</div>
        </div>
        {kayitlar.length>0&&<div style={{marginBottom:10,padding:"10px 13px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)"}}>
          <div style={{fontSize:9,color:C.gold,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.15em",marginBottom:7}}>📂 Önceki Analizler</div>
          {kayitlar.slice(0,3).map(function(k,i){return <div key={i} onClick={function(){setDegerler(k.degerler);setSonuc(k.sonuc);}} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer"}}>
            <span style={{fontSize:11,color:C.muted}}>{k.tarih}</span>
            <span style={{fontSize:11,color:C.gold}}>{Object.keys(k.degerler).length} değer →</span>
          </div>;})}
        </div>}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:14}}>
          {KAN_DEGERLER.map(function(d){return <div key={d.id} style={{padding:"9px 12px",background:"var(--card)",borderRadius:10,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:C.cream}}>{d.label}</div>
              <div style={{fontSize:9,color:C.dim}}>Optimal: {d.optimal}</div>
            </div>
            <input type="number" step="0.1" value={degerler[d.id]||""} onChange={function(e){setDeger(d.id,e.target.value);}} placeholder="?" style={{width:72,padding:"6px 8px",borderRadius:8,border:"1px solid "+(degerler[d.id]?"rgba(212,168,67,0.4)":"var(--border)"),background:"rgba(0,0,0,0.3)",color:C.cream,fontSize:13,textAlign:"center"}}/>
          </div>;})}
        </div>
        {error&&<div style={{padding:"10px",background:"rgba(224,82,82,0.08)",borderRadius:9,fontSize:12,color:C.red,marginBottom:10}}>⚠ {error}</div>}
        <button onClick={analyze} disabled={!doluDegerler.length||loading} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:doluDegerler.length?C.blue:"var(--border)",color:doluDegerler.length?"#fff":C.dim,fontSize:14,fontWeight:700}}>🔬 {doluDegerler.length?doluDegerler.length+" Değer Analiz Et":"Değer Gir"}</button>
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
  {id:"tibbi_nebevi",label:"Tıbbı Nebevi",emoji:"☪️",renk:"#D4A843",aciklama:"Hz. Peygamber'in (s.a.v.) tıp mirası; dua, bitki ve yaşam sünnetleri",
   konular:[
    {id:"tibbi_nebevi_bal",baslik:"Balın Şifa Gücü",ozet:"Kur'an ve Sünnet'te balın önemi ve modern bilimin doğrulamaları"},
    {id:"tibbi_nebevi_hicama",baslik:"Hicama (Kupa Tedavisi)",ozet:"Nebevi tıbbın en önemli uygulamalarından hacamatın faydaları ve zamanı"},
    {id:"tibbi_nebevi_kara_cekirdek",baslik:"Çörek Otu (Habbetüssevda)",ozet:"'Ölümden başka her derde deva' - bilimsel kanıtlar ve kullanım"},
    {id:"tibbi_nebevi_oruç",baslik:"Nebevi Oruç Tedavisi",ozet:"Perşembe-Pazartesi orucu ve şifavi etkileri"},
    {id:"tibbi_nebevi_misvak",baslik:"Misvak ve Ağız Sağlığı",ozet:"Diş fırçasından üstün nebevi pratik"},
    {id:"tibbi_nebevi_dua",baslik:"Dua ve Şifa",ozet:"Rukye, şifa duaları ve manevi tedavi"},
    {id:"tibbi_nebevi_zeytinyagi",baslik:"Zeytinyağı",ozet:"Nebevi tıbbın mucizevi gıdası"},
    {id:"tibbi_nebevi_hurma",baslik:"Hurma",ozet:"Sahur ve iftar sünneti ile şifavi özellikleri"},
   ]
  },
  {id:"ayurveda",label:"Ayurveda",emoji:"🪷",renk:"#9B7FD4",aciklama:"5000 yıllık Hint bilgeliği; dosha dengesi, prakriti ve şifavi yaşam sanatı",
   konular:[
    {id:"ayurveda_dosha",baslik:"Doshas: Vata, Pitta, Kapha",ozet:"Üç dosha ve kişisel constitution analizi"},
    {id:"ayurveda_prakriti",baslik:"Prakriti - Doğal Yapın",ozet:"Kendi doğanı tanı ve ona göre yaşa"},
    {id:"ayurveda_dinacharya",baslik:"Dinacharya - Günlük Rutin",ozet:"Sabah altın saatinden gece ritüeline Ayurvedik gün planı"},
    {id:"ayurveda_ahara",baslik:"Ayurvedik Beslenme",ozet:"6 tat, sindirim ateşi (agni) ve dosha beslenme rehberi"},
    {id:"ayurveda_panchakarma",baslik:"Panchakarma Detox",ozet:"5 arındırma tedavisi - derin temizlenme protokolü"},
    {id:"ayurveda_bitkiler",baslik:"Ayurvedik Bitkiler",ozet:"Ashwagandha, Brahmi, Turmeric, Triphala ve diğerleri"},
    {id:"ayurveda_yoga",baslik:"Yoga ve Pranayama",ozet:"Dosha tipine göre yoga ve nefes pratikleri"},
    {id:"ayurveda_rtu",baslik:"Mevsimsel Yaşam (Ritucharya)",ozet:"Her mevsim için Ayurvedik uyum rehberi"},
   ]
  },
  {id:"cin_tibbi",label:"Çin Tıbbı",emoji:"☯️",renk:"#E05252",aciklama:"Qi, Yin-Yang dengesi ve 5 element teorisi ile bütünsel şifa",
   konular:[
    {id:"cin_qi",baslik:"Qi - Yaşam Enerjisi",ozet:"Qi nedir, nasıl akar ve nasıl dengede tutulur"},
    {id:"cin_yin_yang",baslik:"Yin-Yang Teorisi",ozet:"Zıtların dengesi ve hastalıkla ilişkisi"},
    {id:"cin_5element",baslik:"Beş Element Teorisi",ozet:"Ahşap, Ateş, Toprak, Metal, Su ve organ bağlantıları"},
    {id:"cin_meridyen",baslik:"Meridyenler ve Akupunktur",ozet:"12 ana meridyen ve enerji akış haritası"},
    {id:"cin_bitkisel",baslik:"Çin Bitkisel Tıbbı",ozet:"Ginseng, Astragalus, Reishi ve formülasyonlar"},
    {id:"cin_beslenme",baslik:"Çin Tıbbına Göre Beslenme",ozet:"Gıdaların enerji özellikleri ve organ uyumu"},
    {id:"cin_tui_na",baslik:"Tui Na Masajı",ozet:"Terapötik Çin masajı teknikleri"},
    {id:"cin_qigong",baslik:"Qigong Pratikleri",ozet:"Nefes, hareket ve meditasyon entegrasyonu"},
   ]
  },
  {id:"fonksiyonel_tip",label:"Fonksiyonel Tıp",emoji:"🔬",renk:"#5BA3D0",aciklama:"Hastalığın kök nedenine inen, kişiselleştirilmiş biyoloji tabanlı tıp",
   konular:[
    {id:"ft_gut_aks",baslik:"Bağırsak-Beyin Ekseni",ozet:"Mikrobiyom, serotonin ve ruh sağlığı bağlantısı"},
    {id:"ft_inflamasyon",baslik:"Kronik İnflamasyon",ozet:"Sessiz iltihap, nedenleri ve doğal çözümleri"},
    {id:"ft_mitokondri",baslik:"Mitokondri Optimizasyonu",ozet:"Hücresel enerji fabrikasını güçlendirme"},
    {id:"ft_hormon",baslik:"Hormon Dengesi",ozet:"Kortizol, insülin, tiroid ve cinsiyet hormonları"},
    {id:"ft_detoks",baslik:"Detoksifikasyon Yolları",ozet:"Karaciğer fazı 1-2, metilasyon ve toksin atılımı"},
    {id:"ft_besin",baslik:"Besin Eksiklikleri",ozet:"D vitamini, Magnezyum, B12, Omega-3 ve test rehberi"},
    {id:"ft_stres",baslik:"HPA Aksı ve Stres",ozet:"Sürrenal yorgunluk, kortizol ritmi ve iyileşme"},
    {id:"ft_uyku",baslik:"Uyku Biyolojisi",ozet:"Sirkadiyen ritim, melatonin ve derin uyku optimizasyonu"},
   ]
  },
  {id:"beslenme",label:"Beslenme Bilimi",emoji:"🥗",renk:"#4CAF7A",aciklama:"Kanıta dayalı beslenme bilimi ve metabolik sağlık",
   konular:[
    {id:"beslenme_makro",baslik:"Makro Besin Dengesi",ozet:"Karbonhidrat, protein, yağ oranları ve kişisel ihtiyaç"},
    {id:"beslenme_mikro",baslik:"Mikro Besinler",ozet:"Vitamin ve minerallerin kaynak ve işlevleri"},
    {id:"beslenme_anti",baslik:"Anti-inflamatuar Beslenme",ozet:"Omega-3, polifenoller ve renkli gıdalar"},
    {id:"beslenme_insulin",baslik:"İnsülin Direnci",ozet:"Gliksemik yük, insülin duyarlılığı ve diyet stratejisi"},
    {id:"beslenme_ketojenik",baslik:"Ketojenik Beslenme",ozet:"Keto bilimi, faydaları, riskleri ve uygulama"},
    {id:"beslenme_aralıklı",baslik:"Aralıklı Oruç Bilimi",ozet:"16:8, 5:2 ve OMAD - metabolik etkileri"},
    {id:"beslenme_gut",baslik:"Bağırsak Sağlığı Diyeti",ozet:"Prebiyotik, probiyotik ve fermente gıdalar"},
    {id:"beslenme_yas",baslik:"Yaşa Göre Beslenme",ozet:"Çocuk, yetişkin, hamile ve yaşlı beslenme farklılıkları"},
   ]
  },
  {id:"bitkisel",label:"Bitkisel Şifa",emoji:"🌿",renk:"#2DD4BF",aciklama:"Fitoterapinin gücü - doğanın eczanesi",
   konular:[
    {id:"bitki_adaptogen",baslik:"Adaptogenler",ozet:"Ashwagandha, Rhodiola, Ginseng - stres uyum bitkileri"},
    {id:"bitki_sindirim",baslik:"Sindirim Bitkileri",ozet:"Zencefil, nane, rezene, kimyon ve bağırsak şifası"},
    {id:"bitki_uyku",baslik:"Uyku ve Relaksasyon Bitkileri",ozet:"Melisa, papatya, lavanta, valeryan"},
    {id:"bitki_bagisiklik",baslik:"Bağışıklık Güçlendirici Bitkiler",ozet:"Ekinezya, zerdecal, kara mürver, morinda"},
    {id:"bitki_kadin",baslik:"Kadın Sağlığı Bitkileri",ozet:"Kediotu, çuha çiçeği, ibe otu hormonal denge"},
    {id:"bitki_detoks",baslik:"Detoks Bitkileri",ozet:"Deve dikeni, karahindiba, ısırgan otu ve karaciğer şifası"},
    {id:"bitki_cay",baslik:"Şifalı Çay Formülleri",ozet:"Sabah, akşam, detoks ve bağışıklık çay blendleri"},
    {id:"bitki_baharat",baslik:"Şifalı Baharatlar",ozet:"Zerdecal, karanfil, tarçın, kişniş - mutfak eczanesi"},
   ]
  },
];

function AkademiTab(){
  var [secilenOkul,setSecilenOkul]=useState(null);
  var [secilenKonu,setSecilenKonu]=useState(null);
  var [icerik,setIcerik]=useState("");
  var [loading,setLoading]=useState(false);
  var [aramaMetni,setAramaMetni]=useState("");
  var [favKonular,setFavKonular]=useState(function(){try{return JSON.parse(localStorage.getItem("akademi_fav")||"[]");}catch(e){return [];}});

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
      var sys="Sen "+okul.label+" alanında dünyaca ünlü bir akademisyen ve hekimsin. Türkçe yaz.";
      var accumulated="";
      await callAIStream(sys,
        "Şu konu hakkında kapsamlı, kolay anlaşılır ama derinlikli Türkçe makale yaz:\n\nKonu: "+konu.baslik+"\nÖzet: "+konu.ozet+"\n\nYapı: Giriş → Tarihsel Arka Plan → Bilimsel Temeller → Pratik Uygulama → Sonuç\nUzunluk: 600-900 kelime. Somut örnekler ve pratik tavsiyeler ekle.",
        function(chunk){accumulated+=chunk;setIcerik(accumulated);},
        1800
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
      <button onClick={function(){setSecilenKonu(null);setIcerik("");}} style={{background:"transparent",border:"none",color:C.muted,fontSize:12,cursor:"pointer",padding:"4px 0",marginBottom:8}}>← {secilenOkul.emoji} {secilenOkul.label}</button>
      <div style={{padding:"14px 16px",background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"var(--text)",fontFamily:"'Playfair Display',serif",marginBottom:4}}>{secilenKonu.baslik}</div>
            <div style={{fontSize:11,color:C.muted}}>{secilenKonu.ozet}</div>
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
      {icerik&&<div style={{padding:"16px",background:"var(--card)",borderRadius:14,border:"1px solid var(--border)",marginBottom:16}}>
        <div style={{fontSize:13,color:"var(--text)",lineHeight:1.9,whiteSpace:"pre-wrap"}}>{icerik}{loading&&<span style={{display:"inline-block",width:8,height:16,background:secilenOkul.renk,marginLeft:2,animation:"blink 1s infinite",verticalAlign:"middle"}}/>}</div>
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

  return <div style={{paddingBottom:68}}>
    <TabHeader sub="Sağlık Akademisi" title="Bilgi Merkezi" isDark={true}/>
    <div style={{padding:"0 16px"}}>
      {/* Arama */}
      <div style={{position:"relative",marginBottom:14}}>
        <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,color:C.muted}}>🔍</span>
        <input value={aramaMetni} onChange={function(e){setAramaMetni(e.target.value);}} placeholder="Konu ara… (bal, dosha, omega-3…)" style={{width:"100%",padding:"10px 12px 10px 36px",borderRadius:11,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:13,boxSizing:"border-box",outline:"none"}}/>
      </div>

      {/* Arama sonuçları */}
      {aramaMetni.length>1&&<div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700}}>{aramaSonuclari.length} Sonuç</div>
        {aramaSonuclari.length===0?<div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:12}}>Sonuç bulunamadı</div>:
        aramaSonuclari.map(function(sr,i){return <div key={i} onClick={function(){konuYukle(sr.okul,sr.konu);}} style={{padding:"11px 13px",background:"var(--card)",borderRadius:11,border:"1px solid var(--border)",marginBottom:7,cursor:"pointer"}}>
          <div style={{fontSize:10,color:sr.okul.renk,marginBottom:3,fontWeight:600}}>{sr.okul.emoji} {sr.okul.label}</div>
          <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2}}>{sr.konu.baslik}</div>
          <div style={{fontSize:11,color:C.muted}}>{sr.konu.ozet}</div>
        </div>;})
        }
      </div>}

      {/* Favoriler */}
      {aramaMetni.length<=1&&favKonular.length>0&&<div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:C.gold,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.15em",fontWeight:700}}>❤️ Favorilerim</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {AKADEMI_OKULLAR.flatMap(function(o){return o.konular.map(function(k){return {okul:o,konu:k};});})
           .filter(function(sr){return favKonular.includes(sr.konu.id);})
           .map(function(sr,i){return <div key={i} onClick={function(){konuYukle(sr.okul,sr.konu);}} style={{padding:"7px 12px",borderRadius:50,background:"rgba(212,168,67,0.08)",border:"1px solid rgba(212,168,67,0.2)",color:C.gold,fontSize:11,cursor:"pointer"}}>{sr.konu.baslik}</div>;})
          }
        </div>
      </div>}

      {/* Okul kartları */}
      {aramaMetni.length<=1&&AKADEMI_OKULLAR.map(function(okul,oi){
        return <div key={oi} style={{marginBottom:16}}>
          <div style={{padding:"14px 16px",background:"linear-gradient(135deg,"+okul.renk+"12,var(--card))",borderRadius:14,border:"1px solid var(--border)",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <span style={{fontSize:26}}>{okul.emoji}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:okul.renk,fontFamily:"'Playfair Display',serif"}}>{okul.label}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.5}}>{okul.aciklama}</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {okul.konular.map(function(konu,ki){var isFav=favKonular.includes(konu.id);return <div key={ki} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 13px",background:"var(--card)",borderRadius:11,border:"1px solid var(--border)",cursor:"pointer"}} onClick={function(){konuYukle(okul,konu);}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2}}>{konu.baslik}</div>
                <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{konu.ozet}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={function(e){e.stopPropagation();toggleFavKonu(konu.id);}} style={{background:"transparent",border:"none",fontSize:14,cursor:"pointer",padding:2}}>{isFav?"❤️":"🤍"}</button>
                <span style={{fontSize:16,color:C.muted}}>›</span>
              </div>
            </div>;})}
          </div>
        </div>;
      })}
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
            <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"rgba(76,175,122,0.2)":isActive?"rgba(212,168,67,0.15)":"rgba(255,255,255,0.04)",border:"1.5px solid "+(isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.1)")}}>
              {isDone?<span style={{fontSize:11,color:C.green}}>✓</span>:isActive?<Spinner size={10} color={C.gold}/>:<span style={{fontSize:8,color:"rgba(255,255,255,0.25)"}}>{i+1}</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:isActive?700:isDone?500:400,color:isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.25)"}}>{a.label}</div>
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
            <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:isDone?"rgba(76,175,122,0.2)":isActive?"rgba(212,168,67,0.15)":"rgba(255,255,255,0.05)",border:"1.5px solid "+(isDone?C.green:isActive?C.gold:"rgba(255,255,255,0.1)")}}>
              {isDone?<span style={{fontSize:12,color:C.green}}>✓</span>:isActive?<Spinner size={11} color={C.gold}/>:<span style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>{i+1}</span>}
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
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App(){
  var [user,setUser]=useState(null);
  var [isGuest,setIsGuest]=useState(false);
  var [favorites,setFavorites]=useState([]);
  var [lists,setLists]=useState([]);
  var [ready,setReady]=useState(false);
  var [activeTab,setActiveTab]=useState("menu");
  var [isDark,setIsDark]=useState(true);
  var [showSettings,setShowSettings]=useState(false);
  var [apiKeyInput,setApiKeyInput]=useState(typeof localStorage!=="undefined"?localStorage.getItem("anthropic_api_key")||"":"");

  useEffect(function(){
    var s=sessionStorage.getItem("chef_u");
    var g=sessionStorage.getItem("chef_guest");
    var th=sessionStorage.getItem("chef_theme");
    if (th==="light") setIsDark(false);
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
  function toggleTheme(){var nd=!isDark;setIsDark(nd);sessionStorage.setItem("chef_theme",nd?"dark":"light");}
  async function toggleFav(dish){
    if (isGuest){alert("Favori için hesap açın.");return;}
    var isFav=favorites.some(function(f){return f.isim===dish.isim;});
    var u=isFav?favorites.filter(function(f){return f.isim!==dish.isim;}):favorites.concat([Object.assign({savedAt:new Date().toISOString()},dish)]);
    setFavorites(u);await stSet("fav:"+user,u);
  }
  async function addToList(lid,dish){
    var u=lists.map(function(l){if(l.id!==lid) return l;return Object.assign({},l,{dishes:l.dishes.concat([Object.assign({addedAt:new Date().toISOString()},dish)])});});
    setLists(u);await stSet("lst:"+user,u);
  }

  if (!ready) return <div style={{minHeight:"100vh",background:"#0A0A0A",display:"flex",alignItems:"center",justifyContent:"center"}}><style>{makeCSS(true)}</style><Spinner size={28}/></div>;
  if (!user) return <div style={{minHeight:"100vh",background:"var(--bg)"}}><style>{makeCSS(isDark)}</style><Auth onLogin={function(u,g){if(g) loginGuest();else doLogin(u);}}/></div>;

  function saveApiKey(){ if(typeof localStorage!=="undefined"){ localStorage.setItem("anthropic_api_key",apiKeyInput.trim()); } setShowSettings(false); }
  var hasApiKey=!!getApiKey();

  return <div style={{minHeight:"100vh",background:"var(--bg)",color:C.cream}}>
    <style>{makeCSS(isDark)}</style>
    <ThemeToggle isDark={isDark} onToggle={toggleTheme} hasUser={true}/>
    <div style={{position:"fixed",top:10,right:10,zIndex:600,display:"flex",gap:4,alignItems:"center"}}>
      <button onClick={function(){setApiKeyInput(typeof localStorage!=="undefined"?localStorage.getItem("anthropic_api_key")||"":"");setShowSettings(true);}} title="Ayarlar" style={{padding:"4px 8px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:14,color:C.muted}}>⚙️</button>
      <div style={{padding:"4px 9px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:11,color:C.muted}}>{isGuest?"👤":user}</div>
      <button onClick={logout} style={{padding:"4px 8px",borderRadius:50,background:"var(--card)",border:"1px solid var(--border)",fontSize:11,color:C.muted}}>✕</button>
    </div>
    {showSettings&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:700,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={function(e){if(e.target===e.currentTarget)setShowSettings(false);}}>
      <div className="up" style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:22,maxWidth:400,width:"100%"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{fontSize:16,fontWeight:700,color:C.cream,marginBottom:8}}>⚙️ Ayarlar</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Anthropic API anahtarı (Menü/Şef/Kür AI özellikleri için)</div>
        <input type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={function(e){setApiKeyInput(e.target.value);}} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid var(--border)",background:"var(--card2)",color:C.cream,fontSize:13,marginBottom:12}}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={function(){setShowSettings(false);}} style={{padding:"8px 14px",borderRadius:9,border:"1px solid var(--border)",background:"var(--card2)",color:C.muted,fontSize:12}}>İptal</button>
          <button onClick={saveApiKey} style={{padding:"8px 14px",borderRadius:9,border:"1.5px solid "+C.gold,background:"linear-gradient(135deg,rgba(212,168,67,0.2),rgba(212,168,67,0.06))",color:C.goldL,fontSize:12,fontWeight:600}}>Kaydet</button>
        </div>
        {hasApiKey?<div style={{marginTop:10,fontSize:11,color:C.green}}>✓ API anahtarı ayarlı</div>:<div style={{marginTop:10,fontSize:11,color:C.muted}}>Anahtar yoksa AI özellikleri çalışmaz</div>}
      </div>
    </div>}
    <div style={{paddingBottom:68}}>
      {activeTab==="menu"&&<MenuTab favorites={favorites} lists={lists} onToggleFav={toggleFav} onAddToList={addToList} isGuest={isGuest} user={user}/>}
      {activeTab==="puf"&&<PufTab/>}
      {activeTab==="rehber"&&<RehberTab/>}
      {activeTab==="saglik"&&<SaglikTab/>}
      {activeTab==="smoothie"&&<SmoothieTab/>}
      {activeTab==="foto"&&<FotoTab/>}
      {activeTab==="kur"&&<KurTab/>}
      {activeTab==="kan"&&<KanTab/>}
      {activeTab==="vucut"&&<VucutHaritasiTab/>}
      {activeTab==="oruc"&&<OrucTab/>}
      {activeTab==="nefes"&&<NefesTab/>}
      {activeTab==="takip"&&<TakipTab/>}
      {activeTab==="akademi"&&<AkademiTab/>}
      {activeTab==="favoriler"&&<FavorilerTab favorites={favorites} lists={lists} onToggleFav={toggleFav}/>}
      {activeTab==="chat"&&<ChatTab/>}
    </div>
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:isDark?"rgba(10,10,10,0.97)":"rgba(245,239,224,0.97)",backdropFilter:"blur(10px)",borderTop:"1px solid var(--border)",display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",zIndex:500,padding:"4px 0 6px"}}>
      {BOTTOM_TABS.map(function(t){var ac=activeTab===t.id;return <button key={t.id} onClick={function(){setActiveTab(t.id);}} style={{flex:"0 0 auto",minWidth:54,display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"3px 1px",background:"transparent",border:"none",color:ac?C.goldL:C.muted}}>
        <span style={{fontSize:ac?19:15,transition:"font-size 0.15s"}}>{t.icon}</span>
        <span style={{fontSize:7,fontWeight:ac?700:400}}>{t.label}</span>
        <span style={{width:12,height:2,borderRadius:2,background:ac?C.gold:"transparent",marginTop:1}}/>
      </button>;})}
    </div>
  </div>;
}
