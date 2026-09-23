#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/server"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created server/.env from .env.example"
fi

# Load DB settings from .env
set -a
# shellcheck disable=SC1091
source .env
set +a

MYSQL_ARGS=(-h "${DB_HOST:-127.0.0.1}" -u "${DB_USER:-root}")
if [[ -n "${DB_PASSWORD:-}" ]]; then
  MYSQL_ARGS+=(-p"${DB_PASSWORD}")
fi

echo "Applying schema to database '${DB_NAME:-helpdesk}'..."
mysql "${MYSQL_ARGS[@]}" < src/db/schema.sql

echo "Seeding demo data..."
node src/db/seed.js

echo "Done. Start API with: npm run dev --prefix server"
echo "Start UI with:  npm run dev --prefix client"
