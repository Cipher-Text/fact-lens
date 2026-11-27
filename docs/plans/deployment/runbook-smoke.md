# Runbook: first deploy and smoke test (D6)

Use this for a new environment (staging first, then production) and after any change to the stack. Each step records PASS or FAIL, the time and who ran it, in the release notes. Commands run from `deploy/staging/` on the host, unless a line says otherwise.

## 0. Before you start (blocked items are marked)

- A host with Docker Compose v2, ports 80 and 443 open to the internet. **Not yet chosen** (deployment.md, decision 1).
- DNS A records for the site and the newsroom pointing at the host. **Hostnames not yet chosen** (decision 2).
- A Cloudflare R2 bucket and an access key pair (`S3_*` in `env/api.env`).
- The site renders on request (decision made): its image builds with the real internal `FACTLENS_API_URL` (`http://api:4000`), so no API call happens at build time.

## 1. Environment files

```bash
cd deploy/staging
cp .env.example .env                     # SITE_HOST and NEWSROOM_HOST
cp env/postgres.env.example env/postgres.env
cp env/migrate.env.example env/migrate.env
cp env/api.env.example env/api.env
cp env/worker.env.example env/worker.env
cp env/newsroom.env.example env/newsroom.env
cp env/web.env.example env/web.env
```

Fill in every blank secret. Use random values, never reused across environments:

```bash
openssl rand -hex 24     # INTERNAL_API_TOKEN (the same in api.env and worker.env)
openssl rand -hex 32     # SESSION_SECRET (newsroom.env), POLL_HASH_SECRET (api.env)
```

The sign-in keys come from the API image, after step 2 builds it:

```bash
docker run --rm factlens-api:staging node dist/auth/keygen.js
```

Copy `AUTH_SIGNING_KEY` and `AUTH_ENCRYPTION_KEY` into `env/api.env`. Keep the files on the host only: `deploy/staging/env/*.env` and `deploy/staging/.env` are gitignored.

## 2. Start the stack

```bash
docker compose up -d --build
docker compose ps -a
```

Expect: `migrate` exited with code 0, and `postgres`, `redis`, `api`, `worker`, `web`, `newsroom` healthy, `caddy` running. The API does not start until the migration step exits 0.

If `migrate` exited non-zero, read `docker compose logs migrate`. Do not start the API. Fix the cause, then run `docker compose up -d` again.

## 3. Reference data (once per environment, safe to repeat)

```bash
docker compose run --rm migrate node dist/seed/run.js
```

This seeds desks, categories, default configuration, feature flags and the imported cipher-press articles. It needs `DATABASE_URL` only. Expect exit 0.

## 4. First administrator (once per environment)

```bash
docker compose run --rm api node dist/auth/bootstrap.js --email <address> --name "<display name>"
```

It prints a one-time link valid for 72 hours. Open it in a browser, set a password and an authenticator app. Do not paste the link into chat, tickets or logs. The command refuses to run once an administrator exists.

## 5. Smoke tests

| # | Check | How | Expected |
| --- | --- | --- | --- |
| 1 | Health | `curl -s https://<SITE_HOST>/health` and `curl -s https://<NEWSROOM_HOST>/health` | 200 `{"status":"ok"}` on both |
| 2 | Sign-in | Open `https://<NEWSROOM_HOST>/sign-in`, sign in with the password and the authenticator code | The desk queue opens. A wrong code is refused |
| 3 | Published item | In the newsroom, create an item with a body, assign a desk, move it to publish, then open its page on the site | The item is on the site at `/story/<slug>-<id>` (200), and the newsroom shows it as published |
| 4 | Card render | On the published item, generate its card (if the card panel is built for this release) | The card image loads on the item and on the site |
| 5 | Poll vote | On the site, vote in the featured poll, then vote again from the same browser | The first vote counts; the second is refused and the count does not change |
| 6 | Unavailable page | `docker compose stop api`, then `curl -si -H 'Accept: text/html' https://<SITE_HOST>/` | 503 with the Bangla unavailable page; `/health` on the site still 200 |
| 7 | Recovery | `docker compose start api`, wait for `healthy`, then load the site again within 10 seconds | 200 again (the site caches the API check for 10 seconds) |

Checks 2 to 5 need a browser and a person. Record them as done by hand. Checks 1, 6 and 7 can be scripted.

## 6. After the run

- Keep `docker compose ps -a` and the migrate log with the release notes.
- If any check fails, stop the release. A failed migration is not rolled back automatically: fix forward, or restore from the backup taken before the release (D7).
