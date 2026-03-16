// Chef Network Platform — Supabase CRUD Layer
import { supabase } from "../../lib/supabase.js";

// ══════════════════════════════════════════════════════════════
// HELPER
// ══════════════════════════════════════════════════════════════
function ok(data) { return { data: data, error: null }; }
function err(e) { return { data: null, error: e && e.message ? e.message : String(e) }; }

function requireSupa() {
  if (!supabase) throw new Error("Supabase yapılandırılmamış");
}

// ══════════════════════════════════════════════════════════════
// 1. CHEF PROFILES
// ══════════════════════════════════════════════════════════════
export async function getMyProfile(userId) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return err(error);
  return ok(data);
}

export async function upsertProfile(userId, fields) {
  requireSupa();
  var payload = Object.assign({}, fields, {
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  var { data, error } = await supabase
    .from("chef_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getProfileById(profileId) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_profiles")
    .select("*")
    .eq("id", profileId)
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function searchChefs(query, filters) {
  requireSupa();
  var q = supabase.from("chef_profiles").select("*");
  if (query) q = q.or("display_name.ilike.%"+query+"%,city.ilike.%"+query+"%,country.ilike.%"+query+"%,bio.ilike.%"+query+"%");
  if (filters) {
    if (filters.city) q = q.ilike("city", "%"+filters.city+"%");
    if (filters.country) q = q.eq("country", filters.country);
    if (filters.title) q = q.eq("title", filters.title);
    if (filters.availability) q = q.eq("availability", filters.availability);
    if (filters.cuisine) q = q.contains("cuisine_specializations", [filters.cuisine]);
    if (filters.skill) q = q.contains("skills", [filters.skill]);
    if (filters.minExp) q = q.gte("experience_years", filters.minExp);
  }
  q = q.order("rating_avg", { ascending: false }).limit(50);
  var { data, error } = await q;
  if (error) return err(error);
  return ok(data || []);
}

// ══════════════════════════════════════════════════════════════
// 2. PORTFOLIO
// ══════════════════════════════════════════════════════════════
export async function getPortfolio(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_portfolio")
    .select("*")
    .eq("chef_id", chefId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function addPortfolioItem(chefId, item) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_portfolio")
    .insert(Object.assign({ chef_id: chefId }, item))
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function deletePortfolioItem(itemId) {
  requireSupa();
  var { error } = await supabase.from("chef_portfolio").delete().eq("id", itemId);
  if (error) return err(error);
  return ok(true);
}

// ══════════════════════════════════════════════════════════════
// 3. POSTS (Social Feed)
// ══════════════════════════════════════════════════════════════
export async function getFeed(userId, limit) {
  requireSupa();
  // Get posts from people user follows + own posts
  var { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  var ids = (followData || []).map(function(f) { return f.following_id; });
  ids.push(userId); // include own posts
  var { data, error } = await supabase
    .from("posts")
    .select("*, author:chef_profiles!author_id(id,display_name,avatar_url,title,badges)")
    .in("author_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit || 30);
  if (error) return err(error);
  return ok(data || []);
}

export async function getDiscoverPosts(limit) {
  requireSupa();
  var { data, error } = await supabase
    .from("posts")
    .select("*, author:chef_profiles!author_id(id,display_name,avatar_url,title,badges)")
    .order("likes_count", { ascending: false })
    .limit(limit || 30);
  if (error) return err(error);
  return ok(data || []);
}

export async function createPost(authorId, post) {
  requireSupa();
  var { data, error } = await supabase
    .from("posts")
    .insert(Object.assign({ author_id: authorId }, post))
    .select("*, author:chef_profiles!author_id(id,display_name,avatar_url,title,badges)")
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function deletePost(postId) {
  requireSupa();
  var { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return err(error);
  return ok(true);
}

// ══════════════════════════════════════════════════════════════
// 4. COMMENTS & LIKES
// ══════════════════════════════════════════════════════════════
export async function getComments(postId) {
  requireSupa();
  var { data, error } = await supabase
    .from("post_comments")
    .select("*, author:chef_profiles!author_id(id,display_name,avatar_url)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return err(error);
  return ok(data || []);
}

export async function addComment(postId, authorId, content) {
  requireSupa();
  var { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: authorId, content: content })
    .select("*, author:chef_profiles!author_id(id,display_name,avatar_url)")
    .single();
  if (error) return err(error);
  // increment comment count
  await supabase.rpc("increment_comment_count", { p_id: postId });
  return ok(data);
}

export async function toggleLike(postId, userId) {
  requireSupa();
  var { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    await supabase.rpc("decrement_like_count", { p_id: postId });
    return ok(false); // unliked
  } else {
    await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    await supabase.rpc("increment_like_count", { p_id: postId });
    return ok(true); // liked
  }
}

export async function getMyLikes(userId) {
  requireSupa();
  var { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId);
  if (error) return err(error);
  return ok((data || []).map(function(l) { return l.post_id; }));
}

// ══════════════════════════════════════════════════════════════
// 5. FOLLOWS
// ══════════════════════════════════════════════════════════════
export async function followChef(followerId, followingId) {
  requireSupa();
  var { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) return err(error);
  return ok(true);
}

export async function unfollowChef(followerId, followingId) {
  requireSupa();
  var { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) return err(error);
  return ok(true);
}

export async function getFollowers(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("follows")
    .select("follower:chef_profiles!follower_id(id,display_name,avatar_url,title)")
    .eq("following_id", chefId);
  if (error) return err(error);
  return ok((data || []).map(function(f) { return f.follower; }));
}

export async function getFollowing(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("follows")
    .select("following:chef_profiles!following_id(id,display_name,avatar_url,title)")
    .eq("follower_id", chefId);
  if (error) return err(error);
  return ok((data || []).map(function(f) { return f.following; }));
}

export async function getFollowingIds(chefId) {
  requireSupa();
  var { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", chefId);
  return (data || []).map(function(f) { return f.following_id; });
}

// ══════════════════════════════════════════════════════════════
// 6. CONNECTIONS
// ══════════════════════════════════════════════════════════════
export async function sendConnectionRequest(requesterId, receiverId) {
  requireSupa();
  var { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: requesterId, receiver_id: receiverId })
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function respondConnection(connectionId, accept) {
  requireSupa();
  var { data, error } = await supabase
    .from("connections")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", connectionId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getConnections(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("connections")
    .select("*, requester:chef_profiles!requester_id(id,display_name,avatar_url,title), receiver:chef_profiles!receiver_id(id,display_name,avatar_url,title)")
    .or("requester_id.eq."+chefId+",receiver_id.eq."+chefId)
    .eq("status", "accepted");
  if (error) return err(error);
  return ok(data || []);
}

export async function getPendingConnections(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("connections")
    .select("*, requester:chef_profiles!requester_id(id,display_name,avatar_url,title)")
    .eq("receiver_id", chefId)
    .eq("status", "pending");
  if (error) return err(error);
  return ok(data || []);
}

// ══════════════════════════════════════════════════════════════
// 7. MESSAGES
// ══════════════════════════════════════════════════════════════
export async function getConversations(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("conversations")
    .select("*")
    .contains("participants", [chefId])
    .order("last_message_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function getOrCreateConversation(myId, otherId) {
  requireSupa();
  // Check existing
  var { data: convs } = await supabase
    .from("conversations")
    .select("*")
    .contains("participants", [myId, otherId]);
  var existing = (convs || []).find(function(c) {
    return c.participants.length === 2 &&
      c.participants.includes(myId) &&
      c.participants.includes(otherId);
  });
  if (existing) return ok(existing);
  // Create new
  var { data, error } = await supabase
    .from("conversations")
    .insert({ participants: [myId, otherId] })
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getMessages(conversationId, limit) {
  requireSupa();
  var { data, error } = await supabase
    .from("messages")
    .select("*, sender:chef_profiles!sender_id(id,display_name,avatar_url)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit || 100);
  if (error) return err(error);
  return ok(data || []);
}

export async function sendMessage(conversationId, senderId, content, mediaUrl) {
  requireSupa();
  var msg = { conversation_id: conversationId, sender_id: senderId, content: content };
  if (mediaUrl) msg.media_url = mediaUrl;
  var { data, error } = await supabase
    .from("messages")
    .insert(msg)
    .select("*, sender:chef_profiles!sender_id(id,display_name,avatar_url)")
    .single();
  if (error) return err(error);
  // Update last_message_at
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  return ok(data);
}

export async function markMessagesRead(conversationId, userId) {
  requireSupa();
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .eq("is_read", false);
  return ok(true);
}

export async function getUnreadCount(userId) {
  requireSupa();
  var { data: convs } = await supabase
    .from("conversations")
    .select("id")
    .contains("participants", [userId]);
  if (!convs || convs.length === 0) return 0;
  var ids = convs.map(function(c) { return c.id; });
  var { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .in("conversation_id", ids)
    .neq("sender_id", userId)
    .eq("is_read", false);
  return count || 0;
}

// ══════════════════════════════════════════════════════════════
// 8. JOBS
// ══════════════════════════════════════════════════════════════
export async function getJobs(filters) {
  requireSupa();
  var q = supabase
    .from("jobs")
    .select("*, poster:chef_profiles!poster_id(id,display_name,avatar_url,title)")
    .eq("is_active", true);
  if (filters) {
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.job_type) q = q.eq("job_type", filters.job_type);
    if (filters.city) q = q.ilike("city", "%"+filters.city+"%");
    if (filters.country) q = q.eq("country", filters.country);
    if (filters.cuisine) q = q.contains("cuisine_required", [filters.cuisine]);
    if (filters.skill) q = q.contains("skills_required", [filters.skill]);
    if (filters.minSalary) q = q.gte("salary_min", filters.minSalary);
  }
  q = q.order("created_at", { ascending: false }).limit(50);
  var { data, error } = await q;
  if (error) return err(error);
  return ok(data || []);
}

export async function createJob(posterId, job) {
  requireSupa();
  var { data, error } = await supabase
    .from("jobs")
    .insert(Object.assign({ poster_id: posterId }, job))
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function updateJob(jobId, fields) {
  requireSupa();
  var { data, error } = await supabase
    .from("jobs")
    .update(fields)
    .eq("id", jobId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getMyJobs(posterId) {
  requireSupa();
  var { data, error } = await supabase
    .from("jobs")
    .select("*, applications:job_applications(count)")
    .eq("poster_id", posterId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

// ══════════════════════════════════════════════════════════════
// 9. JOB APPLICATIONS
// ══════════════════════════════════════════════════════════════
export async function applyToJob(jobId, applicantId, coverLetter) {
  requireSupa();
  var { data, error } = await supabase
    .from("job_applications")
    .insert({ job_id: jobId, applicant_id: applicantId, cover_letter: coverLetter })
    .select()
    .single();
  if (error) return err(error);
  // Increment applications_count
  await supabase.rpc("increment_job_applications", { j_id: jobId });
  return ok(data);
}

export async function getMyApplications(applicantId) {
  requireSupa();
  var { data, error } = await supabase
    .from("job_applications")
    .select("*, job:jobs!job_id(id,title,city,country,category,poster:chef_profiles!poster_id(display_name,avatar_url))")
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function getJobApplicants(jobId) {
  requireSupa();
  var { data, error } = await supabase
    .from("job_applications")
    .select("*, applicant:chef_profiles!applicant_id(*)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function updateApplicationStatus(applicationId, status) {
  requireSupa();
  var { data, error } = await supabase
    .from("job_applications")
    .update({ status: status })
    .eq("id", applicationId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

// ══════════════════════════════════════════════════════════════
// 10. CHEF SERVICES (Freelance)
// ══════════════════════════════════════════════════════════════
export async function getServices(filters) {
  requireSupa();
  var q = supabase
    .from("chef_services")
    .select("*, chef:chef_profiles!chef_id(id,display_name,avatar_url,title,city,country,rating_avg,badges)")
    .eq("is_active", true);
  if (filters) {
    if (filters.service_type) q = q.eq("service_type", filters.service_type);
    if (filters.city) q = q.ilike("location", "%"+filters.city+"%");
    if (filters.maxPrice) q = q.lte("price_min", filters.maxPrice);
  }
  q = q.order("created_at", { ascending: false }).limit(50);
  var { data, error } = await q;
  if (error) return err(error);
  return ok(data || []);
}

export async function createService(chefId, service) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_services")
    .insert(Object.assign({ chef_id: chefId }, service))
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getMyServices(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_services")
    .select("*")
    .eq("chef_id", chefId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function updateService(serviceId, fields) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_services")
    .update(fields)
    .eq("id", serviceId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function deleteService(serviceId) {
  requireSupa();
  var { error } = await supabase.from("chef_services").delete().eq("id", serviceId);
  if (error) return err(error);
  return ok(true);
}

// ══════════════════════════════════════════════════════════════
// 11. BOOKINGS
// ══════════════════════════════════════════════════════════════
export async function createBooking(booking) {
  requireSupa();
  var { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("*, service:chef_services!service_id(title,service_type), chef:chef_profiles!chef_id(display_name,avatar_url)")
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getMyBookingsAsClient(clientId) {
  requireSupa();
  var { data, error } = await supabase
    .from("bookings")
    .select("*, service:chef_services!service_id(title,service_type), chef:chef_profiles!chef_id(display_name,avatar_url)")
    .eq("client_id", clientId)
    .order("event_date", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function getMyBookingsAsChef(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("bookings")
    .select("*, service:chef_services!service_id(title,service_type), client:chef_profiles!client_id(display_name,avatar_url)")
    .eq("chef_id", chefId)
    .order("event_date", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function updateBookingStatus(bookingId, status) {
  requireSupa();
  var { data, error } = await supabase
    .from("bookings")
    .update({ status: status })
    .eq("id", bookingId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

// ══════════════════════════════════════════════════════════════
// 12. REVIEWS
// ══════════════════════════════════════════════════════════════
export async function addReview(review) {
  requireSupa();
  var { data, error } = await supabase
    .from("reviews")
    .insert(review)
    .select("*, reviewer:chef_profiles!reviewer_id(display_name,avatar_url)")
    .single();
  if (error) return err(error);
  // Update chef rating avg
  var { data: stats } = await supabase
    .from("reviews")
    .select("rating")
    .eq("chef_id", review.chef_id);
  if (stats && stats.length > 0) {
    var avg = stats.reduce(function(s, r) { return s + r.rating; }, 0) / stats.length;
    await supabase
      .from("chef_profiles")
      .update({ rating_avg: Math.round(avg * 10) / 10, rating_count: stats.length })
      .eq("id", review.chef_id);
  }
  return ok(data);
}

export async function getReviews(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:chef_profiles!reviewer_id(display_name,avatar_url,title)")
    .eq("chef_id", chefId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

// ══════════════════════════════════════════════════════════════
// 13. GROUPS
// ══════════════════════════════════════════════════════════════
export async function getGroups(category) {
  requireSupa();
  var q = supabase.from("chef_groups").select("*, creator:chef_profiles!creator_id(display_name,avatar_url)");
  if (category) q = q.eq("category", category);
  q = q.order("member_count", { ascending: false }).limit(30);
  var { data, error } = await q;
  if (error) return err(error);
  return ok(data || []);
}

export async function createGroup(creatorId, group) {
  requireSupa();
  var { data, error } = await supabase
    .from("chef_groups")
    .insert(Object.assign({ creator_id: creatorId }, group))
    .select()
    .single();
  if (error) return err(error);
  // Auto-join creator
  await supabase.from("group_members").insert({ group_id: data.id, member_id: creatorId, role: "admin" });
  return ok(data);
}

export async function joinGroup(groupId, memberId) {
  requireSupa();
  var { error } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, member_id: memberId });
  if (error) return err(error);
  await supabase.rpc("increment_group_members", { g_id: groupId });
  return ok(true);
}

export async function leaveGroup(groupId, memberId) {
  requireSupa();
  var { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("member_id", memberId);
  if (error) return err(error);
  await supabase.rpc("decrement_group_members", { g_id: groupId });
  return ok(true);
}

export async function getMyGroups(memberId) {
  requireSupa();
  var { data, error } = await supabase
    .from("group_members")
    .select("group:chef_groups!group_id(*)")
    .eq("member_id", memberId);
  if (error) return err(error);
  return ok((data || []).map(function(g) { return g.group; }));
}

// ══════════════════════════════════════════════════════════════
// 14. NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
export async function getNotifications(userId, limit) {
  requireSupa();
  var { data, error } = await supabase
    .from("notifications")
    .select("*, actor:chef_profiles!actor_id(id,display_name,avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit || 30);
  if (error) return err(error);
  return ok(data || []);
}

export async function markNotificationsRead(userId) {
  requireSupa();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return ok(true);
}

export async function createNotification(userId, type, actorId, entityType, entityId) {
  requireSupa();
  // Don't notify yourself
  if (userId === actorId) return ok(null);
  await supabase.from("notifications").insert({
    user_id: userId,
    type: type,
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
  });
  return ok(true);
}

export async function getUnreadNotifCount(userId) {
  requireSupa();
  var { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count || 0;
}

// ══════════════════════════════════════════════════════════════
// 15. COLLABORATIONS
// ══════════════════════════════════════════════════════════════
export async function createCollaboration(collab) {
  requireSupa();
  var { data, error } = await supabase
    .from("collaborations")
    .insert(collab)
    .select("*, initiator:chef_profiles!initiator_id(display_name,avatar_url), partner:chef_profiles!partner_id(display_name,avatar_url)")
    .single();
  if (error) return err(error);
  return ok(data);
}

export async function getCollaborations(chefId) {
  requireSupa();
  var { data, error } = await supabase
    .from("collaborations")
    .select("*, initiator:chef_profiles!initiator_id(display_name,avatar_url,title), partner:chef_profiles!partner_id(display_name,avatar_url,title)")
    .or("initiator_id.eq."+chefId+",partner_id.eq."+chefId)
    .order("created_at", { ascending: false });
  if (error) return err(error);
  return ok(data || []);
}

export async function updateCollabStatus(collabId, status) {
  requireSupa();
  var { data, error } = await supabase
    .from("collaborations")
    .update({ status: status })
    .eq("id", collabId)
    .select()
    .single();
  if (error) return err(error);
  return ok(data);
}

// ══════════════════════════════════════════════════════════════
// 16. FILE UPLOAD (Supabase Storage)
// ══════════════════════════════════════════════════════════════
export async function uploadFile(bucket, path, file) {
  requireSupa();
  var { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) return err(error);
  var { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return ok(urlData.publicUrl);
}

export async function uploadAvatar(userId, file) {
  var ext = file.name.split(".").pop();
  var path = "avatars/" + userId + "." + ext;
  return uploadFile("chef-media", path, file);
}

export async function uploadPortfolioMedia(chefId, file) {
  var ext = file.name.split(".").pop();
  var path = "portfolio/" + chefId + "/" + Date.now() + "." + ext;
  return uploadFile("chef-media", path, file);
}

export async function uploadMessageMedia(senderId, file) {
  var ext = file.name.split(".").pop();
  var path = "messages/" + senderId + "/" + Date.now() + "." + ext;
  return uploadFile("chef-media", path, file);
}
