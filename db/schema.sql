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

-- ─────────────────────────────────────────────────────────────
-- Board: whiteboard do porządkowania stacku wiedzy.
-- Karty (nodes) mają pozycję x/y na tablicy, a strzałki (edges)
-- mówią "najpierw ucz się A, potem B".
-- id generuje przeglądarka (crypto.randomUUID), dzięki temu karta
-- pojawia się od razu, a zapis do bazy leci w tle.
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  category   text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'learning', 'done')),
  x          integer NOT NULL DEFAULT 0,
  y          integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_nodes_user_id_idx ON roadmap_nodes (user_id);

-- Usunięcie karty usuwa też jej strzałki (ON DELETE CASCADE)
CREATE TABLE IF NOT EXISTS roadmap_edges (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id  uuid NOT NULL REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
  target_id  uuid NOT NULL REFERENCES roadmap_nodes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id),
  CHECK (source_id <> target_id)
);

CREATE INDEX IF NOT EXISTS roadmap_edges_user_id_idx ON roadmap_edges (user_id);

-- Board: kształty na tablicy — prostokąty (ramki do grupowania)
-- i klocki z tekstem. w/h to szerokość i wysokość w jednostkach tablicy.
CREATE TABLE IF NOT EXISTS roadmap_shapes (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('rect', 'text')),
  x          integer NOT NULL,
  y          integer NOT NULL,
  w          integer NOT NULL,
  h          integer NOT NULL,
  text       text NOT NULL DEFAULT '',
  color      text NOT NULL DEFAULT 'slate',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_shapes_user_id_idx ON roadmap_shapes (user_id);
