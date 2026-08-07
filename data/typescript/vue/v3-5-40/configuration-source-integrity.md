# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: configuration source integrity

## configuration source integrity

### Secure Development Tooling and Production Build Flags in Vue

**Use when**

Configuring production bundlers and build workflows for Vue applications to prevent exposing development tooling, internal devtools hooks, or raw source maps.

**Secure rules**

**Rule 1: Disable Vue Devtools support and production source maps**

In release builds, compile Vue with **`__VUE_PROD_DEVTOOLS__` set to `'false'`** and turn **`build.sourcemap` off** so that devtools hooks and source maps are excluded from the production bundle.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    // Prevent devtools code from being included in production
    __VUE_PROD_DEVTOOLS__: 'false'
  },
  build: {
    // Do not emit source-map files in the production output
    sourcemap: false
  }
})
```


### Validate Dependency Versions and Externalize Third-Party Modules in Package Configurations

**Use when**

Building scripts, project generators, or bundler configurations that handle third-party dependencies and package manifests.

**Secure rules**

**Rule 1: Externalize library dependencies and peerDependencies when bundling**

When you ship a Vue plugin or component library, configure the bundler’s `external` option with every package listed in `dependencies` and `peerDependencies`.

```js
// build.mjs (esbuild example)
import { build } from 'esbuild'
import pkg from './package.json' assert { type: 'json' }

const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {})
]

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/my-lib.js',
  format: 'esm',
  bundle: true,
  external                 // don't inline external packages
})
```
