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

-- Strzałki łączą DOWOLNE obiekty tablicy: karty (roadmap_nodes) i kształty
-- (roadmap_shapes). Klucz obcy może wskazywać tylko jedną tabelę, więc
-- source_id/target_id nie mają REFERENCES — strzałki obiektu usuwają
-- server actions (deleteRoadmapNode / deleteRoadmapShape), a własność
-- obu końców sprawdza createRoadmapEdge.
CREATE TABLE IF NOT EXISTS roadmap_edges (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id  uuid NOT NULL,
  target_id  uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id),
  CHECK (source_id <> target_id)
);

CREATE INDEX IF NOT EXISTS roadmap_edges_user_id_idx ON roadmap_edges (user_id);

-- Aktualizacja starszych baz: zdejmujemy dawne klucze obce do roadmap_nodes
ALTER TABLE roadmap_edges DROP CONSTRAINT IF EXISTS roadmap_edges_source_id_fkey;
ALTER TABLE roadmap_edges DROP CONSTRAINT IF EXISTS roadmap_edges_target_id_fkey;

-- Board: kształty na tablicy — prostokąty (ramki do grupowania)
-- i klocki z tekstem. w/h to szerokość i wysokość w jednostkach tablicy.
CREATE TABLE IF NOT EXISTS roadmap_shapes (
  id         uuid PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL,
  x          integer NOT NULL,
  y          integer NOT NULL,
  w          integer NOT NULL,
  h          integer NOT NULL,
  text       text NOT NULL DEFAULT '',
  color      text NOT NULL DEFAULT 'slate',
  font_size  integer NOT NULL DEFAULT 14,
  text_color text NOT NULL DEFAULT 'ink',
  bold       boolean NOT NULL DEFAULT false,
  italic     boolean NOT NULL DEFAULT false,
  text_align text NOT NULL DEFAULT 'left',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS roadmap_shapes_user_id_idx ON roadmap_shapes (user_id);

-- Aktualizacja starszych baz: styl tekstu w kształtach (IF NOT EXISTS = bezpieczne ponowne uruchomienie)
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS font_size integer NOT NULL DEFAULT 14;
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS text_color text NOT NULL DEFAULT 'ink';
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS bold boolean NOT NULL DEFAULT false;
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS italic boolean NOT NULL DEFAULT false;
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'left';

-- Rodzaje kształtów: ramka, tekst, karteczka, kod, lista zadań, notatka, kalendarz.
-- Ograniczenie zdejmujemy i zakładamy od nowa — tak dodaje się kolejne rodzaje.
ALTER TABLE roadmap_shapes DROP CONSTRAINT IF EXISTS roadmap_shapes_kind_check;
ALTER TABLE roadmap_shapes ADD CONSTRAINT roadmap_shapes_kind_check
  CHECK (kind IN ('rect', 'text', 'sticky', 'code', 'checklist', 'note', 'calendar'));

-- Kafelek "note" pokazuje notatkę z Cloudy Notes. Usunięcie notatki
-- nie usuwa kafelka — zostaje pusty (SET NULL) i można wybrać inną.
ALTER TABLE roadmap_shapes ADD COLUMN IF NOT EXISTS note_id uuid REFERENCES notes(id) ON DELETE SET NULL;
