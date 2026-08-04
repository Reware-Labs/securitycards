# Security cards

Repository: `https://github.com/trpc/trpc#v11.18.0`
Category: runtime environment hardening

## runtime environment hardening

### Disable Development Mode and Stack Traces in Production

**Use when**

initializing the tRPC server router and configuring runtime environment options for production deployment.

**Secure rules**

**Rule 1: Explicitly configure the `isDev` flag during router initialization to disable verbose error stack traces in production.**

Explicitly configure the `isDev` flag in `initTRPC.create()` or ensure runtime environment variables strictly match deployment settings so that tRPC does not expose stack traces (`error.data.stack`) in client error responses. Set `isDev` deterministically based on your deployment configuration during server router initialization.

```typescript
import { initTRPC } from '@trpc/server';

const t = initTRPC.create({
  isDev: process.env.NODE_ENV === 'development',
});
```
