'use strict';

/**
 * Minimal IMAP reader.
 *
 * Configuration comes from environment variables (see .env.example); nothing is
 * hard-coded. Run it with:
 *
 *   cp .env.example .env    # then edit .env
 *   npm install
 *   npm start
 *
 * This example is intentionally read-only: it lists and previews messages and
 * never marks, deletes or sends anything.
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');

const host = process.env.IMAP_HOST;
const user = process.env.IMAP_USER;
const password = process.env.IMAP_PASSWORD;

if (!host || !user || !password) {
  console.error('IMAP_HOST, IMAP_USER and IMAP_PASSWORD must be set (see .env.example).');
  process.exit(1);
}

const config = {
  user,
  password,
  host,
  port: Number(process.env.IMAP_PORT || 993),
  tls: (process.env.IMAP_TLS || 'true') !== 'false',
  tlsOptions: { servername: host }
};

const mailbox = process.env.IMAP_MAILBOX || 'INBOX';
const unseenOnly = (process.env.IMAP_UNSEEN_ONLY || 'true') !== 'false';
const limit = Math.max(1, Number(process.env.IMAP_LIMIT || 10));

const imap = new Imap(config);

function fail(error) {
  console.error('IMAP error:', error && error.message ? error.message : error);
  process.exitCode = 1;
  try {
    imap.end();
  } catch (ignored) {
    // The connection may already be closed.
  }
}

function preview(message) {
  const body = (message.text || '').replace(/\s+/g, ' ').trim();
  return body.length > 200 ? `${body.slice(0, 200)}…` : body;
}

imap.once('ready', () => {
  imap.openBox(mailbox, false, (openError) => {
    if (openError) {
      fail(openError);
      return;
    }

    imap.search(unseenOnly ? ['UNSEEN'] : ['ALL'], (searchError, results) => {
      if (searchError) {
        fail(searchError);
        return;
      }

      if (!results || results.length === 0) {
        console.log(`No ${unseenOnly ? 'unseen ' : ''}messages in ${mailbox}.`);
        imap.end();
        return;
      }

      const selected = results.slice(-limit);
      const fetch = imap.fetch(selected, { bodies: '' });

      fetch.on('message', (message) => {
        message.on('body', (stream) => {
          simpleParser(stream, (parseError, parsed) => {
            if (parseError) {
              console.error('Could not parse a message:', parseError.message);
              return;
            }
            console.log('---');
            console.log('Subject:', parsed.subject || '(none)');
            console.log('From:', parsed.from ? parsed.from.text : '(unknown)');
            console.log('Date:', parsed.date ? parsed.date.toISOString() : '(unknown)');
            console.log('Preview:', preview(parsed));
          });
        });
      });

      fetch.once('error', fail);
      fetch.once('end', () => {
        console.log('Done.');
        imap.end();
      });
    });
  });
});

imap.once('error', fail);
imap.once('end', () => console.log('Connection closed.'));
imap.connect();
