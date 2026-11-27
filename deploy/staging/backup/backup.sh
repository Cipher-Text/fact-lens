#!/usr/bin/env bash
# Nightly encrypted backup of the staging database to S3-compatible storage (Cloudflare R2), D7.
#   pg_dump (custom format) -> AES-256-CBC with PBKDF2 -> SHA-256 checksum -> upload.
# Run on the host, from anywhere:  deploy/staging/backup/backup.sh   (settings: backup/backup.env, see backup.env.example)
# Retention is a lifecycle rule on the bucket (see the runbook), not this script: deletion is not done here.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$HERE/backup.env" ]]; then set -a; . "$HERE/backup.env"; set +a; fi

: "${BACKUP_BUCKET:?set BACKUP_BUCKET}"
: "${BACKUP_S3_ENDPOINT:?set BACKUP_S3_ENDPOINT}"
: "${BACKUP_ACCESS_KEY_ID:?set BACKUP_ACCESS_KEY_ID}"
: "${BACKUP_SECRET_ACCESS_KEY:?set BACKUP_SECRET_ACCESS_KEY}"
: "${BACKUP_PASSPHRASE_FILE:?set BACKUP_PASSPHRASE_FILE (a file holding the encryption passphrase, mode 600)}"
REGION="${BACKUP_S3_REGION:-auto}"
AWS_IMAGE="${BACKUP_AWS_IMAGE:-amazon/aws-cli:2.22.35}"
NETWORK_ARGS=()
if [[ -n "${BACKUP_DOCKER_NETWORK:-}" ]]; then NETWORK_ARGS=(--network "$BACKUP_DOCKER_NETWORK"); fi

if [[ ! -s "$BACKUP_PASSPHRASE_FILE" ]]; then echo "backup: passphrase file is missing or empty" >&2; exit 1; fi
if [[ -z "${BACKUP_POSTGRES_CONTAINER:-}" ]]; then
  BACKUP_POSTGRES_CONTAINER="$(docker compose -f "$HERE/../compose.yaml" ps -q postgres)"
fi
if [[ -z "$BACKUP_POSTGRES_CONTAINER" ]]; then echo "backup: the postgres container is not running" >&2; exit 1; fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
NAME="factlens-$STAMP.dump.enc"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Credentials go to a 600-mode env file, not the command line.
umask 077
printf 'AWS_ACCESS_KEY_ID=%s\nAWS_SECRET_ACCESS_KEY=%s\nAWS_DEFAULT_REGION=%s\n' \
  "$BACKUP_ACCESS_KEY_ID" "$BACKUP_SECRET_ACCESS_KEY" "$REGION" > "$WORK/aws.env"
printf '[default]\ns3 =\n  addressing_style = path\n' > "$WORK/aws-config"
echo 'AWS_CONFIG_FILE=/work/aws-config' >> "$WORK/aws.env"

# 1. Dump from the running database (custom format: compressed, restorable selectively).
docker exec "$BACKUP_POSTGRES_CONTAINER" sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-privileges' > "$WORK/db.dump"

# 2. Encrypt. The passphrase lives on the host, outside the bucket: keep a copy somewhere safe, or no backup can be read.
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt \
  -pass "file:$BACKUP_PASSPHRASE_FILE" -in "$WORK/db.dump" -out "$WORK/$NAME"
rm -f "$WORK/db.dump"

# 3. Checksum of the encrypted file, checked again by restore.sh before decryption.
openssl dgst -sha256 -r "$WORK/$NAME" | cut -d' ' -f1 > "$WORK/$NAME.sha256"

# 4. Upload the file and its checksum.
aws() {
  docker run --rm "${NETWORK_ARGS[@]}" --env-file "$WORK/aws.env" -v "$WORK:/work" -w /work \
    "$AWS_IMAGE" --endpoint-url "$BACKUP_S3_ENDPOINT" "$@"
}
aws s3 cp "$NAME" "s3://$BACKUP_BUCKET/$NAME" --only-show-errors
aws s3 cp "$NAME.sha256" "s3://$BACKUP_BUCKET/$NAME.sha256" --only-show-errors

echo "backup: uploaded $NAME ($(wc -c < "$WORK/$NAME") bytes) to s3://$BACKUP_BUCKET/"
