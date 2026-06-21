#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# backup.sh — dump CoreDB and LogDB to compressed custom-format archives.
#
# Usage:
#   ./scripts/backup.sh [backup_dir]
#
# Environment variables (all optional, sensible defaults shown):
#   BACKUP_DIR          — root directory for archives  (default: /var/backups/radare)
#   BACKUP_KEEP_DAYS    — prune archives older than N days (default: 30)
#
#   CoreDB:
#     POSTGRES_HOST     (default: localhost)
#     POSTGRES_PORT     (default: 5432)
#     POSTGRES_USER     (default: radare)
#     POSTGRES_PASSWORD (default: radare)
#     POSTGRES_DB       (default: radare)
#
#   LogDB:
#     LOGDB_HOST        (default: localhost)
#     LOGDB_PORT        (default: 5433)
#     LOGDB_USER        (default: radare)
#     LOGDB_PASSWORD    (default: radare)
#     LOGDB_DB          (default: radare_logs)
# ---------------------------------------------------------------------------

log() {
    printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

BACKUP_DIR="${1:-${BACKUP_DIR:-/var/backups/radare}}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-radare}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-radare}"
POSTGRES_DB="${POSTGRES_DB:-radare}"

LOGDB_HOST="${LOGDB_HOST:-localhost}"
LOGDB_PORT="${LOGDB_PORT:-5433}"
LOGDB_USER="${LOGDB_USER:-radare}"
LOGDB_PASSWORD="${LOGDB_PASSWORD:-radare}"
LOGDB_DB="${LOGDB_DB:-radare_logs}"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
log "Backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

# ---------------------------------------------------------------------------
# CoreDB
# ---------------------------------------------------------------------------
COREDB_FILE="${BACKUP_DIR}/coredb_${TIMESTAMP}.dump"
log "Dumping CoreDB (${POSTGRES_DB}@${POSTGRES_HOST}:${POSTGRES_PORT}) -> ${COREDB_FILE}"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    --host="${POSTGRES_HOST}" \
    --port="${POSTGRES_PORT}" \
    --username="${POSTGRES_USER}" \
    --dbname="${POSTGRES_DB}" \
    --format=custom \
    --compress=9 \
    --file="${COREDB_FILE}"

log "CoreDB dump complete: $(du -sh "${COREDB_FILE}" | cut -f1)"

# ---------------------------------------------------------------------------
# LogDB
# ---------------------------------------------------------------------------
LOGDB_FILE="${BACKUP_DIR}/logdb_${TIMESTAMP}.dump"
log "Dumping LogDB (${LOGDB_DB}@${LOGDB_HOST}:${LOGDB_PORT}) -> ${LOGDB_FILE}"

PGPASSWORD="${LOGDB_PASSWORD}" pg_dump \
    --host="${LOGDB_HOST}" \
    --port="${LOGDB_PORT}" \
    --username="${LOGDB_USER}" \
    --dbname="${LOGDB_DB}" \
    --format=custom \
    --compress=9 \
    --file="${LOGDB_FILE}"

log "LogDB dump complete: $(du -sh "${LOGDB_FILE}" | cut -f1)"

# ---------------------------------------------------------------------------
# Pruning
# ---------------------------------------------------------------------------
log "Pruning archives older than ${BACKUP_KEEP_DAYS} days in ${BACKUP_DIR}"
find "${BACKUP_DIR}" -maxdepth 1 -name '*.dump' -mtime "+${BACKUP_KEEP_DAYS}" -print -delete
log "Pruning complete."

log "Backup finished successfully."
