-- ============================================================
-- Jeopardy Quiz App – Datenbanksetup
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- 1. Tabellen anlegen (falls noch nicht vorhanden)

CREATE TABLE IF NOT EXISTS quizzes (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT        NOT NULL,
  description  TEXT        DEFAULT '',
  creator_name TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id       UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id  UUID    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  name     TEXT    NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id   UUID    NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  quiz_id       UUID    NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT    NOT NULL,
  answer_text   TEXT    NOT NULL,
  points        INTEGER NOT NULL DEFAULT 100,
  position      INTEGER NOT NULL DEFAULT 0,
  media_type         TEXT    NOT NULL DEFAULT 'none'
                     CHECK (media_type IN ('none', 'image', 'video')),
  media_url          TEXT    DEFAULT '',
  answer_media_type  TEXT    NOT NULL DEFAULT 'none'
                     CHECK (answer_media_type IN ('none', 'image', 'video')),
  answer_media_url   TEXT    DEFAULT ''
);

-- Migration für bestehende Datenbanken (nur nötig wenn Tabelle bereits existiert)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_media_type TEXT NOT NULL DEFAULT 'none'
  CHECK (answer_media_type IN ('none', 'image', 'video'));
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer_media_url TEXT DEFAULT '';

-- 2. Berechtigungen setzen (WICHTIG – ohne diesen Block funktioniert die App nicht)

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes    TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions  TO anon, authenticated, service_role;

-- 3. Row Level Security aktivieren

ALTER TABLE quizzes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions  ENABLE ROW LEVEL SECURITY;

-- 4. Policies anlegen (öffentlicher Lese- und Schreibzugriff)

DROP POLICY IF EXISTS "pub_quizzes"    ON quizzes;
DROP POLICY IF EXISTS "pub_categories" ON categories;
DROP POLICY IF EXISTS "pub_questions"  ON questions;

CREATE POLICY "pub_quizzes"    ON quizzes    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pub_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pub_questions"  ON questions  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
