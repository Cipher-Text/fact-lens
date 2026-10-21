-- Up Migration

-- Supported locales are data, not an enum (docs/21): adding a third locale is a row, not a migration.
CREATE TABLE locale (
  code         text PRIMARY KEY,
  display_name text NOT NULL,
  direction    text NOT NULL DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO locale (code, display_name) VALUES ('en', 'English'), ('bn-BD', 'বাংলা');

-- Editorial/runtime policy (docs/21 tier 3): workflow policy, AI budgets, rate limits, retention.
-- scope is 'global' or '<kind>:<id>' (for example 'desk:<uuid>').
CREATE TABLE configuration (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL,
  scope      text NOT NULL DEFAULT 'global',
  value      jsonb NOT NULL,
  version    integer NOT NULL DEFAULT 1,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, scope)
);

-- Module-level toggles (docs/21 tier 4).
CREATE TABLE feature_flag (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL DEFAULT false,
  description text NOT NULL DEFAULT '',
  rollout     jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by  text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE feature_flag;
DROP TABLE configuration;
DROP TABLE locale;
