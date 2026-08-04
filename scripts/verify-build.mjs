import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const read = filename => readFile(join(dist, filename), 'utf8');

const [
  markdownCatalog,
  llmsCatalog,
  catalogIndexSource,
  publicCatalogSource,
  notFound,
  routesSource,
  disclaimer,
  headers,
  favicon16,
  favicon32,
  favicon64,
  home,
  integration,
] = await Promise.all([
  read('agent-usage.md'),
  read('llms.txt'),
  read('_catalog-index.json'),
  read('catalog.json'),
  read('404.html'),
  read('_routes.json'),
  read('disclaimer/index.html'),
  read('_headers'),
  read('favicons/Icon__16-16-2.svg'),
  read('favicons/Icon__32-32-4.svg'),
  read('favicons/Icon__64-64-6.svg'),
  read('index.html'),
  read('integration/index.html'),
]);

assert.notEqual(
  markdownCatalog,
  llmsCatalog,
  '/agent-usage.md must be a concise guide, not a copy of /llms.txt',
);

const catalog = JSON.parse(catalogIndexSource);
assert.equal(
  publicCatalogSource,
  catalogIndexSource,
  '/catalog.json and /_catalog-index.json must expose the same catalog',
);
assert.equal(catalog.schemaVersion, 2);
assert.equal(
  catalog.usageGuideUrl,
  'https://securitycards.rewarelabs.com/agent-usage.md',
);
assert.equal(catalog.catalogUrl, 'https://securitycards.rewarelabs.com/llms.txt');
assert.equal(
  catalog.jsonCatalogUrl,
  'https://securitycards.rewarelabs.com/catalog.json',
);
assert.ok(markdownCatalog.length < llmsCatalog.length / 3);
assert.match(markdownCatalog, /^# Security Cards Agent Usage$/m);
assert.match(markdownCatalog, /^## Recommended: use the Security Cards skill$/m);
assert.match(markdownCatalog, /npx skills add Reware-Labs\/securitycards --skill securitycards -g/);
assert.match(markdownCatalog, /https:\/\/github\.com\/Reware-Labs\/securitycards/);
assert.match(markdownCatalog, /^## How to use Security Cards$/m);
assert.match(markdownCatalog, /^## Common workflows$/m);
assert.match(markdownCatalog, /https:\/\/securitycards\.rewarelabs\.com\/llms\.txt/);
assert.doesNotMatch(
  markdownCatalog,
  /\/libraries\/javascript\/fastify\/v5-9-0\//,
  'The concise guide must not reproduce the exhaustive library inventory',
);

for (const language of catalog.languages) {
  assert.match(llmsCatalog, new RegExp(escapeRegExp(language.catalogUrl)));
  for (const library of language.libraries) {
    assert.ok(
      library.versions.some(version => version.versionSlug === library.latestVersion),
      `${language.slug}/${library.slug} must identify a supported latest version`,
    );
    for (const version of library.versions) {
      const urls = [
        version.canonicalUrl,
        version.bundleUrl,
        version.blueprintUrl,
        ...version.categories.map(card => card.canonicalUrl),
      ].filter(Boolean);
      for (const url of urls) {
        assert.match(llmsCatalog, new RegExp(escapeRegExp(url)));
        await access(join(dist, artifactPathForUrl(url)));
      }
    }
  }
}

assert.match(notFound, /name="robots" content="noindex, follow"/);
assert.match(notFound, /rel="alternate" type="text\/markdown" href="\/agent-usage\.md"/);
assert.match(notFound, /id="not-found-path"/);
assert.match(notFound, /id="not-found-resolver-status"/);
assert.match(notFound, /not-found-resolver/);
assert.match(notFound, /href="\/llms\.txt" type="text\/plain"/);
assert.match(notFound, /href="\/agent-usage\.md">Read the agent usage guide<\/a>/);

assert.match(
  home,
  /href="\/libraries\/csharp\/asp-net\/v10-0-10\/"/,
  'C# library links must use the stable csharp language slug',
);
assert.doesNotMatch(
  home,
  /href="\/libraries\/c(?:%23|#)\//,
  'C# library links must not depend on encoded or raw # characters',
);
assert.match(
  home,
  /href="\/libraries\/cpp\/envoy\/v1-39-0\/"/,
  'C++ library links must use the stable cpp language slug',
);
assert.doesNotMatch(
  home,
  /href="\/libraries\/c(?:%2B%2B|\+\+)\//i,
  'C++ library links must not use encoded or raw + characters',
);

assert.match(
  llmsCatalog,
  /https:\/\/securitycards\.rewarelabs\.com\/libraries\/csharp\/asp-net\/v10-0-10\//,
  'catalog C# URLs must use the stable csharp language slug',
);
assert.doesNotMatch(
  llmsCatalog,
  /https:\/\/securitycards\.rewarelabs\.com\/(?:libraries|downloads|llms)\/c(?:%23|#)/,
  'catalog URLs must not use encoded or raw # characters in C# paths',
);
assert.match(
  llmsCatalog,
  /https:\/\/securitycards\.rewarelabs\.com\/libraries\/cpp\/envoy\/v1-39-0\//,
  'catalog C++ URLs must use the stable cpp language slug',
);
assert.doesNotMatch(
  llmsCatalog,
  /https:\/\/securitycards\.rewarelabs\.com\/(?:libraries|downloads|llms)\/c(?:%2B%2B|\+\+)/i,
  'catalog URLs must not use encoded or raw + characters in C++ paths',
);
assert.match(
  integration,
  /https:\/\/securitycards\.rewarelabs\.com\/downloads\/csharp\/asp-net\/v10-0-10\.md/,
  'integration examples must use the stable csharp language slug',
);
assert.doesNotMatch(
  integration,
  /https:\/\/securitycards\.rewarelabs\.com\/(?:libraries|downloads|llms)\/c(?:%23|#)/,
  'integration examples must not use encoded or raw # characters in C# paths',
);
assert.match(integration, /Let the agent inspect my project/);
assert.match(integration, /data-filter-search/);
assert.match(integration, /Search by library, language, or version/);
assert.match(integration, /data-search="JavaScript Fastify v5\.9\.0"/);
assert.doesNotMatch(integration, /<select[^>]*id="integration-library"/);
assert.match(integration, /npx skills add Reware-Labs\/securitycards --skill securitycards -g/);
assert.match(integration, /href="\/agent-usage\.md"[^>]*>Open agent-usage\.md<\/a>/);
assert.match(integration, /Starting a new project/);
assert.match(integration, /Building a feature/);
assert.match(integration, /Reviewing a codebase/);
assert.match(integration, /More ways to connect/);
assert.doesNotMatch(integration, /Advanced: stable endpoints/);
assert.equal((integration.match(/data-prompt-output/g) ?? []).length, 1);
assert.doesNotMatch(
  integration.match(/<pre class="prompt-content"[\s\S]*?<\/pre>/)?.[0] ?? '',
  /llms\.txt/,
  'the human prompt must not mention llms.txt',
);
await assert.rejects(
  access(join(dist, 'securitycards.md')),
  '/securitycards.md must not be generated',
);

await Promise.all([
  read('libraries/csharp/asp-net/v10-0-10/index.html'),
  read('downloads/csharp/asp-net/v10-0-10.md'),
  read('downloads/csharp.md'),
  read('llms/csharp.txt'),
  read('libraries/cpp/envoy/v1-39-0/index.html'),
  read('downloads/cpp/envoy/v1-39-0.md'),
  read('downloads/cpp.md'),
  read('llms/cpp.txt'),
]);

const routes = JSON.parse(routesSource);
assert.deepEqual(routes.include, ['/libraries/*', '/downloads/*']);
assert.deepEqual(routes.exclude, []);

assert.match(disclaimer, /<h1[^>]*>Disclaimer<\/h1>/);
assert.match(disclaimer, /Use the cards as guidance/);
assert.match(disclaimer, /to the fullest extent permitted by applicable law/i);
for (const iconPath of [
  '/favicons/Icon__16-16-2.svg',
  '/favicons/Icon__32-32-4.svg',
  '/favicons/Icon__64-64-6.svg',
]) {
  assert.match(disclaimer, new RegExp(escapeRegExp(iconPath)));
}
for (const favicon of [favicon16, favicon32, favicon64]) {
  assert.match(favicon, /<svg\b/);
}
assert.match(headers, /X-Content-Type-Options: nosniff/);
assert.match(headers, /X-Frame-Options: DENY/);

console.log('verify-build: catalogs, routes, legal page, favicons, headers, and 404 artifacts are consistent');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function artifactPathForUrl(value) {
  const pathname = new URL(value).pathname.replace(/^\//, '');
  return pathname.endsWith('/') ? `${pathname}index.html` : pathname;
}
