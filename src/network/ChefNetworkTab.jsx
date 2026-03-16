// Chef Social Network Hub — Ana Ag Sekmesi
import { useState, useEffect, useRef } from "react";
import { SH, Avatar, BadgeList, Stars, ChipSelect, Field, Btn, Spinner, Empty, SubTabs, Card, Modal, timeAgo } from "./components/SharedUI.jsx";
import {
  getFeed, getDiscoverPosts, createPost, deletePost,
  getComments, addComment, toggleLike, getMyLikes,
  searchChefs, followChef, unfollowChef, getFollowingIds,
  getGroups, createGroup, joinGroup, leaveGroup, getMyGroups,
  getNotifications, markNotificationsRead, getUnreadNotifCount,
  createCollaboration, getCollaborations, updateCollabStatus,
  getMyProfile
} from "./lib/networkDB.js";
import {
  POST_TYPES, NETWORK_MODES, CHEF_TITLES, CUISINE_SPECS,
  CHEF_SKILLS, GROUP_CATEGORIES, COLLAB_TYPES, NOTIFICATION_TYPES,
  AVAILABILITY_TYPES
} from "./lib/networkConstants.js";
import { C } from "../constants.js";
import { callAIText } from "../api/anthropic.js";

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
function uid(user) {
  if (!user) return null;
  if (typeof user === "string") return user === "misafir" ? null : user;
  return user.id || user.email || null;
}

function findLabel(arr, id) {
  var m = arr.find(function(x) { return x.id === id; });
  return m ? m.label : id || "";
}

function findEmoji(arr, id) {
  var m = arr.find(function(x) { return x.id === id; });
  return m ? m.emoji : "";
}

