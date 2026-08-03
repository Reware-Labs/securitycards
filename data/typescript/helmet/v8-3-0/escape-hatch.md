# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: escape hatch

## escape hatch

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
