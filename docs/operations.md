# Operations

Day-to-day commands for the LAN deployment.

## Services

```bash
# Status
systemctl status nginx --no-pager
systemctl status myhomepage-api --no-pager

# Restart
sudo systemctl restart myhomepage-api
sudo systemctl reload nginx

# Start on boot (already enabled by the bootstrap script)
sudo systemctl enable nginx myhomepage-api
```

## Logs

```bash
# Nginx access and error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# API logs
sudo journalctl -u myhomepage-api -f
sudo journalctl -u myhomepage-api --since "1 hour ago"
```

## Updating the site

```bash
cd ~/orangepi-server
sudo bash deploy/scripts/deploy-site.sh
```

The script fetches the latest `main` of the site repository and resets
`/var/www/myhomepage`. There is no build step, so no restart is required.

## Updating the API

```bash
cd ~/orangepi-server
sudo cp -a server/. /opt/myhomepage-api/
sudo sh -c 'cd /opt/myhomepage-api && npm ci --omit=dev'
sudo chown -R www-data:www-data /opt/myhomepage-api
sudo systemctl restart myhomepage-api
```

## Configuration

The API reads `/opt/myhomepage-api/.env`:

| Variable | Default | Meaning |
| --- | --- | --- |
| `NODE_ENV` | `production` | Node environment |
| `HOST` | `127.0.0.1` | Bind address; keep it on loopback |
| `PORT` | `3000` | Port proxied by Nginx |

After editing `.env`, restart the service:

```bash
sudo systemctl restart myhomepage-api
```

## Backup and recovery

The server holds no user data — bookmarks and events live in each visitor's
browser. To rebuild the machine, re-run the bootstrap script; the only local
state worth copying is `/opt/myhomepage-api/.env` and any Nginx customization.

```bash
sudo tar -czf myhomepage-config-$(date +%F).tar.gz \
  /opt/myhomepage-api/.env \
  /etc/nginx/sites-available/myhomepage.conf
```

## Security checklist

- Keep `HOST=127.0.0.1` so the API is reachable only through Nginx.
- Do not expose port 80 to the public internet without a reverse proxy, TLS and
  rate limiting; the original deployment was LAN-only by design.
- Keep `.env` out of git. `.gitignore` already covers it.
- Keep the system up to date: `sudo apt update && sudo apt full-upgrade -y`.
- Review `/var/log/nginx/error.log` after configuration changes.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `502 Bad Gateway` on `/api/health` | API down or on another port | `systemctl status myhomepage-api`; check `.env` `PORT` and the `proxy_pass` port |
| `404` for every page | Wrong `root` path | Compare `root` in the server block with `SITE_DIR` |
| `403 Forbidden` | Nginx user cannot read the site | `sudo chown -R www-data:www-data /var/www/myhomepage` |
| `nginx: [emerg] unknown directive` | Config copied from another Nginx version | Run `nginx -t`, compare with `deploy/nginx/sites-available/myhomepage.conf` |
| `myhomepage-api` restarts in a loop | Missing `.env`, bad `PORT`, or `node` not on the unit's `PATH` | `journalctl -u myhomepage-api -n 50`; check `ExecStart` / `Environment=PATH` |
| Site reachable at `localhost` but not from LAN | Firewall or different network | `sudo ufw allow 80/tcp` (if ufw is enabled); check `hostname -I` |
| Assets look stale after an update | Browser or proxy cache | Hard-refresh; cache TTL is 7 days for assets |
