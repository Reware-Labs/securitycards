# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: network boundary

## network boundary

### Configure explicit trusted proxy IP addresses in HTTP settings

**Use when**

Configuring AdonisJS HTTP settings behind a proxy to ensure correct handling of client IP addresses and prevent spoofing.

**Secure rules**

**Rule 1: Specify trusted proxy IP addresses or ranges using `proxyAddr.compile` instead of enabling wildcard proxy trust.**

Set `trustProxy` in `config/app.ts` using `proxyAddr.compile` with explicit ranges like `loopback` or `uniquelocal` to prevent external clients from forging `X-Forwarded-For` and other proxy headers.

```typescript
import { defineConfig } from '@adonisjs/core/http'
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['loopback', 'uniquelocal'])
})
```
