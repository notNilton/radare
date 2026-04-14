#!/usr/bin/env bash
set -euo pipefail

COMPOSE_BIN="${COMPOSE:-podman compose}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.local.yml}"

if [[ "${RADARE_CONFIRM_NUKE:-}" != "yes" ]]; then
  printf 'Refusing to reset databases without RADARE_CONFIRM_NUKE=yes\n' >&2
  printf 'Usage: RADARE_CONFIRM_NUKE=yes %s\n' "$0" >&2
  exit 1
fi

printf 'Stopping services and removing local database volumes...\n'
$COMPOSE_BIN -f "$COMPOSE_FILE" down -v

printf 'Rebuilding database schema and seed data...\n'
$COMPOSE_BIN -f "$COMPOSE_FILE" up --build --force-recreate migrate migrate-log seed seed-log

printf 'Radare database reboot completed.\n'
