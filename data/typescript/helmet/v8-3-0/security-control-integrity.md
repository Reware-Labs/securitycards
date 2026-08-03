# Security cards

Repository: `https://github.com/helmetjs/helmet#v8.3.0`
Documentation repository: `https://github.com/helmetjs/helmetjs.github.io#main`
Category: security control integrity

## security control integrity

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
