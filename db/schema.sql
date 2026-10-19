-- Tabele modułu logowania. Uruchom: npm run db:migrate
-- (skrypt dzieli plik po średnikach, więc nie używaj ich w komentarzach)

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,          -- zapisywany zawsze małymi literami
  password_hash text NOT NULL,                 -- format: scrypt$N$r$p$salt$hash
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id         text PRIMARY KEY,                 -- SHA-256 tokenu z ciasteczka (nie sam token)
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  content    text NOT NULL DEFAULT '',          -- treść w formacie Markdown
  color      text NOT NULL DEFAULT 'white',     -- klucz z app/lib/note-colors.ts
  pinned     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes (user_id, pinned DESC, updated_at DESC);

-- Stopień ważności notatki: 0 = niski, 1 = normalny, 2 = wysoki
ALTER TABLE notes ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 1 CHECK (priority BETWEEN 0 AND 2);
