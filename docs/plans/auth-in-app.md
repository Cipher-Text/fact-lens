# Plan: authentication inside the backend

Status: **built (A0 to A8)**. The external security review is open (a user action). Later steps for each part are recorded below.

## Goal

The backend manages accounts, passwords, multi-factor sign-in, sessions and authorization. No external identity service is needed in production. The newsroom signs editors in through its own sign-in page, and the API issues the tokens it checks.

## Why this shape

- The API already verifies signed tokens and reads roles from them (`packages/config`, `apps/api/src/auth`). The token verifier stays. The backend starts issuing the tokens it verifies, with its own signing keys, so the guards, capabilities and MFA checks do not change.
- Authentication is security-critical, so it is built as several small reviewed steps, each with its own tests. Nothing here is built on an untested shortcut.
- The OIDC flow with the fake provider stays for the test suite and local work until the new flow is in place, then it is removed from the newsroom's runtime path.

## Defaults (approved)

| Topic | Default |
| --- | --- |
| Sign-in lifetime | An editor's sign-in lasts **8 hours**. After that the editor signs in again. |
| Access token | Valid **15 minutes**. The newsroom refreshes it silently while the sign-in lasts. |
| Refresh tokens | Single use. Each refresh issues a new one. Reuse of an old one ends the sign-in and is audited. |
| Multi-factor | Authenticator-app codes (TOTP) for every account. One-time recovery codes. No SMS. Privileged capabilities already require MFA. |
| Passwords | Argon2id. At least 12 characters. Checked against a list of common passwords. |
| Failed sign-ins | After 5 failures in 15 minutes, the account is locked for 15 minutes. Sign-in attempts are rate limited per address. |
| Accounts | Admin creates an invitation. No self sign-up. An invitation expires after 72 hours and is used once. |
| Invitation delivery | Until an email provider is chosen, the admin copies a one-time invitation link and sends it personally. Password reset by email waits for the same provider. |
| Password reset | By email, once an email provider exists. Until then an admin issues a reset link. |

## Decisions still open (do not block the steps below)

- Which email provider sends invitations and resets (needs an account, a user action).
- Signing key storage: a key file or secret on the VM. Rotation procedure written before launch.

## Tasks, in order

Each task lists its owner. Critical tasks are Claude's. Normal tasks may go to Codex after the contracts and API are merged.

**A0. Decision record (Claude).** Add ADR-046: authentication inside the backend, the defaults above, and the reasons. Update `docs/12-auth-security-and-audit.md` to match. Docs only.

**A1. Migration: accounts and sessions (Claude, runs alone).** Tables:
- `app_user` (id, email unique case-insensitively, display name, status `active`/`disabled`, failed sign-in count, locked until, last sign-in, created at).
- `user_role` (user, role key), replacing the token's role claim as the source for issued tokens.
- `mfa_factor` (user, type `totp`, encrypted secret, confirmed at).
- `mfa_recovery_code` (user, hashed code, used at).
- `auth_session` (id, user, refresh token hash, expires at, revoked at, replaced by, created at, last used at).
- `auth_invitation` (token hash, user, role keys, expires at, used at, created by).
- Up and Down sections. Verified on a scratch database.

**A2. Contracts (Claude).** In `packages/contracts/src/auth.ts`: sign-in request and result, MFA challenge and verification, recovery code use, refresh request, invitation create and accept, password change, enrol and confirm MFA. Build the package. Tests for the schemas (password length, email shape, code formats).

**A3. Password and token primitives (Claude).** Argon2id hashing and verification with a maintained library. Access tokens signed ES256 with the backend's key, with issuer, audience and expiry set. Refresh token generation (random, stored as a hash). TOTP verification with a one-step window. Tests, including wrong password, expired token and reused refresh token.

