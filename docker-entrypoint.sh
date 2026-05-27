#!/bin/sh
set -e

echo "──────────────────────────────────────"
echo " App:     ${APP_VERSION:-unknown}"
echo " Env:     ${ENV:-production}"
echo " Node:    $(node --version)"
echo "──────────────────────────────────────"

# ── Guard: required env vars ─────────────────────────────────────────────────
: "${DATABASE_URL:?❌  DATABASE_URL is not set. Aborting.}"

# ── Prisma migrations ─────────────────────────────────────────────────────────
echo "▶ Running Prisma migrations..."
npm run prisma:migrate

echo "▶ Starting application..."
exec "$@"
