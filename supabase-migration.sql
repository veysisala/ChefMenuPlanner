-- ══════════════════════════════════════════════════════════════
-- Chef Network Platform — Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ══════════════════════════════════════════════════════════════

-- 1. Chef Profiles
CREATE TABLE IF NOT EXISTS chef_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  city TEXT,
  country TEXT,
  title TEXT,
  cuisine_specializations TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  experience_years INT DEFAULT 0,
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  signature_dishes JSONB DEFAULT '[]',
  availability TEXT DEFAULT 'none',
  bio TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}',
  rating_avg NUMERIC(2,1) DEFAULT 0,
  rating_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chef_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read chef_profiles" ON chef_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON chef_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON chef_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON chef_profiles FOR DELETE USING (auth.uid() = user_id);

-- 2. Portfolio
CREATE TABLE IF NOT EXISTS chef_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('photo','video','menu','event')),
  title TEXT,
  description TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chef_portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read portfolio" ON chef_portfolio FOR SELECT USING (true);
CREATE POLICY "Owners can insert portfolio" ON chef_portfolio FOR INSERT
  WITH CHECK (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Owners can delete portfolio" ON chef_portfolio FOR DELETE
  USING (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 3. Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_urls TEXT[] DEFAULT '{}',
  post_type TEXT DEFAULT 'general',
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authors can insert posts" ON posts FOR INSERT
  WITH CHECK (author_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors can update posts" ON posts FOR UPDATE
  USING (author_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors can delete posts" ON posts FOR DELETE
  USING (author_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 4. Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Authors can insert comments" ON post_comments FOR INSERT
  WITH CHECK (author_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Authors can delete own comments" ON post_comments FOR DELETE
  USING (author_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 5. Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON post_likes FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unlike" ON post_likes FOR DELETE
  USING (user_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 6. Follows
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON follows FOR INSERT
  WITH CHECK (follower_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can unfollow" ON follows FOR DELETE
  USING (follower_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 7. Connections
CREATE TABLE IF NOT EXISTS connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, receiver_id)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read connections" ON connections FOR SELECT
  USING (
    requester_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can send connection" ON connections FOR INSERT
  WITH CHECK (requester_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Participants can update connection" ON connections FOR UPDATE
  USING (
    requester_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
  );

-- 8. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants UUID[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read conversations" ON conversations FOR SELECT
  USING (auth.uid()::text = ANY(
    SELECT (cp.user_id)::text FROM chef_profiles cp WHERE cp.id = ANY(participants)
  ));
CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Participants can update conversations" ON conversations FOR UPDATE
  USING (auth.uid()::text = ANY(
    SELECT (cp.user_id)::text FROM chef_profiles cp WHERE cp.id = ANY(participants)
  ));

-- 9. Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Conversation participants can read messages" ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE auth.uid()::text = ANY(
      SELECT (cp.user_id)::text FROM chef_profiles cp WHERE cp.id = ANY(c.participants)
    )
  ));
CREATE POLICY "Senders can insert messages" ON messages FOR INSERT
  WITH CHECK (sender_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Recipients can mark read" ON messages FOR UPDATE
  USING (conversation_id IN (
    SELECT c.id FROM conversations c
    WHERE auth.uid()::text = ANY(
      SELECT (cp.user_id)::text FROM chef_profiles cp WHERE cp.id = ANY(c.participants)
    )
  ));

-- 10. Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poster_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  job_type TEXT,
  category TEXT,
  cuisine_required TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  experience_min INT DEFAULT 0,
  city TEXT,
  country TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'TRY',
  is_active BOOLEAN DEFAULT TRUE,
  applications_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Users can post jobs" ON jobs FOR INSERT
  WITH CHECK (poster_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Posters can update jobs" ON jobs FOR UPDATE
  USING (poster_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Posters can delete jobs" ON jobs FOR DELETE
  USING (poster_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 11. Job Applications
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status TEXT DEFAULT 'applied',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants can read own applications" ON job_applications FOR SELECT
  USING (
    applicant_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR job_id IN (SELECT id FROM jobs WHERE poster_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()))
  );
CREATE POLICY "Users can apply" ON job_applications FOR INSERT
  WITH CHECK (applicant_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Job posters can update status" ON job_applications FOR UPDATE
  USING (job_id IN (SELECT id FROM jobs WHERE poster_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())));

-- 12. Chef Services
CREATE TABLE IF NOT EXISTS chef_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  service_type TEXT,
  title TEXT,
  description TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  price_currency TEXT DEFAULT 'TRY',
  price_unit TEXT DEFAULT 'event',
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chef_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active services" ON chef_services FOR SELECT USING (true);
CREATE POLICY "Chefs can create services" ON chef_services FOR INSERT
  WITH CHECK (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Chefs can update services" ON chef_services FOR UPDATE
  USING (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Chefs can delete services" ON chef_services FOR DELETE
  USING (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 13. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES chef_services(id) ON DELETE CASCADE,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  event_date DATE,
  event_time TIME,
  guest_count INT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  total_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read bookings" ON bookings FOR SELECT
  USING (
    chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR client_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Clients can create bookings" ON bookings FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Chefs can update bookings" ON bookings FOR UPDATE
  USING (chef_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 14. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  review_type TEXT DEFAULT 'booking',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewers can insert reviews" ON reviews FOR INSERT
  WITH CHECK (reviewer_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 15. Chef Groups
CREATE TABLE IF NOT EXISTS chef_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  description TEXT,
  cover_url TEXT,
  category TEXT,
  creator_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  member_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chef_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read groups" ON chef_groups FOR SELECT USING (true);
CREATE POLICY "Users can create groups" ON chef_groups FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Creators can update groups" ON chef_groups FOR UPDATE
  USING (creator_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES chef_groups(id) ON DELETE CASCADE,
  member_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (group_id, member_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE
  USING (member_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 16. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  type TEXT,
  actor_id UUID REFERENCES chef_profiles(id),
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT
  USING (user_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));

-- 17. Collaborations
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES chef_profiles(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  collab_type TEXT,
  status TEXT DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read collaborations" ON collaborations FOR SELECT
  USING (
    initiator_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR partner_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create collaborations" ON collaborations FOR INSERT
  WITH CHECK (initiator_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Participants can update collaborations" ON collaborations FOR UPDATE
  USING (
    initiator_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
    OR partner_id IN (SELECT id FROM chef_profiles WHERE user_id = auth.uid())
  );

-- ══════════════════════════════════════════════════════════════
-- RPC Functions (for atomic counter updates)
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION increment_like_count(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_like_count(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comment_count(p_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_job_applications(j_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE jobs SET applications_count = applications_count + 1 WHERE id = j_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_group_members(g_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chef_groups SET member_count = member_count + 1 WHERE id = g_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_group_members(g_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chef_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = g_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════════════════════════
-- Indexes for performance
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_chef_profiles_user_id ON chef_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_chef_profiles_city ON chef_profiles(city);
CREATE INDEX IF NOT EXISTS idx_chef_profiles_country ON chef_profiles(country);
CREATE INDEX IF NOT EXISTS idx_chef_profiles_title ON chef_profiles(title);
CREATE INDEX IF NOT EXISTS idx_chef_profiles_availability ON chef_profiles(availability);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_chef_services_chef ON chef_services(chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_services_type ON chef_services(service_type);

CREATE INDEX IF NOT EXISTS idx_bookings_chef ON bookings(chef_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(event_date);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_reviews_chef ON reviews(chef_id);

-- ══════════════════════════════════════════════════════════════
-- Storage Bucket (run in Supabase Dashboard → Storage)
-- ══════════════════════════════════════════════════════════════
-- Create bucket: chef-media (public)
-- Folders: avatars/, portfolio/, messages/

-- Done! Now configure your .env:
-- VITE_SUPABASE_URL=https://your-project.supabase.co
-- VITE_SUPABASE_ANON_KEY=your-anon-key
