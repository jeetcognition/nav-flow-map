/**
 * otp-test.mjs
 *
 * Standalone check that the Gmail App Password + IMAP access work, independent of the browser.
 * Connects to Gmail, lists recent message subjects, and prints the latest 6-digit code it finds.
 *
 * Usage:  npm run otp:test
 *
 * Reads from .env:  GMAIL_IMAP_USER (or DEVIN_ADMIN_EMAIL), GMAIL_APP_PASSWORD,
 *                   OTP_FROM_INCLUDES, OTP_SUBJECT_INCLUDES, OTP_CODE_REGEX (all optional)
 */

import 'dotenv/config';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

const user = (process.env.GMAIL_IMAP_USER || process.env.DEVIN_ADMIN_EMAIL || '').trim();
const pass = (process.env.GMAIL_APP_PASSWORD || '').trim();
const fromIncludes = process.env.OTP_FROM_INCLUDES?.toLowerCase();
const subjectIncludes = process.env.OTP_SUBJECT_INCLUDES?.toLowerCase();
const codeRegex = process.env.OTP_CODE_REGEX ? new RegExp(process.env.OTP_CODE_REGEX) : /\b(\d{6})\b/;

if (!user || !pass) {
  console.error('✘  Set GMAIL_IMAP_USER (or DEVIN_ADMIN_EMAIL) and GMAIL_APP_PASSWORD in .env first.');
  process.exit(1);
}

console.log(`\nConnecting to imap.gmail.com as ${user} ...`);
const client = new ImapFlow({ host: 'imap.gmail.com', port: 993, secure: true, auth: { user, pass }, logger: false, tls: { rejectUnauthorized: false } });

try {
  await client.connect();
  console.log('✓  IMAP login succeeded — App Password works.\n');
} catch (err) {
  console.error('✘  IMAP login FAILED:', err?.message ?? err);
  console.error('   Check: 2-Step Verification on, App Password correct (16 chars), IMAP enabled in Gmail settings.');
  process.exit(1);
}

const since = new Date(Date.now() - 30 * 60_000); // last 30 minutes
const lock = await client.getMailboxLock('INBOX');
try {
  const uids = await client.search({ since }, { uid: true });
  console.log(`Recent messages (last 30 min): ${uids?.length ?? 0}`);
  if (!uids?.length) {
    console.log('   (none — request a login code, then re-run to confirm parsing.)');
  }

  const ordered = [...(uids ?? [])].sort((a, b) => b - a).slice(0, 10);
  let found;
  for (const uid of ordered) {
    const msg = await client.fetchOne(String(uid), { envelope: true, source: true }, { uid: true });
    if (!msg?.source) continue;
    const from = (msg.envelope?.from?.map((a) => a.address ?? '').join(',') ?? '').toLowerCase();
    const subject = msg.envelope?.subject ?? '';
    console.log(`   • ${subject}  —  ${from}`);
    if (fromIncludes && !from.includes(fromIncludes)) continue;
    if (subjectIncludes && !subject.toLowerCase().includes(subjectIncludes)) continue;
    if (found) continue;
    const parsed = await simpleParser(msg.source);
    for (const text of [parsed.subject ?? '', parsed.text ?? '', parsed.html || '']) {
      const m = codeRegex.exec(text);
      if (m) { found = (m[1] ?? m[0]).trim(); break; }
    }
  }
  console.log(found ? `\n✓  Latest detected code: ${found}\n` : '\nNo code matched yet (default = 6 digits). Request a code and re-run.\n');
} finally {
  lock.release();
  await client.logout().catch(() => client.close());
}
