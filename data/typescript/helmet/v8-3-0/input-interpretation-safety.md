# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: input interpretation safety

## input interpretation safety

### Quote CSP keyword sources correctly in Content Security Policy directives

**Use when**

Configuring Content Security Policy directives using Helmet in an Express application to ensure reserved keywords are interpreted securely by browsers.

**Secure rules**

**Rule 1: Enclose Content Security Policy keyword sources in single quotes within directive arrays.**

Always single-quote CSP keyword sources such as `self`, `none`, `unsafe-inline`, `unsafe-eval`, `strict-dynamic`, nonces, and hashes inside source strings. Helmet validates directive values and throws an error if reserved keywords appear unquoted or if invalid characters like semicolons or commas are used, preventing the browser from interpreting them as hostnames.

```javascript
import helmet from "helmet";
import express from "express";

const app = express();

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);
```
