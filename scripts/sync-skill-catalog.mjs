import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const builtPath = join(root, 'dist', 'catalog.json');
const snapshotPath = join(root, 'skills', 'securitycards', 'references', 'catalog.json');
const check = process.argv.includes('--check');

const catalog = JSON.parse(await readFile(builtPath, 'utf8'));
assert.equal(catalog.schemaVersion, 2, 'catalog schemaVersion must be 2');
assert.equal(
  catalog.jsonCatalogUrl,
  'https://securitycards.rewarelabs.com/catalog.json',
  'catalog must identify the stable JSON endpoint',
);

const snapshot = `${JSON.stringify(catalog, null, 2)}\n`;

if (check) {
  const committed = await readFile(snapshotPath, 'utf8');
  assert.equal(
    committed,
    snapshot,
    'skill catalog snapshot is stale; run npm run sync:skill-catalog after building',
  );
  console.log('skill catalog snapshot is current');
} else {
  await writeFile(snapshotPath, snapshot);
  console.log('updated skills/securitycards/references/catalog.json');
}
