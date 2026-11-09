-- Up Migration

-- The site's social links now come from the deployment settings (SITE_SOCIAL_*), so the value the newsroom used
-- to save in the configuration table is no longer read, and its key is no longer a known configuration key.
DELETE FROM configuration WHERE key = 'site.social_links';

-- Down Migration

-- A data migration: the saved addresses are not restored (set SITE_SOCIAL_* instead).
SELECT 1;
