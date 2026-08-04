# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: network boundary

## network boundary

### Use trusted connection info functions for IP address extraction

**Use when**

When configuring IP restriction middleware to control network reachability based on client addresses.

**Secure rules**

**Rule 1: Pass a trusted IP resolution function as the getIP argument to ipRestriction instead of relying on unvalidated request headers.**

When restricting IP access using the `ipRestriction` middleware, always supply a trusted connection info function such as `getConnInfo` from runtime adapters like `hono/cloudflare-workers` or `hono/node-server`. Do not use a callback that blindly reads headers like `X-Forwarded-For` unless operating behind a trusted reverse proxy that securely handles client IP forwarding.

```typescript
import { Hono } from 'hono'
import { ipRestriction } from 'hono/ip-restriction'
import { getConnInfo } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('*', ipRestriction(getConnInfo, { allowList: ['203.0.113.5'] }))
```
