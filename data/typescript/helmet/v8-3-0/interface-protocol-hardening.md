# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: interface protocol hardening

## interface protocol hardening

### Configure transport security and upgrade-insecure-requests policies

**Use when**

Use when configuring transport security headers and content security policies to prevent protocol downgrade attacks and ensure secure client communication.

**Secure rules**

**Rule 1: Maintain upgrade-insecure-requests enabled in production environments**

Ensure that the `upgrade-insecure-requests` directive remains active in production environments to automatically convert HTTP resource fetches to HTTPS, preventing protocol downgrade attacks and exposure of sensitive transport data.

```javascript
const isDevelopment = app.get("env") === "development";

app.use(
  contentSecurityPolicy({
    directives: {
      "upgrade-insecure-requests": isDevelopment ? null : [],
    },
  })
);
```

**Rule 2: Enforce HTTPS transport security using Strict-Transport-Security headers**

Configure the `strictTransportSecurity` middleware to issue `Strict-Transport-Security` headers with a sufficiently long `maxAge` specified in seconds to force browsers to interact with the application exclusively over encrypted HTTPS connections.

```javascript
app.use(
  helmet.strictTransportSecurity({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  })
);
```
