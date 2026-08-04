# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: cryptography

## cryptography

### Implement cryptographic operations using secure and available primitives

**Use when**

Using cryptographic functions like hashing or random number generation within your application, especially when leveraging Prisma's compatibility layers.

**Secure rules**

**Rule 1: Always await asynchronous cryptographic hash digests when using polyfilled modules.**

When Prisma polyfills Node.js crypto functions using the Web Crypto API, such as with `globalThis.crypto.subtle.digest`, ensure you always `await` the `digest()` method. This prevents race conditions and ensures data integrity by completing the hash calculation before proceeding.

```typescript
import { createHash } from 'crypto';

async function hashData(data: string): Promise<ArrayBuffer> {
  const hash = createHash('SHA-256');
  hash.update(new TextEncoder().encode(data));
  const result = await hash.digest();
  return result;
}
```

**Rule 2: Ensure the runtime environment provides the cryptographic APIs used by Prisma.**

Prisma's crypto compatibility code relies on `globalThis.crypto` for helpers such as `randomUUID` and `randomFillSync`. Some Prisma call sites check whether a helper is available before invoking it. Guard calls in the same way: invoke these helpers only when the corresponding crypto API is available, because an unavailable API can cause a runtime failure.


**Source files**

- [`helpers/compile/plugins/fill-plugin/fillers/crypto.ts`](https://github.com/prisma/prisma/blob/7.8.0/helpers/compile/plugins/fill-plugin/fillers/crypto.ts)
