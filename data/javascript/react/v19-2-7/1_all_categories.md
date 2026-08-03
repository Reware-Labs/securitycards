# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`

## Category: configuration source integrity

### Control Source Map Generation in Build and Test Toolchain Configurations

**Use when**

Configuring build toolchains, Rollup, Babel, or test tooling environments where source maps or debugger inspector flags could inadvertently expose internal repository structures, comments, and unminified logic in production assets.

**Secure rules**

**Rule 1: Disable source maps in production builds unless a scoped debug session explicitly requires them**

React’s own production build pipeline turns *off* source-map generation at both the compile and bundle stages to avoid shipping unobfuscated source and to keep bundle size and startup costs low. Mirror this approach in your application build so that `.map` files are not published to production artifacts, and re-enable them only when you have a specific, time-boxed need to debug live code.

```javascript
// rollup.config.prod.js
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/app.min.js',
    format: 'cjs',
    sourcemap: false,   // keep maps off in production
  },
  plugins: [
    nodeResolve(),
    commonjs(),
  ],
};
```

**Rule 2: Disable inline source maps by default; enable them only when debugging**

React’s Jest CLI keeps inline source maps turned **off** unless you explicitly pass the `--sourceMaps` flag, because generating them slows the test runner. Follow this pattern in custom tooling so everyday tests run fast, and opt in only when you need to step through transformed code.

```bash
# Fast, default run (no inline maps)
node scripts/jest/jest-cli.js

# Enable inline source maps for an interactive debug session
node scripts/jest/jest-cli.js --sourceMaps
```


### Secure Package Publication and Version Integrity

**Use when**

publishing packages to registries and verifying monorepo dependency manifests.

**Secure rules**

**Rule 1: Enforce multi-factor authentication and explicit registry URLs during package publication.**

When executing package publication scripts, require multi-factor authentication OTP tokens and explicitly specify the intended official package registry URL rather than relying on ambient developer configuration.

```javascript
const otp = await promptForOTP();
await spawnHelper(
  'npm',
  ['publish', `--otp=${otp}`, '--registry=https://registry.npmjs.org'],
  { cwd: packageDir }
);
```

**Rule 2: Ensure every published React package shares one canonical version**

Before cutting a release, **read the export from `packages/shared/ReactVersion.js` to obtain the canonical `reactVersion` string** and verify that the `version` fields in `react`, `react-dom`, and `react-test-renderer` package manifests exactly match it. If any value differs, the build **must fail**.

```javascript
// scripts/tasks/version-check.js
'use strict';

const fs = require('fs');
const path = require('path');

// 1. Extract the canonical version from ReactVersion.js
const reactVersionSrc = fs.readFileSync(
  require.resolve('../../packages/shared/ReactVersion')
);
const reactVersion = /export default '([^']+)';/.exec(reactVersionSrc)[1];

// 2. Collect the package.json versions that must match
const manifestPaths = [
  '../../packages/react/package.json',
  '../../packages/react-dom/package.json',
  '../../packages/react-test-renderer/package.json',
];

let allMatch = true;
for (const relPath of manifestPaths) {
  const absPath = require.resolve(relPath);
  const pkgVersion = require(absPath).version;
  if (pkgVersion !== reactVersion) {
    console.error(
      '%s version mismatch: expected %s, saw %s',
      path.relative(process.cwd(), absPath),
      reactVersion,
      pkgVersion
    );
    allMatch = false;
  }
}

// 3. Abort the release if any mismatch was found
if (!allMatch) {
  process.exit(1);
}
```

**Rule 3: Verify package manifests and dependency version ranges before publishing**

For every release, **load the generated `package.json` files** for all packages being published and **enforce that internal `dependencies` and `peerDependencies` satisfy their declared semantic-version ranges**. Fail the build immediately if any package depends on another release artifact outside its allowed range.

```javascript
'use strict';

const fs = require('fs');
const semver = require('semver');
const {stablePackages} = require('../../ReactVersions'); // list of packages in this release

function checkDependency(packageName, depName, version, range) {
  if (!semver.satisfies(version, range)) {
    throw new Error(
      `${packageName} has an invalid dependency on ${depName}: ${range}. ` +
      `Actual: ${version}`
    );
  }
}

function main() {
  const packages = new Map();

  // 1. Load manifests produced by the release build
  for (const packageName in stablePackages) {
    const manifestPath = `build/oss-stable-semver/${packageName}/package.json`;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    packages.set(manifest.name, manifest);
  }

  // 2. Check every dependency and peerDependency against the release set
  for (const [pkgName, info] of packages) {
    const allRanges = {...info.dependencies, ...info.peerDependencies};
    for (const [dep, range] of Object.entries(allRanges)) {
      if (packages.has(dep)) {
        const releaseVersion = packages.get(dep).version;
        checkDependency(pkgName, dep, releaseVersion, range);
      }
    }
  }
}

main();
```

