import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { runInNewContext } from 'node:vm';
import axios from 'axios';

const cardUrl = new URL(
  '../data/javascript/axios/v1-19-0/input-driven-boundary-selection.md',
  import.meta.url,
);
const card = await readFile(cardUrl, 'utf8');
const snippets = [...card.matchAll(/^```javascript\n([\s\S]*?)^```$/gm)];
assert.equal(snippets.length, 1, 'The path-segment card must provide one runnable example');
assert.equal(axios.VERSION, '1.19.0', 'Run the example against its documented Axios version');

// Execute the published example rather than maintaining a test-only copy.
const { api, fetchUserData } = runInNewContext(
  `${snippets[0][1]}\n;({ api, fetchUserData });`,
  { axios },
  { filename: cardUrl.pathname },
);

let requestCount = 0;
const server = createServer((request, response) => {
  requestCount += 1;
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ url: request.url, host: request.headers.host }));
});

before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  api.defaults.baseURL = `http://127.0.0.1:${server.address().port}`;
  api.defaults.adapter = 'http';
  api.defaults.proxy = false;
  api.defaults.timeout = 1000;
});

after(() => new Promise((resolve, reject) => {
  server.close(error => error ? reject(error) : resolve());
}));

test('preserves ordinary identifiers in the requested user endpoint', async () => {
  for (const [id, path] of [
    ['alice', '/users/alice'],
    ['alice.smith-42', '/users/alice.smith-42'],
    ['Alice Smith', '/users/Alice%20Smith'],
    ['用户', '/users/%E7%94%A8%E6%88%B7'],
  ]) {
    const { data } = await fetchUserData(id);
    assert.equal(data.url, path, id);
    assert.equal(data.host, new URL(api.defaults.baseURL).host);
  }
});

test('keeps URL delimiters and percent escapes inside one user ID', async () => {
  for (const [id, path] of [
    ['alice?role=admin', '/users/alice%3Frole%3Dadmin'],
    ['alice#details', '/users/alice%23details'],
    ['/alice', '/users/%2Falice'],
    ['//other.example/alice', '/users/%2F%2Fother.example%2Falice'],
    ['alice/bob', '/users/alice%2Fbob'],
    ['alice\\bob', '/users/alice%5Cbob'],
    ['%2e%2e', '/users/%252e%252e'],
    ['100%', '/users/100%25'],
  ]) {
    const { data } = await fetchUserData(id);
    assert.equal(data.url, path, id);
    assert.equal(data.host, new URL(api.defaults.baseURL).host);
  }
});

test('does not resolve traversal-shaped identifiers outside the user endpoint', async () => {
  for (const [id, path] of [
    ['../admin', '/users/..%2Fadmin'],
    ['..\\admin', '/users/..%5Cadmin'],
    ['%2e%2e/admin', '/users/%252e%252e%2Fadmin'],
  ]) {
    const { data } = await fetchUserData(id);
    assert.equal(data.url, path, id);
  }
});

test('rejects empty, non-string and standalone dot-segment IDs before HTTP', async () => {
  const requestsBefore = requestCount;
  for (const id of ['', '.', '..', null, undefined, 42, {}, []]) {
    await assert.rejects(async () => fetchUserData(id), { name: 'TypeError' });
  }
  assert.equal(requestCount, requestsBefore);
});