**A4. Sign-in endpoints (Claude).** `POST /auth/sign-in` (password step), `POST /auth/mfa` (code step), `POST /auth/refresh` (rotation with reuse detection), `POST /auth/sign-out`, `GET /auth/me`. Lockout after 5 failures in 15 minutes. Rate limit per address (Redis, as the view counts do). Every sign-in, failure, lockout, refresh and sign-out writes an audit event in the same transaction. Tests for each rule.

**A5. Account administration (Claude).** Capability `user.manage` (new, given to admins only). Create an invitation (returns the one-time link once), accept an invitation (sets password, starts MFA enrolment), enrol and confirm TOTP, issue recovery codes, disable an account (ends its sessions), change an account's roles, admin-issued reset link. Every change is audited. Tests, including the expired and used invitation.

**A6. Keys and configuration (Claude).** The signing key comes from a setting read through `packages/config`, documented in `.env.example` (blank, required in production) and in the README. Startup refuses production without it. A bootstrap command creates the first admin from the command line (`pnpm --filter @fact-lens/api auth:bootstrap`), so the first account does not need the browser.

**A7. Newsroom sign-in (Claude for the auth-facing code, then review).** A sign-in page (email, password, then the code step), a silent refresh through the existing `/api/*` proxy, sign-out, and "signed out after 8 hours" handling. The encrypted HttpOnly cookie stays. Remove the OIDC redirect from the production path. Tests for the flow with the API stubbed.

**A8. Hardening and review (Claude).** Check against `docs/12`: CSRF on cookie-based requests, no tokens in URLs or logs, cookie flags, constant-time comparisons, no account enumeration on sign-in or reset. An external security review before launch (a user action: choose a reviewer).

**A9. Docs and status (Claude).** `docs/22` (what is built), `docs/12` (the security model), the deployment plan (the new key and bootstrap steps), and the README.

## Order and rules

- A1 runs alone (it is a migration). A2 and A3 can follow it. A4 and A5 depend on A3. A7 depends on A4.
- Nothing is merged to `main` without the verification commands passing and your OK.
- The fake identity provider is not removed until A7 is merged and tested.

## Verification (per task)

- API: `pnpm --filter @fact-lens/api test` with `TEST_DATABASE_URL` and `TEST_REDIS_URL`, plus typecheck and lint.
- Contracts: typecheck and lint.
- Newsroom: typecheck, lint, test and build.
- Before launch: `pnpm check` at the root, and the external security review.

## A8: review result (21 November 2026)

Checked against docs/12 and the sign-in code. Fixed in this step:

- **Sign-out was a GET link a site could trigger.** It is now a POST from the app's own form, so another site cannot sign an editor out. (A GET to the route is refused with 405.)
- **The address used for limits could be spoofed.** The newsroom now reads the last `X-Forwarded-For` entry, the one the reverse proxy appends, not the first.
- **A disabled account kept its access token for up to 15 minutes.** The API's guard now checks the account's status on every request for the backend's own accounts. A test covers it.

Already in place and checked: cookies are HTTP-only with SameSite set (Strict for the sign-in step cookie, Lax for the session), and Secure over HTTPS. Invitation tokens are in the link's fragment, so they never reach a server log. Sign-in gives one neutral message for a wrong password, an unknown address, a locked, inactive or unconfirmed account. Codes and passwords are compared in constant time, and the passwords and recovery codes are hashed with Argon2id. The TOTP secret is encrypted at rest. Refresh tokens are single use, and reuse ends the sign-in and is audited. Every sign-in step is audited, with the address hashed. Auth responses are not cacheable.

Known limits, to decide or fix before launch:

- **The common-password list is short.** It needs the full list.
- **Refresh sharing is per process.** Several newsroom instances need a shared store (ADR-047).
- **A lock can be triggered from outside.** Five wrong passwords lock an account for 15 minutes. That is accepted, and it is logged.
- **Headers are not reviewed.** A Content-Security-Policy and the other security headers for the newsroom and the public site have not been checked in this step.
- **External security review.** This needs a reviewer chosen by you (a user action).
