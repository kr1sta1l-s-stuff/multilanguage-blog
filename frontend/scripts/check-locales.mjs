// Verifies every key in src/i18n/keys.ts exists in each public/locales/<lang>.json
// (and that the JSON files contain no unknown keys). Run: node scripts/check-locales.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const keysSrc = readFileSync(join(root, 'src/i18n/keys.ts'), 'utf8');
const arrayBody = keysSrc.slice(
  keysSrc.indexOf('['),
  keysSrc.indexOf('] as const'),
);
const keys = [...arrayBody.matchAll(/'([^']+)'/g)].map((m) => m[1]);
const keySet = new Set(keys);

const manifest = JSON.parse(
  readFileSync(join(root, 'public/locales/index.json'), 'utf8'),
);

let failed = false;
for (const { code } of manifest) {
  const dict = JSON.parse(
    readFileSync(join(root, `public/locales/${code}.json`), 'utf8'),
  );
  const dictKeys = new Set(Object.keys(dict));
  const missing = keys.filter((k) => !dictKeys.has(k));
  const extra = [...dictKeys].filter((k) => !keySet.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`\n[${code}.json]`);
    if (missing.length) console.error(`  missing: ${missing.join(', ')}`);
    if (extra.length) console.error(`  unknown: ${extra.join(', ')}`);
  } else {
    console.log(`[${code}.json] OK (${dictKeys.size} keys)`);
  }
}

if (failed) {
  console.error('\nLocale check FAILED');
  process.exit(1);
}
console.log('\nLocale check passed');
