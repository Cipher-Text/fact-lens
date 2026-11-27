#!/usr/bin/env bash
# Restores one backup into a database container, after checking its checksum and decrypting it (D7).
#   restore.sh <object-key> <target-container> <target-database>
# Refuses to restore into the live database container (BACKUP_POSTGRES_CONTAINER), so a drill cannot overwrite production.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$HERE/backup.env" ]]; then set -a; . "$HERE/backup.env"; set +a; fi

KEY="${1:?usage: restore.sh <object-key> <target-container> <target-database>}"
TARGET="${2:?usage: restore.sh <object-key> <target-container> <target-database>}"
DATABASE="${3:?usage: restore.sh <object-key> <target-container> <target-database>}"
: "${BACKUP_BUCKET:?set BACKUP_BUCKET}" "${BACKUP_S3_ENDPOINT:?set BACKUP_S3_ENDPOINT}"
: "${BACKUP_ACCESS_KEY_ID:?set BACKUP_ACCESS_KEY_ID}" "${BACKUP_SECRET_ACCESS_KEY:?set BACKUP_SECRET_ACCESS_KEY}"
: "${BACKUP_PASSPHRASE_FILE:?set BACKUP_PASSPHRASE_FILE}"
REGION="${BACKUP_S3_REGION:-auto}"
AWS_IMAGE="${BACKUP_AWS_IMAGE:-amazon/aws-cli:2.22.35}"
NETWORK_ARGS=()
if [[ -n "${BACKUP_DOCKER_NETWORK:-}" ]]; then NETWORK_ARGS=(--network "$BACKUP_DOCKER_NETWORK"); fi

if [[ -n "${BACKUP_POSTGRES_CONTAINER:-}" && "$TARGET" == "$BACKUP_POSTGRES_CONTAINER" ]]; then
  echo "restore: refusing to restore into the live database container" >&2
  exit 1
fi
if [[ ! "$DATABASE" =~ ^[a-z_][a-z0-9_]*$ ]]; then echo "restore: unsafe database name" >&2; exit 1; fi

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
umask 077
printf 'AWS_ACCESS_KEY_ID=%s\nAWS_SECRET_ACCESS_KEY=%s\nAWS_DEFAULT_REGION=%s\n' \
  "$BACKUP_ACCESS_KEY_ID" "$BACKUP_SECRET_ACCESS_KEY" "$REGION" > "$WORK/aws.env"
printf '[default]\ns3 =\n  addressing_style = path\n' > "$WORK/aws-config"
echo 'AWS_CONFIG_FILE=/work/aws-config' >> "$WORK/aws.env"
aws() {
  docker run --rm "${NETWORK_ARGS[@]}" --env-file "$WORK/aws.env" -v "$WORK:/work" -w /work \
    "$AWS_IMAGE" --endpoint-url "$BACKUP_S3_ENDPOINT" "$@"
}

# 1. Download the file and its checksum, and check them before anything is decrypted.
NAME="$(basename "$KEY")"
aws s3 cp "s3://$BACKUP_BUCKET/$KEY" "$NAME" --only-show-errors
aws s3 cp "s3://$BACKUP_BUCKET/$KEY.sha256" "$NAME.sha256" --only-show-errors
EXPECTED="$(cat "$WORK/$NAME.sha256")"
ACTUAL="$(openssl dgst -sha256 -r "$WORK/$NAME" | cut -d' ' -f1)"
if [[ "$EXPECTED" != "$ACTUAL" ]]; then echo "restore: checksum mismatch, the backup is damaged or incomplete" >&2; exit 1; fi
echo "restore: checksum OK"

# 2. Decrypt. A wrong passphrase fails here, not later.
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass "file:$BACKUP_PASSPHRASE_FILE" \
  -in "$WORK/$NAME" -out "$WORK/db.dump"
echo "restore: decrypted"

# 3. Restore into the target database. The target is created empty, then filled from the custom-format dump.
docker exec "$TARGET" sh -c "psql -U \"\$POSTGRES_USER\" -d postgres -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS $DATABASE WITH (FORCE)' -c 'CREATE DATABASE $DATABASE'"
docker cp "$WORK/db.dump" "$TARGET:/tmp/restore.dump"
docker exec "$TARGET" sh -c "pg_restore -U \"\$POSTGRES_USER\" -d $DATABASE --no-owner --no-privileges --exit-on-error /tmp/restore.dump; rc=\$?; rm -f /tmp/restore.dump; exit \$rc"
echo "restore: restored into $DATABASE on $TARGET"
