// Chef Job Marketplace Tab
import { useState, useEffect, useRef } from "react";
import { C } from "../constants.js";
import {
  SH, Avatar, BadgeList, Stars, ChipSelect, Field, Btn, Spinner, Empty,
  SubTabs, Card, Modal, timeAgo
} from "./components/SharedUI.jsx";
import {
  getJobs, createJob, updateJob, getMyJobs, applyToJob,
  getMyApplications, getJobApplicants, updateApplicationStatus,
  getMyProfile, searchChefs
} from "./lib/networkDB.js";
import {
  JOB_TYPES, JOB_CATEGORIES, CUISINE_SPECS, CHEF_SKILLS,
  CHEF_TITLES, APPLICATION_STATUSES, COUNTRIES, CURRENCIES, JOBS_MODES
} from "./lib/networkConstants.js";
import { callAIText } from "../api/anthropic.js";

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function findLabel(arr, id) {
  var f = arr.find(function(x) { return x.id === id; });
  return f ? f.label : id;
}

function findEmoji(arr, id) {
  var f = arr.find(function(x) { return x.id === id; });
  return f ? f.emoji || "" : "";
}

function findColor(arr, id) {
  var f = arr.find(function(x) { return x.id === id; });
  return f ? f.color || C.muted : C.muted;
}

function currencySymbol(cid) {
  var f = CURRENCIES.find(function(x) { return x.id === cid; });
  return f ? f.symbol : cid;
}

function truncate(str, len) {
  if (!str) return "";
  if (str.length <= (len || 120)) return str;
  return str.substring(0, len || 120) + "...";
}

function formatSalary(min, max, cur) {
  var sym = currencySymbol(cur || "TRY");
  if (min && max) return sym + " " + min.toLocaleString("tr-TR") + " - " + max.toLocaleString("tr-TR");
  if (min) return sym + " " + min.toLocaleString("tr-TR") + "+";
  if (max) return sym + " " + max.toLocaleString("tr-TR") + "'e kadar";
  return "Belirtilmemiş";
}

// ══════════════════════════════════════════════════════════════
// TAG BADGE
// ══════════════════════════════════════════════════════════════
function TagBadge(props) {
  return <span style={{
    display: "inline-block", padding: "3px 9px", borderRadius: 50,
    fontSize: 10, fontWeight: 600, marginRight: 4, marginBottom: 4,
    background: (props.color || C.gold) + "18",
    color: props.color || C.gold,
    border: "1px solid " + (props.color || C.gold) + "30"
  }}>{props.emoji ? props.emoji + " " : ""}{props.label}</span>;
}

