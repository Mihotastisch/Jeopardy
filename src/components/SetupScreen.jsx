export default function SetupScreen() {
  const sql = `CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, description TEXT DEFAULT '',
  creator_name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  name TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL, answer_text TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100, position INTEGER NOT NULL DEFAULT 0,
  media_type TEXT NOT NULL DEFAULT 'none' CHECK (media_type IN ('none','image','video')),
  media_url TEXT DEFAULT ''
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_quizzes" ON quizzes FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pub_categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "pub_questions" ON questions FOR ALL TO anon USING (true) WITH CHECK (true);`

  return (
    <div className="min-h-screen bg-[#060b1a] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-black text-yellow-400 mb-2" style={{ fontFamily: 'Georgia, serif' }}>JEOPARDY!</h1>
        <p className="text-red-400 text-lg mb-8">⚠ Setup erforderlich</p>

        <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-3">Schritt 1: Datenbank anlegen</h2>
          <p className="text-blue-300 text-sm mb-3">
            Gehe zu deinem <a href="https://supabase.com/dashboard" target="_blank" className="text-yellow-400 underline">Supabase Dashboard</a> →
            SQL Editor → New Query und führe dieses SQL aus:
          </p>
          <pre className="bg-black/50 text-green-300 text-xs p-4 rounded-lg overflow-auto max-h-60 border border-green-900/50">
            {sql}
          </pre>
          <p className="text-blue-400 text-xs mt-2">Die vollständige SQL-Datei liegt auch unter <code className="bg-black/30 px-1 rounded">database-setup.sql</code> im Projektordner.</p>
        </div>

        <div className="bg-blue-900/40 border border-blue-700 rounded-xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-3">Schritt 2: Anon Key eintragen</h2>
          <p className="text-blue-300 text-sm mb-3">
            Gehe zu <strong>Settings → API → Project API Keys → anon public</strong> und kopiere den Key.
            Erstelle dann eine Datei <code className="bg-black/30 px-1 rounded">.env</code> im Projektordner:
          </p>
          <pre className="bg-black/50 text-yellow-300 text-sm p-4 rounded-lg border border-yellow-900/30">
            {`VITE_SUPABASE_ANON_KEY=dein_anon_key_hier`}
          </pre>
          <p className="text-blue-400 text-xs mt-2">Danach <code className="bg-black/30 px-1 rounded">npm run dev</code> neu starten.</p>
        </div>

        <p className="text-blue-500 text-xs text-center">
          Der anon key (öffentlich) ist für Browser-Apps gedacht. Den secret key (sb_secret_*) nie im Frontend einsetzen.
        </p>
      </div>
    </div>
  )
}
