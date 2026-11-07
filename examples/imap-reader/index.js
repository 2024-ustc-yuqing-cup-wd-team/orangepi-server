'use strict';

/**
 * Minimal read-only IMAP reader built on imapflow.
 *
 * Configuration comes from environment variables (see .env.example); nothing is
 * hard-coded. Run it with:
 *
 *   cp .env.example .env    # then edit .env
 *   npm install
 *   npm start
 *
 * This example only lists and previews messages: it never marks, moves, deletes
 * or sends anything.
 */

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const host = process.env.IMAP_HOST;
const user = process.env.IMAP_USER;
const password = process.env.IMAP_PASSWORD;

if (!host || !user || !password) {
  console.error('IMAP_HOST, IMAP_USER and IMAP_PASSWORD must be set (see .env.example).');
  process.exit(1);
}

const mailbox = process.env.IMAP_MAILBOX || 'INBOX';
const unseenOnly = (process.env.IMAP_UNSEEN_ONLY || 'true') !== 'false';
const limit = Math.max(1, Number(process.env.IMAP_LIMIT || 10));

const client = new ImapFlow({
  host,
  port: Number(process.env.IMAP_PORT || 993),
  secure: (process.env.IMAP_TLS || 'true') !== 'false',
  auth: { user, pass: password },
  logger: false
});

function preview(message) {
  const body = (message.text || '').replace(/\s+/g, ' ').trim();
  return body.length > 200 ? `${body.slice(0, 200)}…` : body;
}

async function main() {
  await client.connect();

  const lock = await client.getMailboxLock(mailbox);
  try {
    const criteria = unseenOnly ? { seen: false } : { all: true };
    const uids = await client.search(criteria, { uid: true });

    if (!uids || uids.length === 0) {
      console.log(`No ${unseenOnly ? 'unseen ' : ''}messages in ${mailbox}.`);
      return;
    }

    const selected = uids.slice(-limit);
    for await (const message of client.fetch(selected, { envelope: true, source: true, uid: true }, { uid: true })) {
      const parsed = await simpleParser(message.source);
      console.log('---');
      console.log('Subject:', parsed.subject || '(none)');
      console.log('From:', parsed.from ? parsed.from.text : '(unknown)');
      console.log('Date:', parsed.date ? parsed.date.toISOString() : '(unknown)');
      console.log('Preview:', preview(parsed));
    }
  } finally {
    lock.release();
  }
}

main()
  .catch((error) => {
    console.error('IMAP error:', error && error.message ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    client.logout().catch(() => {
      // The connection may already be closed after an error.
    });
  });
