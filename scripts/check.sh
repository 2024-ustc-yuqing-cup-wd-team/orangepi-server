#!/usr/bin/env bash
#
# Local checks that mirror CI (except the Nginx validation, which needs root).
#
#   bash scripts/check.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

printf 'Checking JSON manifests…\n'
node -e "for (const f of ['server/package.json', 'examples/imap-reader/package.json']) JSON.parse(require('node:fs').readFileSync(f, 'utf8'))"

printf 'Checking JavaScript syntax…\n'
node --check server/src/index.js
node --check examples/imap-reader/index.js

printf 'Checking shell scripts…\n'
bash -n deploy/scripts/bootstrap.sh
bash -n deploy/scripts/deploy-site.sh
bash -n scripts/check.sh

printf 'OK\n'
