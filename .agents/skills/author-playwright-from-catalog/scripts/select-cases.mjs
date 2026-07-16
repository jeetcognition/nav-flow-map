#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(skillDir, '../../../../');
const source = fs.readFileSync(path.join(repoRoot, 'testcases.js'), 'utf8');
const match = source.match(/^const TESTCASES = (.*);$/m);
if (!match) throw new Error('Could not find TESTCASES in testcases.js');
const cases = JSON.parse(match[1]);

const args = process.argv.slice(2);
const filters = {};
for (let i = 0; i < args.length; i += 1) {
  if (!args[i].startsWith('--')) throw new Error(`Unexpected argument: ${args[i]}`);
  const key = args[i].slice(2);
  const value = args[i + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}`);
  filters[key] = value.split(',').map(item => item.trim()).filter(Boolean);
  i += 1;
}

const explicitIds = new Set(filters.id || []);
const prefixes = new Set(filters.prefix || []);
const suites = new Set(filters.suite || (explicitIds.size ? [] : ['Smoke', 'Sanity']));
const priorities = new Set(filters.priority || (explicitIds.size ? [] : ['P0', 'P1']));
const selected = cases.filter(testCase => {
  if (explicitIds.size && !explicitIds.has(testCase.id)) return false;
  if (prefixes.size && !prefixes.has(testCase.id.split('-')[0])) return false;
  if (suites.size && !suites.has(testCase.type)) return false;
  if (priorities.size && !priorities.has(testCase.pri)) return false;
  return true;
});

process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`);
