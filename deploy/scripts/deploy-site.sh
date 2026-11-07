#!/usr/bin/env bash
#
# Update the static site on the server.
#
#   sudo bash deploy/scripts/deploy-site.sh
#
# Override SITE_DIR / SITE_REPO / SITE_BRANCH if your layout differs.

set -euo pipefail

SITE_REPO="${SITE_REPO:-https://github.com/2024-ustc-yuqing-cup-wd-team/myhomepage.git}"
SITE_DIR="${SITE_DIR:-/var/www/myhomepage}"
SITE_BRANCH="${SITE_BRANCH:-main}"
OWNER="${OWNER:-www-data:www-data}"

fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

if [ "$(id -u)" -ne 0 ]; then
  fail "run this script with sudo"
fi

if [ -d "$SITE_DIR/.git" ]; then
  git -C "$SITE_DIR" fetch --depth 1 origin "$SITE_BRANCH"
  git -C "$SITE_DIR" reset --hard FETCH_HEAD
else
  install -d "$SITE_DIR"
  git clone --depth 1 --branch "$SITE_BRANCH" "$SITE_REPO" "$SITE_DIR"
fi

chown -R "$OWNER" "$SITE_DIR"

printf 'Site updated in %s (branch %s).\n' "$SITE_DIR" "$SITE_BRANCH"
