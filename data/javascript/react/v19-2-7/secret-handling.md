# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`
Category: secret handling

## secret handling

### Secure Browser Storage and State Initialization

**Use when**

When initializing React component state or restoring application persistence using browser storage and URL fragments.

**Secure rules**

**Rule 1: Persist only harmless playground state and validate it on load**

Store *only* non-sensitive editor data (the user’s source code, compiler config, and the **showInternals** flag) in `localStorage` and the URL hash. At startup, decode the persisted payload, **require that it includes a string-typed `source` field**, and sanitize the optional fields—falling back to `defaultConfig` and `false` when they are absent or empty.

```typescript
import invariant from 'invariant';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';
import {defaultStore, defaultConfig} from '../defaultStore';

export interface Store {
  source: string;
  config: string;
  showInternals: boolean;
}

/* -------- encode / decode helpers -------- */
export const encodeStore = (s: Store) =>
  compressToEncodedURIComponent(JSON.stringify(s));

export const decodeStore = (hash: string): unknown =>
  JSON.parse(decompressFromEncodedURIComponent(hash));

/* -------- minimal structural check -------- */
function isValidStore(raw: unknown): raw is Store {
  return (
    raw != null &&
    typeof raw === 'object' &&
    'source' in raw &&
    typeof (raw as any).source === 'string'
  );
}

/* -------- public APIs -------- */
export function saveStore(store: Store) {
  const blob = encodeStore(store);
  localStorage.setItem('playgroundStore', blob);
  history.replaceState({}, '', `#${blob}`);
}

export function initStoreFromUrlOrLocalStorage(): Store {
  const blob = location.hash.slice(1) || localStorage.getItem('playgroundStore');
  if (!blob) return defaultStore;

  const raw = decodeStore(blob);
  invariant(isValidStore(raw), 'Invalid store payload');

  return {
    source: raw.source,
    config: raw.config ? raw.config : defaultConfig,
    showInternals: 'showInternals' in raw ? raw.showInternals : false,
  };
}
```
