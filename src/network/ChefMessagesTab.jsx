// Chef Messages Tab — Professional chat system for Chef Network
import { useState, useEffect, useRef } from "react";
import { SH, Avatar, Btn, Spinner, Empty, Card, Modal, timeAgo } from "./components/SharedUI.jsx";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount,
  getMyProfile,
  getProfileById,
  searchChefs,
  uploadMessageMedia,
} from "./lib/networkDB.js";
import { C } from "../constants.js";

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChefMessagesTab(props) {
  var user = props.user;
  var userId = user && typeof user === "object" ? (user.id || user.email) : user;

  // ── State ──────────────────────────────────────────────────
  var _myProfile = useState(null);
  var myProfile = _myProfile[0];
  var setMyProfile = _myProfile[1];

  var _convos = useState([]);
  var convos = _convos[0];
  var setConvos = _convos[1];

  var _convoProfiles = useState({});
  var convoProfiles = _convoProfiles[0];
  var setConvoProfiles = _convoProfiles[1];

  var _convoLastMsgs = useState({});
  var convoLastMsgs = _convoLastMsgs[0];
  var setConvoLastMsgs = _convoLastMsgs[1];

  var _convoUnreads = useState({});
  var convoUnreads = _convoUnreads[0];
  var setConvoUnreads = _convoUnreads[1];

  var _loading = useState(true);
  var loading = _loading[0];
  var setLoading = _loading[1];

  // Active chat
  var _activeConvo = useState(null);
  var activeConvo = _activeConvo[0];
  var setActiveConvo = _activeConvo[1];

  var _messages = useState([]);
  var messages = _messages[0];
  var setMessages = _messages[1];

  var _msgLoading = useState(false);
  var msgLoading = _msgLoading[0];
  var setMsgLoading = _msgLoading[1];

  var _msgText = useState("");
  var msgText = _msgText[0];
  var setMsgText = _msgText[1];

  var _sending = useState(false);
  var sending = _sending[0];
  var setSending = _sending[1];

  var _otherProfile = useState(null);
  var otherProfile = _otherProfile[0];
  var setOtherProfile = _otherProfile[1];

  // New message modal
  var _showNewMsg = useState(false);
  var showNewMsg = _showNewMsg[0];
  var setShowNewMsg = _showNewMsg[1];

  var _searchQ = useState("");
  var searchQ = _searchQ[0];
  var setSearchQ = _searchQ[1];

  var _searchResults = useState([]);
  var searchResults = _searchResults[0];
  var setSearchResults = _searchResults[1];

  var _searching = useState(false);
  var searching = _searching[0];
  var setSearching = _searching[1];

  // Media upload
  var _uploading = useState(false);
  var uploading = _uploading[0];
  var setUploading = _uploading[1];

  // Refs
  var chatEndRef = useRef(null);
  var fileInputRef = useRef(null);
  var pollRef = useRef(null);
  var msgCountRef = useRef(0);

  // ── Load profile & conversations on mount ──────────────────
  useEffect(function () {
    if (!userId || userId === "misafir") {
      setLoading(false);
      return;
    }
    loadInit();

    return function () {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [userId]);

  function loadInit() {
    setLoading(true);
    getMyProfile(userId).then(function (res) {
      if (res.data) {
        setMyProfile(res.data);
        loadConversations(res.data.id);
      } else {
        setLoading(false);
      }
    });
  }

  function loadConversations(profileId) {
    getConversations(profileId).then(function (res) {
      var list = res.data || [];
      setConvos(list);
      setLoading(false);

      // Resolve other participant profiles and last messages
      list.forEach(function (conv) {
        var otherId = getOtherId(conv.participants, profileId);
        if (otherId && !convoProfiles[otherId]) {
          getProfileById(otherId).then(function (pRes) {
            if (pRes.data) {
              setConvoProfiles(function (prev) {
                var next = Object.assign({}, prev);
                next[otherId] = pRes.data;
                return next;
              });
            }
          });
        }
        // Load last message for preview
        getMessages(conv.id, 1).then(function (mRes) {
          var msgs = mRes.data || [];
          if (msgs.length > 0) {
            setConvoLastMsgs(function (prev) {
              var next = Object.assign({}, prev);
              next[conv.id] = msgs[msgs.length - 1];
              return next;
            });
          }
        });
        // Load unread count per conversation
        loadConvoUnread(conv, profileId);
      });
    });
  }

  function loadConvoUnread(conv, profileId) {
    getMessages(conv.id, 100).then(function (mRes) {
      var msgs = mRes.data || [];
      var unread = 0;
      msgs.forEach(function (m) {
        if (m.sender_id !== profileId && !m.is_read) unread++;
      });
      setConvoUnreads(function (prev) {
        var next = Object.assign({}, prev);
        next[conv.id] = unread;
        return next;
      });
    });
  }

  function getOtherId(participants, myId) {
    if (!participants || !Array.isArray(participants)) return null;
    var other = participants.filter(function (p) {
      return p !== myId;
    });
    return other.length > 0 ? other[0] : null;
  }

  // ── Open a conversation ────────────────────────────────────
  function openConversation(conv) {
    setActiveConvo(conv);
    setMsgLoading(true);
    setMessages([]);
    setMsgText("");
    msgCountRef.current = 0;

    var otherId = getOtherId(conv.participants, myProfile.id);
    if (otherId) {
      getProfileById(otherId).then(function (pRes) {
        if (pRes.data) setOtherProfile(pRes.data);
      });
    }

    loadChatMessages(conv.id, true);

    // Mark as read
    markMessagesRead(conv.id, myProfile.id).then(function () {
      setConvoUnreads(function (prev) {
        var next = Object.assign({}, prev);
        next[conv.id] = 0;
        return next;
      });
    });

    // Start polling for new messages
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(function () {
      pollMessages(conv.id);
    }, 5000);
  }

  function loadChatMessages(convId, initial) {
    if (initial) setMsgLoading(true);
    getMessages(convId).then(function (res) {
      var list = res.data || [];
      setMessages(list);
      msgCountRef.current = list.length;
      if (initial) setMsgLoading(false);
      scrollToBottom();
      // Mark new ones as read
      if (myProfile) {
        markMessagesRead(convId, myProfile.id);
      }
    });
  }

  function pollMessages(convId) {
    getMessages(convId).then(function (res) {
      var list = res.data || [];
      if (list.length !== msgCountRef.current) {
        setMessages(list);
        msgCountRef.current = list.length;
        scrollToBottom();
        if (myProfile) {
          markMessagesRead(convId, myProfile.id);
        }
      }
    });
  }

  function scrollToBottom() {
    setTimeout(function () {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }

  // ── Send message ───────────────────────────────────────────
  function handleSend() {
    if (!msgText.trim() || !activeConvo || !myProfile || sending) return;
    setSending(true);
    var text = msgText.trim();
    setMsgText("");
    sendMessage(activeConvo.id, myProfile.id, text).then(function (res) {
      setSending(false);
      if (res.data) {
        setMessages(function (prev) {
          return prev.concat([res.data]);
        });
        msgCountRef.current = msgCountRef.current + 1;
        scrollToBottom();
        // Update last message in list
        setConvoLastMsgs(function (prev) {
          var next = Object.assign({}, prev);
          next[activeConvo.id] = res.data;
          return next;
        });
      }
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Media send ─────────────────────────────────────────────
  function handleMediaSelect(e) {
    var file = e.target.files && e.target.files[0];
    if (!file || !activeConvo || !myProfile) return;
    setUploading(true);
    uploadMessageMedia(myProfile.id, file).then(function (res) {
      setUploading(false);
      if (res.data) {
        var caption = msgText.trim() || "";
        setMsgText("");
        setSending(true);
        sendMessage(activeConvo.id, myProfile.id, caption || "📷 Fotoğraf", res.data).then(function (mRes) {
          setSending(false);
          if (mRes.data) {
            setMessages(function (prev) {
              return prev.concat([mRes.data]);
            });
            msgCountRef.current = msgCountRef.current + 1;
            scrollToBottom();
            setConvoLastMsgs(function (prev) {
              var next = Object.assign({}, prev);
              next[activeConvo.id] = mRes.data;
              return next;
            });
          }
        });
      }
    });
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── New message search ─────────────────────────────────────
  function handleSearch() {
    if (!searchQ.trim()) return;
    setSearching(true);
    searchChefs(searchQ.trim()).then(function (res) {
      var results = (res.data || []).filter(function (c) {
        return c.id !== (myProfile && myProfile.id);
      });
      setSearchResults(results);
      setSearching(false);
    });
  }

  function handleSearchKey(e) {
    if (e.key === "Enter") handleSearch();
  }

  function startConversationWith(chef) {
    if (!myProfile) return;
    setShowNewMsg(false);
    setSearchQ("");
    setSearchResults([]);
    setLoading(true);
    getOrCreateConversation(myProfile.id, chef.id).then(function (res) {
      setLoading(false);
      if (res.data) {
        // Add to convos if not present
        setConvos(function (prev) {
          var exists = prev.find(function (c) {
            return c.id === res.data.id;
          });
          if (!exists) return [res.data].concat(prev);
          return prev;
        });
        // Cache the profile
        setConvoProfiles(function (prev) {
          var next = Object.assign({}, prev);
          next[chef.id] = chef;
          return next;
        });
        openConversation(res.data);
      }
    });
  }

  // ── Go back to conversation list ───────────────────────────
  function goBack() {
    if (pollRef.current) clearInterval(pollRef.current);
    setActiveConvo(null);
    setOtherProfile(null);
    setMessages([]);
    setMsgText("");
    // Reload conversations to get updated data
    if (myProfile) loadConversations(myProfile.id);
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER — Guest guard
  // ══════════════════════════════════════════════════════════════
  if (!userId || userId === "misafir") {
    return Empty({
      emoji: "🔒",
      title: "Giriş Gerekli",
      desc: "Mesajlaşma özelliğini kullanmak için giriş yapmalısınız.",
    });
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spinner size={28} />
        <div style={{ marginTop: 12, fontSize: 13, color: C.muted }}>Mesajlar yükleniyor...</div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER — Chat View (active conversation)
  // ══════════════════════════════════════════════════════════════
  if (activeConvo) {
    var otherName = otherProfile ? otherProfile.display_name : "...";
    var otherAvUrl = otherProfile ? otherProfile.avatar_url : null;
    var otherTitle = otherProfile ? otherProfile.title : "";

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {/* ── Chat header ─────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            background: "var(--card)",
            borderBottom: "1px solid var(--border)",
            borderRadius: "14px 14px 0 0",
            marginBottom: 0,
          }}
        >
          <button
            onClick={goBack}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 20,
              color: C.gold,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 8,
              transition: "background 0.15s",
            }}
            title="Geri"
          >
            ←
          </button>
          <Avatar url={otherAvUrl} name={otherName} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {otherName}
            </div>
            {otherTitle && (
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{otherTitle}</div>
            )}
          </div>
        </div>

        {/* ── Messages area ───────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: "var(--bg)",
            minHeight: 200,
            maxHeight: "calc(100vh - 340px)",
          }}
        >
          {msgLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spinner size={22} />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Merhaba deyin!</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                Bu sohbette henüz mesaj yok. İlk mesajı siz gönderin.
              </div>
            </div>
          ) : (
            messages.map(function (msg, idx) {
              var isMine = myProfile && msg.sender_id === myProfile.id;
              var showDateSep = false;
              if (idx > 0) {
                var prevDate = new Date(messages[idx - 1].created_at).toDateString();
                var curDate = new Date(msg.created_at).toDateString();
                if (prevDate !== curDate) showDateSep = true;
              }
              if (idx === 0) showDateSep = true;

              return (
                <div key={msg.id || idx}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div
                      style={{
                        textAlign: "center",
                        margin: "12px 0 8px",
                        fontSize: 10,
                        color: C.muted,
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {formatDate(msg.created_at)}
                    </div>
                  )}
                  {/* Bubble */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      alignItems: "flex-end",
                      gap: 6,
                      marginBottom: 2,
                    }}
                  >
                    {!isMine && (
                      <Avatar
                        url={msg.sender && msg.sender.avatar_url}
                        name={msg.sender && msg.sender.display_name}
                        size={26}
                      />
                    )}
                    <div
                      style={{
                        maxWidth: "72%",
                        padding: msg.media_url ? "6px 6px 8px" : "10px 14px",
                        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMine
                          ? "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")"
                          : "var(--card)",
                        color: isMine ? "#1a1208" : "var(--text)",
                        border: isMine ? "none" : "1px solid var(--border)",
                        boxShadow: isMine
                          ? "0 2px 8px rgba(212,168,67,0.2)"
                          : "0 1px 4px rgba(0,0,0,0.06)",
                        wordBreak: "break-word",
                      }}
                    >
                      {/* Media thumbnail */}
                      {msg.media_url && (
                        <a
                          href={msg.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", marginBottom: msg.content && msg.content !== "📷 Fotoğraf" ? 6 : 0 }}
                        >
                          <img
                            src={msg.media_url}
                            alt="Medya"
                            style={{
                              width: "100%",
                              maxWidth: 220,
                              borderRadius: 10,
                              display: "block",
                              cursor: "pointer",
                            }}
                          />
                        </a>
                      )}
                      {/* Text content */}
                      {msg.content && msg.content !== "📷 Fotoğraf" && (
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{msg.content}</div>
                      )}
                      {/* Meta: time + read */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            opacity: 0.6,
                            color: isMine ? "#5a4010" : C.muted,
                          }}
                        >
                          {timeAgo(msg.created_at)}
                        </span>
                        {isMine && (
                          <span
                            style={{
                              fontSize: 10,
                              opacity: 0.6,
                              color: msg.is_read ? "#2a7a40" : "#5a4010",
                            }}
                            title={msg.is_read ? "Okundu" : "Gönderildi"}
                          >
                            {msg.is_read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── Input bar ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "10px 12px",
            background: "var(--card)",
            borderTop: "1px solid var(--border)",
            borderRadius: "0 0 14px 14px",
          }}
        >
          {/* Media button */}
          <button
            onClick={function () {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            disabled={uploading}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 16,
              cursor: uploading ? "not-allowed" : "pointer",
              color: C.muted,
              opacity: uploading ? 0.5 : 1,
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            title="Fotoğraf gönder"
          >
            {uploading ? <Spinner size={14} /> : "📷"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleMediaSelect}
            style={{ display: "none" }}
          />

          {/* Text input */}
          <textarea
            value={msgText}
            onChange={function (e) {
              setMsgText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            rows={1}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 13,
              resize: "none",
              outline: "none",
              maxHeight: 100,
              minHeight: 38,
              lineHeight: 1.4,
              fontFamily: "inherit",
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!msgText.trim() || sending}
            style={{
              background: msgText.trim()
                ? "linear-gradient(135deg, " + C.gold + ", " + C.goldL + ")"
                : "var(--border)",
              border: "none",
              borderRadius: 12,
              padding: "10px 16px",
              fontSize: 15,
              cursor: !msgText.trim() || sending ? "not-allowed" : "pointer",
              color: msgText.trim() ? "#1a1208" : C.muted,
              fontWeight: 700,
              opacity: sending ? 0.6 : 1,
              transition: "all 0.2s",
              flexShrink: 0,
              boxShadow: msgText.trim() ? "0 2px 8px rgba(212,168,67,0.3)" : "none",
            }}
            title="Gönder"
          >
            {sending ? <Spinner size={14} /> : "➤"}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER — Conversation List View
  // ══════════════════════════════════════════════════════════════
  var totalUnread = 0;
  Object.keys(convoUnreads).forEach(function (k) {
    totalUnread = totalUnread + (convoUnreads[k] || 0);
  });

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <SH
          emoji="💬"
          label="Mesajlar"
          count={totalUnread > 0 ? totalUnread + " okunmamış" : null}
        />
        <Btn small onClick={function () { setShowNewMsg(true); }}>
          + Yeni Mesaj
        </Btn>
      </div>

      {/* Conversation list */}
      {convos.length === 0 ? (
        <Empty
          emoji="💬"
          title="Henüz mesajınız yok"
          desc="Başka şeflerle sohbet başlatmak için Yeni Mesaj butonunu kullanın."
          action={
            <Btn onClick={function () { setShowNewMsg(true); }}>
              Sohbet Başlat
            </Btn>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {convos.map(function (conv) {
            var otherId = getOtherId(conv.participants, myProfile ? myProfile.id : null);
            var prof = otherId ? convoProfiles[otherId] : null;
            var lastMsg = convoLastMsgs[conv.id];
            var unread = convoUnreads[conv.id] || 0;

            var displayName = prof ? prof.display_name : "Yükleniyor...";
            var avatarUrl = prof ? prof.avatar_url : null;
            var lastText = lastMsg
              ? lastMsg.media_url
                ? "📷 Fotoğraf"
                : lastMsg.content
                  ? lastMsg.content.length > 45
                    ? lastMsg.content.substring(0, 45) + "..."
                    : lastMsg.content
                  : ""
              : "";
            var lastTime = conv.last_message_at || conv.created_at;

            return (
              <Card
                key={conv.id}
                onClick={function () {
                  openConversation(conv);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  cursor: "pointer",
                  borderLeft: unread > 0 ? "3px solid " + C.gold : "3px solid transparent",
                  transition: "border-color 0.2s, background 0.15s",
                }}
              >
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <Avatar url={avatarUrl} name={displayName} size={44} />
                  {unread > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: -2,
                        right: -2,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: C.red,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid var(--card)",
                      }}
                    >
                      {unread > 9 ? "9+" : unread}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: unread > 0 ? 700 : 500,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {displayName}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: unread > 0 ? C.gold : C.muted,
                        fontWeight: unread > 0 ? 600 : 400,
                        flexShrink: 0,
                      }}
                    >
                      {timeAgo(lastTime)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: unread > 0 ? "var(--text)" : C.muted,
                      fontWeight: unread > 0 ? 600 : 400,
                      marginTop: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lastText || "Henüz mesaj yok"}
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ fontSize: 14, color: C.muted, flexShrink: 0, opacity: 0.5 }}>›</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── New Message Modal ────────────────────────── */}
      <Modal
        open={showNewMsg}
        onClose={function () {
          setShowNewMsg(false);
          setSearchQ("");
          setSearchResults([]);
        }}
        title="Yeni Mesaj"
      >
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={searchQ}
              onChange={function (e) {
                setSearchQ(e.target.value);
              }}
              onKeyDown={handleSearchKey}
              placeholder="Şef adı veya şehir ara..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 13,
              }}
            />
            <Btn small onClick={handleSearch} loading={searching}>
              Ara
            </Btn>
          </div>
        </div>

        {/* Search results */}
        {searchResults.length === 0 && searchQ && !searching ? (
          <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 12 }}>
            Sonuç bulunamadı. Farklı bir arama deneyin.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
            {searchResults.map(function (chef) {
              return (
                <Card
                  key={chef.id}
                  onClick={function () {
                    startConversationWith(chef);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    cursor: "pointer",
                  }}
                >
                  <Avatar url={chef.avatar_url} name={chef.display_name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {chef.display_name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
                      {[chef.title, chef.city].filter(Boolean).join(" · ") || "Şef"}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: C.gold, fontWeight: 600, flexShrink: 0 }}>
                    Mesaj →
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {!searchQ && searchResults.length === 0 && (
          <div style={{ textAlign: "center", padding: 20, color: C.muted, fontSize: 12 }}>
            Mesaj göndermek istediğiniz şefi arayın.
          </div>
        )}
      </Modal>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// HELPER — Format date for separators
// ══════════════════════════════════════════════════════════════
function formatDate(dateStr) {
  if (!dateStr) return "";
  var d = new Date(dateStr);
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var diffDays = Math.floor((today.getTime() - msgDay.getTime()) / 86400000);

  if (diffDays === 0) return "Bugün";
  if (diffDays === 1) return "Dün";

  var months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}
