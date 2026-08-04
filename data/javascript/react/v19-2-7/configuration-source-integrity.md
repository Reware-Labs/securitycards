# Security cards

Repository: `https://github.com/react/react#v19.2.7`
Documentation repository: `https://github.com/reactjs/react.dev#main`
Category: configuration source integrity

## configuration source integrity

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
