import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveVersionPath,
  shouldAttemptNormalization,
} from '../functions/_lib/version-resolution.js';
import { handleVersionedRequest } from '../functions/_lib/handle-versioned-request.js';
import {
  compareVersionSlugs,
  formatVersionLabel,
} from '../src/utils/version.js';
import { buildBrowserFallbackUrl } from '../src/scripts/not-found-resolver.js';

const catalog = {
  schemaVersion: 2,
  usageGuideUrl: 'https://securitycards.example/agent-usage.md',
  catalogUrl: 'https://securitycards.example/llms.txt',
  languages: [
    {
      slug: 'python',
      libraries: [
        {
          slug: 'fastapi',
          latestVersion: '0-140-0',
          versions: [
            {
              version: '0.140.0',
              versionSlug: '0-140-0',
              path: '/libraries/python/fastapi/0-140-0/',
              bundlePath: '/downloads/python/fastapi/0-140-0.md',
              blueprintPath: '/downloads/python/fastapi/0-140-0/0_security_blueprint.md',
              categories: [
                {
                  slug: 'injection',
                  path: '/downloads/python/fastapi/0-140-0/injection.md',
                },
              ],
            },
            {
              version: '0.139.2',
              versionSlug: '0-139-2',
              path: '/libraries/python/fastapi/0-139-2/',
              bundlePath: '/downloads/python/fastapi/0-139-2.md',
              blueprintPath: '/downloads/python/fastapi/0-139-2/0_security_blueprint.md',
              categories: [],
            },
          ],
        },
      ],
    },
  ],
};

test('preserves arbitrary upstream version labels without SemVer validation', () => {
  assert.equal(formatVersionLabel('shiro-root-3-0-0'), 'shiro.root.3.0.0');
  assert.equal(formatVersionLabel('sveltejs-kit-2-70-1'), 'sveltejs.kit.2.70.1');
  assert.equal(formatVersionLabel('rel-2-0-51'), 'rel.2.0.51');
  assert.equal(formatVersionLabel('6-1rc1'), '6.1rc1');
  assert.equal(formatVersionLabel('release-next'), 'release.next');
  assert.ok(compareVersionSlugs('v2-10-0', 'v2-9-0') > 0);
});

test('normalizes malformed, unavailable, and omitted human page versions', () => {
  assert.equal(
    resolveVersionPath('/libraries/python/fastapi/0.139.2/', catalog),
    '/libraries/python/fastapi/0-140-0/',
  );
  assert.equal(
    resolveVersionPath('/libraries/python/fastapi/not-a-version/', catalog),
    '/libraries/python/fastapi/0-140-0/',
  );
  assert.equal(
    resolveVersionPath('/libraries/python/fastapi/', catalog),
    '/libraries/python/fastapi/0-140-0/',
  );
});

test('normalizes bundles, category cards, and blueprints', () => {
  assert.equal(
    resolveVersionPath('/downloads/python/fastapi/99-0-0.md', catalog),
    '/downloads/python/fastapi/0-140-0.md',
  );
  assert.equal(
    resolveVersionPath('/downloads/python/fastapi/', catalog),
    '/downloads/python/fastapi/0-140-0.md',
  );
  assert.equal(
    resolveVersionPath('/downloads/python/fastapi/0.139.2/injection.md', catalog),
    '/downloads/python/fastapi/0-140-0/injection.md',
  );
  assert.equal(
    resolveVersionPath('/downloads/python/fastapi/nope/0_security_blueprint.md', catalog),
    '/downloads/python/fastapi/0-140-0/0_security_blueprint.md',
  );
});

test('does not guess valid versions, libraries, languages, categories, or unrelated URLs', () => {
  assert.equal(resolveVersionPath('/libraries/python/fastapi/0-139-2/', catalog), null);
  assert.equal(resolveVersionPath('/libraries/python/fast-api/nope/', catalog), null);
  assert.equal(resolveVersionPath('/libraries/ruby/fastapi/nope/', catalog), null);
  assert.equal(resolveVersionPath('/downloads/python/fastapi/nope/missing.md', catalog), null);
  assert.equal(resolveVersionPath('/downloads/python.md', catalog), null);
  assert.equal(resolveVersionPath('/unrelated/python/fastapi/nope/', catalog), null);
});

test('attempts normalization only for failed safe requests', () => {
  assert.equal(shouldAttemptNormalization('GET', 404), true);
  assert.equal(shouldAttemptNormalization('HEAD', 404), true);
  assert.equal(shouldAttemptNormalization('POST', 404), false);
  assert.equal(shouldAttemptNormalization('GET', 200), false);
});

test('returns a 307 with the query string and canonical headers preserved', async () => {
  const response = await handleVersionedRequest({
    request: new Request(
      'https://securitycards.example/libraries/python/fastapi/0.139.2/?source=agent',
    ),
    next: async () => new Response('not found', { status: 404 }),
    env: {
      ASSETS: {
        fetch: async () => Response.json(catalog),
      },
    },
  });

  assert.equal(response.status, 307);
  assert.equal(
    response.headers.get('location'),
    'https://securitycards.example/libraries/python/fastapi/0-140-0/?source=agent',
  );
  assert.equal(
    response.headers.get('link'),
    '<https://securitycards.example/libraries/python/fastapi/0-140-0/>; rel="canonical"',
  );
  assert.equal(response.headers.get('x-security-cards-version-normalized'), 'true');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
});

test('passes successful assets through without loading the catalog index', async () => {
  let catalogFetches = 0;
  const response = await handleVersionedRequest({
    request: new Request(
      'https://securitycards.example/libraries/python/fastapi/0-139-2/',
    ),
    next: async () => new Response('canonical asset', { status: 200 }),
    env: {
      ASSETS: {
        fetch: async () => {
          catalogFetches += 1;
          return Response.json(catalog);
        },
      },
    },
  });

  assert.equal(await response.text(), 'canonical asset');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(catalogFetches, 0);
});

test('builds a portable browser fallback while preserving query and fragment', () => {
  assert.equal(
    buildBrowserFallbackUrl(
      'https://securitycards.example/downloads/python/fastapi/broken/injection.md?source=browser#rules',
      catalog,
    ),
    'https://securitycards.example/downloads/python/fastapi/0-140-0/injection.md?source=browser#rules',
  );
  assert.equal(
    buildBrowserFallbackUrl(
      'https://securitycards.example/libraries/python/fast-api/broken/',
      catalog,
    ),
    null,
  );
  assert.equal(
    buildBrowserFallbackUrl('https://securitycards.example/unrelated/path', catalog),
    null,
  );
});
