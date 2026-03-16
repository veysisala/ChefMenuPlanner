import { useState, useEffect, useRef } from "react";
import { C } from "../constants.js";
import {
  getMyProfile,
  upsertProfile,
  getPortfolio,
  addPortfolioItem,
  deletePortfolioItem,
  getReviews,
  getFollowers,
  getFollowing,
  getConnections,
  uploadAvatar,
  uploadPortfolioMedia,
} from "./lib/networkDB.js";
import {
  CHEF_TITLES,
  CUISINE_SPECS,
  CHEF_SKILLS,
  AVAILABILITY_TYPES,
  CHEF_BADGES,
  COUNTRIES,
  PROFILE_MODES,
} from "./lib/networkConstants.js";
import {
  SH,
  Avatar,
  BadgeList,
  Stars,
  ChipSelect,
  Field,
  Btn,
  Spinner,
  Empty,
  SubTabs,
  Card,
  Modal,
  timeAgo,
} from "./components/SharedUI.jsx";

// ══════════════════════════════════════════════════════════════
// Helper: portfolio type labels and emojis
// ══════════════════════════════════════════════════════════════
var PORTFOLIO_TYPES = [
  { id: "photo", label: "Fotoğraf", emoji: "📸" },
  { id: "video", label: "Video", emoji: "🎬" },
  { id: "menu", label: "Menü", emoji: "📋" },
  { id: "event", label: "Etkinlik", emoji: "🎉" },
];

