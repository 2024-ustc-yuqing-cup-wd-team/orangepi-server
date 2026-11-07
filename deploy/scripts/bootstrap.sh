#!/usr/bin/env bash
#
# One-shot bootstrap for the MyHomePage server.
#
# Tested on Debian/Ubuntu ARM64 (Orange Pi). Run it from the repository:
#
#   sudo bash deploy/scripts/bootstrap.sh
#
# It installs Nginx, clones the site into /var/www/myhomepage, installs the
# optional API into /opt/myhomepage-api, and enables both services.
# Override paths with SITE_DIR / API_DIR / SITE_REPO environment variables.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

SITE_REPO="${SITE_REPO:-https://github.com/2024-ustc-yuqing-cup-wd-team/myhomepage.git}"
SITE_DIR="${SITE_DIR:-/var/www/myhomepage}"
API_DIR="${API_DIR:-/opt/myhomepage-api}"
API_USER="${API_USER:-www-data}"
API_GROUP="${API_GROUP:-www-data}"

log() { printf '\n==> %s\n' "$*"; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

if [ "$(id -u)" -ne 0 ]; then
  fail "run this script with sudo"
fi

command -v apt-get >/dev/null 2>&1 || fail "this script targets Debian/Ubuntu"
command -v node >/dev/null 2>&1 || fail "Node.js >= 20 is required; see docs/setup.md"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt 20 ]; then
  fail "Node.js >= 20 is required (found $(node -v))"
fi

log "Installing Nginx and git"
apt-get update -qq
apt-get install -y -qq nginx git ca-certificates curl

log "Deploying the site into $SITE_DIR"
if [ -d "$SITE_DIR/.git" ]; then
  git -C "$SITE_DIR" fetch --depth 1 origin main
  git -C "$SITE_DIR" reset --hard FETCH_HEAD
else
  install -d "$SITE_DIR"
  git clone --depth 1 "$SITE_REPO" "$SITE_DIR"
fi

log "Installing the optional API into $API_DIR"
install -d "$API_DIR"
cp -a "$REPO_ROOT/server/." "$API_DIR/"
rm -rf "$API_DIR/node_modules"
( cd "$API_DIR" && npm ci --omit=dev )
if [ ! -f "$API_DIR/.env" ]; then
  cp "$API_DIR/.env.example" "$API_DIR/.env"
fi
chown -R "$API_USER:$API_GROUP" "$SITE_DIR" "$API_DIR"

log "Installing the Nginx site configuration"
install -m 644 "$REPO_ROOT/deploy/nginx/sites-available/myhomepage.conf" \
  /etc/nginx/sites-available/myhomepage.conf
ln -sf /etc/nginx/sites-available/myhomepage.conf /etc/nginx/sites-enabled/myhomepage.conf
# Disable Debian's stock welcome site so our server block answers on port 80.
if [ -L /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t
systemctl enable nginx >/dev/null
systemctl reload nginx

log "Installing the systemd unit"
install -m 644 "$REPO_ROOT/deploy/systemd/myhomepage-api.service" \
  /etc/systemd/system/myhomepage-api.service
systemctl daemon-reload
systemctl enable myhomepage-api >/dev/null
systemctl restart myhomepage-api

log "Verifying"
sleep 1
curl -fsS -o /dev/null "http://127.0.0.1/"
curl -fsS "http://127.0.0.1/api/health"
printf '\n\nBootstrap complete.\n'
printf 'Open http://%s/ from another device on the same network.\n' \
  "$(hostname -I 2>/dev/null | awk '{print $1}')"
