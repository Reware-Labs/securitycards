# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: api contract misuse

## api contract misuse

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
