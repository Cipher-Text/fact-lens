-- Up Migration

-- Advertising module (Epic G). Carried forward from CipherPress's Advertiser/AdCampaign/
-- AdPlacement/Ad/AdEvent design. Separate from the editorial Story graph (docs/05): ads are
-- not Story relations and have no editorial workflow state.
-- Changes from CipherPress: locale targeting references locale(code) (NULL = all locales)
-- instead of a fixed ALL/BN/EN enum, and ads can be retired with `active` rather than deleted.

CREATE TABLE advertiser (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  website      text CHECK (website IS NULL OR website ~* '^https?://'),
  -- private commercial data: never expose through public read models
  billing_info text,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ad_campaign (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES advertiser (id),
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'ended')),
  start_at      timestamptz,
  end_at        timestamptz,
  budget        numeric(12, 2) CHECK (budget >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at IS NULL OR start_at IS NULL OR end_at > start_at)
);

CREATE INDEX ad_campaign_advertiser_idx ON ad_campaign (advertiser_id);
CREATE INDEX ad_campaign_live_idx ON ad_campaign (start_at, end_at) WHERE status = 'active';

CREATE TABLE ad_placement (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text NOT NULL UNIQUE,
  name            text NOT NULL,
  description     text,
  allowed_formats text[] NOT NULL DEFAULT '{image,html}',
  CHECK (cardinality(allowed_formats) > 0 AND allowed_formats <@ ARRAY['image', 'html'])
);

CREATE TABLE ad (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES ad_campaign (id),
  placement_id     uuid NOT NULL REFERENCES ad_placement (id),
  title            text NOT NULL,
  format           text NOT NULL CHECK (format IN ('image', 'html')),
  media_asset_id   uuid REFERENCES media_asset (id),
  -- untrusted markup: sanitize on write and again on render (docs/12)
  html             text,
  -- only http(s); redirect endpoints must re-validate against this value, never a request parameter
  target_url       text NOT NULL CHECK (target_url ~* '^https?://'),
  open_in_new_tab  boolean NOT NULL DEFAULT true,
  priority         integer NOT NULL DEFAULT 0,
  weight           integer NOT NULL DEFAULT 1 CHECK (weight >= 1),
  device_target    text NOT NULL DEFAULT 'all' CHECK (device_target IN ('all', 'desktop', 'mobile')),
  locale           text REFERENCES locale (code),
  active           boolean NOT NULL DEFAULT true,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (format <> 'image' OR media_asset_id IS NOT NULL),
  CHECK (format <> 'html' OR (html IS NOT NULL AND length(btrim(html)) > 0))
);

CREATE INDEX ad_serving_idx ON ad (placement_id, priority DESC) WHERE active;
CREATE INDEX ad_campaign_fk_idx ON ad (campaign_id);

-- An ad's format must be allowed by its placement.
CREATE FUNCTION ad_format_allowed_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ad_placement WHERE id = NEW.placement_id AND NEW.format = ANY (allowed_formats)) THEN
    RAISE EXCEPTION 'format % is not allowed by placement %', NEW.format, NEW.placement_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ad_format_allowed
  BEFORE INSERT OR UPDATE OF format, placement_id ON ad
  FOR EACH ROW EXECUTE FUNCTION ad_format_allowed_check();

CREATE TABLE ad_category_target (
  ad_id       uuid NOT NULL REFERENCES ad (id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category (id),
  PRIMARY KEY (ad_id, category_id)
);

-- Impression and click log. Fields come from the public internet: lengths are capped.
-- ip_hash holds a salted hash only, never a raw IP. Retention window and hash algorithm are
-- open (docs/19, question 10); occurred_at is indexed so a purge job can enforce either.
-- Ads with events cannot be deleted: retire them with ad.active = false.
CREATE TABLE ad_event (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  event_type    text NOT NULL CHECK (event_type IN ('impression', 'click')),
  ad_id         uuid NOT NULL REFERENCES ad (id),
  placement_key text CHECK (length(placement_key) <= 100),
  path          text CHECK (length(path) <= 2048),
  referrer      text CHECK (length(referrer) <= 2048),
  ip_hash       text CHECK (length(ip_hash) <= 128),
  user_agent    text CHECK (length(user_agent) <= 512)
);

CREATE INDEX ad_event_ad_idx ON ad_event (ad_id, occurred_at DESC);
CREATE INDEX ad_event_time_idx ON ad_event (occurred_at);

-- Down Migration

DROP TABLE ad_event;
DROP TABLE ad_category_target;
DROP TABLE ad;
DROP FUNCTION ad_format_allowed_check();
DROP TABLE ad_placement;
DROP TABLE ad_campaign;
DROP TABLE advertiser;
