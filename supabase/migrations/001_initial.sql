-- =========================================================
-- JeddahEvents — Initial Schema, RLS Policies & Seed Data
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- TABLES
-- =========================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  image_url TEXT,
  ticket_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cafes
CREATE TABLE IF NOT EXISTS cafes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  hours TEXT,
  rating NUMERIC DEFAULT 0,
  price_tier INTEGER DEFAULT 2 CHECK (price_tier BETWEEN 1 AND 4),
  image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  tags TEXT[] DEFAULT '{}',
  wifi BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews (for both events and cafes)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  cafe_id UUID REFERENCES cafes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT reviews_target_check CHECK (
    (event_id IS NOT NULL AND cafe_id IS NULL) OR
    (cafe_id IS NOT NULL AND event_id IS NULL)
  )
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('event', 'cafe')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Posts
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  location_tag TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Events: public read, authenticated insert, own update
CREATE POLICY "events_select_approved" ON events FOR SELECT USING (is_approved = true OR auth.uid() = submitted_by);
CREATE POLICY "events_insert_authenticated" ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update_own" ON events FOR UPDATE USING (auth.uid() = submitted_by);

-- Cafes: public read only
CREATE POLICY "cafes_select_all" ON cafes FOR SELECT USING (true);

-- Reviews: public read, auth write
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Attendance: auth CRUD own records
CREATE POLICY "attendance_select_all" ON attendance FOR SELECT USING (true);
CREATE POLICY "attendance_insert_own" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attendance_delete_own" ON attendance FOR DELETE USING (auth.uid() = user_id);

-- Favorites: own records
CREATE POLICY "favorites_select_own" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Follows
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Posts
CREATE POLICY "posts_select_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "likes_select_all" ON likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "comments_select_all" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON comments FOR DELETE USING (auth.uid() = user_id);

-- =========================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =========================================================
-- SEED DATA — PROFILES
-- =========================================================

INSERT INTO profiles (id, email, full_name, username, bio, avatar_url)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@jeddahevents.sa', 'Jeddah Events Admin', 'jeddah_events', 'The official JeddahEvents team account. Sharing the best of Jeddah!', null),
  ('00000000-0000-0000-0000-000000000002', 'sara@example.com', 'Sara Al-Zahrani', 'sara_jed', 'Food lover and event enthusiast from Jeddah 🌊', null)
ON CONFLICT DO NOTHING;

-- =========================================================
-- SEED DATA — EVENTS (10 events)
-- =========================================================

INSERT INTO events (title, description, category, date, venue, price, image_url, latitude, longitude, is_featured, is_approved, submitted_by)
VALUES
  (
    'Jeddah Jazz Festival',
    'Three nights of world-class jazz at the beautiful Al Corniche waterfront. Featuring local and international jazz artists performing under the stars with the Red Sea as backdrop.',
    'Music',
    NOW() + INTERVAL '7 days',
    'Al Corniche Amphitheater, Jeddah',
    80,
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    21.5168,
    39.1625,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Historic Jeddah Photography Walk',
    'Guided photography walk through Al-Balad (Jeddah Historic District), a UNESCO World Heritage Site. Perfect for photography enthusiasts of all levels.',
    'Art',
    NOW() + INTERVAL '3 days',
    'Al-Balad, Jeddah Historic Area',
    50,
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800',
    21.4858,
    39.1862,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Stand-Up Comedy Night',
    'Laugh out loud with Saudi Arabia''s funniest comedians performing live at Red Sea Mall. Bilingual show in Arabic and English.',
    'Comedy',
    NOW() + INTERVAL '5 days',
    'Red Sea Mall Event Hall, Jeddah',
    120,
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
    21.5921,
    39.1726,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Digital Art Exhibition: Future Visions',
    'An immersive digital art exhibition featuring Saudi and Arab artists exploring themes of identity, technology, and the future of the Middle East.',
    'Art',
    NOW() + INTERVAL '10 days',
    'Jeddah Art Week Gallery, Al-Hamra District',
    60,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    21.5433,
    39.1728,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Red Sea Food Festival',
    'A 3-day celebration of Jeddah''s incredible culinary scene. Over 50 restaurants and food trucks serving everything from traditional Hejazi cuisine to international fare.',
    'Food',
    NOW() + INTERVAL '14 days',
    'King Abdullah Sports City, Jeddah',
    30,
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    21.6592,
    39.1733,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'UI/UX Design Masterclass',
    'Full-day workshop led by industry experts. Learn the latest design thinking methodologies, Figma tricks, and user research techniques. Certificate provided.',
    'Workshop',
    NOW() + INTERVAL '8 days',
    'The Garage Co-working, Tahlia Street',
    200,
    'https://images.unsplash.com/photo-1587440871875-191322ee64b0?w=800',
    21.5784,
    39.1681,
    false,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Jeddah Triathlon 2026',
    'Annual triathlon event along the stunning Jeddah Corniche. Open and elite categories available. Registration includes swim cap and finisher medal.',
    'Sports',
    NOW() + INTERVAL '21 days',
    'Al Corniche Road, North Jeddah',
    150,
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
    21.6190,
    39.1035,
    false,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Oud & Violin Evening',
    'An enchanting fusion performance combining traditional Arabic oud with classical violin. Set in the intimate courtyard of a restored traditional Jeddah house.',
    'Music',
    NOW() + INTERVAL '4 days',
    'Beit Al Othman Heritage House, Al-Balad',
    90,
    'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800',
    21.4912,
    39.1891,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Children''s Science Festival',
    'A free family-friendly science festival with interactive experiments, robotics demonstrations, and educational activities for children aged 5-15.',
    'Workshop',
    NOW() + INTERVAL '9 days',
    'King Abdulaziz Center for World Culture (Ithra), Jeddah Branch',
    0,
    'https://images.unsplash.com/photo-1532094349884-543290128878?w=800',
    21.5273,
    39.1925,
    false,
    true,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Sunset Dhow Cruise',
    'Experience Jeddah from the sea aboard a traditional dhow. Enjoy sunset views of the city skyline, complimentary Arabic coffee, and live oud music.',
    'Festival',
    NOW() + INTERVAL '2 days',
    'Jeddah Yacht Club, North Corniche',
    180,
    'https://images.unsplash.com/photo-1548574505-5e239809ee19?w=800',
    21.6833,
    39.0876,
    true,
    true,
    '00000000-0000-0000-0000-000000000001'
  );

