# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`
Category: resource exhaustion

## resource exhaustion

### Prevent Rendering Denial of Service by Caching Promises Passed to the use Hook

**Use when**

Building asynchronous React Server Components or client components that read promises during render using the `use()` hook.

**Secure rules**

**Rule 1: Cache Promises by every input that defines the request**

`use()` must always receive **exactly the same Promise instance for the same query parameters**.
Build a bounded cache whose *key* is a stable representation of **all inputs that influence the async work** (for example, `store` *and* `compilerOutput`). Omitting a parameter in the cache key can return stale data or trigger “uncached promise” loops.

```tsx
import { use } from 'react';
import { LRUCache } from 'lru-cache';

type CacheKey = string;// e.g. JSON-encoded composite
const tabifyCache = new LRUCache<CacheKey, Promise<Map<string, ReactNode>>>({
  max: 100,
});
function makeKey(store: Store, output: CompilerOutput): CacheKey {
  return JSON.stringify([store.id, output.hash]);
}
function getTabifyPromise(
  store: Store,
  output: CompilerOutput,
): Promise<Map<string, ReactNode>> {
  const key = makeKey(store, output);
  let promise = tabifyCache.get(key);
  if (!promise) {
    promise = tabify(store.source, output, store.showInternals);
    tabifyCache.set(key, promise);
  }
  return promise;
}
export default function OutputContent({
  store,
  compilerOutput,
}: Props) {
  const tabs = use(getTabifyPromise(store, compilerOutput));
  return <TabbedWindow tabs={tabs} />;
}
```
