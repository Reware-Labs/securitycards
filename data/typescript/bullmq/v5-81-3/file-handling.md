# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: file handling

## file handling

### Sanitize and restrict local filesystem paths supplied to script loader mappings

**Use when**

Configuring path mappings or loading Lua scripts from directory paths where untrusted input could influence filesystem paths.

**Secure rules**

**Rule 1: Restrict script loader path mappings and Lua script loading directories to explicit, trusted, hardcoded locations.**

Always configure path mappings with explicit, hardcoded application directories and avoid accepting dynamic path input. Ensure paths supplied to `ScriptLoader.addPathMapping` or when loading scripts originate strictly from trusted locations to prevent path traversal or arbitrary filesystem reading.

```typescript
const scriptLoader = new ScriptLoader();
scriptLoader.addPathMapping('custom', path.resolve(__dirname, '../scripts/lua'));
await scriptLoader.load(redisClient, path.resolve(__dirname, '../scripts/lua'));
```
