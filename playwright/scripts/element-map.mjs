/**
 * element-map.mjs
 *
 * Walks a page (using the saved admin session) and prints every interactive
 * element with its role, accessible name, and the Playwright locator to use.
 *
 * Usage:
 *   node scripts/element-map.mjs [url-path-or-full-url]
 *
 * Examples:
 *   node scripts/element-map.mjs /org/cog-enterprise-qa/org-selector
 *   node scripts/element-map.mjs /org/jeet-devin-qa/wiki
 *   node scripts/element-map.mjs /org/jeet-devin-qa/search
 *
 * Requires .auth/admin.json (run `npm run auth` once to create it).
 */

import { chromium } from '@playwright/test';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL ?? 'https://cog-enterprise-qa.beta.devinenterprise.com';
const pathArg = process.argv[2] ?? '/';
const url = pathArg.startsWith('http') ? pathArg : BASE_URL + pathArg;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: '.auth/admin.json' });
const page = await ctx.newPage();

console.log(`\nNavigating to: ${url}\n`);
await page.goto(url, { waitUntil: 'networkidle' });

// Guard: detect auth redirect — session has expired if we land on a login page.
const finalUrl = page.url();
const title = await page.title();
if (finalUrl.includes('/login') || finalUrl.includes('auth0') || title.toLowerCase().includes('log in')) {
  await browser.close();
  console.error(`\n✘  Session expired — landed on login page instead of the target URL.`);
  console.error(`   Run:  npm run auth\n   Then re-run this script.\n`);
  process.exit(1);
}

console.log(`Page title: ${title}\nURL: ${finalUrl}\n`);

const elements = await page.evaluate(() => {
  const results = [];

  // Collect all buttons (including role=button)
  document.querySelectorAll('button, [role="button"]').forEach(el => {
    const name = (
      el.getAttribute('aria-label') ||
      el.innerText?.replace(/\s+/g, ' ').trim()
    )?.slice(0, 70) || '';
    if (!name) return;
    results.push({
      role: 'button',
      name,
      testid: el.getAttribute('data-testid') || '',
      locator: `getByRole('button', { name: ${JSON.stringify(name)} })`,
    });
  });

  // Links
  document.querySelectorAll('a[href], [role="link"]').forEach(el => {
    const name = (
      el.getAttribute('aria-label') ||
      el.innerText?.replace(/\s+/g, ' ').trim()
    )?.slice(0, 70) || '';
    if (!name) return;
    results.push({
      role: 'link',
      name,
      testid: el.getAttribute('data-testid') || '',
      locator: `getByRole('link', { name: ${JSON.stringify(name)} })`,
    });
  });

  // Text inputs / textareas
  document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea').forEach(el => {
    const label = document.querySelector(`label[for="${el.id}"]`)?.innerText?.trim()
      || el.getAttribute('aria-label')
      || el.getAttribute('placeholder')
      || '';
    if (!label) return;
    results.push({
      role: el.tagName === 'TEXTAREA' ? 'textbox' : `input[type=${el.type || 'text'}]`,
      name: label,
      testid: el.getAttribute('data-testid') || '',
      locator: `getByLabel(${JSON.stringify(label)})  // or getByPlaceholder(${JSON.stringify(el.getAttribute('placeholder') || label)})`,
    });
  });

  // Checkboxes
  document.querySelectorAll('input[type=checkbox]').forEach(el => {
    const label = document.querySelector(`label[for="${el.id}"]`)?.innerText?.trim()
      || el.getAttribute('aria-label') || '';
    if (!label) return;
    results.push({
      role: 'checkbox',
      name: label,
      testid: el.getAttribute('data-testid') || '',
      locator: `getByRole('checkbox', { name: ${JSON.stringify(label)} })`,
    });
  });

  // Deduplicate by locator string
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.locator)) return false;
    seen.add(r.locator);
    return true;
  });
});

// Pretty-print
const COL = { role: 10, name: 40, testid: 22 };
const header = 'ROLE'.padEnd(COL.role) + 'NAME'.padEnd(COL.name) + 'TESTID'.padEnd(COL.testid) + 'PLAYWRIGHT LOCATOR';
console.log(header);
console.log('-'.repeat(header.length + 20));
for (const el of elements) {
  const line =
    el.role.padEnd(COL.role) +
    el.name.slice(0, COL.name - 2).padEnd(COL.name) +
    (el.testid || '-').padEnd(COL.testid) +
    el.locator;
  console.log(line);
}
console.log(`\n${elements.length} elements found.\n`);

await browser.close();
