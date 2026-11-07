# Setup

This guide takes a fresh Orange Pi (or any ARM64 Debian/Ubuntu board) to a
working LAN deployment of USTC MyHomePage.

## Prerequisites

- An Orange Pi or similar ARM64 board running Debian or Ubuntu.
- Node.js **20 or newer** for ARM64.
- `git`, `nginx` and `curl`.
- The board and the clients on the same network.

The site itself is static, so the API is optional: if you do not need
`/api/health`, you can install Nginx only and skip the Node.js steps.

## 1. Prepare the system

```bash
sudo apt update
sudo apt full-upgrade -y
sudo apt install -y git nginx ca-certificates curl
```

Set a stable hostname and, ideally, a DHCP reservation or static IP so the LAN
address does not change:

```bash
sudo hostnamectl set-hostname myhomepage
hostname -I
```

## 2. Install Node.js 20+ (ARM64)

### Option A — official ARM64 tarball

Useful when the board has restricted internet access: download the tarball on a
PC, copy it over, and install it locally.

```bash
NODE_VERSION=v22.11.0
curl -fLO "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-arm64.tar.xz"
tar -xf "node-${NODE_VERSION}-linux-arm64.tar.xz"
sudo mv "node-${NODE_VERSION}-linux-arm64" "/usr/local/${NODE_VERSION}"
echo "export PATH=/usr/local/${NODE_VERSION}/bin:\$PATH" >> ~/.bashrc
source ~/.bashrc
node -v
```

The systemd unit uses `/usr/bin/env node` with
`PATH=/usr/local/bin:/usr/bin:/bin`. If Node lives somewhere else, either add a
symlink (`sudo ln -s /usr/local/node-v22.11.0/bin/node /usr/local/bin/node`) or
edit `ExecStart` in the unit.

### Option B — NodeSource repository

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

## 3. Get the repository

```bash
git clone https://github.com/2024-ustc-yuqing-cup-wd-team/orangepi-server.git
cd orangepi-server
```

## 4. Run the bootstrap script

```bash
sudo bash deploy/scripts/bootstrap.sh
```

The script:

1. installs Nginx and git;
2. clones the site repository into `/var/www/myhomepage`;
3. installs the API into `/opt/myhomepage-api` and runs `npm ci --omit=dev`;
4. installs and enables `deploy/nginx/sites-available/myhomepage.conf`;
5. installs and restarts `myhomepage-api.service`;
6. verifies `/` and `/api/health` with `curl`.

Paths can be overridden:

```bash
sudo SITE_DIR=/srv/myhomepage API_DIR=/srv/myhomepage-api \
  bash deploy/scripts/bootstrap.sh
```

If you change `SITE_DIR`, update `root` in the Nginx server block too.

## 5. Verify

```bash
curl -I http://127.0.0.1/
curl http://127.0.0.1/api/health
systemctl status myhomepage-api --no-pager
```

From another machine on the LAN, open `http://<board-ip>/`.

## 6. Optional: tuned main Nginx configuration

`deploy/nginx/nginx.conf` adds gzip, a custom log format and
`server_tokens off`. The stock Debian configuration already includes
`sites-enabled/*`, so this file is optional.

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
sudo cp deploy/nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

## Manual installation

If you prefer not to run the bootstrap script:

```bash
# Static site
sudo install -d /var/www/myhomepage
sudo git clone --depth 1 https://github.com/2024-ustc-yuqing-cup-wd-team/myhomepage.git /var/www/myhomepage
sudo chown -R www-data:www-data /var/www/myhomepage

# API
sudo install -d /opt/myhomepage-api
sudo cp -a server/. /opt/myhomepage-api/
sudo cp /opt/myhomepage-api/.env.example /opt/myhomepage-api/.env
sudo sh -c 'cd /opt/myhomepage-api && npm ci --omit=dev'
sudo chown -R www-data:www-data /opt/myhomepage-api

# Nginx
sudo cp deploy/nginx/sites-available/myhomepage.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/myhomepage.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# systemd
sudo cp deploy/systemd/myhomepage-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now myhomepage-api
```

## Troubleshooting

See [Operations](operations.md#troubleshooting) for the common failure modes:
502 from the API, 403/404 from Nginx, and the service not starting.
