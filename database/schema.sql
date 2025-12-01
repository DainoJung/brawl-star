-- Brawl-Star Medicine Management Database Schema
-- Run this SQL in Supabase SQL Editor

-- 1. Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create medicines table
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  timing TEXT NOT NULL,  -- 'before_meal' | 'after_meal'
  times TEXT[] NOT NULL,
  days TEXT[] DEFAULT ARRAY['월','화','수','목','금','토','일'],
  confidence FLOAT,
  original_text TEXT,
  warning TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'completed' | 'missed'
  taken_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create alarms table
CREATE TABLE IF NOT EXISTS alarms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  time TIME NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  days TEXT[] DEFAULT ARRAY['월','화','수','목','금','토','일'],
  sound TEXT DEFAULT 'default',
  vibration BOOLEAN DEFAULT TRUE,
  gradual_volume BOOLEAN DEFAULT TRUE,
  snooze_enabled BOOLEAN DEFAULT TRUE,
  snooze_interval INTEGER DEFAULT 5,
  snooze_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medicines_user_id ON medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies (Allow all for now since we use temporary user IDs)
-- Profiles: Anyone can read/write their own data
CREATE POLICY "Users can manage their own profile" ON profiles
  FOR ALL USING (true);

-- Medicines: Users can manage their own medicines
CREATE POLICY "Users can manage their own medicines" ON medicines
  FOR ALL USING (true);

-- Schedules: Users can manage their own schedules
CREATE POLICY "Users can manage their own schedules" ON schedules
  FOR ALL USING (true);

-- Alarms: Users can manage their own alarms
CREATE POLICY "Users can manage their own alarms" ON alarms
  FOR ALL USING (true);

-- Chat messages: Users can manage their own messages
CREATE POLICY "Users can manage their own chat messages" ON chat_messages
  FOR ALL USING (true);

-- 10. Create a default test user for development
INSERT INTO profiles (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', '테스트 사용자')
ON CONFLICT (id) DO NOTHING;

-- Done! Tables are ready to use.
