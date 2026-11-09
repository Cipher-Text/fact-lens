-- Up Migration

-- Moves a database that was seeded with the old cipher-press menu (local, national, politics, economy, business,
-- international, sports, technology, health) to the site's menu: Geopolitics, Economy, Security, Technology,
-- History. The seed only adds missing rows, so it cannot do this. A database without the old menu (a new one, or
-- one that already has the site's menu) is left alone, so this is safe to run anywhere. Editors' changes win:
-- a label is renamed only while it still has its seeded name, and a section that news items use is kept.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM category WHERE key = 'local') THEN
    RETURN;
  END IF;

  -- The three sections the old menu did not have.
  INSERT INTO category (key, position) VALUES ('geopolitics', 1), ('security', 3), ('history', 5) ON CONFLICT (key) DO NOTHING;
  INSERT INTO category_label (category_id, locale, name, slug)
  SELECT c.id, v.locale, v.name, c.key
    FROM category c
    JOIN (VALUES
      ('geopolitics', 'en', 'Geopolitics and Diplomacy'), ('geopolitics', 'bn-BD', 'ভূরাজনীতি ও কূটনীতি'),
      ('security', 'en', 'Security and Conflict'), ('security', 'bn-BD', 'নিরাপত্তা ও সংঘাত'),
      ('history', 'en', 'History and Context'), ('history', 'bn-BD', 'ইতিহাস ও প্রেক্ষাপট')
    ) AS v(key, locale, name) ON v.key = c.key
  ON CONFLICT DO NOTHING;

  -- The two that exist under the same key take the site's names, while they still have the seeded ones. The old
  -- descriptions were about Bangladesh and the site has none, so they go with the old names.
  UPDATE category_label l SET name = v.name, description = NULL
    FROM category c,
         (VALUES
           ('economy', 'en', 'Economy', 'Economy and Trade'), ('economy', 'bn-BD', 'অর্থনীতি', 'অর্থনীতি ও বাণিজ্য'),
           ('technology', 'en', 'Technology', 'Technology and Strategic Power'), ('technology', 'bn-BD', 'প্রযুক্তি', 'প্রযুক্তি ও কৌশলগত শক্তি')
         ) AS v(key, locale, was, name)
   WHERE c.id = l.category_id AND c.key = v.key AND l.locale = v.locale AND l.name = v.was;

  -- The order of the site's menu, and everything else after it.
  UPDATE category SET position = CASE key
      WHEN 'geopolitics' THEN 1 WHEN 'economy' THEN 2 WHEN 'security' THEN 3 WHEN 'technology' THEN 4 WHEN 'history' THEN 5 END
    WHERE key IN ('geopolitics', 'economy', 'security', 'technology', 'history');
  UPDATE category SET position = position + 5
    WHERE key NOT IN ('geopolitics', 'economy', 'security', 'technology', 'history');

  -- The old sections that nothing uses are archived, which takes them out of the menu and the pickers; their
  -- addresses and labels stay. One that news items or ads use stays as it is, for the editors to decide.
  UPDATE category SET status = 'archived', show_in_menu = false
    WHERE key IN ('local', 'national', 'politics', 'business', 'international', 'sports', 'health')
      AND NOT EXISTS (SELECT 1 FROM news_category nc WHERE nc.category_id = category.id)
      AND NOT EXISTS (SELECT 1 FROM ad_category_target t WHERE t.category_id = category.id)
      AND NOT EXISTS (SELECT 1 FROM category child WHERE child.parent_id = category.id);
END $$;

-- Down Migration

-- A data migration: it does not restore the old menu.
SELECT 1;
