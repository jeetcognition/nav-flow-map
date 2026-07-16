#!/usr/bin/env node
// Nightly API health smoke for Devin Enterprise. Pure black-box — no repo access needed.
// Covers ENT-021/022/043. Exit code != 0 on any failure so cron/CI can alert.
//
// Usage:
//   BASE_API_URL=https://qa.staging.devinenterprise.com \
//   ENTERPRISE_SERVICE_KEY=... ORG_SERVICE_KEY=... \
//   node scripts/api-health.mjs
//
// Cron (e.g. 06:00 daily), writing a log you can paste into Slack/Linear:
//   0 6 * * *  cd /path/to/enterprise-qa-smoke && \
//     BASE_API_URL=... ENTERPRISE_SERVICE_KEY=... ORG_SERVICE_KEY=... \
//     node scripts/api-health.mjs >> ~/qa-logs/ent-api-health.log 2>&1

const BASE = (process.env.BASE_API_URL ?? 'https://qa.staging.devinenterprise.com').replace(/\/$/, '');

const checks = [
  { name: 'Org health        [ENT-021]', path: '/v2/health/me',            key: process.env.ORG_SERVICE_KEY },
  { name: 'Enterprise health [ENT-022]', path: '/v2/enterprise/health/me', key: process.env.ENTERPRISE_SERVICE_KEY },
];

async function run() {
  const ts = new Date().toISOString();
  let failures = 0;
  const rows = [];

  for (const c of checks) {
    if (!c.key) { rows.push([c.name, 'SKIP', 'no key in env']); continue; }
    try {
      const res = await fetch(`${BASE}${c.path}`, {
        headers: { Authorization: `Bearer ${c.key}` },
      });
      const ok = res.status === 200;
      if (!ok) failures++;
      rows.push([c.name, ok ? 'PASS' : 'FAIL', `HTTP ${res.status}`]);
    } catch (err) {
      failures++;
      rows.push([c.name, 'FAIL', err.message]);
    }
  }

  console.log(`\nDevin Enterprise API health — ${ts}  (${BASE})`);
  for (const [name, status, detail] of rows) {
    console.log(`  ${status.padEnd(4)}  ${name}  ${detail}`);
  }
  console.log(failures ? `\nRESULT: FAIL (${failures})\n` : `\nRESULT: PASS\n`);
  process.exit(failures ? 1 : 0);
}

run();
