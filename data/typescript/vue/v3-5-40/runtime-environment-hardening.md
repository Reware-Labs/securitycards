# Security cards

Repository: `https://github.com/vuejs/core#v3.5.40`
Documentation repository: `https://github.com/vuejs/docs#main`
Category: runtime environment hardening

## runtime environment hardening

### Deploy Production Vue Builds to Disable Development Debugging and Warning Hooks

**Use when**

Deploying Vue applications to production environments or configuring build pipelines.

**Secure rules**

**Rule 1: Configure build tools to replace `process.env.NODE_ENV` with 'production' or import explicit production bundles to strip devtools integrations and reactivity debugging hooks.**

When deploying Vue applications to production, configure your bundler to define `process.env.NODE_ENV` as 'production' or load explicit production files such as `vue.global.prod.js` to prevent external actors from inspecting internal component states and diagnostic warnings.

```js
new webpack.DefinePlugin({
  'process.env.NODE_ENV': JSON.stringify('production')
})
```
