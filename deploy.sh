#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE="nfs_linear-widgets"
SERVER_DIR="/home/protected/server"

cd "$SCRIPT_DIR"

echo "📦 Installing frontend dependencies..."
npm install

echo "🎨 Building frontend (tsc + vite)..."
npm run build

echo "📦 Installing server dependencies..."
( cd server && npm install )

echo "🛠  Building server (tsc)..."
( cd server && npm run build )

echo "🚀 Syncing server to ${REMOTE}:${SERVER_DIR}..."
ssh "$REMOTE" "mkdir -p ${SERVER_DIR}"
rsync -azPh --delete --timeout=300 \
  server/build/ \
  "$REMOTE:${SERVER_DIR}/build/"
rsync -azPh --delete --timeout=300 \
  dist/ \
  "$REMOTE:${SERVER_DIR}/dist/"
rsync -azPh --timeout=300 \
  server/package.json server/package-lock.json server/run.sh \
  "$REMOTE:${SERVER_DIR}/"

echo "📦 Installing production deps on server..."
ssh "$REMOTE" "cd ${SERVER_DIR} && npm install --omit=dev && chmod +x run.sh"

echo "✅ Deployment complete."
echo "ℹ️  HUP / restart the daemon from the NFS panel."