function debounce(fn, ms) {
  var t = null;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(t);
    t = setTimeout(function() { fn.apply(ctx, args); }, ms);
  };
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChefNetworkTab(props) {
  var userId = uid(props.user);

  // --- Global state ---
  var _mode = useState("feed");
  var mode = _mode[0], setMode = _mode[1];

  var _profile = useState(null);
  var profile = _profile[0], setProfile = _profile[1];

  var _loading = useState(false);
  var loading = _loading[0], setLoading = _loading[1];

  var _unread = useState(0);
  var unread = _unread[0], setUnread = _unread[1];

  // --- Feed state ---
  var _posts = useState([]);
  var posts = _posts[0], setPosts = _posts[1];

  var _likedIds = useState([]);
  var likedIds = _likedIds[0], setLikedIds = _likedIds[1];

  var _newContent = useState("");
  var newContent = _newContent[0], setNewContent = _newContent[1];

  var _newType = useState("general");
  var newType = _newType[0], setNewType = _newType[1];

  var _newMedia = useState("");
  var newMedia = _newMedia[0], setNewMedia = _newMedia[1];

  var _posting = useState(false);
  var posting = _posting[0], setPosting = _posting[1];

  var _openComments = useState(null);
  var openComments = _openComments[0], setOpenComments = _openComments[1];

  var _comments = useState({});
  var comments = _comments[0], setComments = _comments[1];

  var _commentText = useState({});
  var commentText = _commentText[0], setCommentText = _commentText[1];

  var _loadingComments = useState({});
  var loadingComments = _loadingComments[0], setLoadingComments = _loadingComments[1];

  // --- Discover state ---
  var _searchQ = useState("");
  var searchQ = _searchQ[0], setSearchQ = _searchQ[1];

  var _chefResults = useState([]);
  var chefResults = _chefResults[0], setChefResults = _chefResults[1];

  var _titleFilter = useState("");
  var titleFilter = _titleFilter[0], setTitleFilter = _titleFilter[1];

  var _cuisineFilter = useState("");
  var cuisineFilter = _cuisineFilter[0], setCuisineFilter = _cuisineFilter[1];

  var _skillFilter = useState("");
  var skillFilter = _skillFilter[0], setSkillFilter = _skillFilter[1];

  var _availFilter = useState("");
  var availFilter = _availFilter[0], setAvailFilter = _availFilter[1];

  var _followingIds = useState([]);
  var followingIds = _followingIds[0], setFollowingIds = _followingIds[1];

  var _trendPosts = useState([]);
  var trendPosts = _trendPosts[0], setTrendPosts = _trendPosts[1];

  var _aiQuery = useState("");
  var aiQuery = _aiQuery[0], setAiQuery = _aiQuery[1];

  var _aiLoading = useState(false);
  var aiLoading = _aiLoading[0], setAiLoading = _aiLoading[1];

  var _searching = useState(false);
  var searching = _searching[0], setSearching = _searching[1];

  // --- Groups state ---
  var _groupCat = useState("");
  var groupCat = _groupCat[0], setGroupCat = _groupCat[1];

  var _groupsList = useState([]);
  var groupsList = _groupsList[0], setGroupsList = _groupsList[1];

  var _myGroups = useState([]);
  var myGroups = _myGroups[0], setMyGroups = _myGroups[1];

  var _showCreateGroup = useState(false);
  var showCreateGroup = _showCreateGroup[0], setShowCreateGroup = _showCreateGroup[1];

  var _newGroup = useState({ name: "", description: "", category: "general", cover_url: "" });
  var newGroup = _newGroup[0], setNewGroup = _newGroup[1];

  var _creatingGroup = useState(false);
  var creatingGroup = _creatingGroup[0], setCreatingGroup = _creatingGroup[1];

  var _showMyGroups = useState(false);
  var showMyGroups = _showMyGroups[0], setShowMyGroups = _showMyGroups[1];

  // --- Collab state ---
  var _collabs = useState([]);
  var collabs = _collabs[0], setCollabs = _collabs[1];

  var _showNewCollab = useState(false);
  var showNewCollab = _showNewCollab[0], setShowNewCollab = _showNewCollab[1];

  var _collabForm = useState({ title: "", description: "", collab_type: "recipe", partner_search: "" });
  var collabForm = _collabForm[0], setCollabForm = _collabForm[1];

  var _partnerResults = useState([]);
  var partnerResults = _partnerResults[0], setPartnerResults = _partnerResults[1];

  var _selectedPartner = useState(null);
  var selectedPartner = _selectedPartner[0], setSelectedPartner = _selectedPartner[1];

  var _creatingCollab = useState(false);
  var creatingCollab = _creatingCollab[0], setCreatingCollab = _creatingCollab[1];

  // --- Notifications state ---
  var _notifs = useState([]);
  var notifs = _notifs[0], setNotifs = _notifs[1];

  // --- Refs ---
  var debounceRef = useRef(null);
  var partnerDebRef = useRef(null);

  // ══════════════════════════════════════════════════════════════
  // MOUNT: load profile + unread count
  // ══════════════════════════════════════════════════════════════
  useEffect(function() {
    if (!userId) return;
    getMyProfile(userId).then(function(r) {
      if (r.data) setProfile(r.data);
    });
    getUnreadNotifCount(userId).then(function(c) { setUnread(c); });
  }, [userId]);

  // ══════════════════════════════════════════════════════════════
  // MODE CHANGE: load data
  // ══════════════════════════════════════════════════════════════
  useEffect(function() {
    if (!userId && mode !== "discover") return;
    if (mode === "feed") loadFeed();
    if (mode === "discover") loadDiscover();
    if (mode === "groups") loadGroups();
    if (mode === "collab") loadCollabs();
    if (mode === "notifications") loadNotifs();
  }, [mode, userId, profile]);

  // ══════════════════════════════════════════════════════════════
  // DATA LOADERS
  // ══════════════════════════════════════════════════════════════
  function loadFeed() {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      getFeed(profile.id),
      getMyLikes(profile.id)
    ]).then(function(res) {
      if (res[0].data) setPosts(res[0].data);
      if (res[1].data) setLikedIds(res[1].data);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }

  function loadDiscover() {
    setLoading(true);
    var p = [];
    p.push(getDiscoverPosts(20));
    if (userId && profile) p.push(getFollowingIds(profile.id));
    Promise.all(p).then(function(res) {
      if (res[0].data) setTrendPosts(res[0].data);
      if (res[1]) setFollowingIds(res[1]);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }

  function loadGroups() {
    setLoading(true);
    var p = [getGroups(groupCat || undefined)];
    if (profile) p.push(getMyGroups(profile.id));
    Promise.all(p).then(function(res) {
      if (res[0].data) setGroupsList(res[0].data);
      if (res[1] && res[1].data) setMyGroups(res[1].data);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }

  function loadCollabs() {
    if (!profile) return;
    setLoading(true);
    getCollaborations(profile.id).then(function(r) {
      if (r.data) setCollabs(r.data);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }

  function loadNotifs() {
    if (!userId) return;
    setLoading(true);
    getNotifications(userId, 50).then(function(r) {
      if (r.data) setNotifs(r.data);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }

  // ══════════════════════════════════════════════════════════════
  // FEED ACTIONS
  // ══════════════════════════════════════════════════════════════
  function handleCreatePost() {
    if (!profile || !newContent.trim()) return;
    setPosting(true);
    var postData = {
      content: newContent.trim(),
      post_type: newType,
    };
    if (newMedia.trim()) postData.media_urls = [newMedia.trim()];
    createPost(profile.id, postData).then(function(r) {
      if (r.data) setPosts([r.data].concat(posts));
      setNewContent("");
      setNewMedia("");
      setNewType("general");
      setPosting(false);
    }).catch(function() { setPosting(false); });
  }

  function handleDeletePost(postId) {
    deletePost(postId).then(function(r) {
      if (!r.error) setPosts(posts.filter(function(p) { return p.id !== postId; }));
    });
  }

  function handleToggleLike(postId) {
    if (!profile) return;
    var wasLiked = likedIds.includes(postId);
    // optimistic UI
    if (wasLiked) {
      setLikedIds(likedIds.filter(function(id) { return id !== postId; }));
      setPosts(posts.map(function(p) { return p.id === postId ? Object.assign({}, p, { likes_count: (p.likes_count || 1) - 1 }) : p; }));
    } else {
      setLikedIds(likedIds.concat([postId]));
      setPosts(posts.map(function(p) { return p.id === postId ? Object.assign({}, p, { likes_count: (p.likes_count || 0) + 1 }) : p; }));
    }
    toggleLike(postId, profile.id);
  }

  function handleOpenComments(postId) {
    if (openComments === postId) { setOpenComments(null); return; }
    setOpenComments(postId);
    if (!comments[postId]) {
      var lc = Object.assign({}, loadingComments);
      lc[postId] = true;
      setLoadingComments(lc);
      getComments(postId).then(function(r) {
        var c = Object.assign({}, comments);
        c[postId] = r.data || [];
        setComments(c);
        var lc2 = Object.assign({}, loadingComments);
        lc2[postId] = false;
        setLoadingComments(lc2);
      });
    }
  }

  function handleAddComment(postId) {
    var text = (commentText[postId] || "").trim();
    if (!text || !profile) return;
    addComment(postId, profile.id, text).then(function(r) {
      if (r.data) {
        var c = Object.assign({}, comments);
        c[postId] = (c[postId] || []).concat([r.data]);
        setComments(c);
        // update count
        setPosts(posts.map(function(p) { return p.id === postId ? Object.assign({}, p, { comments_count: (p.comments_count || 0) + 1 }) : p; }));
      }
      var ct = Object.assign({}, commentText);
      ct[postId] = "";
      setCommentText(ct);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // DISCOVER ACTIONS
  // ══════════════════════════════════════════════════════════════
  function doSearch(q, filters) {
    setSearching(true);
    searchChefs(q || undefined, filters || undefined).then(function(r) {
      if (r.data) setChefResults(r.data);
      setSearching(false);
    }).catch(function() { setSearching(false); });
  }

  function handleSearchInput(val) {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(function() {
      var filters = {};
      if (titleFilter) filters.title = titleFilter;
      if (cuisineFilter) filters.cuisine = cuisineFilter;
      if (skillFilter) filters.skill = skillFilter;
      if (availFilter) filters.availability = availFilter;
      doSearch(val, filters);
    }, 400);
  }

  function handleFilterChange() {
    var filters = {};
    if (titleFilter) filters.title = titleFilter;
    if (cuisineFilter) filters.cuisine = cuisineFilter;
    if (skillFilter) filters.skill = skillFilter;
    if (availFilter) filters.availability = availFilter;
    doSearch(searchQ, filters);
  }

  useEffect(function() {
    if (mode === "discover") handleFilterChange();
  }, [titleFilter, cuisineFilter, skillFilter, availFilter]);

  function handleFollow(chefId) {
    if (!profile) return;
    var isFollowing = followingIds.includes(chefId);
    if (isFollowing) {
      setFollowingIds(followingIds.filter(function(id) { return id !== chefId; }));
      unfollowChef(profile.id, chefId);
    } else {
      setFollowingIds(followingIds.concat([chefId]));
      followChef(profile.id, chefId);
    }
  }

  function handleAIDiscover() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    var sysP = "Sen bir chef arama asistanissin. Kullanicinin doğal dildeki talebini ayrıştır ve JSON döndür. Alanlar: query (string, arama metni), title (chef ünvanı id, ör. 'executive_chef'), cuisine (mutfak id, ör. 'japanese'), skill (yetenek id, ör. 'sushi'), city (şehir). Sadece JSON döndür, başka açıklama yazma.";
    var msgs = [{ role: "user", content: aiQuery.trim() }];
    callAIText(sysP, msgs, 300).then(function(res) {
      try {
        var raw = typeof res === "string" ? res : (res && res.text ? res.text : JSON.stringify(res));
        // Extract JSON from response
        var jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          var parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) setTitleFilter(parsed.title);
          if (parsed.cuisine) setCuisineFilter(parsed.cuisine);
          if (parsed.skill) setSkillFilter(parsed.skill);
          if (parsed.query) setSearchQ(parsed.query);
          doSearch(parsed.query || parsed.city || "", {
            title: parsed.title || undefined,
            cuisine: parsed.cuisine || undefined,
            skill: parsed.skill || undefined,
            city: parsed.city || undefined,
          });
        }
      } catch(e) {
        // fallback: just search with the text
        doSearch(aiQuery.trim());
      }
      setAiLoading(false);
    }).catch(function() {
      doSearch(aiQuery.trim());
      setAiLoading(false);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // GROUPS ACTIONS
  // ══════════════════════════════════════════════════════════════
  useEffect(function() {
    if (mode === "groups") {
      getGroups(groupCat || undefined).then(function(r) {
        if (r.data) setGroupsList(r.data);
      });
    }
  }, [groupCat]);

  function handleJoinGroup(groupId) {
    if (!profile) return;
    var isMember = myGroups.some(function(g) { return g && g.id === groupId; });
    if (isMember) {
      leaveGroup(groupId, profile.id).then(function() {
        setMyGroups(myGroups.filter(function(g) { return g && g.id !== groupId; }));
        setGroupsList(groupsList.map(function(g) {
          return g.id === groupId ? Object.assign({}, g, { member_count: Math.max(0, (g.member_count || 1) - 1) }) : g;
        }));
      });
    } else {
      joinGroup(groupId, profile.id).then(function() {
        var grp = groupsList.find(function(g) { return g.id === groupId; });
        if (grp) setMyGroups(myGroups.concat([grp]));
        setGroupsList(groupsList.map(function(g) {
          return g.id === groupId ? Object.assign({}, g, { member_count: (g.member_count || 0) + 1 }) : g;
        }));
      });
    }
  }

  function handleCreateGroup() {
    if (!profile || !newGroup.name.trim()) return;
    setCreatingGroup(true);
    createGroup(profile.id, {
      name: newGroup.name.trim(),
      description: newGroup.description.trim(),
      category: newGroup.category,
      cover_url: newGroup.cover_url.trim() || null,
    }).then(function(r) {
      if (r.data) {
        setGroupsList([r.data].concat(groupsList));
        setMyGroups(myGroups.concat([r.data]));
      }
      setShowCreateGroup(false);
      setNewGroup({ name: "", description: "", category: "general", cover_url: "" });
      setCreatingGroup(false);
    }).catch(function() { setCreatingGroup(false); });
  }

  // ══════════════════════════════════════════════════════════════
  // COLLAB ACTIONS
  // ══════════════════════════════════════════════════════════════
  function handlePartnerSearch(val) {
    setCollabForm(Object.assign({}, collabForm, { partner_search: val }));
    setSelectedPartner(null);
    clearTimeout(partnerDebRef.current);
    partnerDebRef.current = setTimeout(function() {
      if (val.length >= 2) {
        searchChefs(val).then(function(r) {
          if (r.data) setPartnerResults(r.data.filter(function(c) { return c.id !== (profile && profile.id); }).slice(0, 8));
        });
      } else {
        setPartnerResults([]);
      }
    }, 350);
  }

  function handleCreateCollab() {
    if (!profile || !selectedPartner || !collabForm.title.trim()) return;
    setCreatingCollab(true);
    createCollaboration({
      initiator_id: profile.id,
      partner_id: selectedPartner.id,
      title: collabForm.title.trim(),
      description: collabForm.description.trim(),
      collab_type: collabForm.collab_type,
      status: "proposed",
    }).then(function(r) {
      if (r.data) setCollabs([r.data].concat(collabs));
      setShowNewCollab(false);
      setCollabForm({ title: "", description: "", collab_type: "recipe", partner_search: "" });
      setSelectedPartner(null);
      setPartnerResults([]);
      setCreatingCollab(false);
    }).catch(function() { setCreatingCollab(false); });
  }

  function handleCollabStatus(collabId, newStatus) {
    updateCollabStatus(collabId, newStatus).then(function(r) {
      if (r.data) {
        setCollabs(collabs.map(function(c) { return c.id === collabId ? Object.assign({}, c, { status: newStatus }) : c; }));
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // NOTIFICATIONS ACTIONS
  // ══════════════════════════════════════════════════════════════
  function handleMarkAllRead() {
    if (!userId) return;
    markNotificationsRead(userId).then(function() {
      setNotifs(notifs.map(function(n) { return Object.assign({}, n, { is_read: true }); }));
      setUnread(0);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // GUEST CHECK
  // ══════════════════════════════════════════════════════════════
  if (!userId) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Empty emoji="🔒" title="Giris Yapmaniz Gerekiyor" desc="Chef agini kullanmak icin lutfen giris yapin." />
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // BUILD SUBTABS WITH UNREAD BADGE
  // ══════════════════════════════════════════════════════════════
  var tabItems = NETWORK_MODES.map(function(m) {
    var item = { id: m.id, label: m.label, emoji: m.emoji };
    if (m.id === "notifications" && unread > 0) item.count = unread;
    return item;
  });

  // ══════════════════════════════════════════════════════════════
  // COLLAB STATUS HELPERS
  // ══════════════════════════════════════════════════════════════
  var collabStatusMap = {
    proposed: { label: "Teklif Edildi", color: C.orange, emoji: "📨" },
    active: { label: "Aktif", color: C.green, emoji: "🟢" },
    completed: { label: "Tamamlandi", color: C.blue, emoji: "✅" },
    cancelled: { label: "Iptal", color: C.red, emoji: "❌" },
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER: FEED
  // ══════════════════════════════════════════════════════════════
  function renderFeed() {
    return (
      <div>
        {/* Post creation form */}
        {profile && (
          <Card style={{ marginBottom: 16, borderLeft: "3px solid " + C.gold }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
              <Avatar url={profile.avatar_url} name={profile.display_name} size={36} />
              <div style={{ flex: 1 }}>
                <Field
                  placeholder="Ne dusunuyorsun, sef?"
                  multiline
                  rows={3}
                  value={newContent}
                  onChange={setNewContent}
                  mb={8}
                />
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Gonderi Turu
              </div>
              <ChipSelect options={POST_TYPES} selected={newType} multi={false} onChange={setNewType} />
            </div>

            <Field
              label="Medya URL (istege bagli)"
              placeholder="https://resim-adresi.com/foto.jpg"
              value={newMedia}
              onChange={setNewMedia}
              mb={10}
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={handleCreatePost} disabled={!newContent.trim() || posting} loading={posting}>
                Paylas
              </Btn>
            </div>
          </Card>
        )}

        {/* Posts list */}
        {loading && !posts.length ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
        ) : posts.length === 0 ? (
          <Empty emoji="📰" title="Akisiniz bos" desc="Sefleri takip edin veya ilk gonderinizi paylasin!" />
        ) : posts.map(function(post) {
          var author = post.author || {};
          var isOwn = profile && author.id === profile.id;
          var isLiked = likedIds.includes(post.id);
          var commentsOpen = openComments === post.id;
          var postComments = comments[post.id] || [];
          var isLoadingComments = loadingComments[post.id];
          var typeObj = POST_TYPES.find(function(t) { return t.id === post.post_type; });

          return (
            <Card key={post.id} style={{ marginBottom: 10 }}>
              {/* Author header */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <Avatar url={author.avatar_url} name={author.display_name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                    {author.display_name || "Anonim"}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>
                    {findLabel(CHEF_TITLES, author.title)}
                    {author.title && " · "}
                    {timeAgo(post.created_at)}
                  </div>
                </div>
                {typeObj && (
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 50, background: C.goldDim, color: C.goldL, fontWeight: 600 }}>
                    {typeObj.emoji} {typeObj.label}
                  </span>
                )}
                {isOwn && (
                  <button
                    onClick={function() { handleDeletePost(post.id); }}
                    style={{ fontSize: 14, color: C.red, background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
                    title="Sil"
                  >
                    🗑
                  </button>
                )}
              </div>

              {/* Author badges */}
              {author.badges && author.badges.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <BadgeList badges={author.badges} small />
                </div>
              )}

              {/* Content */}
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 10, whiteSpace: "pre-wrap" }}>
                {post.content}
              </div>

              {/* Media images */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {post.media_urls.map(function(url, i) {
                    return (
                      <img
                        key={i}
                        src={url}
                        alt=""
                        style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 10, objectFit: "cover", border: "1px solid var(--border)" }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Actions row */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={function() { handleToggleLike(post.id); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 13, color: isLiked ? C.red : C.muted, fontWeight: isLiked ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {isLiked ? "❤️" : "🤍"} {post.likes_count || 0}
                </button>
                <button
                  onClick={function() { handleOpenComments(post.id); }}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 13, color: commentsOpen ? C.blue : C.muted, fontWeight: commentsOpen ? 700 : 400,
                    display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  💬 {post.comments_count || 0}
                </button>
              </div>

              {/* Comments section */}
              {commentsOpen && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  {isLoadingComments ? (
                    <div style={{ textAlign: "center", padding: 10 }}><Spinner size={16} /></div>
                  ) : postComments.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: 8 }}>Henuz yorum yok</div>
                  ) : postComments.map(function(com) {
                    var ca = com.author || {};
                    return (
                      <div key={com.id} style={{ display: "flex", gap: 8, marginBottom: 8, padding: 8, background: "var(--bg)", borderRadius: 10 }}>
                        <Avatar url={ca.avatar_url} name={ca.display_name} size={28} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                            {ca.display_name || "Anonim"}
                            <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>{timeAgo(com.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text)", marginTop: 2 }}>{com.content}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add comment */}
                  {profile && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input
                        value={commentText[post.id] || ""}
                        onChange={function(e) {
                          var ct = Object.assign({}, commentText);
                          ct[post.id] = e.target.value;
                          setCommentText(ct);
                        }}
                        onKeyDown={function(e) {
                          if (e.key === "Enter") handleAddComment(post.id);
                        }}
                        placeholder="Yorum yaz..."
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 10,
                          border: "1px solid var(--border)", background: "var(--card)",
                          color: "var(--text)", fontSize: 12,
                        }}
                      />
                      <Btn small onClick={function() { handleAddComment(post.id); }} disabled={!(commentText[post.id] || "").trim()}>
                        Gonder
                      </Btn>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: DISCOVER
  // ══════════════════════════════════════════════════════════════
  function renderDiscover() {
    return (
      <div>
        {/* Search bar */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={searchQ}
              onChange={function(e) { handleSearchInput(e.target.value); }}
              placeholder="Sef ara... (isim, sehir, mutfak)"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--bg)",
                color: "var(--text)", fontSize: 13,
              }}
            />
            {searching && <Spinner size={18} />}
          </div>

          {/* Filter chips */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Unvan</div>
            <ChipSelect options={CHEF_TITLES.slice(0, 8)} selected={titleFilter} multi={false} onChange={function(v) { setTitleFilter(v); }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Mutfak</div>
            <ChipSelect options={CUISINE_SPECS.slice(0, 10)} selected={cuisineFilter} multi={false} onChange={function(v) { setCuisineFilter(v); }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Yetenek</div>
            <ChipSelect options={CHEF_SKILLS.slice(0, 8)} selected={skillFilter} multi={false} onChange={function(v) { setSkillFilter(v); }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Musaitlik</div>
            <ChipSelect options={AVAILABILITY_TYPES} selected={availFilter} multi={false} onChange={function(v) { setAvailFilter(v); }} />
          </div>
        </Card>

        {/* AI Chef Discovery */}
        <Card style={{ marginBottom: 14, borderLeft: "3px solid " + C.purple }}>
          <SH emoji="🤖" label="AI Sef Kesfet" />
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>
            Dogal dilde arayin: "Istanbul'da sushi yapan pastry chef"
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={aiQuery}
              onChange={function(e) { setAiQuery(e.target.value); }}
              onKeyDown={function(e) { if (e.key === "Enter") handleAIDiscover(); }}
              placeholder="Serbest metin ile sef arayin..."
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--bg)",
                color: "var(--text)", fontSize: 13,
              }}
            />
            <Btn onClick={handleAIDiscover} disabled={!aiQuery.trim() || aiLoading} loading={aiLoading}>
              Kesfet
            </Btn>
          </div>
        </Card>

        {/* Chef results */}
        {chefResults.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SH emoji="👨‍🍳" label="Sef Sonuclari" count={chefResults.length} />
            {chefResults.map(function(chef) {
              var isFollowing = followingIds.includes(chef.id);
              var isSelf = profile && chef.id === profile.id;
              var availObj = AVAILABILITY_TYPES.find(function(a) { return a.id === chef.availability; });
              return (
                <Card key={chef.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar url={chef.avatar_url} name={chef.display_name} size={46} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{chef.display_name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>
                        {findEmoji(CHEF_TITLES, chef.title)} {findLabel(CHEF_TITLES, chef.title)}
                        {chef.city && (" · " + chef.city)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        {chef.rating_avg > 0 && <Stars value={Math.round(chef.rating_avg)} size={12} />}
                        {chef.rating_avg > 0 && <span style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>{chef.rating_avg}</span>}
                        {availObj && availObj.id !== "none" && (
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 50, background: availObj.color + "18", color: availObj.color, fontWeight: 600 }}>
                            {availObj.emoji} {availObj.label}
                          </span>
                        )}
                      </div>
                      {chef.badges && chef.badges.length > 0 && (
                        <div style={{ marginTop: 4 }}><BadgeList badges={chef.badges} small /></div>
                      )}
                    </div>
                    {!isSelf && profile && (
                      <Btn
                        small
                        variant={isFollowing ? "outline" : undefined}
                        onClick={function() { handleFollow(chef.id); }}
                      >
                        {isFollowing ? "Takipten Cik" : "Takip Et"}
                      </Btn>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Trending posts */}
        {trendPosts.length > 0 && (
          <div>
            <SH emoji="🔥" label="Trend Gonderiler" count={trendPosts.length} />
            {trendPosts.slice(0, 10).map(function(post) {
              var author = post.author || {};
              return (
                <Card key={post.id} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <Avatar url={author.avatar_url} name={author.display_name} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{author.display_name || "Anonim"}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{timeAgo(post.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 12, color: C.red }}>❤️ {post.likes_count || 0}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
                    {(post.content || "").length > 200 ? post.content.substring(0, 200) + "..." : post.content}
                  </div>
                  {post.media_urls && post.media_urls.length > 0 && (
                    <img src={post.media_urls[0]} alt="" style={{ width: "100%", maxHeight: 180, borderRadius: 8, objectFit: "cover", marginTop: 8 }} />
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {!chefResults.length && !trendPosts.length && !loading && (
          <Empty emoji="🔍" title="Sef veya gonderi bulunamadi" desc="Farkli filtreler deneyin veya AI kesif ozelligini kullanin." />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: GROUPS
  // ══════════════════════════════════════════════════════════════
  function renderGroups() {
    var myGroupIds = myGroups.map(function(g) { return g && g.id; }).filter(Boolean);

    return (
      <div>
        {/* Actions row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <Btn small onClick={function() { setShowCreateGroup(true); }} disabled={!profile}>
            + Grup Olustur
          </Btn>
          <Btn small variant="outline" onClick={function() { setShowMyGroups(!showMyGroups); }}>
            {showMyGroups ? "Tum Gruplar" : "Gruplarim (" + myGroups.length + ")"}
          </Btn>
        </div>

        {/* Category filter */}
        {!showMyGroups && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>Kategori</div>
            <ChipSelect options={GROUP_CATEGORIES} selected={groupCat} multi={false} onChange={setGroupCat} />
          </div>
        )}

        {/* Groups list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
        ) : (showMyGroups ? myGroups : groupsList).length === 0 ? (
          <Empty emoji="👥" title={showMyGroups ? "Henuz bir gruba katilmadiniz" : "Bu kategoride grup yok"} desc="Yeni bir grup olusturun veya mevcut gruplara katilin." />
        ) : (showMyGroups ? myGroups : groupsList).filter(Boolean).map(function(grp) {
          var isMember = myGroupIds.includes(grp.id);
          var catObj = GROUP_CATEGORIES.find(function(c) { return c.id === grp.category; });
          return (
            <Card key={grp.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {grp.cover_url ? (
                  <img src={grp.cover_url} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }} />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 12,
                    background: "linear-gradient(135deg, " + C.gold + ", " + C.orange + ")",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24,
                  }}>
                    {catObj ? catObj.emoji : "👥"}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{grp.name}</div>
                  {grp.description && (
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.4 }}>
                      {grp.description.length > 120 ? grp.description.substring(0, 120) + "..." : grp.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                    {catObj && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 50, background: C.goldDim, color: C.goldL, fontWeight: 600 }}>
                        {catObj.emoji} {catObj.label}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: C.muted }}>👥 {grp.member_count || 0} uye</span>
                  </div>
                </div>
                {profile && (
                  <Btn small variant={isMember ? "outline" : undefined} onClick={function() { handleJoinGroup(grp.id); }}>
                    {isMember ? "Ayril" : "Katil"}
                  </Btn>
                )}
              </div>
            </Card>
          );
        })}

        {/* Create group modal */}
        <Modal open={showCreateGroup} onClose={function() { setShowCreateGroup(false); }} title="Yeni Grup Olustur">
          <Field label="Grup Adi" placeholder="Ornegin: Istanbul Pastane Severler" value={newGroup.name} onChange={function(v) { setNewGroup(Object.assign({}, newGroup, { name: v })); }} />
          <Field label="Aciklama" multiline rows={3} placeholder="Grup hakkinda kisa bilgi..." value={newGroup.description} onChange={function(v) { setNewGroup(Object.assign({}, newGroup, { description: v })); }} />
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Kategori</div>
            <ChipSelect options={GROUP_CATEGORIES} selected={newGroup.category} multi={false} onChange={function(v) { setNewGroup(Object.assign({}, newGroup, { category: v })); }} />
          </div>
          <Field label="Kapak Resmi URL (istege bagli)" placeholder="https://..." value={newGroup.cover_url} onChange={function(v) { setNewGroup(Object.assign({}, newGroup, { cover_url: v })); }} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="outline" onClick={function() { setShowCreateGroup(false); }}>Vazgec</Btn>
            <Btn onClick={handleCreateGroup} disabled={!newGroup.name.trim() || creatingGroup} loading={creatingGroup}>Olustur</Btn>
          </div>
        </Modal>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: COLLAB
  // ══════════════════════════════════════════════════════════════
  function renderCollab() {
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SH emoji="🤝" label="Isbirlikleri" count={collabs.length} />
          <Btn small onClick={function() { setShowNewCollab(true); }} disabled={!profile}>
            + Yeni Isbirligi
          </Btn>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
        ) : collabs.length === 0 ? (
          <Empty emoji="🤝" title="Henuz isbirliginiz yok" desc="Diger seflerle yeni bir isbirligi baslatmak icin yukaridaki butona tiklayin." />
        ) : collabs.map(function(col) {
          var initiator = col.initiator || {};
          var partner = col.partner || {};
          var statusInfo = collabStatusMap[col.status] || collabStatusMap.proposed;
          var typeObj = COLLAB_TYPES.find(function(t) { return t.id === col.collab_type; });
          var isInitiator = profile && col.initiator_id === profile.id;
          var isPartner = profile && col.partner_id === profile.id;

          return (
            <Card key={col.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{col.title}</div>
                  {typeObj && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 50, background: C.goldDim, color: C.goldL, fontWeight: 600, display: "inline-block", marginTop: 4 }}>
                      {typeObj.emoji} {typeObj.label}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 50,
                  background: statusInfo.color + "18", color: statusInfo.color,
                  fontWeight: 700,
                }}>
                  {statusInfo.emoji} {statusInfo.label}
                </span>
              </div>

              {col.description && (
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>{col.description}</div>
              )}

              <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar url={initiator.avatar_url} name={initiator.display_name} size={24} />
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{initiator.display_name}</span>
                </div>
                <span style={{ fontSize: 14, color: C.muted }}>↔</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Avatar url={partner.avatar_url} name={partner.display_name} size={24} />
                  <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{partner.display_name}</span>
                </div>
              </div>

              {/* Status actions */}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {col.status === "proposed" && isPartner && (
                  <Btn small onClick={function() { handleCollabStatus(col.id, "active"); }}>
                    Kabul Et
                  </Btn>
                )}
                {col.status === "proposed" && isPartner && (
                  <Btn small variant="danger" onClick={function() { handleCollabStatus(col.id, "cancelled"); }}>
                    Reddet
                  </Btn>
                )}
                {col.status === "active" && (isInitiator || isPartner) && (
                  <Btn small onClick={function() { handleCollabStatus(col.id, "completed"); }}>
                    Tamamlandi
                  </Btn>
                )}
                {col.status === "active" && (isInitiator || isPartner) && (
                  <Btn small variant="outline" onClick={function() { handleCollabStatus(col.id, "cancelled"); }}>
                    Iptal Et
                  </Btn>
                )}
              </div>
            </Card>
          );
        })}

        {/* New collab modal */}
        <Modal open={showNewCollab} onClose={function() { setShowNewCollab(false); setPartnerResults([]); setSelectedPartner(null); }} title="Yeni Isbirligi Teklifi">
          <Field label="Baslik" placeholder="Isbirligi basligi" value={collabForm.title} onChange={function(v) { setCollabForm(Object.assign({}, collabForm, { title: v })); }} />
          <Field label="Aciklama" multiline rows={3} placeholder="Isbirligi detaylari..." value={collabForm.description} onChange={function(v) { setCollabForm(Object.assign({}, collabForm, { description: v })); }} />

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Isbirligi Turu</div>
            <ChipSelect options={COLLAB_TYPES} selected={collabForm.collab_type} multi={false} onChange={function(v) { setCollabForm(Object.assign({}, collabForm, { collab_type: v })); }} />
          </div>

          {/* Partner search */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Partner Sec</div>
            {selectedPartner ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 10, background: "var(--bg)", borderRadius: 10 }}>
                <Avatar url={selectedPartner.avatar_url} name={selectedPartner.display_name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{selectedPartner.display_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{findLabel(CHEF_TITLES, selectedPartner.title)}</div>
                </div>
                <button onClick={function() { setSelectedPartner(null); }} style={{ fontSize: 14, color: C.red, background: "transparent", border: "none", cursor: "pointer" }}>✕</button>
              </div>
            ) : (
              <div>
                <input
                  value={collabForm.partner_search}
                  onChange={function(e) { handlePartnerSearch(e.target.value); }}
                  placeholder="Sef adi arayarak secin..."
                  style={{
                    width: "100%", padding: "10px 13px", borderRadius: 10,
                    border: "1px solid var(--border)", background: "var(--card)",
                    color: "var(--text)", fontSize: 13,
                  }}
                />
                {partnerResults.length > 0 && (
                  <div style={{ marginTop: 4, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                    {partnerResults.map(function(ch) {
                      return (
                        <div
                          key={ch.id}
                          onClick={function() {
                            setSelectedPartner(ch);
                            setPartnerResults([]);
                            setCollabForm(Object.assign({}, collabForm, { partner_search: "" }));
                          }}
                          style={{
                            display: "flex", gap: 8, alignItems: "center",
                            padding: "8px 12px", cursor: "pointer",
                            borderBottom: "1px solid var(--border)",
                            background: "var(--card)",
                          }}
                        >
                          <Avatar url={ch.avatar_url} name={ch.display_name} size={28} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{ch.display_name}</div>
                            <div style={{ fontSize: 10, color: C.muted }}>{findLabel(CHEF_TITLES, ch.title)}{ch.city ? " · " + ch.city : ""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn variant="outline" onClick={function() { setShowNewCollab(false); setPartnerResults([]); setSelectedPartner(null); }}>Vazgec</Btn>
            <Btn onClick={handleCreateCollab} disabled={!collabForm.title.trim() || !selectedPartner || creatingCollab} loading={creatingCollab}>
              Teklif Gonder
            </Btn>
          </div>
        </Modal>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  function renderNotifications() {
    var unreadCount = notifs.filter(function(n) { return !n.is_read; }).length;

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <SH emoji="🔔" label="Bildirimler" count={notifs.length} />
          {unreadCount > 0 && (
            <Btn small variant="outline" onClick={handleMarkAllRead}>
              Tumunu Okundu Isaretle ({unreadCount})
            </Btn>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
        ) : notifs.length === 0 ? (
          <Empty emoji="🔔" title="Bildirim yok" desc="Yeni bildirimleriniz burada gorunecek." />
        ) : notifs.map(function(notif) {
          var actor = notif.actor || {};
          var typeInfo = NOTIFICATION_TYPES[notif.type] || { label: notif.type, emoji: "📢" };

          return (
            <Card key={notif.id} style={{
              marginBottom: 6,
              opacity: notif.is_read ? 0.7 : 1,
              borderLeft: notif.is_read ? "none" : "3px solid " + C.gold,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar url={actor.avatar_url} name={actor.display_name} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700 }}>{actor.display_name || "Birisi"}</span>
                    <span style={{ marginLeft: 4 }}>{typeInfo.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{timeAgo(notif.created_at)}</div>
                </div>
                <span style={{ fontSize: 18 }}>{typeInfo.emoji}</span>
                {!notif.is_read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: C.gold, flexShrink: 0,
                  }} />
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════
  var modeRenderers = {
    feed: renderFeed,
    discover: renderDiscover,
    groups: renderGroups,
    collab: renderCollab,
    notifications: renderNotifications,
  };

  var renderContent = modeRenderers[mode] || renderFeed;

  return (
    <div style={{ padding: "0 2px" }}>
      <SubTabs tabs={tabItems} active={mode} onChange={function(m) { setMode(m); }} />

      {loading && mode !== "feed" && mode !== "discover" && !posts.length && !groupsList.length && !collabs.length && !notifs.length ? (
        <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