// Empty form templates
function emptyEducation() { return { school: "", year: "", degree: "" }; }
function emptyCert() { return { name: "", issuer: "", year: "" }; }
function emptyWork() { return { place: "", role: "", city: "", country: "", start: "", end: "" }; }
function emptyDish() { return { name: "", description: "" }; }
function emptyPortfolioForm() { return { type: "photo", title: "", description: "", file: null }; }

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChefProfileTab(props) {
  var userId = props.user && props.user.id ? props.user.id : props.user;

  // ── State ──
  var stMode = useState(PROFILE_MODES[0].id);
  var mode = stMode[0];
  var setMode = stMode[1];

  var stProfile = useState(null);
  var profile = stProfile[0];
  var setProfile = stProfile[1];

  var stLoading = useState(true);
  var loading = stLoading[0];
  var setLoading = stLoading[1];

  var stSaving = useState(false);
  var saving = stSaving[0];
  var setSaving = stSaving[1];

  var stMsg = useState("");
  var msg = stMsg[0];
  var setMsg = stMsg[1];

  // Form fields
  var stName = useState("");
  var displayName = stName[0];
  var setDisplayName = stName[1];

  var stAvatarUrl = useState("");
  var avatarUrl = stAvatarUrl[0];
  var setAvatarUrl = stAvatarUrl[1];

  var stCity = useState("");
  var city = stCity[0];
  var setCity = stCity[1];

  var stCountry = useState("");
  var country = stCountry[0];
  var setCountry = stCountry[1];

  var stBio = useState("");
  var bio = stBio[0];
  var setBio = stBio[1];

  var stTitle = useState("");
  var title = stTitle[0];
  var setTitle = stTitle[1];

  var stCuisines = useState([]);
  var cuisines = stCuisines[0];
  var setCuisines = stCuisines[1];

  var stSkills = useState([]);
  var skills = stSkills[0];
  var setSkills = stSkills[1];

  var stExpYears = useState(0);
  var expYears = stExpYears[0];
  var setExpYears = stExpYears[1];

  var stAvail = useState("none");
  var avail = stAvail[0];
  var setAvail = stAvail[1];

  var stEdu = useState([]);
  var education = stEdu[0];
  var setEducation = stEdu[1];

  var stCerts = useState([]);
  var certs = stCerts[0];
  var setCerts = stCerts[1];

  var stWork = useState([]);
  var workHistory = stWork[0];
  var setWorkHistory = stWork[1];

  var stDishes = useState([]);
  var signatureDishes = stDishes[0];
  var setSignatureDishes = stDishes[1];

  var stAvatarUploading = useState(false);
  var avatarUploading = stAvatarUploading[0];
  var setAvatarUploading = stAvatarUploading[1];

  // Portfolio state
  var stPortfolio = useState([]);
  var portfolio = stPortfolio[0];
  var setPortfolio = stPortfolio[1];

  var stPortLoading = useState(false);
  var portLoading = stPortLoading[0];
  var setPortLoading = stPortLoading[1];

  var stPortFilter = useState("all");
  var portFilter = stPortFilter[0];
  var setPortFilter = stPortFilter[1];

  var stPortModal = useState(false);
  var portModalOpen = stPortModal[0];
  var setPortModalOpen = stPortModal[1];

  var stPortForm = useState(emptyPortfolioForm());
  var portForm = stPortForm[0];
  var setPortForm = stPortForm[1];

  var stPortSaving = useState(false);
  var portSaving = stPortSaving[0];
  var setPortSaving = stPortSaving[1];

  var stPortDetail = useState(null);
  var portDetail = stPortDetail[0];
  var setPortDetail = stPortDetail[1];

  // Reviews state
  var stReviews = useState([]);
  var reviews = stReviews[0];
  var setReviews = stReviews[1];

  var stRevLoading = useState(false);
  var revLoading = stRevLoading[0];
  var setRevLoading = stRevLoading[1];

  // Connections state
  var stFollowers = useState([]);
  var followers = stFollowers[0];
  var setFollowers = stFollowers[1];

  var stFollowing = useState([]);
  var following = stFollowing[0];
  var setFollowing = stFollowing[1];

  var stConns = useState([]);
  var connections = stConns[0];
  var setConnections = stConns[1];

  var stConnLoading = useState(false);
  var connLoading = stConnLoading[0];
  var setConnLoading = stConnLoading[1];

  var stConnTab = useState("followers");
  var connTab = stConnTab[0];
  var setConnTab = stConnTab[1];

  var avatarRef = useRef(null);
  var portFileRef = useRef(null);

  // ══════════════════════════════════════════════════════════
  // Load profile on mount
  // ══════════════════════════════════════════════════════════
  useEffect(function () {
    if (!userId || userId === "misafir") {
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyProfile(userId).then(function (res) {
      if (res.data) {
        setProfile(res.data);
        populateForm(res.data);
      }
      setLoading(false);
    }).catch(function () {
      setLoading(false);
    });
  }, [userId]);

  // Load sub-mode data when switching
  useEffect(function () {
    if (!profile || !profile.id) return;
    if (mode === "portfolio") loadPortfolio();
    if (mode === "reviews") loadReviews();
    if (mode === "connections") loadConnections();
  }, [mode, profile && profile.id]);

  // ══════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════
  function populateForm(p) {
    setDisplayName(p.display_name || "");
    setAvatarUrl(p.avatar_url || "");
    setCity(p.city || "");
    setCountry(p.country || "");
    setBio(p.bio || "");
    setTitle(p.title || "");
    setCuisines(p.cuisine_specializations || []);
    setSkills(p.skills || []);
    setExpYears(p.experience_years || 0);
    setAvail(p.availability || "none");
    setEducation(p.education || []);
    setCerts(p.certifications || []);
    setWorkHistory(p.work_history || []);
    setSignatureDishes(p.signature_dishes || []);
  }

  function flashMsg(text) {
    setMsg(text);
    setTimeout(function () { setMsg(""); }, 3000);
  }

  // ══════════════════════════════════════════════════════════
  // Avatar upload
  // ══════════════════════════════════════════════════════════
  function handleAvatarUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    uploadAvatar(userId, file).then(function (res) {
      setAvatarUploading(false);
      if (res.data) {
        setAvatarUrl(res.data);
        flashMsg("Avatar yuklendi!");
      } else {
        flashMsg("Avatar yuklenemedi: " + (res.error || ""));
      }
    }).catch(function () {
      setAvatarUploading(false);
      flashMsg("Avatar yuklenemedi");
    });
  }

  // ══════════════════════════════════════════════════════════
  // Save profile
  // ══════════════════════════════════════════════════════════
  function handleSave() {
    if (!displayName.trim()) {
      flashMsg("Gorunen ad zorunlu!");
      return;
    }
    setSaving(true);
    var fields = {
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
      city: city.trim(),
      country: country,
      bio: bio.trim(),
      title: title,
      cuisine_specializations: cuisines,
      skills: skills,
      experience_years: parseInt(expYears) || 0,
      availability: avail,
      education: education.filter(function (e) { return e.school; }),
      certifications: certs.filter(function (c) { return c.name; }),
      work_history: workHistory.filter(function (w) { return w.place; }),
      signature_dishes: signatureDishes.filter(function (d) { return d.name; }),
    };
    upsertProfile(userId, fields).then(function (res) {
      setSaving(false);
      if (res.data) {
        setProfile(res.data);
        flashMsg("Profil kaydedildi!");
      } else {
        flashMsg("Hata: " + (res.error || "Kaydedilemedi"));
      }
    }).catch(function () {
      setSaving(false);
      flashMsg("Kaydetme hatasi");
    });
  }

  // ══════════════════════════════════════════════════════════
  // Share profile
  // ══════════════════════════════════════════════════════════
  function handleShare() {
    var url = window.location.origin + "?chef=" + (profile && profile.id ? profile.id : userId);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        flashMsg("Profil linki kopyalandi!");
      });
    } else {
      flashMsg(url);
    }
  }

  // ══════════════════════════════════════════════════════════
  // Portfolio CRUD
  // ══════════════════════════════════════════════════════════
  function loadPortfolio() {
    if (!profile || !profile.id) return;
    setPortLoading(true);
    getPortfolio(profile.id).then(function (res) {
      setPortfolio(res.data || []);
      setPortLoading(false);
    }).catch(function () { setPortLoading(false); });
  }

  function handleAddPortfolio() {
    if (!portForm.title.trim()) {
      flashMsg("Baslik zorunlu!");
      return;
    }
    setPortSaving(true);
    var finish = function (mediaUrl) {
      var item = {
        type: portForm.type,
        title: portForm.title.trim(),
        description: portForm.description.trim(),
        media_url: mediaUrl || "",
      };
      addPortfolioItem(profile.id, item).then(function (res) {
        setPortSaving(false);
        if (res.data) {
          setPortfolio([res.data].concat(portfolio));
          setPortModalOpen(false);
          setPortForm(emptyPortfolioForm());
          flashMsg("Portfolyo oğesi eklendi!");
        } else {
          flashMsg("Eklenemedi: " + (res.error || ""));
        }
      }).catch(function () { setPortSaving(false); });
    };

    if (portForm.file) {
      uploadPortfolioMedia(profile.id, portForm.file).then(function (res) {
        finish(res.data || "");
      }).catch(function () { finish(""); });
    } else {
      finish("");
    }
  }

  function handleDeletePortfolio(itemId) {
    if (!confirm("Bu oğeyi silmek istediğinize emin misiniz?")) return;
    deletePortfolioItem(itemId).then(function (res) {
      if (res.error) {
        flashMsg("Silinemedi");
        return;
      }
      setPortfolio(portfolio.filter(function (p) { return p.id !== itemId; }));
      flashMsg("Silindi");
      if (portDetail && portDetail.id === itemId) setPortDetail(null);
    });
  }

  // ══════════════════════════════════════════════════════════
  // Reviews load
  // ══════════════════════════════════════════════════════════
  function loadReviews() {
    if (!profile || !profile.id) return;
    setRevLoading(true);
    getReviews(profile.id).then(function (res) {
      setReviews(res.data || []);
      setRevLoading(false);
    }).catch(function () { setRevLoading(false); });
  }

  // ══════════════════════════════════════════════════════════
  // Connections load
  // ══════════════════════════════════════════════════════════
  function loadConnections() {
    if (!profile || !profile.id) return;
    setConnLoading(true);
    Promise.all([
      getFollowers(profile.id),
      getFollowing(profile.id),
      getConnections(profile.id),
    ]).then(function (results) {
      setFollowers(results[0].data || []);
      setFollowing(results[1].data || []);
      setConnections(results[2].data || []);
      setConnLoading(false);
    }).catch(function () { setConnLoading(false); });
  }

  // ══════════════════════════════════════════════════════════
  // Array field helpers (education, certs, work, dishes)
  // ══════════════════════════════════════════════════════════
  function updateArrayItem(arr, setArr, idx, key, val) {
    var next = arr.map(function (item, i) {
      if (i !== idx) return item;
      var copy = Object.assign({}, item);
      copy[key] = val;
      return copy;
    });
    setArr(next);
  }

  function removeArrayItem(arr, setArr, idx) {
    setArr(arr.filter(function (_, i) { return i !== idx; }));
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: Guest state
  // ══════════════════════════════════════════════════════════
  if (!userId || userId === "misafir") {
    return Empty({
      emoji: "🔒",
      title: "Giris Yapiniz",
      desc: "Profil sayfasini goruntulemek icin giris yapmaniz gerekiyor.",
    });
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: Loading
  // ══════════════════════════════════════════════════════════
  if (loading) {
    return <div style={{ textAlign: "center", padding: 60 }}>
      <Spinner size={28} />
      <div style={{ marginTop: 10, color: C.muted, fontSize: 13 }}>Profil yukleniyor...</div>
    </div>;
  }

  // ══════════════════════════════════════════════════════════
  // RENDER: Sub-tabs
  // ══════════════════════════════════════════════════════════
  return <div style={{ paddingBottom: 20 }}>
    {/* Message toast */}
    {msg && <div style={{
      position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
      padding: "10px 22px", borderRadius: 10,
      background: C.gold, color: "#000", fontSize: 13, fontWeight: 700,
      zIndex: 800, boxShadow: "0 4px 16px rgba(0,0,0,0.25)"
    }}>{msg}</div>}

    <SubTabs tabs={PROFILE_MODES} active={mode} onChange={setMode} />

    {mode === "info" && renderInfo()}
    {mode === "portfolio" && renderPortfolio()}
    {mode === "reviews" && renderReviews()}
    {mode === "connections" && renderConnections()}
  </div>;

  // ══════════════════════════════════════════════════════════════
  // RENDER: INFO
  // ══════════════════════════════════════════════════════════════
  function renderInfo() {
    var isNew = !profile;
    return <div>
      <SH emoji="📋" label={isNew ? "Profil Olustur" : "Profil Bilgileri"} />

      {/* Profile header card (if existing) */}
      {profile && <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar url={profile.avatar_url} name={profile.display_name} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{profile.display_name}</span>
              {profile.is_verified && <span title="Dogrulanmis" style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 50,
                background: C.blue + "20", color: C.blue, fontWeight: 600
              }}>Dogrulanmis</span>}
            </div>
            {profile.title && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {(function () {
                var t = CHEF_TITLES.find(function (x) { return x.id === profile.title; });
                return t ? t.emoji + " " + t.label : profile.title;
              })()}
            </div>}
            {(profile.city || profile.country) && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {"📍 " + [profile.city, profile.country].filter(Boolean).join(", ")}
            </div>}
            {/* Rating */}
            {profile.rating_count > 0 && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Stars value={Math.round(profile.rating_avg || 0)} size={14} />
              <span style={{ fontSize: 12, color: C.muted }}>
                {(profile.rating_avg || 0).toFixed(1)} ({profile.rating_count} degerlendirme)
              </span>
            </div>}
          </div>
        </div>
        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && <div style={{ marginTop: 10 }}>
          <BadgeList badges={profile.badges} />
        </div>}
        {/* Share button */}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <Btn small onClick={handleShare} variant="outline">Profil Paylas</Btn>
        </div>
      </Card>}

      {/* ── Form fields ── */}
      <Card>
        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 600, color: C.gold }}>
          {isNew ? "Yeni Profil Olusturun" : "Bilgileri Duzenle"}
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative" }}>
            <Avatar url={avatarUrl} name={displayName || "?"} size={60} />
            {avatarUploading && <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)", display: "flex",
              alignItems: "center", justifyContent: "center"
            }}><Spinner size={18} color="#fff" /></div>}
          </div>
          <div>
            <Btn small onClick={function () { avatarRef.current && avatarRef.current.click(); }}>
              Avatar Yukle
            </Btn>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={handleAvatarUpload} />
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>JPG, PNG (maks. 2MB)</div>
          </div>
        </div>

        <Field label="Gorunen Ad" value={displayName} onChange={setDisplayName} placeholder="Ad Soyad" />
        <Field label="Biyografi" value={bio} onChange={setBio} multiline placeholder="Kendinizi tanıtın..." rows={4} />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <Field label="Sehir" value={city} onChange={setCity} placeholder="Istanbul" />
          </div>
          <div style={{ flex: 1, marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ulke</label>
            <select value={country} onChange={function (e) { setCountry(e.target.value); }}
              style={{
                width: "100%", padding: "10px 13px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text)", fontSize: 13
              }}>
              <option value="">Seciniz</option>
              {COUNTRIES.map(function (c) {
                return <option key={c} value={c}>{c}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Unvan</label>
          <ChipSelect options={CHEF_TITLES} selected={title} multi={false} onChange={setTitle} />
        </div>

        {/* Cuisine Specializations */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Mutfak Uzmanliklari</label>
          <ChipSelect options={CUISINE_SPECS} selected={cuisines} multi onChange={setCuisines} />
        </div>

        {/* Skills */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Yetenekler</label>
          <ChipSelect options={CHEF_SKILLS} selected={skills} multi onChange={setSkills} />
        </div>

        {/* Experience years */}
        <Field label="Deneyim (Yil)" value={expYears} onChange={function (v) {
          var n = parseInt(v) || 0;
          if (n < 0) n = 0;
          if (n > 50) n = 50;
          setExpYears(n);
        }} type="number" placeholder="0" />

        {/* Availability */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Musaitlik Durumu</label>
          <ChipSelect options={AVAILABILITY_TYPES} selected={avail} multi={false} onChange={setAvail} />
        </div>
      </Card>

      {/* ── Education ── */}
      <Card style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SH emoji="🎓" label="Egitim" />
          <Btn small onClick={function () { setEducation(education.concat([emptyEducation()])); }}>+ Ekle</Btn>
        </div>
        {education.map(function (edu, idx) {
          return <div key={idx} style={{
            padding: 10, border: "1px solid var(--border)", borderRadius: 10,
            marginBottom: 8, background: "var(--card2)"
          }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 2 }}>
                <Field label="Okul" value={edu.school} mb={4} onChange={function (v) { updateArrayItem(education, setEducation, idx, "school", v); }} placeholder="Okul adi" />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Yil" value={edu.year} mb={4} onChange={function (v) { updateArrayItem(education, setEducation, idx, "year", v); }} placeholder="2020" />
              </div>
            </div>
            <Field label="Derece/Bolum" value={edu.degree} mb={0} onChange={function (v) { updateArrayItem(education, setEducation, idx, "degree", v); }} placeholder="Gastronomi" />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Btn small variant="danger" onClick={function () { removeArrayItem(education, setEducation, idx); }}>Sil</Btn>
            </div>
          </div>;
        })}
        {education.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Henuz egitim bilgisi eklenmemis.</div>}
      </Card>

      {/* ── Certifications ── */}
      <Card style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SH emoji="📜" label="Sertifikalar" />
          <Btn small onClick={function () { setCerts(certs.concat([emptyCert()])); }}>+ Ekle</Btn>
        </div>
        {certs.map(function (cert, idx) {
          return <div key={idx} style={{
            padding: 10, border: "1px solid var(--border)", borderRadius: 10,
            marginBottom: 8, background: "var(--card2)"
          }}>
            <Field label="Sertifika Adi" value={cert.name} mb={4} onChange={function (v) { updateArrayItem(certs, setCerts, idx, "name", v); }} placeholder="HACCP" />
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 2 }}>
                <Field label="Veren Kurum" value={cert.issuer} mb={0} onChange={function (v) { updateArrayItem(certs, setCerts, idx, "issuer", v); }} placeholder="Kurum adi" />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Yil" value={cert.year} mb={0} onChange={function (v) { updateArrayItem(certs, setCerts, idx, "year", v); }} placeholder="2023" />
              </div>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Btn small variant="danger" onClick={function () { removeArrayItem(certs, setCerts, idx); }}>Sil</Btn>
            </div>
          </div>;
        })}
        {certs.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Henuz sertifika eklenmemis.</div>}
      </Card>

      {/* ── Work History ── */}
      <Card style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SH emoji="💼" label="Is Gecmisi" />
          <Btn small onClick={function () { setWorkHistory(workHistory.concat([emptyWork()])); }}>+ Ekle</Btn>
        </div>
        {workHistory.map(function (w, idx) {
          return <div key={idx} style={{
            padding: 10, border: "1px solid var(--border)", borderRadius: 10,
            marginBottom: 8, background: "var(--card2)"
          }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <Field label="Is Yeri" value={w.place} mb={4} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "place", v); }} placeholder="Restoran adi" />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Pozisyon" value={w.role} mb={4} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "role", v); }} placeholder="Sous Chef" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <Field label="Sehir" value={w.city} mb={4} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "city", v); }} placeholder="Istanbul" />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Ulke" value={w.country} mb={4} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "country", v); }} placeholder="Turkiye" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Field label="Baslangic" value={w.start} mb={0} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "start", v); }} placeholder="2018" />
              </div>
              <div style={{ flex: 1 }}>
                <Field label="Bitis" value={w.end} mb={0} onChange={function (v) { updateArrayItem(workHistory, setWorkHistory, idx, "end", v); }} placeholder="2022 veya Devam" />
              </div>
            </div>
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Btn small variant="danger" onClick={function () { removeArrayItem(workHistory, setWorkHistory, idx); }}>Sil</Btn>
            </div>
          </div>;
        })}
        {workHistory.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Henuz is gecmisi eklenmemis.</div>}
      </Card>

      {/* ── Signature Dishes ── */}
      <Card style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <SH emoji="🍽️" label="Imza Yemekler" />
          <Btn small onClick={function () { setSignatureDishes(signatureDishes.concat([emptyDish()])); }}>+ Ekle</Btn>
        </div>
        {signatureDishes.map(function (d, idx) {
          return <div key={idx} style={{
            padding: 10, border: "1px solid var(--border)", borderRadius: 10,
            marginBottom: 8, background: "var(--card2)"
          }}>
            <Field label="Yemek Adi" value={d.name} mb={4} onChange={function (v) { updateArrayItem(signatureDishes, setSignatureDishes, idx, "name", v); }} placeholder="Kuzu Tandir" />
            <Field label="Aciklama" value={d.description} mb={0} onChange={function (v) { updateArrayItem(signatureDishes, setSignatureDishes, idx, "description", v); }} multiline placeholder="Kisa tanitim..." rows={2} />
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <Btn small variant="danger" onClick={function () { removeArrayItem(signatureDishes, setSignatureDishes, idx); }}>Sil</Btn>
            </div>
          </div>;
        })}
        {signatureDishes.length === 0 && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 10 }}>Henuz imza yemek eklenmemis.</div>}
      </Card>

      {/* ── Save ── */}
      <div style={{ marginTop: 14 }}>
        <Btn full onClick={handleSave} loading={saving} disabled={saving}>
          {isNew ? "Profil Olustur" : "Degisiklikleri Kaydet"}
        </Btn>
      </div>
    </div>;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: PORTFOLIO
  // ══════════════════════════════════════════════════════════════
  function renderPortfolio() {
    if (!profile) {
      return <Empty emoji="📋" title="Once profil olusturun" desc="Portfolyo eklemek icin profilinizi tamamlayin." />;
    }

    var filtered = portFilter === "all"
      ? portfolio
      : portfolio.filter(function (p) { return p.type === portFilter; });

    return <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <SH emoji="🎨" label="Portfolyo" count={portfolio.length} />
        <Btn small onClick={function () { setPortModalOpen(true); }}>+ Yeni Ekle</Btn>
      </div>

      {/* Type filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={function () { setPortFilter("all"); }} style={{
          padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: portFilter === "all" ? 700 : 400,
          border: "1px solid " + (portFilter === "all" ? C.gold : "var(--border)"),
          background: portFilter === "all" ? "rgba(212,168,67,0.12)" : "var(--card)",
          color: portFilter === "all" ? C.goldL : C.muted, transition: "all 0.15s"
        }}>Tumu</button>
        {PORTFOLIO_TYPES.map(function (pt) {
          var active = portFilter === pt.id;
          return <button key={pt.id} onClick={function () { setPortFilter(pt.id); }} style={{
            padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: active ? 700 : 400,
            border: "1px solid " + (active ? C.gold : "var(--border)"),
            background: active ? "rgba(212,168,67,0.12)" : "var(--card)",
            color: active ? C.goldL : C.muted, transition: "all 0.15s"
          }}>{pt.emoji} {pt.label}</button>;
        })}
      </div>

      {portLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={22} /></div>}

      {!portLoading && filtered.length === 0 && <Empty
        emoji="🎨"
        title="Portfolyo bos"
        desc="Yemek fotograflari, videolar, menuler veya etkinlikler ekleyin."
        action={<Btn small onClick={function () { setPortModalOpen(true); }}>Ilk Ogeyi Ekle</Btn>}
      />}

      {/* Portfolio grid */}
      {!portLoading && filtered.length > 0 && <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
        gap: 10
      }}>
        {filtered.map(function (item) {
          var typeObj = PORTFOLIO_TYPES.find(function (t) { return t.id === item.type; });
          return <div key={item.id} onClick={function () { setPortDetail(item); }}
            style={{
              borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)",
              background: "var(--card)", cursor: "pointer", transition: "border-color 0.15s"
            }}>
            {/* Thumbnail */}
            {item.media_url
              ? <div style={{
                  width: "100%", height: 120, backgroundImage: "url(" + item.media_url + ")",
                  backgroundSize: "cover", backgroundPosition: "center",
                  position: "relative"
                }}>
                  {typeObj && <span style={{
                    position: "absolute", top: 6, left: 6, fontSize: 10, padding: "2px 8px",
                    borderRadius: 50, background: "rgba(0,0,0,0.6)", color: "#fff"
                  }}>{typeObj.emoji} {typeObj.label}</span>}
                </div>
              : <div style={{
                  width: "100%", height: 120, display: "flex", alignItems: "center",
                  justifyContent: "center", background: "var(--card2)", fontSize: 32
                }}>{typeObj ? typeObj.emoji : "📁"}</div>
            }
            {/* Title */}
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.title}
              </div>
              {item.description && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.description}
              </div>}
            </div>
          </div>;
        })}
      </div>}

      {/* ── Add portfolio modal ── */}
      <Modal open={portModalOpen} onClose={function () { setPortModalOpen(false); }} title="Portfolyo Oğesi Ekle">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tur</label>
          <ChipSelect options={PORTFOLIO_TYPES} selected={portForm.type} multi={false}
            onChange={function (v) { setPortForm(Object.assign({}, portForm, { type: v })); }} />
        </div>
        <Field label="Baslik" value={portForm.title}
          onChange={function (v) { setPortForm(Object.assign({}, portForm, { title: v })); }}
          placeholder="Yemek fotografi, menu tasarimi..." />
        <Field label="Aciklama" value={portForm.description} multiline
          onChange={function (v) { setPortForm(Object.assign({}, portForm, { description: v })); }}
          placeholder="Detayli aciklama..." rows={3} />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dosya Yukle</label>
          <input ref={portFileRef} type="file" accept="image/*,video/*"
            onChange={function (e) {
              var f = e.target.files && e.target.files[0];
              setPortForm(Object.assign({}, portForm, { file: f || null }));
            }}
            style={{ fontSize: 12, color: C.muted }} />
        </div>
        <Btn full onClick={handleAddPortfolio} loading={portSaving} disabled={portSaving}>Ekle</Btn>
      </Modal>

      {/* ── Detail modal ── */}
      <Modal open={!!portDetail} onClose={function () { setPortDetail(null); }} title={portDetail ? portDetail.title : ""} wide>
        {portDetail && <div>
          {portDetail.media_url && <div style={{ marginBottom: 14, textAlign: "center" }}>
            {portDetail.type === "video"
              ? <video src={portDetail.media_url} controls style={{ maxWidth: "100%", borderRadius: 10 }} />
              : <img src={portDetail.media_url} alt="" style={{ maxWidth: "100%", borderRadius: 10 }} />
            }
          </div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {(function () {
              var tp = PORTFOLIO_TYPES.find(function (t) { return t.id === portDetail.type; });
              return tp ? <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 50,
                background: C.gold + "18", color: C.goldL
              }}>{tp.emoji} {tp.label}</span> : null;
            })()}
            {portDetail.created_at && <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(portDetail.created_at)}</span>}
          </div>
          {portDetail.description && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 14 }}>
            {portDetail.description}
          </div>}
          <Btn small variant="danger" onClick={function () { handleDeletePortfolio(portDetail.id); }}>Oğeyi Sil</Btn>
        </div>}
      </Modal>
    </div>;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: REVIEWS
  // ══════════════════════════════════════════════════════════════
  function renderReviews() {
    if (!profile) {
      return <Empty emoji="📋" title="Once profil olusturun" desc="Degerlendirmeleri gormek icin profilinizi tamamlayin." />;
    }

    var avgRating = profile.rating_avg || 0;
    var ratingCount = profile.rating_count || 0;

    return <div>
      <SH emoji="⭐" label="Degerlendirmeler" count={ratingCount} />

      {/* Rating summary */}
      <Card style={{ marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: C.gold }}>{avgRating.toFixed(1)}</div>
        <div style={{ marginTop: 4, display: "flex", justifyContent: "center" }}>
          <Stars value={Math.round(avgRating)} size={20} />
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{ratingCount} degerlendirme</div>
      </Card>

      {revLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={22} /></div>}

      {!revLoading && reviews.length === 0 && <Empty
        emoji="⭐"
        title="Henuz degerlendirme yok"
        desc="Musterileriniz sizi degerlendirdikce burada gorunecek."
      />}

      {!revLoading && reviews.map(function (rev) {
        var reviewer = rev.reviewer || {};
        return <Card key={rev.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Avatar url={reviewer.avatar_url} name={reviewer.display_name} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{reviewer.display_name || "Anonim"}</span>
                  {reviewer.title && <span style={{ fontSize: 11, color: C.muted, marginLeft: 6 }}>
                    {(function () {
                      var t = CHEF_TITLES.find(function (x) { return x.id === reviewer.title; });
                      return t ? t.label : reviewer.title;
                    })()}
                  </span>}
                </div>
                {rev.created_at && <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(rev.created_at)}</span>}
              </div>
              <Stars value={rev.rating || 0} size={13} />
              {rev.content && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5, marginTop: 6 }}>
                {rev.content}
              </div>}
            </div>
          </div>
        </Card>;
      })}
    </div>;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: CONNECTIONS
  // ══════════════════════════════════════════════════════════════
  function renderConnections() {
    if (!profile) {
      return <Empty emoji="📋" title="Once profil olusturun" desc="Baglantilari gormek icin profilinizi tamamlayin." />;
    }

    var connTabs = [
      { id: "followers", label: "Takipciler", emoji: "👥", count: followers.length },
      { id: "following", label: "Takip Edilen", emoji: "👤", count: following.length },
      { id: "connections", label: "Baglantilar", emoji: "🤝", count: connections.length },
    ];

    return <div>
      <SH emoji="🤝" label="Baglantilar" />

      {/* Connection sub-tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {connTabs.map(function (ct) {
          var active = connTab === ct.id;
          return <button key={ct.id} onClick={function () { setConnTab(ct.id); }} style={{
            flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 12,
            fontWeight: active ? 700 : 400,
            border: "1.5px solid " + (active ? C.gold : "var(--border)"),
            background: active ? "rgba(212,168,67,0.1)" : "var(--card)",
            color: active ? C.goldL : C.muted, textAlign: "center",
            transition: "all 0.15s"
          }}>
            <div>{ct.emoji}</div>
            <div style={{ marginTop: 2 }}>{ct.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, color: active ? C.gold : "var(--text)" }}>{ct.count}</div>
          </button>;
        })}
      </div>

      {connLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={22} /></div>}

      {!connLoading && connTab === "followers" && renderPersonList(followers, "Henuz takipciniz yok")}
      {!connLoading && connTab === "following" && renderPersonList(following, "Henuz kimseyi takip etmiyorsunuz")}
      {!connLoading && connTab === "connections" && renderConnectionsList()}
    </div>;
  }

  function renderPersonList(list, emptyText) {
    if (list.length === 0) {
      return <Empty emoji="👤" title={emptyText} />;
    }
    return <div>
      {list.map(function (person) {
        if (!person) return null;
        return <Card key={person.id} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar url={person.avatar_url} name={person.display_name} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{person.display_name || "Isimsiz"}</div>
              {person.title && <div style={{ fontSize: 11, color: C.muted }}>
                {(function () {
                  var t = CHEF_TITLES.find(function (x) { return x.id === person.title; });
                  return t ? t.emoji + " " + t.label : person.title;
                })()}
              </div>}
            </div>
          </div>
        </Card>;
      })}
    </div>;
  }

  function renderConnectionsList() {
    if (connections.length === 0) {
      return <Empty emoji="🤝" title="Henuz baglantiniz yok" desc="Diger seflerle baglanti kurarak aginizi genisletin." />;
    }
    return <div>
      {connections.map(function (conn) {
        // Determine the other person in the connection
        var other = null;
        if (conn.requester && conn.requester.id === (profile && profile.id)) {
          other = conn.receiver;
        } else {
          other = conn.requester;
        }
        if (!other) return null;
        return <Card key={conn.id} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Avatar url={other.avatar_url} name={other.display_name} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{other.display_name || "Isimsiz"}</div>
              {other.title && <div style={{ fontSize: 11, color: C.muted }}>
                {(function () {
                  var t = CHEF_TITLES.find(function (x) { return x.id === other.title; });
                  return t ? t.emoji + " " + t.label : other.title;
                })()}
              </div>}
            </div>
            <span style={{
              fontSize: 10, padding: "3px 10px", borderRadius: 50,
              background: C.green + "18", color: C.green
            }}>Bagli</span>
          </div>
        </Card>;
      })}
    </div>;
  }
}
