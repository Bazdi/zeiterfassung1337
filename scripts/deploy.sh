#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${APP_NAME:-zeiterfassung1337}
APP_DIR=${APP_DIR:-/var/www/zeiterfassung1337}
NODE_VERSION=${NODE_VERSION:-20}

echo "[deploy] cd $APP_DIR"
cd "$APP_DIR"

if command -v nvm >/dev/null 2>&1; then
  echo "[deploy] using nvm $NODE_VERSION"
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
fi

echo "[deploy] stopping PM2 app if running"
pm2 stop "$APP_NAME" >/dev/null 2>&1 || true

echo "[deploy] cleaning build cache"
rm -rf .next

echo "[deploy] install production deps"
npm ci --omit=dev

if [[ "${RESET_DB:-false}" == "true" ]]; then
  echo "[deploy] RESET_DB=true → removing SQLite files"
  rm -f prod.db dev.db || true
fi

echo "[deploy] prisma push + generate + seed"
npm run db:setup

echo "[deploy] building"
npm run build

echo "[deploy] starting with PM2"
if [[ -f ecosystem.config.js ]]; then
  pm2 startOrReload ecosystem.config.js --update-env
else
  pm2 start "npm start" --name "$APP_NAME" --update-env
fi

pm2 save
echo "[deploy] done"

