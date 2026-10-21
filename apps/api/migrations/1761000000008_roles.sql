-- Up Migration

-- Role definitions are configurable data (docs/12): a role is a named set of capabilities.
-- Identity-provider claims name roles; authorization checks capabilities, never role names.
CREATE TABLE app_role (
  key         text PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE app_role_capability (
  role_key   text NOT NULL REFERENCES app_role (key) ON DELETE CASCADE,
  capability text NOT NULL CHECK (capability IN (
    'story.edit', 'story.submit', 'story.review', 'story.fact_check', 'story.publish',
    'story.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage')),
  PRIMARY KEY (role_key, capability)
);

-- Down Migration

DROP TABLE app_role_capability;
DROP TABLE app_role;
