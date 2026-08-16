# Security cards

Repository: `https://github.com/fastify/fastify#v5.9.0`
Category: file handling

## file handling

### Secure Static File Serving in Fastify

**Use when**

When manually serving static files or assets, defining custom static routes, or bypassing the standard response lifecycle using hijack.

**Secure rules**

**Rule 1: Prefer static or simple parametric routes on hot paths.**

Prefer static or simple parametric routes on hot paths. Fastify supports regular expression routes, but they are expensive; routes with many parameters can also hurt router performance.

**Rule 2: Streams have no default content type; buffers default to `application/octet-stream`.**

When `reply.send()` sends a stream without a `Content-Type` header, the header remains unset. When it sends a buffer without a `Content-Type` header, Fastify sets `Content-Type` to `application/octet-stream`. `reply.type(contentType)` sets the response content type and is a shortcut for setting the `Content-Type` header.

**Rule 3: Handle the response manually after calling `reply.hijack()`.**

Calling `reply.hijack()` prevents Fastify from sending the response automatically and from running the remaining hooks. The application takes full responsibility for the low-level request and response. If `reply.raw` sends the response, `onResponse` hooks still run.

```javascript
fastify.get('/', (request, reply) => {
  reply.hijack()
  reply.raw.writeHead(200, { 'Content-Type': 'text/plain' })
  reply.raw.end('hijacked response')
})
```


### Contain user-supplied paths within a storage root

**Use when**

A request supplies a file name, path segment, or archive entry that the application opens, writes, or extracts.

**Secure rules**

**Rule 1: Resolve the candidate path and verify it stays inside the storage root.**

`path.join(root, request.params.name)` still leaves the root when the name contains `..`, so the check must happen after resolution rather than on the raw input. Resolve the candidate to an absolute path and confirm it is the root or sits beneath it before opening anything. Reject rather than clamp, so a traversal attempt does not silently read a neighbouring file.

```javascript
const path = require('node:path');
const fs = require('node:fs/promises');

const STORAGE_ROOT = path.resolve('./data');

const resolveWithin = (root, candidate) => {
  const target = path.resolve(root, candidate);
  return target === root || target.startsWith(root + path.sep) ? target : null;
};

fastify.get('/files/:name', async (request, reply) => {
  const target = resolveWithin(STORAGE_ROOT, request.params.name);
  if (!target) {
    return reply.code(404).send({ error: 'not found' });
  }
  return reply.send(await fs.readFile(target));
});
```

**Rule 2: Apply the same containment check to every entry read out of an archive.**

Entry names inside a zip or tar are attacker-controlled in exactly the way a path parameter is, and an entry named `../../etc/passwd` writes outside the extraction directory. Resolve each entry against the destination and skip any that escapes it.

```javascript
for (const entry of archive.entries) {
  const target = resolveWithin(EXTRACT_ROOT, entry.name);
  if (!target) {
    continue; // entry escapes the extraction directory
  }
  await fs.writeFile(target, await entry.buffer());
}
```

**Source files**

- [`docs/Reference/Reply.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Reply.md)
- [`docs/Reference/Routes.md`](https://github.com/fastify/fastify/blob/v5.9.0/docs/Reference/Routes.md)
- [`test/skip-reply-send.test.js`](https://github.com/fastify/fastify/blob/v5.9.0/test/skip-reply-send.test.js)
