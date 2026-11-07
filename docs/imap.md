# IMAP notes

The 2024 repository included an IMAP experiment that connected to a QQ Mail
mailbox. That script had two problems: the account credential was hard-coded and
committed, and the code was a copy of a tutorial rather than something the site
used. It is now a separate, read-only example in
[`examples/imap-reader`](../examples/imap-reader/) that reads everything from
environment variables.

## What IMAP is

IMAP (Internet Message Access Protocol) lets a client read and organise messages
that stay on the mail server. Common ports:

- `993` — IMAP over TLS (use this).
- `143` — plain IMAP, or STARTTLS; avoid it.

## Before you start

1. Enable IMAP in the mail provider's settings.
2. Generate an **application password** (QQ Mail calls it an authorisation code;
   Gmail calls it an app password). Do not use your login password.
3. Treat the app password like a password: it grants mailbox access.

For QQ Mail: Settings → Account → POP3/IMAP service → generate an authorisation
code. For Gmail: Google Account → Security → 2-Step Verification → App passwords.

## Run the example

```bash
cd examples/imap-reader
cp .env.example .env
# edit .env: IMAP_HOST, IMAP_USER, IMAP_PASSWORD
npm install
npm start
```

The script opens `INBOX`, searches for unseen messages (configurable), prints a
short preview of up to ten of them, and disconnects. It never modifies the
mailbox.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `IMAP_HOST` | — | `imap.qq.com`, `imap.gmail.com`, … |
| `IMAP_PORT` | `993` | 993 for TLS |
| `IMAP_TLS` | `true` | Use TLS |
| `IMAP_USER` | — | Mailbox account |
| `IMAP_PASSWORD` | — | App password / authorisation code |
| `IMAP_MAILBOX` | `INBOX` | Folder to read |
| `IMAP_UNSEEN_ONLY` | `true` | Only unseen messages |
| `IMAP_LIMIT` | `10` | Maximum messages to print |

## Security rules

- **Never commit `.env`.** It is listed in `.gitignore`; keep it that way.
- If a credential is committed by accident, revoke it with the mail provider
  immediately. Removing the file only fixes the latest commit — the secret stays
  in the git history until the history is rewritten.
- Prefer a dedicated mailbox or an app password scoped to mail access, and rotate
  it after the experiment.
- Do not use this example to send mail or to automate account actions; it is
  read-only by design.

## Libraries

- [`imapflow`](https://www.npmjs.com/package/imapflow) — maintained IMAP client
  with a promise-based API.
- [`mailparser`](https://www.npmjs.com/package/mailparser) — parses MIME
  messages into subject, sender, date and body.
