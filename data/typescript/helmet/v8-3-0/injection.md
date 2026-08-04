# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: injection

## injection

### Configure Content Security Policy with dynamic cryptographic nonces

**Use when**

When configuring Content Security Policy directives in helmet to prevent script injection without enabling unsafe inline scripts.

**Secure rules**

**Rule 1: Pass dynamic functions within script source array directives to append per-request cryptographic nonces.**

Ensure that inline scripts are secured by generating a per-request cryptographic nonce and passing a function within `scriptSrc` array directives that returns the nonce-based policy string.

```javascript
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(32).toString("hex");
  next();
});
app.use(
  contentSecurityPolicy({
    directives: {
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
    },
  })
);
```
