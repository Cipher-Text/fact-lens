-- Up Migration

-- Accounts for sign-in inside the backend (ADR-046, docs/plans/auth-in-app.md, step A1). Passwords and secrets are
-- never stored in plain text: a password is an Argon2id hash, a refresh token and a recovery code are hashes, and the
-- TOTP secret is encrypted by the application before it reaches this table.

CREATE TABLE app_user (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND position('@' IN email) > 1),
  display_name      text        NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 200),
  -- Null until the invitation is accepted and a password is set.
  password_hash     text,
  status            text        NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'disabled')),
  failed_sign_ins   integer     NOT NULL DEFAULT 0 CHECK (failed_sign_ins >= 0),
  locked_until      timestamptz,
  last_sign_in_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'active' OR password_hash IS NOT NULL)
);
-- One account per address, regardless of letter case.
CREATE UNIQUE INDEX app_user_email_key ON app_user (lower(email));

-- The roles of an account. Authorization still goes from roles to capabilities (app_role_capability).
CREATE TABLE user_role (
  user_id    uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  role_key   text        NOT NULL REFERENCES app_role (key) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_key)
);
CREATE INDEX user_role_role_idx ON user_role (role_key);

-- One authenticator-app factor per account (TOTP). The secret is encrypted by the application.
CREATE TABLE mfa_factor (
  user_id           uuid        PRIMARY KEY REFERENCES app_user (id) ON DELETE CASCADE,
  secret_encrypted  bytea       NOT NULL,
  -- The time step of the last accepted code, so one code cannot be used twice.
  last_used_step    bigint,
  confirmed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- One-time recovery codes, stored as hashes.
CREATE TABLE mfa_recovery_code (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  code_hash  text        NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code_hash)
);

-- A sign-in. It ends at expires_at (8 hours after it starts) or when revoked.
CREATE TABLE auth_session (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX auth_session_user_idx ON auth_session (user_id);

-- Every refresh token a sign-in has issued. Each is single use: refreshing marks it used and issues the next one.
-- Presenting a token that is already used means it was copied, so the whole sign-in is revoked and audited.
CREATE TABLE auth_refresh_token (
  token_hash text        PRIMARY KEY,
  session_id uuid        NOT NULL REFERENCES auth_session (id) ON DELETE CASCADE,
  issued_at  timestamptz NOT NULL DEFAULT now(),
  used_at    timestamptz
);
CREATE INDEX auth_refresh_token_session_idx ON auth_refresh_token (session_id);

-- An invitation for a new account. The link carries a random token; only its hash is stored. Used once.
CREATE TABLE auth_invitation (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text        NOT NULL UNIQUE,
  user_id    uuid        NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
  created_by uuid        REFERENCES app_user (id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_invitation_user_idx ON auth_invitation (user_id);

-- Down Migration

DROP TABLE auth_invitation;
DROP TABLE auth_refresh_token;
DROP TABLE auth_session;
DROP TABLE mfa_recovery_code;
DROP TABLE mfa_factor;
DROP TABLE user_role;
DROP TABLE app_user;