-- =========================================================
-- SEED DATA — CAFES (8 cafes)
-- =========================================================

INSERT INTO cafes (name, description, address, phone, website, hours, rating, price_tier, image_url, latitude, longitude, tags, wifi)
VALUES
  (
    'Brew Lab Jeddah',
    'Specialty coffee roasters and craft brew bar. Known for their single-origin pour-overs and minimalist aesthetic. One of Jeddah''s top specialty coffee destinations.',
    'Tahlia Street, Al-Rawda District, Jeddah',
    '+966-12-345-6789',
    'https://brewlab.sa',
    'Daily 7:00 AM – 12:00 AM',
    4.8,
    3,
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    21.5784,
    39.1681,
    ARRAY['Specialty Coffee', 'Work-friendly', 'Hidden Gems'],
    true
  ),
  (
    'The Corniche Cafe',
    'Iconic beachfront cafe overlooking the Red Sea. Famous for their seafood sandwiches and fresh juices. A Jeddah institution since 2010.',
    'Al Corniche Road, North Jeddah',
    '+966-12-345-0001',
    null,
    'Daily 6:00 AM – 2:00 AM',
    4.5,
    2,
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
    21.6021,
    39.0976,
    ARRAY['Outdoor Seating', 'Sea View', 'Late Night'],
    false
  ),
  (
    'Al Balad Qahwa House',
    'Traditional Arabian coffee house in the heart of Jeddah Historic Area. Serving authentic qahwa (cardamom coffee) and dates in a beautifully restored Ottoman-era building.',
    'Al-Balad Historic District, Jeddah',
    '+966-12-647-8921',
    null,
    'Daily 9:00 AM – 11:00 PM',
    4.9,
    1,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800',
    21.4891,
    39.1876,
    ARRAY['Hidden Gems', 'Traditional'],
    false
  ),
  (
    'Espresso Republic',
    'Modern third-wave coffee shop with 20+ brewing methods available. Barista champions on staff. Popular with Jeddah''s creative and tech community.',
    'Prince Mohammed Bin Abdulaziz Road (Tahlia), Jeddah',
    '+966-12-345-9999',
    'https://espressorepublic.com.sa',
    'Mon-Thu 7:00 AM – 11:00 PM, Fri-Sat 7:00 AM – 1:00 AM',
    4.7,
    3,
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
    21.5721,
    39.1652,
    ARRAY['Specialty Coffee', 'Work-friendly', 'Outdoor Seating'],
    true
  ),
  (
    'Midnight Garden Cafe',
    'Atmospheric rooftop cafe with fairy lights and a curated playlist. Best visited after 10 PM when the city comes alive. Serves craft cocktails (non-alcoholic) and gourmet bites.',
    'Al-Hamra District, Jeddah',
    '+966-12-665-4321',
    null,
    'Daily 4:00 PM – 3:00 AM',
    4.6,
    3,
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
    21.5392,
    39.1659,
    ARRAY['Late Night', 'Outdoor Seating', 'Hidden Gems'],
    true
  ),
  (
    'Kinda Cafe',
    'Cozy neighborhood cafe beloved for its house-baked croissants and friendly staff. The loyalty card is worth it — 10th coffee is free.',
    'Al-Rawdah District, Jeddah',
    '+966-12-221-7654',
    null,
    'Daily 7:30 AM – 10:30 PM',
    4.4,
    2,
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800',
    21.5841,
    39.1723,
    ARRAY['Work-friendly', 'Cozy'],
    true
  ),
  (
    'Sea Salt Kitchen & Coffee',
    'Fresh coastal-inspired cafe with the best açaí bowls in Jeddah. Healthy, clean-eating menu with specialty coffee. Very popular with the fitness community.',
    'Obhur Area, North Jeddah',
    '+966-12-699-1234',
    'https://seasaltkitchen.sa',
    'Daily 7:00 AM – 10:00 PM',
    4.6,
    3,
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
    21.7102,
    39.0943,
    ARRAY['Outdoor Seating', 'Healthy', 'Specialty Coffee'],
    true
  ),
  (
    'Urban Grind Co.',
    'Industrial-chic coffee bar doubling as a co-working space. Unlimited refills on drip coffee with day pass. High-speed WiFi and standing desks available.',
    'Al-Andalus Mall Area, Jeddah',
    '+966-12-455-8800',
    null,
    'Mon-Fri 8:00 AM – 10:00 PM, Sat-Sun 9:00 AM – 11:00 PM',
    4.3,
    2,
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    21.5612,
    39.1839,
    ARRAY['Work-friendly', 'Late Night'],
    true
  );

-- =========================================================
-- REALTIME — Enable for social features
-- =========================================================

-- Enable realtime on posts table (run this in Supabase dashboard or via CLI)
-- ALTER PUBLICATION supabase_realtime ADD TABLE posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE likes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE comments;
