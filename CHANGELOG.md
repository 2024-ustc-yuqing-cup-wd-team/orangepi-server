# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-11-07

Post-competition cleanup of the Orange Pi deployment.

### Added

- `deploy/nginx/nginx.conf` and
  `deploy/nginx/sites-available/myhomepage.conf` with static serving, asset
  caching and an `/api/` reverse proxy.
- `deploy/systemd/myhomepage-api.service` with basic hardening.
- `deploy/scripts/bootstrap.sh` (one-shot install) and
  `deploy/scripts/deploy-site.sh` (site update).
- A small Express service exposing `GET /api/health` and `GET /api`.
- `examples/imap-reader/`: a read-only IMAP demo configured entirely through
  environment variables and built on the maintained `imapflow` client.
- Documentation: setup, operations, architecture and IMAP notes.
- CI, issue templates, `.gitignore`, `.gitattributes` and `.editorconfig`.
- `LICENSE` (MIT).

### Fixed

- **Routing:** the old `location /` proxied every request to Node.js, so the
  static site was never served. The site is now served from
  `/var/www/myhomepage` and only `/api/` is proxied.
- Sources encoded as GBK were converted to UTF-8.

### Changed

- Extracted the Nginx configuration and the deployment steps out of `note.md`
  into version-controlled files.
- Rewrote the README in English with a Chinese translation
  (`README.zh-CN.md`), including the topology and cleanup notes.

### Removed

- `node_modules/` committed in the repository (590 files).
- A hard-coded mail account credential; the git history was rewritten to remove
  it. The replacement reads configuration from `.env`.
- The `YQC_Website` git submodule pointer; the site is cloned by the deployment
  scripts instead.
- Obsolete tutorial notes under `docs/help/`.

[1.0.0]: https://github.com/2024-ustc-yuqing-cup-wd-team/orangepi-server/releases/tag/v1.0.0
