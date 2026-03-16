// Chef Freelance / Booking Marketplace Tab
import { useState, useEffect, useRef } from "react";
import { C } from "../constants.js";
import {
  SH, Avatar, BadgeList, Stars, ChipSelect, Field, Btn, Spinner, Empty,
  SubTabs, Card, Modal, timeAgo
} from "./components/SharedUI.jsx";
import {
  getServices, createService, getMyServices, updateService, deleteService,
  createBooking, getMyBookingsAsClient, getMyBookingsAsChef, updateBookingStatus,
  addReview, getMyProfile
} from "./lib/networkDB.js";
import {
  SERVICE_TYPES, PRICE_UNITS, BOOKING_STATUSES, CURRENCIES, FREELANCE_MODES
} from "./lib/networkConstants.js";

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════
function uid(user) {
  if (!user) return null;
  if (typeof user === "string") return user === "misafir" ? null : user;
  return user.id || user.email || null;
}

function currSymbol(cid) {
  var c = CURRENCIES.find(function(x) { return x.id === cid; });
  return c ? c.symbol : cid || "";
}

function svcLabel(typeId) {
  var t = SERVICE_TYPES.find(function(x) { return x.id === typeId; });
  return t ? (t.emoji + " " + t.label) : typeId;
}

function svcObj(typeId) {
  return SERVICE_TYPES.find(function(x) { return x.id === typeId; }) || { id: typeId, label: typeId, emoji: "" };
}

function unitLabel(unitId) {
  var u = PRICE_UNITS.find(function(x) { return x.id === unitId; });
  return u ? u.label : unitId || "";
}

function statusObj(statusId) {
  return BOOKING_STATUSES.find(function(x) { return x.id === statusId; }) || { id: statusId, label: statusId, emoji: "", color: C.muted };
}

function fmtDate(d) {
  if (!d) return "";
  var parts = d.split("-");
  if (parts.length === 3) return parts[2] + "." + parts[1] + "." + parts[0];
  return d;
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year, month) {
  var d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-first
}

var MONTH_NAMES = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"
];

