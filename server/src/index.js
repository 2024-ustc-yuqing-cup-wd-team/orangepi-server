'use strict';

/**
 * MyHomePage API.
 *
 * A deliberately small Express service that lives behind Nginx at /api/. It
 * exposes a health endpoint today and is the place for future server-side
 * features. All user data stays in the browser, so there is no database here.
 */

const express = require('express');
const pkg = require('../package.json');

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const startedAt = Date.now();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: pkg.name,
    version: pkg.version,
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000)
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: pkg.name,
    version: pkg.version,
    endpoints: ['/api/health']
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

// Express error handlers must keep the four-argument signature.
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
  console.error('[myhomepage-api] unhandled error:', error);
  res.status(500).json({ error: 'internal_error' });
});

const server = app.listen(port, host, () => {
  console.log(`[myhomepage-api] listening on http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[myhomepage-api] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  });
}
