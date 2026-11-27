# Runbook: database backups and restore (D7)

The staging database is the only copy of the content. The backup is a nightly, encrypted `pg_dump` of the running database, uploaded to a bucket that only backups use. Scripts: `deploy/staging/backup/backup.sh` and `restore.sh`.

## One-time setup (on the host)

1. Create a Cloudflare R2 bucket for backups only (for example `factlens-staging-backups`) and an API token that can only read and write that bucket.
2. Add a **lifecycle rule** on the bucket that deletes objects older than 14 days. Retention is not done by the script (there is no delete code to get wrong). Check the rule exists in the dashboard.
3. Create the passphrase file, readable only by root, and keep a second copy somewhere that is not the host (a password manager, a printed copy in a safe). Without it, no backup can be read:
   ```bash
   openssl rand -base64 48 > /root/factlens-backup.pass && chmod 600 /root/factlens-backup.pass
   ```
4. Copy the settings and fill them in:
   ```bash
   cp deploy/staging/backup/backup.env.example deploy/staging/backup/backup.env
   chmod 600 deploy/staging/backup/backup.env
   ```
5. Run one backup by hand and check it appears in the bucket:
   ```bash
   deploy/staging/backup/backup.sh
   ```
6. Schedule it nightly (root's crontab), logging to a file:
   ```bash
   0 2 * * * /path/to/fact-lens/deploy/staging/backup/backup.sh >> /var/log/factlens-backup.log 2>&1
   ```

## Each backup

`backup.sh` dumps the `postgres` service with `pg_dump --format=custom`, encrypts it with AES-256-CBC (PBKDF2, 600,000 iterations), writes a SHA-256 checksum next to it, and uploads both to the bucket as `factlens-<UTC time>.dump.enc` and `.sha256`. It exits non-zero on any failure; the cron log records it.

## Restore

Restoring replaces data, so do it into a **new** database first, check it, and only then switch the API to it.

1. Stop writes: `docker compose stop worker api`. The newsroom and the site can stay up; they will show errors while the API is down.
2. Pick the backup key from the bucket (the newest one before the incident).
3. Restore into a scratch database on the same server, for example `factlens_restore`:
   ```bash
   deploy/staging/backup/restore.sh factlens-<time>.dump.enc "$(docker compose ps -q postgres)" factlens_restore
   ```
   The script checks the checksum before decrypting, and refuses to restore into the live container (`BACKUP_POSTGRES_CONTAINER`). Set `BACKUP_POSTGRES_CONTAINER` in `backup.env` to the live container so that guard works.
4. Compare row counts with the live database (the same query as in the drill, `results/D7-row-counts.tsv` for the method), and check the latest news items by hand.
5. Point the API at the restored database (`DATABASE_URL` in `env/api.env`, `env/migrate.env`, `env/worker.env`), then `docker compose up -d`. Run the migration step first if the restored schema is older than the release.

## Drill (once per quarter, and after any change to the scripts)

The drill restores a backup into a scratch database and compares row counts with the source. It was run once on 27 November 2026 with a local RustFS standing in for R2, from a seeded database:

- Restore into the live container: refused (exit 1).
- Wrong passphrase: fails at decryption (exit 1).
- Checksum does not match: refused before decryption (exit 1).
- Restore into the scratch database: exit 0. Row counts match on all 62 tables and 19,009 rows, and all 36 migrations are recorded.

Not tested here: the real R2 endpoint, the lifecycle rule, and the cron job on a host. These are checked on the first real run.
