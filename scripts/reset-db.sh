#!/usr/bin/env bash
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/zeiterfassung1337}

cd "$APP_DIR"

echo "[reset-db] removing SQLite files (prod.db/dev.db)"
rm -f prod.db dev.db || true

echo "[reset-db] pushing schema + generate + seed"
npm run db:setup

echo "[reset-db] done"

