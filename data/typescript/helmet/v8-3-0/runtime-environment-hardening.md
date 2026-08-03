# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: runtime environment hardening

## runtime environment hardening

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
