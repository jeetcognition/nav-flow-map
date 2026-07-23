import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// Reads a one-time login code (OTP) from a Gmail inbox over IMAP.
//
// Auth: Gmail blocks plain passwords over IMAP, so this needs a 16-char *App Password*
// (Google Account -> Security -> 2-Step Verification -> App passwords). Put it in .env as
// GMAIL_APP_PASSWORD and the inbox address as GMAIL_IMAP_USER (defaults to DEVIN_ADMIN_EMAIL).
//
// Strategy: after the app requests a code, wait for the email to arrive, then pick the
// email with the highest UID (newest) and extract the numeric code from it.

export interface FetchOtpOptions {
  /** IMAP login (inbox address). Defaults to env GMAIL_IMAP_USER || DEVIN_ADMIN_EMAIL. */
  user?: string;
  /** Google App Password. Defaults to env GMAIL_APP_PASSWORD. */
  password?: string;
  /** Only consider messages whose From contains this (case-insensitive). */
  fromIncludes?: string;
  /** Only consider messages whose To contains this (case-insensitive). */
  toIncludes?: string;
  /** Only consider messages whose Subject contains this (case-insensitive). */
  subjectIncludes?: string;
  /** Regex with a capture group for the code. Defaults to a 6-digit match. */
  codeRegex?: RegExp;
  /** Delay before first poll to let email arrive (ms). Default 30s. */
  initialDelayMs?: number;
  /** Max time to wait for the email to arrive (ms). Default 90s. */
  timeoutMs?: number;
  /** Poll interval while waiting (ms). Default 3s. */
  pollIntervalMs?: number;
}

const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;

function envDefault(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/**
 * Wait for the OTP email to arrive, then pick the newest one (highest UID).
 * Call this AFTER submitting the email for OTP.
 */
export async function fetchLatestOtp(options: FetchOtpOptions = {}): Promise<string> {
  const user = options.user ?? envDefault("GMAIL_IMAP_USER") ?? envDefault("DEVIN_ADMIN_EMAIL");
  const password = options.password ?? envDefault("GMAIL_APP_PASSWORD");
  if (!user || !password) {
    throw new Error(
      "Gmail OTP: missing inbox credentials. Set GMAIL_IMAP_USER (or DEVIN_ADMIN_EMAIL) and GMAIL_APP_PASSWORD in .env.",
    );
  }

  const codeRegex = options.codeRegex ?? defaultCodeRegex();
  const initialDelayMs = options.initialDelayMs ?? 30_000;
  const timeoutMs = options.timeoutMs ?? 90_000;
  const pollIntervalMs = options.pollIntervalMs ?? 3_000;
  const fromIncludes = options.fromIncludes?.toLowerCase();
  const toIncludes = options.toIncludes?.toLowerCase();
  const subjectIncludes = options.subjectIncludes?.toLowerCase();

  // Wait for the email to arrive before polling.
  await sleep(initialDelayMs);

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const deadline = Date.now() + (timeoutMs - initialDelayMs);

    while (Date.now() < deadline) {
      const code = await findNewestCode(client, {
        fromIncludes,
        toIncludes,
        subjectIncludes,
        codeRegex,
      });
      if (code) return code;
      await sleep(pollIntervalMs);
    }
    throw new Error(`Gmail OTP: timed out after ${timeoutMs}ms (no matching OTP email found).`);
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/**
 * Find the OTP code from the newest email that matches the filters,
 * scanning back over the most recent messages (newest first).
 */
async function findNewestCode(
  client: ImapFlow,
  filters: {
    fromIncludes?: string;
    toIncludes?: string;
    subjectIncludes?: string;
    codeRegex: RegExp;
  },
): Promise<string | undefined> {
  const lock = await client.getMailboxLock("INBOX");
  try {
    // Search for today's emails.
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const uids = await client.search({ since }, { uid: true });
    if (!uids || uids.length === 0) return undefined;

    // Walk the newest emails first; a shared inbox can hold codes for other logins.
    const newestFirst = [...uids].sort((a, b) => b - a).slice(0, 10);
    for (const uid of newestFirst) {
      const msg = await client.fetchOne(
        String(uid),
        { envelope: true, source: true },
        { uid: true },
      );
      if (!msg || !msg.source) continue;

      const from = (msg.envelope?.from?.map((a) => a.address ?? "").join(",") ?? "").toLowerCase();
      const to = (msg.envelope?.to?.map((a) => a.address ?? "").join(",") ?? "").toLowerCase();
      const subject = (msg.envelope?.subject ?? "").toLowerCase();
      if (filters.fromIncludes && !from.includes(filters.fromIncludes)) continue;
      if (filters.toIncludes && !to.includes(filters.toIncludes)) continue;
      if (filters.subjectIncludes && !subject.includes(filters.subjectIncludes)) continue;

      const parsed = await simpleParser(msg.source);
      const haystacks = [parsed.subject ?? "", parsed.text ?? "", parsed.html || ""];
      for (const text of haystacks) {
        const m = filters.codeRegex.exec(text);
        if (m) return (m[1] ?? m[0]).trim();
      }
      // Without filters keep the original semantics: only consider the newest email.
      if (!filters.fromIncludes && !filters.toIncludes && !filters.subjectIncludes) {
        return undefined;
      }
    }
    return undefined;
  } finally {
    lock.release();
  }
}

/**
 * Delete all OTP emails from the inbox (matching subject pattern).
 * Call after successful login to keep the inbox clean for future runs.
 */
export async function deleteOtpEmails(
  options: {
    user?: string;
    password?: string;
    subjectPattern?: RegExp;
  } = {},
): Promise<number> {
  const user = options.user ?? envDefault("GMAIL_IMAP_USER") ?? envDefault("DEVIN_ADMIN_EMAIL");
  const password = options.password ?? envDefault("GMAIL_APP_PASSWORD");
  if (!user || !password) return 0;

  const subjectPattern = options.subjectPattern ?? /verification code/i;

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const lock = await client.getMailboxLock("INBOX");
    try {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const uids = await client.search({ since }, { uid: true });
      if (!uids || uids.length === 0) return 0;

      let deleted = 0;
      for (const uid of uids) {
        const msg = await client.fetchOne(String(uid), { envelope: true }, { uid: true });
        if (!msg?.envelope?.subject) continue;
        if (subjectPattern.test(msg.envelope.subject)) {
          await client.messageDelete(String(uid), { uid: true });
          deleted++;
        }
      }
      return deleted;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => client.close());
  }
}

/** Default matcher: a standalone 4-8 digit run, prefer 6 (configurable via OTP_CODE_REGEX). */
function defaultCodeRegex(): RegExp {
  const fromEnv = envDefault("OTP_CODE_REGEX");
  if (fromEnv) return new RegExp(fromEnv);
  return /\b(\d{6})\b/;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
