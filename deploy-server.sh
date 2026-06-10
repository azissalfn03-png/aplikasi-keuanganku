#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-}"
APP_DIR="${APP_DIR:-/var/www/web-findash}"
WEB_DIR="${WEB_DIR:-/var/www/html/findash}"

if [ -z "$REPO_URL" ]; then
  echo "ERROR: isi REPO_URL, contoh: REPO_URL=https://github.com/USER/web-findash.git bash deploy-server.sh"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y git
fi

if ! command -v nginx >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y nginx
fi

if ! command -v rsync >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y rsync
fi

sudo mkdir -p "$APP_DIR" "$WEB_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR" "$WEB_DIR"

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.idea/' \
  "$APP_DIR/www/" "$WEB_DIR/"

sudo tee /etc/nginx/sites-available/findash >/dev/null <<EOF
server {
    listen 80;
    server_name _;

    root $WEB_DIR;
    index index.html;

    location /findash/ {
        alias $WEB_DIR/;
        try_files \$uri \$uri/ /findash/index.html;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/findash /etc/nginx/sites-enabled/findash
sudo nginx -t
sudo systemctl reload nginx

echo "OK: buka http://$(hostname -I | awk '{print $1}')/findash/"
