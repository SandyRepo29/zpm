-- ZPM: Releases, Epics, Tickets
-- Run after schema.sql

CREATE TYPE release_status AS ENUM ('planning', 'in_progress', 'released', 'cancelled');
CREATE TYPE epic_status    AS ENUM ('backlog', 'in_progress', 'done', 'cancelled');
CREATE TYPE ticket_status  AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
CREATE TYPE ticket_type    AS ENUM ('story', 'bug', 'task', 'sub_task');

-- Global ticket number sequence (ZPM-1, ZPM-2, ...)
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE TABLE releases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version      VARCHAR(30)    NOT NULL UNIQUE,   -- e.g. "10.1.16"
  name         VARCHAR(200),
  description  TEXT,
  release_date DATE,
  status       release_status NOT NULL DEFAULT 'planning',
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE epics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id   UUID REFERENCES releases(id) ON DELETE SET NULL,
  title        VARCHAR(200)   NOT NULL,
  description  TEXT,
  status       epic_status    NOT NULL DEFAULT 'backlog',
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no     INTEGER        NOT NULL DEFAULT nextval('ticket_number_seq'),
  epic_id       UUID           NOT NULL REFERENCES epics(id) ON DELETE CASCADE,
  title         VARCHAR(300)   NOT NULL,
  description   TEXT,
  type          ticket_type    NOT NULL DEFAULT 'story',
  status        ticket_status  NOT NULL DEFAULT 'backlog',
  resource_id   UUID           REFERENCES resources(id) ON DELETE SET NULL,
  story_points  SMALLINT       CHECK (story_points IS NULL OR story_points > 0),
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS releases_updated_at ON releases;
CREATE TRIGGER releases_updated_at BEFORE UPDATE ON releases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS epics_updated_at ON epics;
CREATE TRIGGER epics_updated_at    BEFORE UPDATE ON epics    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS tickets_updated_at ON tickets;
CREATE TRIGGER tickets_updated_at  BEFORE UPDATE ON tickets  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
