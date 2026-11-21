-- Up Migration

-- The capability that lets an administrator invite, change and disable accounts (docs/plans/auth-in-app.md, step A5).
-- It is privileged: it needs a multi-factor sign-in. The list below is the current list plus user.manage.
ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish',
  'news.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage', 'analytics.read',
  'user.manage'));
INSERT INTO app_role_capability (role_key, capability) SELECT key, 'user.manage' FROM app_role WHERE key = 'admin'
  ON CONFLICT DO NOTHING;

-- Down Migration

DELETE FROM app_role_capability WHERE capability = 'user.manage';
ALTER TABLE app_role_capability DROP CONSTRAINT app_role_capability_capability_check;
ALTER TABLE app_role_capability ADD CONSTRAINT app_role_capability_capability_check CHECK (capability IN (
  'news.edit', 'news.submit', 'news.review', 'news.fact_check', 'news.publish',
  'news.correct', 'media.manage', 'taxonomy.manage', 'audit.read', 'ads.manage', 'config.manage', 'analytics.read'));
