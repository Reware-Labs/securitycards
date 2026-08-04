# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: boundary control

## boundary control

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
