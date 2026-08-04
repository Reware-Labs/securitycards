# Security cards

Repository: `https://github.com/prisma/prisma#7.8.0`
Category: runtime environment hardening

## runtime environment hardening

### Disable Unnecessary Node.js Modules for Security

**Use when**

When developing or deploying applications using Prisma, especially in production environments.

**Secure rules**

**Rule 1: Avoid relying on Node.js core modules ('http', 'https', 'tls', 'net', 'dns', 'child_process') in code bundled with Prisma's fill-plugin configuration, where those modules are intentionally shimmed.**

Prisma, in version 7.8.0, uses a fill-plugin during bundling that replaces these core Node.js modules with empty contents. Code built with this configuration should not require functionality from the shimmed modules. For Prisma database communication, use the supported database Driver Adapters.


**Source files**

- [`helpers/compile/plugins/fill-plugin/fillPlugin.ts`](https://github.com/prisma/prisma/blob/7.8.0/helpers/compile/plugins/fill-plugin/fillPlugin.ts)
