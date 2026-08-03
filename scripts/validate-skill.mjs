import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const skillRoot = join(root, 'skills', 'securitycards');
const skillPath = join(skillRoot, 'SKILL.md');
const source = await readFile(skillPath, 'utf8');
const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/);

assert.ok(match, 'SKILL.md must contain YAML frontmatter and a Markdown body');
const frontmatterLines = match[1].split('\n').filter(Boolean);
assert.equal(frontmatterLines.length, 2, 'SKILL.md frontmatter must contain only name and description');
assert.equal(frontmatterLines[0], 'name: securitycards');
assert.match(frontmatterLines[1], /^description: .+/);
assert.ok(frontmatterLines[1].slice('description: '.length).length <= 1024);
assert.ok(match[2].length > 0, 'SKILL.md instructions must not be empty');
assert.ok(match[2].split('\n').length < 500, 'SKILL.md must stay under 500 lines');

const openai = await readFile(join(skillRoot, 'agents', 'openai.yaml'), 'utf8');
assert.match(openai, /display_name: "Security Cards"/);
assert.match(openai, /short_description: "Apply version-pinned secure coding guidance"/);
assert.match(openai, /default_prompt: "Use \$securitycards /);

const catalog = JSON.parse(
  await readFile(join(skillRoot, 'references', 'catalog.json'), 'utf8'),
);
assert.equal(catalog.schemaVersion, 2);
assert.equal(catalog.jsonCatalogUrl, 'https://securitycards.rewarelabs.com/catalog.json');
assert.ok(catalog.languages.length > 0, 'snapshot must contain at least one language');

for (const path of await walk(skillRoot)) {
  const info = await stat(path);
  assert.equal(
    info.mode & 0o111,
    0,
    `${relative(root, path)} must not be executable; the skill is instruction-only`,
  );
  const contents = await readFile(path, 'utf8');
  assert.doesNotMatch(contents, /(?:api[_-]?key|token|secret)\s*[:=]\s*['"][^'"]+/i);
}

console.log('validate-skill: structure, metadata, snapshot, and instruction-only policy are valid');

async function walk(directory) {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await walk(path));
    else paths.push(path);
  }
  return paths;
}
