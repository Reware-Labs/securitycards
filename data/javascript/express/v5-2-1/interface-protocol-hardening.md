# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict HTTP Method Selection and Avoid Query-Based Method Overriding

**Use when**

When configuring routing handlers and handling method dispatch in Express applications to prevent method confusion and protocol abuse.

**Secure rules**

**Rule 1: Use a request header getter for method overriding and restrict allowed methods to POST**

When using `method-override` middleware, pass an `X-`-prefixed header name as the getter rather than a query string key. The `options.methods` list defaults to `['POST']`; the official README warns that adding other methods "may introduce security issues and cause weird behavior when requests travel through caches." Keep the allowed methods set to `['POST']` only.

```javascript
app.use(methodOverride('X-HTTP-Method-Override'));
```