var DAY_NAMES = ["Pt", "Sa", "Ca", "Pe", "Cu", "Ct", "Pz"];

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function ChefFreelanceTab(props) {
  var userId = uid(props.user);

  // Sub-mode navigation
  var modeState = useState("browse");
  var mode = modeState[0];
  var setMode = modeState[1];

  // ── Browse state ──
  var servicesState = useState([]);
  var services = servicesState[0];
  var setServices = servicesState[1];

  var svcLoadingState = useState(false);
  var svcLoading = svcLoadingState[0];
  var setSvcLoading = svcLoadingState[1];

  var filterTypeState = useState("");
  var filterType = filterTypeState[0];
  var setFilterType = filterTypeState[1];

  var filterCityState = useState("");
  var filterCity = filterCityState[0];
  var setFilterCity = filterCityState[1];

  var filterMaxPriceState = useState("");
  var filterMaxPrice = filterMaxPriceState[0];
  var setFilterMaxPrice = filterMaxPriceState[1];

  // Detail modal
  var detailState = useState(null);
  var detail = detailState[0];
  var setDetail = detailState[1];

  // Booking flow modal
  var bookingModalState = useState(null);
  var bookingModal = bookingModalState[0];
  var setBookingModal = bookingModalState[1];

  var bookDateState = useState("");
  var bookDate = bookDateState[0];
  var setBookDate = bookDateState[1];

  var bookTimeState = useState("");
  var bookTime = bookTimeState[0];
  var setBookTime = bookTimeState[1];

  var bookGuestsState = useState("1");
  var bookGuests = bookGuestsState[0];
  var setBookGuests = bookGuestsState[1];

  var bookNotesState = useState("");
  var bookNotes = bookNotesState[0];
  var setBookNotes = bookNotesState[1];

  var bookSubmittingState = useState(false);
  var bookSubmitting = bookSubmittingState[0];
  var setBookSubmitting = bookSubmittingState[1];

  var bookConfirmState = useState(false);
  var bookConfirm = bookConfirmState[0];
  var setBookConfirm = bookConfirmState[1];

  // ── My Services state ──
  var myServicesState = useState([]);
  var myServices = myServicesState[0];
  var setMyServices = myServicesState[1];

  var myLoadingState = useState(false);
  var myLoading = myLoadingState[0];
  var setMyLoading = myLoadingState[1];

  // Create/edit form
  var formTypeState = useState("");
  var formType = formTypeState[0];
  var setFormType = formTypeState[1];

  var formTitleState = useState("");
  var formTitle = formTitleState[0];
  var setFormTitle = formTitleState[1];

  var formDescState = useState("");
  var formDesc = formDescState[0];
  var setFormDesc = formDescState[1];

  var formMinState = useState("");
  var formMin = formMinState[0];
  var setFormMin = formMinState[1];

  var formMaxState = useState("");
  var formMax = formMaxState[0];
  var setFormMax = formMaxState[1];

  var formCurrState = useState("TRY");
  var formCurr = formCurrState[0];
  var setFormCurr = formCurrState[1];

  var formUnitState = useState("");
  var formUnit = formUnitState[0];
  var setFormUnit = formUnitState[1];

  var formLocState = useState("");
  var formLoc = formLocState[0];
  var setFormLoc = formLocState[1];

  var formSubmitState = useState(false);
  var formSubmitting = formSubmitState[0];
  var setFormSubmitting = formSubmitState[1];

  var editIdState = useState(null);
  var editId = editIdState[0];
  var setEditId = editIdState[1];

  // ── Bookings state ──
  var bookSubState = useState("client");
  var bookSub = bookSubState[0];
  var setBookSub = bookSubState[1];

  var clientBookingsState = useState([]);
  var clientBookings = clientBookingsState[0];
  var setClientBookings = clientBookingsState[1];

  var chefBookingsState = useState([]);
  var chefBookings = chefBookingsState[0];
  var setChefBookings = chefBookingsState[1];

  var bookingsLoadState = useState(false);
  var bookingsLoading = bookingsLoadState[0];
  var setBookingsLoading = bookingsLoadState[1];

  // Review modal
  var reviewModalState = useState(null);
  var reviewModal = reviewModalState[0];
  var setReviewModal = reviewModalState[1];

  var reviewRatingState = useState(0);
  var reviewRating = reviewRatingState[0];
  var setReviewRating = reviewRatingState[1];

  var reviewTextState = useState("");
  var reviewText = reviewTextState[0];
  var setReviewText = reviewTextState[1];

  var reviewSubmitState = useState(false);
  var reviewSubmitting = reviewSubmitState[0];
  var setReviewSubmitting = reviewSubmitState[1];

  // ── Calendar state ──
  var nowRef = useRef(new Date());
  var calYearState = useState(nowRef.current.getFullYear());
  var calYear = calYearState[0];
  var setCalYear = calYearState[1];

  var calMonthState = useState(nowRef.current.getMonth());
  var calMonth = calMonthState[0];
  var setCalMonth = calMonthState[1];

  var calBookingsState = useState([]);
  var calBookings = calBookingsState[0];
  var setCalBookings = calBookingsState[1];

  var calLoadState = useState(false);
  var calLoading = calLoadState[0];
  var setCalLoading = calLoadState[1];

  var calDayState = useState(null);
  var calDay = calDayState[0];
  var setCalDay = calDayState[1];

  // My profile for create
  var profileState = useState(null);
  var profile = profileState[0];
  var setProfile = profileState[1];

  // ══════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════

  // Load profile once
  useEffect(function() {
    if (!userId) return;
    getMyProfile(userId).then(function(res) {
      if (res.data) setProfile(res.data);
    });
  }, [userId]);

  // Load services on browse mount + filter change
  useEffect(function() {
    if (mode !== "browse") return;
    loadServices();
  }, [mode, filterType, filterCity, filterMaxPrice]);

  // Load my services
  useEffect(function() {
    if (mode !== "my_services" || !userId) return;
    loadMyServices();
  }, [mode, userId]);

  // Load bookings
  useEffect(function() {
    if (mode !== "bookings" || !userId) return;
    loadBookings();
  }, [mode, userId, bookSub]);

  // Load calendar bookings
  useEffect(function() {
    if (mode !== "calendar" || !userId) return;
    loadCalendar();
  }, [mode, userId, calMonth, calYear]);

  // ══════════════════════════════════════════════════════════════
  // DATA LOADERS
  // ══════════════════════════════════════════════════════════════

  function loadServices() {
    setSvcLoading(true);
    var filters = {};
    if (filterType) filters.service_type = filterType;
    if (filterCity.trim()) filters.city = filterCity.trim();
    if (filterMaxPrice && Number(filterMaxPrice) > 0) filters.maxPrice = Number(filterMaxPrice);
    getServices(Object.keys(filters).length ? filters : undefined).then(function(res) {
      setServices(res.data || []);
      setSvcLoading(false);
    }).catch(function() {
      setSvcLoading(false);
    });
  }

  function loadMyServices() {
    setMyLoading(true);
    getMyServices(userId).then(function(res) {
      setMyServices(res.data || []);
      setMyLoading(false);
    }).catch(function() {
      setMyLoading(false);
    });
  }

  function loadBookings() {
    setBookingsLoading(true);
    if (bookSub === "client") {
      getMyBookingsAsClient(userId).then(function(res) {
        setClientBookings(res.data || []);
        setBookingsLoading(false);
      }).catch(function() { setBookingsLoading(false); });
    } else {
      getMyBookingsAsChef(userId).then(function(res) {
        setChefBookings(res.data || []);
        setBookingsLoading(false);
      }).catch(function() { setBookingsLoading(false); });
    }
  }

  function loadCalendar() {
    setCalLoading(true);
    // Load both client and chef bookings for calendar
    Promise.all([
      getMyBookingsAsClient(userId),
      getMyBookingsAsChef(userId)
    ]).then(function(results) {
      var all = (results[0].data || []).concat(results[1].data || []);
      setCalBookings(all);
      setCalLoading(false);
    }).catch(function() {
      setCalLoading(false);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════

  function handleBook() {
    if (!bookingModal || !userId || !bookDate || !bookTime) return;
    setBookSubmitting(true);
    var guests = Math.max(1, parseInt(bookGuests) || 1);
    var svc = bookingModal;
    var pricePerUnit = svc.price_min || 0;
    var totalPrice = pricePerUnit * guests;
    var booking = {
      service_id: svc.id,
      chef_id: svc.chef_id,
      client_id: userId,
      event_date: bookDate,
      event_time: bookTime,
      guest_count: guests,
      notes: bookNotes,
      total_price: totalPrice,
      currency: svc.price_currency || "TRY",
      status: "pending"
    };
    createBooking(booking).then(function(res) {
      setBookSubmitting(false);
      if (res.error) {
        alert("Hata: " + res.error);
        return;
      }
      setBookingModal(null);
      setDetail(null);
      setBookDate("");
      setBookTime("");
      setBookGuests("1");
      setBookNotes("");
      setBookConfirm(true);
    }).catch(function() {
      setBookSubmitting(false);
    });
  }

  function handleCreateService() {
    if (!userId || !formTitle.trim() || !formType) return;
    setFormSubmitting(true);
    var payload = {
      service_type: formType,
      title: formTitle.trim(),
      description: formDesc.trim(),
      price_min: Number(formMin) || 0,
      price_max: Number(formMax) || 0,
      price_currency: formCurr,
      price_unit: formUnit,
      location: formLoc.trim(),
      is_active: true
    };
    if (editId) {
      updateService(editId, payload).then(function(res) {
        setFormSubmitting(false);
        if (res.error) { alert("Hata: " + res.error); return; }
        resetForm();
        loadMyServices();
      }).catch(function() { setFormSubmitting(false); });
    } else {
      createService(userId, payload).then(function(res) {
        setFormSubmitting(false);
        if (res.error) { alert("Hata: " + res.error); return; }
        resetForm();
        loadMyServices();
      }).catch(function() { setFormSubmitting(false); });
    }
  }

  function resetForm() {
    setFormType("");
    setFormTitle("");
    setFormDesc("");
    setFormMin("");
    setFormMax("");
    setFormCurr("TRY");
    setFormUnit("");
    setFormLoc("");
    setEditId(null);
  }

  function handleEditService(svc) {
    setEditId(svc.id);
    setFormType(svc.service_type || "");
    setFormTitle(svc.title || "");
    setFormDesc(svc.description || "");
    setFormMin(svc.price_min != null ? String(svc.price_min) : "");
    setFormMax(svc.price_max != null ? String(svc.price_max) : "");
    setFormCurr(svc.price_currency || "TRY");
    setFormUnit(svc.price_unit || "");
    setFormLoc(svc.location || "");
  }

  function handleDeleteService(svcId) {
    if (!confirm("Bu hizmeti silmek istediginize emin misiniz?")) return;
    deleteService(svcId).then(function(res) {
      if (res.error) { alert("Hata: " + res.error); return; }
      loadMyServices();
    });
  }

  function handleToggleActive(svc) {
    updateService(svc.id, { is_active: !svc.is_active }).then(function(res) {
      if (res.error) { alert("Hata: " + res.error); return; }
      loadMyServices();
    });
  }

  function handleUpdateBookingStatus(bookingId, newStatus) {
    updateBookingStatus(bookingId, newStatus).then(function(res) {
      if (res.error) { alert("Hata: " + res.error); return; }
      loadBookings();
    });
  }

  function handleReviewSubmit() {
    if (!reviewModal || !userId || reviewRating === 0) return;
    setReviewSubmitting(true);
    var review = {
      booking_id: reviewModal.id,
      chef_id: reviewModal.chef_id,
      reviewer_id: userId,
      rating: reviewRating,
      comment: reviewText.trim()
    };
    addReview(review).then(function(res) {
      setReviewSubmitting(false);
      if (res.error) { alert("Hata: " + res.error); return; }
      setReviewModal(null);
      setReviewRating(0);
      setReviewText("");
      loadBookings();
    }).catch(function() {
      setReviewSubmitting(false);
    });
  }

  function calPrev() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
    setCalDay(null);
  }

  function calNext() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
    setCalDay(null);
  }

  // Calendar helpers
  function bookingsForDay(day) {
    var dateStr = calYear + "-" + String(calMonth + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    return calBookings.filter(function(b) {
      return b.event_date === dateStr;
    });
  }

  function dayHasBooking(day) {
    return bookingsForDay(day).length > 0;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Browse Services
  // ══════════════════════════════════════════════════════════════
  function renderBrowse() {
    return <div>
      <SH emoji="🔍" label="Hizmet Ara" />

      {/* Filter: service type chips */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hizmet Tipi</div>
        <ChipSelect
          options={SERVICE_TYPES}
          selected={filterType}
          multi={false}
          onChange={function(v) { setFilterType(v); }}
        />
      </div>

      {/* Filter: city + max price row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Field
            label="Sehir"
            value={filterCity}
            onChange={function(v) { setFilterCity(v); }}
            placeholder="Istanbul, Ankara..."
            mb={0}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Field
            label="Maks. Fiyat"
            value={filterMaxPrice}
            onChange={function(v) { setFilterMaxPrice(v); }}
            placeholder="5000"
            type="number"
            mb={0}
          />
        </div>
      </div>

      {/* Results */}
      {svcLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
      ) : services.length === 0 ? (
        <Empty emoji="🔍" title="Hizmet bulunamadi" desc="Filtrelerinizi degistirerek tekrar deneyin" />
      ) : (
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>{services.length} hizmet bulundu</div>
          {services.map(function(svc) {
            var chef = svc.chef || {};
            var st = svcObj(svc.service_type);
            return <Card key={svc.id} onClick={function() { setDetail(svc); }} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <Avatar url={chef.avatar_url} name={chef.display_name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{svc.title}</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                    {chef.display_name || "Chef"} {chef.city ? " - " + chef.city : ""}
                  </div>
                  {chef.rating_avg > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <Stars value={Math.round(chef.rating_avg)} size={12} />
                      <span style={{ fontSize: 11, color: C.muted }}>({chef.rating_avg})</span>
                    </div>
                  )}
                  {chef.badges && chef.badges.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                      <BadgeList badges={chef.badges} small />
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 50,
                      background: "rgba(212,168,67,0.12)", color: C.goldL,
                      border: "1px solid " + C.borderG
                    }}>
                      {st.emoji} {st.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                      {currSymbol(svc.price_currency)}{svc.price_min || 0}
                      {svc.price_max && svc.price_max > (svc.price_min || 0) ? " - " + currSymbol(svc.price_currency) + svc.price_max : ""}
                      {svc.price_unit ? <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}> / {unitLabel(svc.price_unit)}</span> : ""}
                    </span>
                  </div>
                </div>
              </div>
              {svc.description && (
                <div style={{
                  fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.5,
                  overflow: "hidden", textOverflow: "ellipsis",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                }}>
                  {svc.description}
                </div>
              )}
            </Card>;
          })}
        </div>
      )}

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Booking Modal */}
      {renderBookingModal()}

      {/* Booking Confirmation Modal */}
      <Modal open={bookConfirm} onClose={function() { setBookConfirm(false); }} title="Rezervasyon Olusturuldu!">
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
            Rezervasyonunuz basariyla olusturuldu!
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            Chef en kisa surede onaylayacaktir. Rezervasyonlarim sekmesinden durumu takip edebilirsiniz.
          </div>
          <Btn onClick={function() { setBookConfirm(false); }}>Tamam</Btn>
        </div>
      </Modal>
    </div>;
  }

  function renderDetailModal() {
    if (!detail) return null;
    var svc = detail;
    var chef = svc.chef || {};
    var st = svcObj(svc.service_type);

    return <Modal open={!!detail} onClose={function() { setDetail(null); }} title={svc.title} wide>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16, padding: 12, background: "var(--bg)", borderRadius: 12 }}>
        <Avatar url={chef.avatar_url} name={chef.display_name} size={56} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{chef.display_name || "Chef"}</div>
          {chef.title && <div style={{ fontSize: 12, color: C.muted }}>{chef.title}</div>}
          {chef.city && <div style={{ fontSize: 12, color: C.muted }}>{chef.city}{chef.country ? ", " + chef.country : ""}</div>}
          {chef.rating_avg > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Stars value={Math.round(chef.rating_avg)} size={14} />
              <span style={{ fontSize: 12, color: C.muted }}>({chef.rating_avg})</span>
            </div>
          )}
          {chef.badges && chef.badges.length > 0 && (
            <div style={{ marginTop: 6 }}><BadgeList badges={chef.badges} /></div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <span style={{
          fontSize: 12, padding: "4px 12px", borderRadius: 50,
          background: "rgba(212,168,67,0.12)", color: C.goldL,
          border: "1px solid " + C.borderG
        }}>
          {st.emoji} {st.label}
        </span>
      </div>

      {svc.description && (
        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.7, marginBottom: 16 }}>
          {svc.description}
        </div>
      )}

      {/* Pricing */}
      <div style={{ padding: 14, background: "var(--bg)", borderRadius: 12, marginBottom: 16, border: "1px solid " + C.borderG }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Fiyatlandirma</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.gold }}>
          {currSymbol(svc.price_currency)}{svc.price_min || 0}
          {svc.price_max && svc.price_max > (svc.price_min || 0) ? " - " + currSymbol(svc.price_currency) + svc.price_max : ""}
        </div>
        {svc.price_unit && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Birim: {unitLabel(svc.price_unit)}</div>}
        {svc.location && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Konum: {svc.location}</div>}
      </div>

      {userId && userId !== svc.chef_id && (
        <Btn full onClick={function() {
          setBookingModal(svc);
          setDetail(null);
        }}>Rezervasyon Yap</Btn>
      )}
      {!userId && (
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", fontStyle: "italic" }}>
          Rezervasyon yapmak icin giris yapin
        </div>
      )}
    </Modal>;
  }

  function renderBookingModal() {
    if (!bookingModal) return null;
    var svc = bookingModal;
    var guests = Math.max(1, parseInt(bookGuests) || 1);
    var totalPrice = (svc.price_min || 0) * guests;

    return <Modal open={!!bookingModal} onClose={function() { setBookingModal(null); }} title="Rezervasyon Olustur">
      <div style={{ marginBottom: 14, padding: 10, background: "var(--bg)", borderRadius: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{svc.title}</div>
        <div style={{ fontSize: 12, color: C.muted }}>{svcLabel(svc.service_type)}</div>
      </div>

      <Field label="Tarih" type="date" value={bookDate} onChange={function(v) { setBookDate(v); }} />
      <Field label="Saat" type="time" value={bookTime} onChange={function(v) { setBookTime(v); }} />
      <Field label="Kisi Sayisi" type="number" value={bookGuests} onChange={function(v) { setBookGuests(v); }} placeholder="1" />
      <Field label="Notlar (Opsiyonel)" multiline value={bookNotes} onChange={function(v) { setBookNotes(v); }} placeholder="Ozel isteklerinizi yazin..." />

      {/* Calculated total */}
      <div style={{
        padding: 14, background: "rgba(212,168,67,0.08)", borderRadius: 12,
        border: "1px solid " + C.borderG, marginBottom: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: C.muted }}>Tahmini Toplam</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>
            {currSymbol(svc.price_currency)}{totalPrice}
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
          {currSymbol(svc.price_currency)}{svc.price_min || 0} x {guests} kisi
        </div>
      </div>

      <Btn full onClick={handleBook} loading={bookSubmitting} disabled={bookSubmitting || !bookDate || !bookTime}>
        Rezervasyonu Onayla
      </Btn>
    </Modal>;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: My Services
  // ══════════════════════════════════════════════════════════════
  function renderMyServices() {
    if (!userId) return <Empty emoji="🔒" title="Giris gerekli" desc="Hizmet olusturmak icin giris yapin" />;

    return <div>
      {/* Create / Edit form */}
      <Card style={{ border: "1px solid " + C.borderG, marginBottom: 16 }}>
        <SH emoji={editId ? "✏️" : "➕"} label={editId ? "Hizmeti Duzenle" : "Yeni Hizmet Olustur"} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Hizmet Tipi</div>
          <ChipSelect
            options={SERVICE_TYPES}
            selected={formType}
            multi={false}
            onChange={function(v) { setFormType(v); }}
          />
        </div>

        <Field label="Baslik" value={formTitle} onChange={function(v) { setFormTitle(v); }} placeholder="Ornek: Ozel Akdeniz Mutfagi Deneyimi" />
        <Field label="Aciklama" multiline rows={4} value={formDesc} onChange={function(v) { setFormDesc(v); }} placeholder="Hizmetinizi detayli olarak tanitin..." />

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <Field label="Min. Fiyat" type="number" value={formMin} onChange={function(v) { setFormMin(v); }} placeholder="500" mb={0} />
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Maks. Fiyat" type="number" value={formMax} onChange={function(v) { setFormMax(v); }} placeholder="2000" mb={0} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 0 }}>
              <label style={{ display: "block", fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Para Birimi</label>
              <select
                value={formCurr}
                onChange={function(e) { setFormCurr(e.target.value); }}
                style={{
                  width: "100%", padding: "10px 13px", borderRadius: 10,
                  border: "1px solid var(--border)", background: "var(--card)",
                  color: "var(--text)", fontSize: 13
                }}
              >
                {CURRENCIES.map(function(c) {
                  return <option key={c.id} value={c.id}>{c.label}</option>;
                })}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fiyat Birimi</div>
          <ChipSelect
            options={PRICE_UNITS}
            selected={formUnit}
            multi={false}
            onChange={function(v) { setFormUnit(v); }}
          />
        </div>

        <Field label="Konum" value={formLoc} onChange={function(v) { setFormLoc(v); }} placeholder="Istanbul, Besiktas" />

        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={handleCreateService} loading={formSubmitting} disabled={formSubmitting || !formType || !formTitle.trim()}>
            {editId ? "Guncelle" : "Olustur"}
          </Btn>
          {editId && (
            <Btn variant="outline" onClick={resetForm}>Iptal</Btn>
          )}
        </div>
      </Card>

      {/* My services list */}
      <SH emoji="🎯" label="Hizmetlerim" count={myServices.length} />
      {myLoading ? (
        <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>
      ) : myServices.length === 0 ? (
        <Empty emoji="🎯" title="Henuz hizmet olusturmadiniz" desc="Yukaridaki formu kullanarak ilk hizmetinizi olusturun" />
      ) : (
        myServices.map(function(svc) {
          var st = svcObj(svc.service_type);
          return <Card key={svc.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{svc.title}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 50,
                    background: svc.is_active ? "rgba(76,175,122,0.12)" : "rgba(224,82,82,0.12)",
                    color: svc.is_active ? C.green : C.red,
                    border: "1px solid " + (svc.is_active ? "rgba(76,175,122,0.3)" : "rgba(224,82,82,0.3)")
                  }}>
                    {svc.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 50,
                    background: "rgba(212,168,67,0.12)", color: C.goldL,
                    border: "1px solid " + C.borderG
                  }}>
                    {st.emoji} {st.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                  {currSymbol(svc.price_currency)}{svc.price_min || 0}
                  {svc.price_max && svc.price_max > (svc.price_min || 0) ? " - " + currSymbol(svc.price_currency) + svc.price_max : ""}
                  {svc.price_unit ? <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}> / {unitLabel(svc.price_unit)}</span> : ""}
                </div>
                {svc.location && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{svc.location}</div>}
                {svc.description && (
                  <div style={{
                    fontSize: 12, color: C.muted, marginTop: 6, lineHeight: 1.5,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                  }}>
                    {svc.description}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <Btn small variant="outline" onClick={function() { handleEditService(svc); }}>Duzenle</Btn>
              <Btn small variant="outline" onClick={function() { handleToggleActive(svc); }}>
                {svc.is_active ? "Pasife Al" : "Aktife Al"}
              </Btn>
              <Btn small variant="danger" onClick={function() { handleDeleteService(svc.id); }}>Sil</Btn>
            </div>
          </Card>;
        })
      )}
    </div>;
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Bookings
  // ══════════════════════════════════════════════════════════════
  function renderBookings() {
    if (!userId) return <Empty emoji="🔒" title="Giris gerekli" desc="Rezervasyonlari gormek icin giris yapin" />;

    var bookingSubTabs = [
      { id: "client", label: "Aldigim Rezervasyonlar", emoji: "📤" },
      { id: "chef", label: "Gelen Rezervasyonlar", emoji: "📥" }
    ];

    return <div>
      <SubTabs tabs={bookingSubTabs} active={bookSub} onChange={function(v) { setBookSub(v); }} />

      {bookingsLoading ? (
        <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>
      ) : bookSub === "client" ? (
        renderClientBookings()
      ) : (
        renderChefBookings()
      )}

      {/* Review Modal */}
      <Modal open={!!reviewModal} onClose={function() { setReviewModal(null); setReviewRating(0); setReviewText(""); }} title="Degerlendirme Yap">
        {reviewModal && (
          <div>
            <div style={{ marginBottom: 14, padding: 10, background: "var(--bg)", borderRadius: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {reviewModal.service ? reviewModal.service.title : "Hizmet"}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Puaniniz</div>
              <Stars value={reviewRating} size={24} onChange={function(v) { setReviewRating(v); }} />
            </div>

            <Field label="Yorumunuz" multiline rows={4} value={reviewText} onChange={function(v) { setReviewText(v); }} placeholder="Deneyiminizi paylassin..." />

            <Btn full onClick={handleReviewSubmit} loading={reviewSubmitting} disabled={reviewSubmitting || reviewRating === 0}>
              Degerlendirmeyi Gonder
            </Btn>
          </div>
        )}
      </Modal>
    </div>;
  }

  function renderClientBookings() {
    if (clientBookings.length === 0) {
      return <Empty emoji="📤" title="Henuz rezervasyonunuz yok" desc="Hizmetler sekmesinden bir hizmet secip rezervasyon yapabilirsiniz" />;
    }
    return clientBookings.map(function(b) {
      var st = statusObj(b.status);
      var chef = b.chef || {};
      var service = b.service || {};
      return <Card key={b.id}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar url={chef.avatar_url} name={chef.display_name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
              {service.title || "Hizmet"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
              Chef: {chef.display_name || "Bilinmeyen"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: C.muted, marginBottom: 6 }}>
              <span>{"📅 " + fmtDate(b.event_date)}</span>
              {b.event_time && <span>{"🕐 " + b.event_time}</span>}
              {b.guest_count && <span>{"👥 " + b.guest_count + " kisi"}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 50,
                background: st.color + "18", color: st.color,
                border: "1px solid " + st.color + "30", fontWeight: 600
              }}>
                {st.emoji} {st.label}
              </span>
              {b.total_price && (
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                  {currSymbol(b.currency)}{b.total_price}
                </span>
              )}
            </div>
          </div>
        </div>
        {b.status === "completed" && (
          <div style={{ marginTop: 10 }}>
            <Btn small onClick={function() { setReviewModal(b); }}>Degerlendir</Btn>
          </div>
        )}
      </Card>;
    });
  }

  function renderChefBookings() {
    if (chefBookings.length === 0) {
      return <Empty emoji="📥" title="Gelen rezervasyon yok" desc="Hizmetlerinize yapilan rezervasyonlar burada gorunecek" />;
    }
    return chefBookings.map(function(b) {
      var st = statusObj(b.status);
      var client = b.client || {};
      var service = b.service || {};
      return <Card key={b.id}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Avatar url={client.avatar_url} name={client.display_name} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
              {service.title || "Hizmet"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
              Musteri: {client.display_name || "Bilinmeyen"}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: C.muted, marginBottom: 6 }}>
              <span>{"📅 " + fmtDate(b.event_date)}</span>
              {b.event_time && <span>{"🕐 " + b.event_time}</span>}
              {b.guest_count && <span>{"👥 " + b.guest_count + " kisi"}</span>}
            </div>
            {b.notes && (
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontStyle: "italic" }}>
                Not: {b.notes}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 50,
                background: st.color + "18", color: st.color,
                border: "1px solid " + st.color + "30", fontWeight: 600
              }}>
                {st.emoji} {st.label}
              </span>
              {b.total_price && (
                <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
                  {currSymbol(b.currency)}{b.total_price}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status action buttons for chef */}
        {(b.status === "pending" || b.status === "confirmed") && (
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {b.status === "pending" && (
              <Btn small onClick={function() { handleUpdateBookingStatus(b.id, "confirmed"); }}>
                Onayla
              </Btn>
            )}
            {b.status === "confirmed" && (
              <Btn small onClick={function() { handleUpdateBookingStatus(b.id, "completed"); }}>
                Tamamlandi
              </Btn>
            )}
            <Btn small variant="danger" onClick={function() { handleUpdateBookingStatus(b.id, "cancelled"); }}>
              Iptal Et
            </Btn>
          </div>
        )}
      </Card>;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER: Calendar
  // ══════════════════════════════════════════════════════════════
  function renderCalendar() {
    if (!userId) return <Empty emoji="🔒" title="Giris gerekli" desc="Takvimi gormek icin giris yapin" />;

    var totalDays = daysInMonth(calYear, calMonth);
    var startDay = firstDayOfMonth(calYear, calMonth);
    var today = new Date();
    var isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;
    var todayDate = today.getDate();

    // Build cells
    var cells = [];
    var i;
    for (i = 0; i < startDay; i++) {
      cells.push(null); // empty cells before month starts
    }
    for (i = 1; i <= totalDays; i++) {
      cells.push(i);
    }

    // Day bookings for selected day
    var dayBookings = calDay ? bookingsForDay(calDay) : [];

    return <div>
      {/* Month navigation */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 16, padding: "10px 0"
      }}>
        <button onClick={calPrev} style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--text)", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {"<"}
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
          {MONTH_NAMES[calMonth]} {calYear}
        </div>
        <button onClick={calNext} style={{
          width: 36, height: 36, borderRadius: 10, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--text)", fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {">"}
        </button>
      </div>

      {calLoading ? (
        <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>
      ) : (
        <div>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAY_NAMES.map(function(dn) {
              return <div key={dn} style={{
                textAlign: "center", fontSize: 11, fontWeight: 700,
                color: C.muted, padding: "6px 0", textTransform: "uppercase"
              }}>
                {dn}
              </div>;
            })}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map(function(day, idx) {
              if (day === null) {
                return <div key={"e" + idx} style={{ padding: 8 }} />;
              }
              var hasB = dayHasBooking(day);
              var isToday = isCurrentMonth && day === todayDate;
              var isSelected = calDay === day;

              return <button key={day} onClick={function() { setCalDay(isSelected ? null : day); }} style={{
                padding: "8px 4px", borderRadius: 10,
                border: isSelected ? "2px solid " + C.gold : isToday ? "2px solid " + C.blue : "1px solid transparent",
                background: isSelected ? "rgba(212,168,67,0.12)" : "var(--card)",
                color: isSelected ? C.goldL : isToday ? C.blue : "var(--text)",
                fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400,
                cursor: "pointer", position: "relative",
                minHeight: 44, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2,
                transition: "all 0.15s"
              }}>
                {day}
                {hasB && (
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: C.gold
                  }} />
                )}
              </button>;
            })}
          </div>

          {/* Selected day bookings */}
          {calDay && (
            <div style={{ marginTop: 16 }}>
              <SH emoji="📋" label={calDay + " " + MONTH_NAMES[calMonth] + " " + calYear + " Rezervasyonlari"} count={dayBookings.length} />
              {dayBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, fontSize: 13, color: C.muted }}>
                  Bu gun icin rezervasyon yok
                </div>
              ) : (
                dayBookings.map(function(b) {
                  var st = statusObj(b.status);
                  var other = b.chef || b.client || {};
                  var service = b.service || {};
                  return <Card key={b.id}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar url={other.avatar_url} name={other.display_name} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                          {service.title || "Hizmet"}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {other.display_name || ""} {b.event_time ? " - " + b.event_time : ""} {b.guest_count ? " - " + b.guest_count + " kisi" : ""}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, padding: "3px 8px", borderRadius: 50,
                        background: st.color + "18", color: st.color,
                        border: "1px solid " + st.color + "30", fontWeight: 600
                      }}>
                        {st.emoji} {st.label}
                      </span>
                    </div>
                  </Card>;
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>;
  }

  // ══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════════════════
  return <div>
    <SubTabs tabs={FREELANCE_MODES} active={mode} onChange={function(v) { setMode(v); }} />

    {mode === "browse" && renderBrowse()}
    {mode === "my_services" && renderMyServices()}
    {mode === "bookings" && renderBookings()}
    {mode === "calendar" && renderCalendar()}
  </div>;
}
