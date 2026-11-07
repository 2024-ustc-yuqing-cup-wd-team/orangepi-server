# Security policy

## Supported versions

This repository is an archive of a 2024 competition deployment. Only the latest
`main` branch is maintained.

| Version | Supported |
| --- | --- |
| `main` | ✅ |
| older commits | ❌ |

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Use GitHub's private
vulnerability reporting:

1. Open the repository's **Security** tab.
2. Choose **Report a vulnerability**.
3. Describe the problem, the affected file, and a minimal reproduction.

You can expect an initial response within a few days. This is a volunteer,
archived project, so please allow reasonable time for a fix.

## Secrets

- Configuration and credentials belong in `.env` files, which are ignored by
  git; `.env.example` documents the expected variables.
- Never commit mail passwords, app passwords or tokens. If one is committed,
  revoke it with the provider first, then ask a maintainer to rewrite history.
- The optional API binds to `127.0.0.1` and is proxied by Nginx; do not expose
  port 3000 directly.

## Deployment notes

- This setup was designed for a campus LAN. Publishing it on the public internet
  requires TLS, authentication and rate limiting, which are out of scope here.
- Keep the operating system and Node.js patched.
- Review `/var/log/nginx/error.log` and `journalctl -u myhomepage-api` after
  changes.