// ══════════════════════════════════════════════════════════════
// STATUS TIMELINE
// ══════════════════════════════════════════════════════════════
function StatusTimeline(props) {
  var statuses = ["applied", "reviewing", "interview", "accepted"];
  var currentIdx = statuses.indexOf(props.status);
  if (props.status === "rejected") currentIdx = -2;

  return <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "12px 0" }}>
    {statuses.map(function(sId, i) {
      var st = APPLICATION_STATUSES.find(function(x) { return x.id === sId; });
      var reached = i <= currentIdx;
      var isCurrent = i === currentIdx;
      var isRejected = props.status === "rejected";
      var dotCol = isRejected ? (i === 0 ? "#E05252" : "var(--border)") : reached ? st.color : "var(--border)";

      return <div key={sId} style={{ display: "flex", alignItems: "center", flex: i < statuses.length - 1 ? 1 : "0 0 auto" }}>
        <div style={{
          width: isCurrent ? 28 : 20, height: isCurrent ? 28 : 20, borderRadius: "50%",
          background: dotCol + (reached ? "" : "30"),
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isCurrent ? 13 : 10, color: reached ? "#fff" : C.muted,
          fontWeight: 700, border: isCurrent ? "2px solid " + dotCol : "none",
          transition: "all 0.3s"
        }}>{st.emoji}</div>
        {i < statuses.length - 1 && <div style={{
          flex: 1, height: 2, marginLeft: 2, marginRight: 2,
          background: reached && i < currentIdx ? st.color : "var(--border)",
          transition: "all 0.3s"
        }} />}
      </div>;
    })}
    {props.status === "rejected" && <div style={{
      marginLeft: 8, padding: "3px 10px", borderRadius: 50,
      background: "rgba(224,82,82,0.12)", color: "#E05252",
      fontSize: 10, fontWeight: 700
    }}>Reddedildi</div>}
  </div>;
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChefJobsTab(props) {
  var user = props.user;
  var userId = user && user.id ? user.id : null;
  var isGuest = !userId || user === "misafir";

  // Sub-mode
  var modeState = useState("browse");
  var mode = modeState[0];
  var setMode = modeState[1];

  // ══════════════════════════════════════════════════
  // BROWSE STATE
  // ══════════════════════════════════════════════════
  var jobsState = useState([]);
  var jobs = jobsState[0];
  var setJobs = jobsState[1];

  var loadingJobsState = useState(false);
  var loadingJobs = loadingJobsState[0];
  var setLoadingJobs = loadingJobsState[1];

  var filterTypeState = useState("");
  var filterType = filterTypeState[0];
  var setFilterType = filterTypeState[1];

  var filterCatState = useState("");
  var filterCat = filterCatState[0];
  var setFilterCat = filterCatState[1];

  var filterCityState = useState("");
  var filterCity = filterCityState[0];
  var setFilterCity = filterCityState[1];

  var filterCountryState = useState("");
  var filterCountry = filterCountryState[0];
  var setFilterCountry = filterCountryState[1];

  var filterCuisineState = useState("");
  var filterCuisine = filterCuisineState[0];
  var setFilterCuisine = filterCuisineState[1];

  var filterSkillState = useState("");
  var filterSkill = filterSkillState[0];
  var setFilterSkill = filterSkillState[1];

  var filterMinSalaryState = useState("");
  var filterMinSalary = filterMinSalaryState[0];
  var setFilterMinSalary = filterMinSalaryState[1];

  var showFiltersState = useState(false);
  var showFilters = showFiltersState[0];
  var setShowFilters = showFiltersState[1];

  // Detail & Apply modals
  var detailJobState = useState(null);
  var detailJob = detailJobState[0];
  var setDetailJob = detailJobState[1];

  var applyJobState = useState(null);
  var applyJob = applyJobState[0];
  var setApplyJob = applyJobState[1];

  var coverLetterState = useState("");
  var coverLetter = coverLetterState[0];
  var setCoverLetter = coverLetterState[1];

  var applyingState = useState(false);
  var applying = applyingState[0];
  var setApplying = applyingState[1];

  var applySuccessState = useState(false);
  var applySuccess = applySuccessState[0];
  var setApplySuccess = applySuccessState[1];

  // Saved jobs
  var savedJobsState = useState([]);
  var savedJobs = savedJobsState[0];
  var setSavedJobs = savedJobsState[1];

  // ══════════════════════════════════════════════════
  // POST STATE
  // ══════════════════════════════════════════════════
  var postTitleState = useState("");
  var postTitle = postTitleState[0];
  var setPostTitle = postTitleState[1];

  var postDescState = useState("");
  var postDesc = postDescState[0];
  var setPostDesc = postDescState[1];

  var postTypeState = useState("");
  var postType = postTypeState[0];
  var setPostType = postTypeState[1];

  var postCatState = useState("");
  var postCat = postCatState[0];
  var setPostCat = postCatState[1];

  var postCuisineState = useState([]);
  var postCuisine = postCuisineState[0];
  var setPostCuisine = postCuisineState[1];

  var postSkillsState = useState([]);
  var postSkills = postSkillsState[0];
  var setPostSkills = postSkillsState[1];

  var postExpMinState = useState("");
  var postExpMin = postExpMinState[0];
  var setPostExpMin = postExpMinState[1];

  var postCityState = useState("");
  var postCity = postCityState[0];
  var setPostCity = postCityState[1];

  var postCountryState = useState("Türkiye");
  var postCountry = postCountryState[0];
  var setPostCountry = postCountryState[1];

  var postSalaryMinState = useState("");
  var postSalaryMin = postSalaryMinState[0];
  var setPostSalaryMin = postSalaryMinState[1];

  var postSalaryMaxState = useState("");
  var postSalaryMax = postSalaryMaxState[0];
  var setPostSalaryMax = postSalaryMaxState[1];

  var postCurrencyState = useState("TRY");
  var postCurrency = postCurrencyState[0];
  var setPostCurrency = postCurrencyState[1];

  var postExpiresState = useState("");
  var postExpires = postExpiresState[0];
  var setPostExpires = postExpiresState[1];

  var postingState = useState(false);
  var posting = postingState[0];
  var setPosting = postingState[1];

  var postSuccessState = useState(false);
  var postSuccess = postSuccessState[0];
  var setPostSuccess = postSuccessState[1];

  // ══════════════════════════════════════════════════
  // APPLICATIONS STATE
  // ══════════════════════════════════════════════════
  var applicationsState = useState([]);
  var applications = applicationsState[0];
  var setApplications = applicationsState[1];

  var loadingAppsState = useState(false);
  var loadingApps = loadingAppsState[0];
  var setLoadingApps = loadingAppsState[1];

  // ══════════════════════════════════════════════════
  // MY JOBS STATE
  // ══════════════════════════════════════════════════
  var myJobsState = useState([]);
  var myJobs = myJobsState[0];
  var setMyJobs = myJobsState[1];

  var loadingMyJobsState = useState(false);
  var loadingMyJobs = loadingMyJobsState[0];
  var setLoadingMyJobs = loadingMyJobsState[1];

  var viewApplicantsJobState = useState(null);
  var viewApplicantsJob = viewApplicantsJobState[0];
  var setViewApplicantsJob = viewApplicantsJobState[1];

  var applicantsState = useState([]);
  var applicants = applicantsState[0];
  var setApplicants = applicantsState[1];

  var loadingApplicantsState = useState(false);
  var loadingApplicants = loadingApplicantsState[0];
  var setLoadingApplicants = loadingApplicantsState[1];

  var togglingJobState = useState(null);
  var togglingJob = togglingJobState[0];
  var setTogglingJob = togglingJobState[1];

  // ══════════════════════════════════════════════════
  // DISCOVERY STATE
  // ══════════════════════════════════════════════════
  var discoveryQueryState = useState("");
  var discoveryQuery = discoveryQueryState[0];
  var setDiscoveryQuery = discoveryQueryState[1];

  var discoveryResultsState = useState([]);
  var discoveryResults = discoveryResultsState[0];
  var setDiscoveryResults = discoveryResultsState[1];

  var discoveringState = useState(false);
  var discovering = discoveringState[0];
  var setDiscovering = discoveringState[1];

  var discoveryErrorState = useState("");
  var discoveryError = discoveryErrorState[0];
  var setDiscoveryError = discoveryErrorState[1];

  var discoveryMatchJobState = useState(null);
  var discoveryMatchJob = discoveryMatchJobState[0];
  var setDiscoveryMatchJob = discoveryMatchJobState[1];

  // ══════════════════════════════════════════════════
  // ERROR
  // ══════════════════════════════════════════════════
  var errState = useState("");
  var errMsg = errState[0];
  var setErrMsg = errState[1];

  // ══════════════════════════════════════════════════
  // LOAD SAVED JOBS FROM LOCALSTORAGE
  // ══════════════════════════════════════════════════
  useEffect(function() {
    try {
      var saved = localStorage.getItem("chef_saved_jobs");
      if (saved) setSavedJobs(JSON.parse(saved));
    } catch (e) {}
  }, []);

  function toggleSaveJob(jobId) {
    var next;
    if (savedJobs.includes(jobId)) {
      next = savedJobs.filter(function(x) { return x !== jobId; });
    } else {
      next = savedJobs.concat([jobId]);
    }
    setSavedJobs(next);
    try { localStorage.setItem("chef_saved_jobs", JSON.stringify(next)); } catch (e) {}
  }

  // ══════════════════════════════════════════════════
  // LOAD JOBS (BROWSE)
  // ══════════════════════════════════════════════════
  function loadJobs() {
    setLoadingJobs(true);
    setErrMsg("");
    var filters = {};
    if (filterType) filters.job_type = filterType;
    if (filterCat) filters.category = filterCat;
    if (filterCity) filters.city = filterCity;
    if (filterCountry) filters.country = filterCountry;
    if (filterCuisine) filters.cuisine = filterCuisine;
    if (filterSkill) filters.skill = filterSkill;
    if (filterMinSalary) filters.minSalary = parseInt(filterMinSalary, 10);
    getJobs(Object.keys(filters).length > 0 ? filters : null).then(function(res) {
      setLoadingJobs(false);
      if (res.error) { setErrMsg(res.error); return; }
      setJobs(res.data || []);
    }).catch(function(e) {
      setLoadingJobs(false);
      setErrMsg(e.message || "Yüklenemedi");
    });
  }

  useEffect(function() {
    loadJobs();
  }, []);

  // Reload when filters change
  var filtersRef = useRef({ filterType: filterType, filterCat: filterCat, filterCity: filterCity, filterCountry: filterCountry, filterCuisine: filterCuisine, filterSkill: filterSkill, filterMinSalary: filterMinSalary });
  useEffect(function() {
    var prev = filtersRef.current;
    if (prev.filterType !== filterType || prev.filterCat !== filterCat || prev.filterCity !== filterCity ||
        prev.filterCountry !== filterCountry || prev.filterCuisine !== filterCuisine ||
        prev.filterSkill !== filterSkill || prev.filterMinSalary !== filterMinSalary) {
      filtersRef.current = { filterType: filterType, filterCat: filterCat, filterCity: filterCity, filterCountry: filterCountry, filterCuisine: filterCuisine, filterSkill: filterSkill, filterMinSalary: filterMinSalary };
      loadJobs();
    }
  }, [filterType, filterCat, filterCity, filterCountry, filterCuisine, filterSkill, filterMinSalary]);

  // ══════════════════════════════════════════════════
  // APPLY TO JOB
  // ══════════════════════════════════════════════════
  function handleApply() {
    if (!userId) { setErrMsg("Giriş yapmalısınız"); return; }
    if (!coverLetter.trim()) return;
    setApplying(true);
    applyToJob(applyJob.id, userId, coverLetter.trim()).then(function(res) {
      setApplying(false);
      if (res.error) { setErrMsg(res.error); return; }
      setApplySuccess(true);
      setCoverLetter("");
      setTimeout(function() { setApplyJob(null); setApplySuccess(false); }, 2000);
    }).catch(function(e) {
      setApplying(false);
      setErrMsg(e.message || "Başvuru gönderilemedi");
    });
  }

  // ══════════════════════════════════════════════════
  // CREATE JOB (POST)
  // ══════════════════════════════════════════════════
  function handleCreateJob() {
    if (!userId) { setErrMsg("Giriş yapmalısınız"); return; }
    if (!postTitle.trim() || !postDesc.trim()) { setErrMsg("Başlık ve açıklama zorunlu"); return; }
    setPosting(true);
    setErrMsg("");
    var jobPayload = {
      title: postTitle.trim(),
      description: postDesc.trim(),
      job_type: postType || "full_time",
      category: postCat || "restaurant",
      cuisine_required: postCuisine,
      skills_required: postSkills,
      experience_min: postExpMin ? parseInt(postExpMin, 10) : 0,
      city: postCity.trim(),
      country: postCountry,
      salary_min: postSalaryMin ? parseInt(postSalaryMin, 10) : null,
      salary_max: postSalaryMax ? parseInt(postSalaryMax, 10) : null,
      salary_currency: postCurrency,
      expires_at: postExpires || null,
      is_active: true
    };
    createJob(userId, jobPayload).then(function(res) {
      setPosting(false);
      if (res.error) { setErrMsg(res.error); return; }
      setPostSuccess(true);
      // Reset form
      setPostTitle(""); setPostDesc(""); setPostType(""); setPostCat("");
      setPostCuisine([]); setPostSkills([]); setPostExpMin("");
      setPostCity(""); setPostSalaryMin(""); setPostSalaryMax("");
      setPostExpires("");
      setTimeout(function() { setPostSuccess(false); }, 3000);
    }).catch(function(e) {
      setPosting(false);
      setErrMsg(e.message || "İlan oluşturulamadı");
    });
  }

  // ══════════════════════════════════════════════════
  // LOAD MY APPLICATIONS
  // ══════════════════════════════════════════════════
  function loadMyApplications() {
    if (!userId) return;
    setLoadingApps(true);
    getMyApplications(userId).then(function(res) {
      setLoadingApps(false);
      if (res.error) { setErrMsg(res.error); return; }
      setApplications(res.data || []);
    }).catch(function(e) {
      setLoadingApps(false);
      setErrMsg(e.message || "Yüklenemedi");
    });
  }

  useEffect(function() {
    if (mode === "applications") loadMyApplications();
  }, [mode]);

  // ══════════════════════════════════════════════════
  // LOAD MY JOBS
  // ══════════════════════════════════════════════════
  function loadMyPostedJobs() {
    if (!userId) return;
    setLoadingMyJobs(true);
    getMyJobs(userId).then(function(res) {
      setLoadingMyJobs(false);
      if (res.error) { setErrMsg(res.error); return; }
      setMyJobs(res.data || []);
    }).catch(function(e) {
      setLoadingMyJobs(false);
      setErrMsg(e.message || "Yüklenemedi");
    });
  }

  useEffect(function() {
    if (mode === "my_jobs") loadMyPostedJobs();
  }, [mode]);

  // ══════════════════════════════════════════════════
  // VIEW APPLICANTS
  // ══════════════════════════════════════════════════
  function handleViewApplicants(job) {
    setViewApplicantsJob(job);
    setLoadingApplicants(true);
    setApplicants([]);
    getJobApplicants(job.id).then(function(res) {
      setLoadingApplicants(false);
      if (res.error) { setErrMsg(res.error); return; }
      setApplicants(res.data || []);
    }).catch(function(e) {
      setLoadingApplicants(false);
      setErrMsg(e.message || "Yüklenemedi");
    });
  }

  // ══════════════════════════════════════════════════
  // UPDATE APPLICATION STATUS
  // ══════════════════════════════════════════════════
  function handleUpdateAppStatus(appId, newStatus) {
    updateApplicationStatus(appId, newStatus).then(function(res) {
      if (res.error) { setErrMsg(res.error); return; }
      setApplicants(applicants.map(function(a) {
        if (a.id === appId) return Object.assign({}, a, { status: newStatus });
        return a;
      }));
    }).catch(function(e) { setErrMsg(e.message); });
  }

  // ══════════════════════════════════════════════════
  // TOGGLE JOB ACTIVE/INACTIVE
  // ══════════════════════════════════════════════════
  function handleToggleJob(job) {
    setTogglingJob(job.id);
    updateJob(job.id, { is_active: !job.is_active }).then(function(res) {
      setTogglingJob(null);
      if (res.error) { setErrMsg(res.error); return; }
      setMyJobs(myJobs.map(function(j) {
        if (j.id === job.id) return Object.assign({}, j, { is_active: !job.is_active });
        return j;
      }));
    }).catch(function(e) {
      setTogglingJob(null);
      setErrMsg(e.message);
    });
  }

  // ══════════════════════════════════════════════════
  // AI DISCOVERY
  // ══════════════════════════════════════════════════
  function handleDiscovery() {
    if (!discoveryQuery.trim()) return;
    setDiscovering(true);
    setDiscoveryError("");
    setDiscoveryResults([]);

    var sysPrompt = "Sen bir yemek sektoru ise alim uzmanısın. Kullanıcının serbest metin aramasını analiz et ve JSON formatında filtreler cikar.\n" +
      "Cikti formatı: {\"query\": \"arama metni\", \"filters\": {\"city\": \"sehir veya null\", \"country\": \"ulke veya null\", \"cuisine\": \"mutfak id veya null\", \"skill\": \"beceri id veya null\", \"minExp\": sayi veya null, \"title\": \"unvan id veya null\"}}\n" +
      "Mutfak id'leri: turkish, french, italian, japanese, chinese, indian, thai, korean, mexican, spanish, greek, lebanese, moroccan, american, brazilian, persian, vietnamese, mediterranean, vegan, fusion, molecular, nordic\n" +
      "Beceri id'leri: pastry, sushi, grill, fermentation, baking, plating, sauce, butchery, seafood, chocolate, wine_pairing, menu_design, food_photography, cost_control, team_management, molecular_gastronomy, catering, vegan_cooking, bread_making, ice_cream, knife_skills, preservation, nutrition, food_safety\n" +
      "Unvan id'leri: executive_chef, head_chef, sous_chef, pastry_chef, line_cook, prep_cook, saucier, garde_manger, rotisseur, poissonnier, patissier, boulanger, private_chef, catering_chef, food_stylist, culinary_instructor, food_consultant, restaurant_owner\n" +
      "Sadece JSON dondur.";

    var msgs = [{ role: "user", content: discoveryQuery.trim() }];

    callAIText(sysPrompt, msgs, 500).then(function(parsed) {
      var query = parsed.query || discoveryQuery;
      var filters = parsed.filters || {};
      // Clean null values
      var cleanFilters = {};
      if (filters.city) cleanFilters.city = filters.city;
      if (filters.country) cleanFilters.country = filters.country;
      if (filters.cuisine) cleanFilters.cuisine = filters.cuisine;
      if (filters.skill) cleanFilters.skill = filters.skill;
      if (filters.minExp) cleanFilters.minExp = filters.minExp;
      if (filters.title) cleanFilters.title = filters.title;

      return searchChefs(query, Object.keys(cleanFilters).length > 0 ? cleanFilters : null).then(function(res) {
        setDiscovering(false);
        if (res.error) { setDiscoveryError(res.error); return; }
        // Add match scores
        var chefs = (res.data || []).map(function(chef) {
          var score = calcMatchScore(chef, filters);
          return Object.assign({}, chef, { match_score: score });
        });
        // Sort by match score
        chefs.sort(function(a, b) { return b.match_score - a.match_score; });
        setDiscoveryResults(chefs);
      });
    }).catch(function(e) {
      // Fallback: direct search
      searchChefs(discoveryQuery.trim(), null).then(function(res) {
        setDiscovering(false);
        if (res.error) { setDiscoveryError(res.error); return; }
        setDiscoveryResults(res.data || []);
      }).catch(function(e2) {
        setDiscovering(false);
        setDiscoveryError(e2.message || "Arama yapılamadı");
      });
    });
  }

  function calcMatchScore(chef, filters) {
    var score = 50; // Base score
    var maxBonus = 50;
    var bonusPoints = 0;
    var checks = 0;

    if (filters.city && chef.city) {
      checks++;
      if (chef.city.toLowerCase().indexOf(filters.city.toLowerCase()) >= 0) bonusPoints += 1;
    }
    if (filters.country && chef.country) {
      checks++;
      if (chef.country === filters.country) bonusPoints += 1;
    }
    if (filters.cuisine && chef.cuisine_specializations && chef.cuisine_specializations.length > 0) {
      checks++;
      if (chef.cuisine_specializations.indexOf(filters.cuisine) >= 0) bonusPoints += 1;
    }
    if (filters.skill && chef.skills && chef.skills.length > 0) {
      checks++;
      if (chef.skills.indexOf(filters.skill) >= 0) bonusPoints += 1;
    }
    if (filters.minExp && chef.experience_years) {
      checks++;
      if (chef.experience_years >= filters.minExp) bonusPoints += 1;
    }
    if (filters.title && chef.title) {
      checks++;
      if (chef.title === filters.title) bonusPoints += 1;
    }

    // Rating bonus
    if (chef.rating_avg) {
      bonusPoints += 0.2; checks += 0.5;
    }

    if (checks > 0) {
      score = 50 + Math.round((bonusPoints / checks) * maxBonus);
    }
    if (score > 100) score = 100;
    if (score < 10) score = 10;
    return score;
  }

  // Skill match for a specific job
  function calcJobSkillMatch(chef, job) {
    if (!job || !job.skills_required || job.skills_required.length === 0) return null;
    if (!chef.skills || chef.skills.length === 0) return 0;
    var matched = 0;
    job.skills_required.forEach(function(sk) {
      if (chef.skills.indexOf(sk) >= 0) matched++;
    });
    return Math.round((matched / job.skills_required.length) * 100);
  }

  // ══════════════════════════════════════════════════
  // RENDER: BROWSE
  // ══════════════════════════════════════════════════
  function renderBrowse() {
    return <div>
      {/* Filter toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SH emoji="🔍" label="İş İlanları" count={jobs.length} />
        <Btn small onClick={function() { setShowFilters(!showFilters); }} variant="outline">
          {showFilters ? "Filtreleri Gizle" : "Filtrele"}
        </Btn>
      </div>

      {/* Filter bar */}
      {showFilters && <Card style={{ marginBottom: 12, background: "var(--card2)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filtreler</div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Çalışma Şekli</div>
          <ChipSelect options={JOB_TYPES} selected={filterType} multi={false} onChange={function(v) { setFilterType(v); }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Kategori</div>
          <ChipSelect options={JOB_CATEGORIES} selected={filterCat} multi={false} onChange={function(v) { setFilterCat(v); }} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <Field label="Şehir" value={filterCity} onChange={function(v) { setFilterCity(v); }} placeholder="İstanbul..." />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ülke</label>
              <select value={filterCountry} onChange={function(e) { setFilterCountry(e.target.value); }} style={{
                width: "100%", padding: "10px 13px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text)", fontSize: 13
              }}>
                <option value="">Tümü</option>
                {COUNTRIES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Mutfak</div>
          <ChipSelect options={CUISINE_SPECS} selected={filterCuisine} multi={false} onChange={function(v) { setFilterCuisine(v); }} />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Beceri</div>
          <ChipSelect options={CHEF_SKILLS} selected={filterSkill} multi={false} onChange={function(v) { setFilterSkill(v); }} />
        </div>

        <Field label="Minimum Maaş (TRY)" value={filterMinSalary} onChange={function(v) { setFilterMinSalary(v); }} placeholder="50000" type="number" />

        <Btn small variant="outline" onClick={function() {
          setFilterType(""); setFilterCat(""); setFilterCity(""); setFilterCountry("");
          setFilterCuisine(""); setFilterSkill(""); setFilterMinSalary("");
        }}>Filtreleri Temizle</Btn>
      </Card>}

      {/* Loading */}
      {loadingJobs && <div style={{ textAlign: "center", padding: 30 }}><Spinner /><div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Yükleniyor...</div></div>}

      {/* Error */}
      {errMsg && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(224,82,82,0.1)", color: "#E05252", fontSize: 12, marginBottom: 10 }}>{errMsg}</div>}

      {/* Job list */}
      {!loadingJobs && jobs.length === 0 && <Empty emoji="💼" title="Henüz ilan yok" desc="Yeni ilanlar eklendiğinde burada görünecek" />}

      {jobs.map(function(job) {
        var isSaved = savedJobs.includes(job.id);
        return <Card key={job.id} onClick={function() { setDetailJob(job); }} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{job.title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>{truncate(job.description, 140)}</div>
            </div>
            <button onClick={function(e) { e.stopPropagation(); toggleSaveJob(job.id); }} style={{
              background: "transparent", border: "none", fontSize: 20, cursor: "pointer",
              color: isSaved ? C.gold : C.muted, marginLeft: 8
            }}>{isSaved ? "★" : "☆"}</button>
          </div>

          {/* Poster info */}
          {job.poster && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar url={job.poster.avatar_url} name={job.poster.display_name} size={24} />
            <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 500 }}>{job.poster.display_name}</span>
            {job.poster.title && <span style={{ fontSize: 10, color: C.muted }}>{findLabel(CHEF_TITLES, job.poster.title)}</span>}
          </div>}

          {/* Location & salary */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            {(job.city || job.country) && <span style={{ fontSize: 11, color: C.muted }}>
              {"📍 " + (job.city ? job.city : "") + (job.city && job.country ? ", " : "") + (job.country ? job.country : "")}
            </span>}
            {(job.salary_min || job.salary_max) && <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>
              {"💰 " + formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
            </span>}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {job.job_type && <TagBadge label={findLabel(JOB_TYPES, job.job_type)} emoji={findEmoji(JOB_TYPES, job.job_type)} color={C.blue} />}
            {job.category && <TagBadge label={findLabel(JOB_CATEGORIES, job.category)} emoji={findEmoji(JOB_CATEGORIES, job.category)} color={C.purple} />}
            {job.cuisine_required && job.cuisine_required.map(function(cId) {
              return <TagBadge key={cId} label={findLabel(CUISINE_SPECS, cId)} emoji={findEmoji(CUISINE_SPECS, cId)} color={C.orange} />;
            })}
            {job.skills_required && job.skills_required.map(function(sId) {
              return <TagBadge key={sId} label={findLabel(CHEF_SKILLS, sId)} emoji={findEmoji(CHEF_SKILLS, sId)} color={C.teal} />;
            })}
          </div>

          {/* Time */}
          <div style={{ fontSize: 10, color: C.muted, marginTop: 8, textAlign: "right" }}>{timeAgo(job.created_at)}</div>
        </Card>;
      })}

      {/* Saved jobs count */}
      {savedJobs.length > 0 && <div style={{ textAlign: "center", padding: "8px 0", fontSize: 11, color: C.gold }}>
        {"★ " + savedJobs.length + " kayıtlı ilan"}
      </div>}

      {/* DETAIL MODAL */}
      <Modal open={!!detailJob} onClose={function() { setDetailJob(null); }} title={detailJob ? detailJob.title : ""} wide>
        {detailJob && <div>
          {/* Poster */}
          {detailJob.poster && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <Avatar url={detailJob.poster.avatar_url} name={detailJob.poster.display_name} size={36} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{detailJob.poster.display_name}</div>
              {detailJob.poster.title && <div style={{ fontSize: 11, color: C.muted }}>{findLabel(CHEF_TITLES, detailJob.poster.title)}</div>}
            </div>
          </div>}

          {/* Badges row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {detailJob.job_type && <TagBadge label={findLabel(JOB_TYPES, detailJob.job_type)} emoji={findEmoji(JOB_TYPES, detailJob.job_type)} color={C.blue} />}
            {detailJob.category && <TagBadge label={findLabel(JOB_CATEGORIES, detailJob.category)} emoji={findEmoji(JOB_CATEGORIES, detailJob.category)} color={C.purple} />}
          </div>

          {/* Description */}
          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, marginBottom: 14, whiteSpace: "pre-wrap" }}>{detailJob.description}</div>

          {/* Details grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {(detailJob.city || detailJob.country) && <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--card2)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: "uppercase" }}>Konum</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                {"📍 " + (detailJob.city || "") + (detailJob.city && detailJob.country ? ", " : "") + (detailJob.country || "")}
              </div>
            </div>}
            {(detailJob.salary_min || detailJob.salary_max) && <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--card2)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: "uppercase" }}>Maaş</div>
              <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{"💰 " + formatSalary(detailJob.salary_min, detailJob.salary_max, detailJob.salary_currency)}</div>
            </div>}
            {detailJob.experience_min > 0 && <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--card2)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: "uppercase" }}>Deneyim</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{"Minimum " + detailJob.experience_min + " yıl"}</div>
            </div>}
            {detailJob.expires_at && <div style={{ padding: "10px 12px", borderRadius: 10, background: "var(--card2)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 2, textTransform: "uppercase" }}>Son Başvuru</div>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{new Date(detailJob.expires_at).toLocaleDateString("tr-TR")}</div>
            </div>}
          </div>

          {/* Required cuisines */}
          {detailJob.cuisine_required && detailJob.cuisine_required.length > 0 && <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Gereken Mutfak Uzmanlığı</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {detailJob.cuisine_required.map(function(cId) {
                return <TagBadge key={cId} label={findLabel(CUISINE_SPECS, cId)} emoji={findEmoji(CUISINE_SPECS, cId)} color={C.orange} />;
              })}
            </div>
          </div>}

          {/* Required skills */}
          {detailJob.skills_required && detailJob.skills_required.length > 0 && <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Gereken Beceriler</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {detailJob.skills_required.map(function(sId) {
                return <TagBadge key={sId} label={findLabel(CHEF_SKILLS, sId)} emoji={findEmoji(CHEF_SKILLS, sId)} color={C.teal} />;
              })}
            </div>
          </div>}

          {/* Apply button */}
          {!isGuest && <Btn full onClick={function() { setDetailJob(null); setApplyJob(detailJob); setCoverLetter(""); setApplySuccess(false); }} bg={C.green}>
            Başvur
          </Btn>}
          {isGuest && <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "10px 0" }}>Başvurmak için giriş yapın</div>}
        </div>}
      </Modal>

      {/* APPLY MODAL */}
      <Modal open={!!applyJob} onClose={function() { setApplyJob(null); }} title={applyJob ? "Başvuru: " + applyJob.title : ""}>
        {applyJob && !applySuccess && <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            Neden bu pozisyon için uygun olduğunuzu açıklayın.
          </div>
          <Field label="Ön Yazı" multiline value={coverLetter} onChange={function(v) { setCoverLetter(v); }} placeholder="Kendinizi tanıtın, deneyimlerinizi ve bu pozisyon için motivasyonunuzu yazın..." rows={6} />
          <Btn full onClick={handleApply} loading={applying} disabled={!coverLetter.trim() || applying}>
            Başvuruyu Gönder
          </Btn>
        </div>}
        {applySuccess && <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.green, marginBottom: 6 }}>Başvurunuz Gönderildi!</div>
          <div style={{ fontSize: 12, color: C.muted }}>İlan sahibi başvurunuzu inceleyecek</div>
        </div>}
      </Modal>
    </div>;
  }

  // ══════════════════════════════════════════════════
  // RENDER: POST
  // ══════════════════════════════════════════════════
  function renderPost() {
    if (isGuest) {
      return <Empty emoji="🔒" title="Giriş Gerekli" desc="İlan vermek için giriş yapmalısınız" />;
    }

    if (postSuccess) {
      return <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 50, marginBottom: 14 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.green, marginBottom: 8 }}>İlan Başarıyla Oluşturuldu!</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>İlanınız artık şefler tarafından görüntülenebilir.</div>
        <Btn onClick={function() { setPostSuccess(false); setMode("my_jobs"); loadMyPostedJobs(); }}>İlanlarıma Git</Btn>
      </div>;
    }

    return <div>
      <SH emoji="📝" label="Yeni İş İlanı" />

      <Field label="İlan Başlığı" value={postTitle} onChange={function(v) { setPostTitle(v); }} placeholder="ör: Deneyimli Sushi Şefi Aranıyor" />

      <Field label="Açıklama" multiline value={postDesc} onChange={function(v) { setPostDesc(v); }} placeholder="Pozisyon hakkında detaylı bilgi, beklentiler, iş ortamı..." rows={5} />

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Çalışma Şekli</div>
        <ChipSelect options={JOB_TYPES} selected={postType} multi={false} onChange={function(v) { setPostType(v); }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Kategori</div>
        <ChipSelect options={JOB_CATEGORIES} selected={postCat} multi={false} onChange={function(v) { setPostCat(v); }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gereken Mutfak Uzmanlığı</div>
        <ChipSelect options={CUISINE_SPECS} selected={postCuisine} multi={true} onChange={function(v) { setPostCuisine(v); }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gereken Beceriler</div>
        <ChipSelect options={CHEF_SKILLS} selected={postSkills} multi={true} onChange={function(v) { setPostSkills(v); }} />
      </div>

      <Field label="Minimum Deneyim (Yıl)" value={postExpMin} onChange={function(v) { setPostExpMin(v); }} placeholder="ör: 3" type="number" />

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Field label="Şehir" value={postCity} onChange={function(v) { setPostCity(v); }} placeholder="İstanbul" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ülke</label>
            <select value={postCountry} onChange={function(e) { setPostCountry(e.target.value); }} style={{
              width: "100%", padding: "10px 13px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--text)", fontSize: 13
            }}>
              {COUNTRIES.map(function(c) { return <option key={c} value={c}>{c}</option>; })}
            </select>
          </div>
        </div>
      </div>

      {/* Salary row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <Field label="Min Maaş" value={postSalaryMin} onChange={function(v) { setPostSalaryMin(v); }} placeholder="40000" type="number" />
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Max Maaş" value={postSalaryMax} onChange={function(v) { setPostSalaryMax(v); }} placeholder="80000" type="number" />
        </div>
        <div style={{ flex: 0.8 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Para Birimi</label>
            <select value={postCurrency} onChange={function(e) { setPostCurrency(e.target.value); }} style={{
              width: "100%", padding: "10px 13px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--text)", fontSize: 13
            }}>
              {CURRENCIES.map(function(cur) { return <option key={cur.id} value={cur.id}>{cur.label}</option>; })}
            </select>
          </div>
        </div>
      </div>

      <Field label="Son Başvuru Tarihi" value={postExpires} onChange={function(v) { setPostExpires(v); }} type="date" />

      {errMsg && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(224,82,82,0.1)", color: "#E05252", fontSize: 12, marginBottom: 10 }}>{errMsg}</div>}

      <Btn full onClick={handleCreateJob} loading={posting} disabled={posting || !postTitle.trim() || !postDesc.trim()}>
        İlanı Yayınla
      </Btn>
    </div>;
  }

  // ══════════════════════════════════════════════════
  // RENDER: APPLICATIONS
  // ══════════════════════════════════════════════════
  function renderApplications() {
    if (isGuest) {
      return <Empty emoji="🔒" title="Giriş Gerekli" desc="Başvurularınızı görmek için giriş yapmalısınız" />;
    }

    return <div>
      <SH emoji="📩" label="Başvurularım" count={applications.length} />

      {loadingApps && <div style={{ textAlign: "center", padding: 30 }}><Spinner /><div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Yükleniyor...</div></div>}

      {!loadingApps && applications.length === 0 && <Empty emoji="📩" title="Henüz başvuru yok" desc="İlanlara başvurduğunuzda burada görünecek" action={
        <Btn small onClick={function() { setMode("browse"); }}>İlanları Gör</Btn>
      } />}

      {applications.map(function(app) {
        var job = app.job;
        var statusObj = APPLICATION_STATUSES.find(function(s) { return s.id === app.status; });
        var statusCol = statusObj ? statusObj.color : C.muted;
        var statusLabel = statusObj ? statusObj.label : app.status;
        var statusEmoji = statusObj ? statusObj.emoji : "📋";

        return <Card key={app.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                {job ? job.title : "İlan"}
              </div>

              {/* Poster info */}
              {job && job.poster && <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Avatar url={job.poster.avatar_url} name={job.poster.display_name} size={20} />
                <span style={{ fontSize: 11, color: C.muted }}>{job.poster.display_name}</span>
              </div>}

              {/* Location */}
              {job && (job.city || job.country) && <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>
                {"📍 " + (job.city || "") + (job.city && job.country ? ", " : "") + (job.country || "")}
              </div>}
            </div>

            {/* Status badge */}
            <div style={{
              padding: "5px 12px", borderRadius: 50,
              background: statusCol + "18", color: statusCol,
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
            }}>{statusEmoji + " " + statusLabel}</div>
          </div>

          {/* Timeline */}
          <StatusTimeline status={app.status} />

          {/* Applied date */}
          <div style={{ fontSize: 10, color: C.muted, textAlign: "right" }}>
            {"Başvuru: " + timeAgo(app.created_at)}
          </div>
        </Card>;
      })}
    </div>;
  }

  // ══════════════════════════════════════════════════
  // RENDER: MY JOBS
  // ══════════════════════════════════════════════════
  function renderMyJobs() {
    if (isGuest) {
      return <Empty emoji="🔒" title="Giriş Gerekli" desc="İlanlarınızı görmek için giriş yapmalısınız" />;
    }

    return <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SH emoji="📋" label="İlanlarım" count={myJobs.length} />
        <Btn small onClick={function() { setMode("post"); }}>+ Yeni İlan</Btn>
      </div>

      {loadingMyJobs && <div style={{ textAlign: "center", padding: 30 }}><Spinner /><div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Yükleniyor...</div></div>}

      {!loadingMyJobs && myJobs.length === 0 && <Empty emoji="📋" title="Henüz ilan yok" desc="İlk ilanınızı oluşturun" action={
        <Btn small onClick={function() { setMode("post"); }}>İlan Ver</Btn>
      } />}

      {myJobs.map(function(job) {
        var appCount = 0;
        if (job.applications && job.applications.length > 0) {
          appCount = job.applications[0].count || 0;
        }
        var isToggling = togglingJob === job.id;

        return <Card key={job.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{job.title}</div>
                <div style={{
                  padding: "2px 8px", borderRadius: 50, fontSize: 9, fontWeight: 700,
                  background: job.is_active ? "rgba(76,175,122,0.12)" : "rgba(224,82,82,0.12)",
                  color: job.is_active ? C.green : C.red
                }}>{job.is_active ? "Aktif" : "Pasif"}</div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{truncate(job.description, 100)}</div>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
            {job.job_type && <TagBadge label={findLabel(JOB_TYPES, job.job_type)} emoji={findEmoji(JOB_TYPES, job.job_type)} color={C.blue} />}
            {(job.city || job.country) && <span style={{ fontSize: 11, color: C.muted }}>
              {"📍 " + (job.city || "") + (job.city && job.country ? ", " : "") + (job.country || "")}
            </span>}
            <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(job.created_at)}</span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Btn small onClick={function() { handleViewApplicants(job); }} bg={C.blue}>
              {"📩 Başvurular (" + appCount + ")"}
            </Btn>
            <Btn small variant="outline" onClick={function() { handleToggleJob(job); }} disabled={isToggling}>
              {isToggling ? "..." : (job.is_active ? "⏸ Durdur" : "▶ Aktifleştir")}
            </Btn>
          </div>
        </Card>;
      })}

      {/* APPLICANTS MODAL */}
      <Modal open={!!viewApplicantsJob} onClose={function() { setViewApplicantsJob(null); }} title={viewApplicantsJob ? "Başvurular: " + viewApplicantsJob.title : ""} wide>
        {viewApplicantsJob && <div>
          {loadingApplicants && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}

          {!loadingApplicants && applicants.length === 0 && <Empty emoji="📭" title="Henüz başvuru yok" desc="Başvurular geldiğinde burada görünecek" />}

          {applicants.map(function(app) {
            var chef = app.applicant;
            var statusObj = APPLICATION_STATUSES.find(function(s) { return s.id === app.status; });
            var statusCol = statusObj ? statusObj.color : C.muted;

            return <Card key={app.id} style={{ marginBottom: 10 }}>
              {/* Chef info */}
              {chef && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar url={chef.avatar_url} name={chef.display_name} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{chef.display_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {chef.title ? findLabel(CHEF_TITLES, chef.title) : ""}
                    {chef.experience_years ? " - " + chef.experience_years + " yıl deneyim" : ""}
                  </div>
                  {chef.city && <div style={{ fontSize: 10, color: C.muted }}>{"📍 " + chef.city + (chef.country ? ", " + chef.country : "")}</div>}
                </div>
                {chef.rating_avg > 0 && <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <Stars value={Math.round(chef.rating_avg)} size={12} />
                  <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{chef.rating_avg}</span>
                </div>}
              </div>}

              {/* Skills */}
              {chef && chef.skills && chef.skills.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
                {chef.skills.slice(0, 6).map(function(sId) {
                  return <TagBadge key={sId} label={findLabel(CHEF_SKILLS, sId)} emoji={findEmoji(CHEF_SKILLS, sId)} color={C.teal} />;
                })}
              </div>}

              {/* Skill match */}
              {chef && (function() {
                var matchPct = calcJobSkillMatch(chef, viewApplicantsJob);
                if (matchPct === null) return null;
                var matchCol = matchPct >= 80 ? C.green : matchPct >= 50 ? C.gold : C.red;
                return <div style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 50,
                  background: matchCol + "18", color: matchCol,
                  fontSize: 10, fontWeight: 700, marginBottom: 8
                }}>{"Beceri Uyumu: %" + matchPct}</div>;
              })()}

              {/* Cover letter */}
              {app.cover_letter && <div style={{
                padding: "10px 12px", borderRadius: 10, background: "var(--card2)",
                border: "1px solid var(--border)", marginBottom: 10,
                fontSize: 12, color: "var(--text)", lineHeight: 1.6, fontStyle: "italic"
              }}>{"\"" + app.cover_letter + "\""}</div>}

              {/* Status dropdown */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                <div style={{ fontSize: 10, color: C.muted }}>{timeAgo(app.created_at)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.muted }}>Durum:</span>
                  <select value={app.status} onChange={function(e) { handleUpdateAppStatus(app.id, e.target.value); }} style={{
                    padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: "1px solid " + statusCol + "40",
                    background: statusCol + "10",
                    color: statusCol
                  }}>
                    {APPLICATION_STATUSES.map(function(st) {
                      return <option key={st.id} value={st.id}>{st.emoji + " " + st.label}</option>;
                    })}
                  </select>
                </div>
              </div>
            </Card>;
          })}
        </div>}
      </Modal>
    </div>;
  }

  // ══════════════════════════════════════════════════
  // RENDER: DISCOVERY
  // ══════════════════════════════════════════════════
  function renderDiscovery() {
    return <div>
      <SH emoji="🤖" label="AI Şef Keşfi" />
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
        Doğal dilde arama yapın. AI, arama kriterlerinizi analiz edip en uygun şefleri bulur.
      </div>

      {/* Search input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Field label="" value={discoveryQuery} onChange={function(v) { setDiscoveryQuery(v); }} placeholder="ör: Sushi chef arıyorum, İstanbul, 5+ yıl deneyim..." mb={0} />
        </div>
        <Btn onClick={handleDiscovery} loading={discovering} disabled={discovering || !discoveryQuery.trim()}>
          Ara
        </Btn>
      </div>

      {/* Quick suggestion chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          "İstanbul'da Türk mutfağı uzmanı",
          "Pastane şefi, 3+ yıl deneyim",
          "Vegan mutfak uzmanı, İzmir",
          "Sushi chef arıyorum",
          "Fine dining deneyimli, Ankara"
        ].map(function(q) {
          return <button key={q} onClick={function() { setDiscoveryQuery(q); }} style={{
            padding: "5px 12px", borderRadius: 50, fontSize: 11,
            background: "var(--card2)", border: "1px solid var(--border)",
            color: C.muted, cursor: "pointer", transition: "all 0.15s"
          }}>{q}</button>;
        })}
      </div>

      {/* Job match selector */}
      {jobs.length > 0 && <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Veya bir ilanla eşleştir:</div>
        <select value={discoveryMatchJob ? discoveryMatchJob.id : ""} onChange={function(e) {
          var jId = e.target.value;
          if (!jId) { setDiscoveryMatchJob(null); return; }
          var found = jobs.find(function(j) { return j.id === jId; });
          setDiscoveryMatchJob(found || null);
          if (found) {
            var queryParts = [];
            if (found.title) queryParts.push(found.title);
            if (found.city) queryParts.push(found.city);
            if (found.cuisine_required && found.cuisine_required.length > 0) {
              queryParts.push(found.cuisine_required.map(function(c) { return findLabel(CUISINE_SPECS, c); }).join(", "));
            }
            if (found.experience_min) queryParts.push(found.experience_min + "+ yıl deneyim");
            setDiscoveryQuery(queryParts.join(", "));
          }
        }} style={{
          width: "100%", padding: "10px 13px", borderRadius: 10,
          border: "1px solid var(--border)", background: "var(--card)",
          color: "var(--text)", fontSize: 12
        }}>
          <option value="">-- İlan seçin --</option>
          {jobs.map(function(j) { return <option key={j.id} value={j.id}>{j.title}</option>; })}
        </select>
      </div>}

      {/* Loading */}
      {discovering && <div style={{ textAlign: "center", padding: 30 }}>
        <Spinner />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>AI analiz ediyor ve şefler aranıyor...</div>
      </div>}

      {/* Error */}
      {discoveryError && <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(224,82,82,0.1)", color: "#E05252", fontSize: 12, marginBottom: 10 }}>{discoveryError}</div>}

      {/* Results */}
      {!discovering && discoveryResults.length > 0 && <div>
        <SH emoji="👨‍🍳" label="Bulunan Şefler" count={discoveryResults.length} />

        {discoveryResults.map(function(chef) {
          var matchCol = (chef.match_score || 50) >= 80 ? C.green : (chef.match_score || 50) >= 60 ? C.gold : (chef.match_score || 50) >= 40 ? C.orange : C.red;
          var jobMatch = discoveryMatchJob ? calcJobSkillMatch(chef, discoveryMatchJob) : null;

          return <Card key={chef.id}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <Avatar url={chef.avatar_url} name={chef.display_name} size={48} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{chef.display_name}</div>
                    {chef.title && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{findLabel(CHEF_TITLES, chef.title)}</div>}
                  </div>
                  {/* Match score */}
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: matchCol + "18", border: "2px solid " + matchCol,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column"
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: matchCol, lineHeight: 1 }}>{"%" + (chef.match_score || 50)}</div>
                    <div style={{ fontSize: 7, color: matchCol, fontWeight: 600 }}>uyum</div>
                  </div>
                </div>

                {/* Location */}
                {(chef.city || chef.country) && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  {"📍 " + (chef.city || "") + (chef.city && chef.country ? ", " : "") + (chef.country || "")}
                </div>}

                {/* Experience */}
                {chef.experience_years > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                  {"⏱ " + chef.experience_years + " yıl deneyim"}
                </div>}

                {/* Rating */}
                {chef.rating_avg > 0 && <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <Stars value={Math.round(chef.rating_avg)} size={12} />
                  <span style={{ fontSize: 11, color: C.gold }}>{chef.rating_avg}</span>
                  {chef.rating_count > 0 && <span style={{ fontSize: 10, color: C.muted }}>{"(" + chef.rating_count + ")"}</span>}
                </div>}
              </div>
            </div>

            {/* Cuisines */}
            {chef.cuisine_specializations && chef.cuisine_specializations.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 8 }}>
              {chef.cuisine_specializations.map(function(cId) {
                return <TagBadge key={cId} label={findLabel(CUISINE_SPECS, cId)} emoji={findEmoji(CUISINE_SPECS, cId)} color={C.orange} />;
              })}
            </div>}

            {/* Skills */}
            {chef.skills && chef.skills.length > 0 && <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 6 }}>
              {chef.skills.slice(0, 8).map(function(sId) {
                var isRequired = discoveryMatchJob && discoveryMatchJob.skills_required && discoveryMatchJob.skills_required.indexOf(sId) >= 0;
                return <TagBadge key={sId} label={findLabel(CHEF_SKILLS, sId)} emoji={findEmoji(CHEF_SKILLS, sId)} color={isRequired ? C.green : C.teal} />;
              })}
              {chef.skills.length > 8 && <span style={{ fontSize: 10, color: C.muted, alignSelf: "center" }}>{"+" + (chef.skills.length - 8)}</span>}
            </div>}

            {/* Badges */}
            {chef.badges && chef.badges.length > 0 && <div style={{ marginTop: 6 }}>
              <BadgeList badges={chef.badges} small />
            </div>}

            {/* Job-specific skill match */}
            {jobMatch !== null && <div style={{
              marginTop: 8, padding: "6px 12px", borderRadius: 8,
              background: "var(--card2)", border: "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>İlan Beceri Uyumu</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: jobMatch >= 80 ? C.green : jobMatch >= 50 ? C.gold : C.red
                }}>{"%" + jobMatch}</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: "var(--border)", marginTop: 4, overflow: "hidden" }}>
                <div style={{
                  width: jobMatch + "%", height: "100%", borderRadius: 2,
                  background: jobMatch >= 80 ? C.green : jobMatch >= 50 ? C.gold : C.red,
                  transition: "width 0.5s"
                }} />
              </div>
            </div>}

            {/* Bio */}
            {chef.bio && <div style={{ fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
              {truncate(chef.bio, 150)}
            </div>}
          </Card>;
        })}
      </div>}

      {!discovering && discoveryResults.length === 0 && discoveryQuery && !discoveryError && <Empty emoji="🔍" title="Sonuç bulunamadı" desc="Farklı arama kriterleri deneyin" />}
    </div>;
  }

  // ══════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════
  return <div style={{ paddingBottom: 20 }}>
    <SubTabs tabs={JOBS_MODES} active={mode} onChange={function(v) { setMode(v); setErrMsg(""); }} />

    {mode === "browse" && renderBrowse()}
    {mode === "post" && renderPost()}
    {mode === "applications" && renderApplications()}
    {mode === "my_jobs" && renderMyJobs()}
    {mode === "discovery" && renderDiscovery()}
  </div>;
}
