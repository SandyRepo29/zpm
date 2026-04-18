-- ZPM Resource Manager Schema v2
-- Drop and recreate cleanly

DROP TABLE IF EXISTS resources CASCADE;
DROP TYPE IF EXISTS department_code CASCADE;

CREATE TYPE department_code AS ENUM ('BE', 'FE', 'AR', 'QM', 'QA', 'RE', 'EM');

CREATE TABLE resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  VARCHAR(100)    NOT NULL,
  last_name   VARCHAR(100)    NOT NULL,
  job_title   VARCHAR(150),
  department  department_code NOT NULL,
  location    VARCHAR(100),
  is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
