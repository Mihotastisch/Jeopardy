// Run this SQL in your Supabase SQL editor to set up the database:
export const setupSQL = `
-- quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

-- questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  position INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
  media_url TEXT DEFAULT ''
);

-- Enable Row Level Security (optional, open access for now)
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users
CREATE POLICY IF NOT EXISTS "Allow all on quizzes" ON quizzes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow all on questions" ON questions FOR ALL TO anon USING (true) WITH CHECK (true);
`