**Rule 4: Enforce explicit and validated npm dist-tags for every release channel**

Release automation **must require** an approved dist-tag (`latest`, `canary`, `experimental`, `beta`, or `rc`) and pass it to `npm publish`; the default `latest` tag must never be applied implicitly.
Fail fast on unknown or misspelled tags to prevent accidental promotion of pre-release builds to the stable channel.

```javascript
// scripts/release/assert-dist-tag.js
const {spawnSync} = require('node:child_process');

const ALLOWED = new Set(['latest', 'canary', 'experimental', 'beta', 'rc']);
const tag = process.env.DIST_TAG;            // exported by CI or CLI flag

if (!ALLOWED.has(tag)) {
  console.error(
    `Invalid dist-tag “${tag}”. Allowed tags: ${[...ALLOWED].join(', ')}.`
  );
  process.exit(1);
}

// Always publish with an explicit tag so npm does not fall back to "latest".
const {status} = spawnSync(
  'npm',
  ['publish', `--tag=${tag}`, '--registry=https://registry.npmjs.org'],
  {stdio: 'inherit'}
);

process.exit(status ?? 1);
```


## Category: injection

### Filter and Validate Component Props Before Rendering or Spreading Onto Intrinsic Elements

**Use when**

Building React components that accept and forward untrusted props or render dynamic content from component properties.

**Secure rules**

**Rule 1: Forward only allow-listed DOM props to intrinsic elements**

Before you spread an object onto a native JSX tag, build an explicit **allow-list** of attribute names (or apply a predicate that accepts only known DOM and `data-*/aria-*` attributes).
Everything else—including misspelled, framework-specific, or user-supplied props—**must be stripped** so it never reaches the browser or silently triggers React’s *Unknown Prop* warning.

```tsx
// safe-button.tsx
import React from 'react';

const ALLOWED = new Set([
  // core HTML attributes you actually need
  'id',
  'className',
  'type',
  'disabled',
  'title',
  'onClick',
  // always permit data-/aria- attributes for accessibility & instrumentation
]);

function filterDomProps(src: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(src)) {
    if (ALLOWED.has(key) || key.startsWith('data-') || key.startsWith('aria-')) {
      out[key] = value;
    }
  }
  return out;
}

export default function SafeButton(
  props: React.PropsWithChildren<{ variant?: 'primary' | 'secondary' }> &
    Record<string, unknown>,
) {
  const { variant = 'primary', children, ...rest } = props;
  const domProps = filterDomProps(rest);

  return (
    <button className={`btn-${variant}`} {...domProps}>
      {children}
    </button>
  );
}
```


### Prevent Dynamic Code Execution in Configuration and Template Processing

**Use when**

Parsing dynamic component configuration strings, compiler overrides, or string concatenation expressions from ASTs.

**Secure rules**

**Rule 1: Parse dynamic configuration strings using safe structured serialization formats instead of evaluating expressions dynamically.**

Avoid executing untrusted configuration text using `eval()` or `new Function(...)`. Use `JSON.parse` or secure structured data formats to safely deserialize override options.

```javascript
try {
  const configOverrideOptions = JSON.parse(configOverrides);
  return parsePluginOptions({ ...baseOptions, ...configOverrideOptions });
} catch (e) {
  throw new Error('Invalid configuration format');
}
```

**Rule 2: Safely process template AST nodes and expression strings by whitelisting node types without invoking arbitrary code execution.**

When extracting or evaluating string expressions from an Abstract Syntax Tree, explicitly match supported node types like `StringLiteral`, `Literal`, and binary addition operators. Throw explicit errors on unsupported types rather than falling back to dangerous evaluation functions.

```javascript
function evalStringConcat(ast) {
  switch (ast.type) {
    case 'StringLiteral':
    case 'Literal':
      return ast.value;
    case 'BinaryExpression':
      if (ast.operator !== '+') {
        throw new Error('Unsupported binary operator ' + ast.operator);
      }
      return evalStringConcat(ast.left) + evalStringConcat(ast.right);
    default:
      throw new Error('Unsupported type ' + ast.type);
  }
}
```


## Category: input contract definition

### Validate all arguments passed into Server Actions on the server

**Use when**

When building React Server Actions that receive network inputs and parameters from clients.

**Secure rules**

**Rule 1: Validate all parameters and arguments received inside Server Actions on the server before processing business logic or mutating state.**

Always inspect and validate types, lengths, and expected values of all arguments received in Server Actions. Reject malformed inputs or missing required fields prior to application processing.

```javascript
'use server';
import { addTodo } from './db';

export async function createTodo(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return 'Please enter a valid todo.';
  }
  addTodo(text.trim());
  return 'Added successfully';
}
```


## Category: resource exhaustion

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


## Category: secret handling

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
