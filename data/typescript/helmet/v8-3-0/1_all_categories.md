# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`

## Category: api contract misuse

### Configure Helmet Middleware With Supported API Options and Correct Types

**Use when**

When initializing Helmet middleware or standalone sub-middleware functions and passing configuration objects and options.

**Secure rules**

**Rule 1: Provide valid non-negative numbers and exact option key names for strict transport security configuration.**

Ensure that `maxAge` is passed as a non-negative number and that option keys such as `includeSubDomains` use exact property casing. Passing invalid types or misspelled keys causes immediate runtime initialization errors.

```typescript
import helmet from "helmet";

app.use(
  helmet.strictTransportSecurity({
    maxAge: 31536000,
    includeSubDomains: false,
  })
);
```

**Rule 2: Avoid mixing legacy option aliases with modern header configuration keys in the same options object.**

Do not pass both modern header keys and legacy alias keys simultaneously to Helmet initialization, as this causes a runtime error.

```typescript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(
  helmet({
    xFrameOptions: { action: "deny" },
    strictTransportSecurity: { maxAge: 31536000 },
  })
);
```

**Rule 3: Supply valid unique policy tokens for referrer policy configuration.**

Ensure policy options contain only unique, recognized policy tokens in an array to avoid triggering startup exceptions.

```typescript
import helmet from "helmet";

app.use(
  helmet.referrerPolicy({
    policy: ["same-origin", "strict-origin"]
  })
);
```


### Configure MIME Sniffing Protection with Helmet

**Use when**

Configuring Express application security headers to prevent browsers from MIME-sniffing response bodies away from their declared Content-Type.

**Secure rules**

**Rule 1: Enable X-Content-Type-Options via default Helmet middleware or standalone sub-middleware.**

Use `app.use(helmet())` or apply `app.use(helmet.xContentTypeOptions())` directly to ensure the `X-Content-Type-Options: nosniff` response header is sent.

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet());
app.use(helmet.xContentTypeOptions());
```

**Rule 2: Avoid passing invalid or conflicting configuration options to `xContentTypeOptions`.**

Do not pass an options object to `xContentTypeOptions` as it does not take configuration options and will log a console warning. Additionally, avoid supplying both `xContentTypeOptions` and the legacy `noSniff` key in Helmet options simultaneously to prevent initialization errors.

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(
  helmet({
    xContentTypeOptions: true,
  })
);
```


## Category: boundary control

### Restrict cross-origin resource embedding with Cross-Origin Resource Policy

**Use when**

When configuring Express server boundaries to control how untrusted third-party websites can embed and read application resources.

**Secure rules**

**Rule 1: Enforce strict resource isolation by configuring the crossOriginResourcePolicy middleware with supported policy values.**

Use the default `same-origin` policy by invoking `helmet.crossOriginResourcePolicy()` without options or explicitly pass one of the supported lowercase policy strings such as `same-origin`, `same-site`, or `cross-origin`. Passing invalid values will cause middleware initialization errors at startup.

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

app.use(helmet.crossOriginResourcePolicy({ policy: "same-origin" }));
app.use(helmet.crossOriginResourcePolicy({ policy: "same-site" }));
```


## Category: escape hatch

### Restrict the use of the dangerouslyDisableDefaultSrc escape hatch for Content Security Policy defaults

**Use when**

Configuring Content Security Policy in Helmet when an advanced edge case requires explicitly omitting the default-src fallback directive.

**Secure rules**

**Rule 1: Use contentSecurityPolicy.dangerouslyDisableDefaultSrc exclusively as the value for the defaultSrc directive.**

To explicitly omit default-src without triggering a configuration error, developers must pass `contentSecurityPolicy.dangerouslyDisableDefaultSrc` as the value for `defaultSrc`. Attempting to use this escape hatch symbol on directives other than `default-src` throws an exception.

```javascript
import helmet from "helmet";
import express from "express";

const app = express();

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: false,
    directives: {
      defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
      scriptSrc: ["'self'", "https://scripts.example.com"],
      styleSrc: ["'self'"],
    },
  })
);
```

**Rule 2: Avoid disabling the default-src directive**

Avoid setting the `default-src` directive to `helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc` (or the equivalent on the standalone middleware). Official documentation states that this is not recommended.


## Category: injection

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


## Category: input contract definition

### Enforce valid enumerated values for policy options

**Use when**

When configuring cross-origin policy settings such as crossOriginOpenerPolicy to ensure allowed input values conform to explicit specifications.

**Secure rules**

**Rule 1: Provide exact lowercase policy strings to policy options to satisfy input contract validation.**

Ensure that settings like `crossOriginOpenerPolicy` receive only explicitly allowed lowercase policy strings such as 'same-origin', 'same-origin-allow-popups', 'noopener-allow-popups', or 'unsafe-none'. Passing invalid types, empty strings, or uppercase values results in runtime setup errors.

```typescript
import helmet from "helmet";

app.use(
  helmet.crossOriginOpenerPolicy({
    policy: "same-origin-allow-popups",
  })
);
```


## Category: input interpretation safety

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


## Category: interface protocol hardening

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


## Category: runtime environment hardening

### Remove the X-Powered-By header to reduce framework fingerprinting

**Use when**

Configuring the production runtime and process environment to reduce attack surface and avoid revealing framework implementation details.

**Secure rules**

**Rule 1: Suppress the X-Powered-By response header in production environments.**

Remove or suppress the `X-Powered-By` response header to avoid revealing framework implementation details such as Express or Node.js to potential attackers. You can disable the header directly via Express or use Helmet middleware which handles header removal automatically.

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

// Disable the header directly via Express:
app.disable("x-powered-by");

// Or use Helmet middleware which handles header removal automatically:
app.use(helmet());
```


## Category: security control integrity

### Properly Invoke Helmet Middleware Factory Function in Express

**Use when**

Registering Helmet as global middleware in an Express application to ensure security header controls remain consistently applied across all execution paths.

**Secure rules**

**Rule 1: Invoke helmet as a factory function when registering Express middleware**

Always call `helmet()` as a function when passing it to `app.use()` so that the middleware function is properly instantiated and returned. Passing `helmet` directly without invocation causes a runtime error on incoming HTTP requests (thrown when the first argument is recognized as an `IncomingMessage`), preventing security header generation.

```javascript
import express from "express";
import helmet from "helmet";

const app = express();

// Correct: Invoke helmet() as a function to return middleware
app.use(helmet());
```
