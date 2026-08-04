# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: runtime environment hardening

## runtime environment hardening

### Configure Production Runtime Environment and Error Handling

**Use when**

When deploying the Express application to production and configuring runtime environment variables or error handling middleware to prevent stack trace and debugging information disclosure.

**Secure rules**

**Rule 1: Set NODE_ENV to production in deployment environments to sanitize default error responses.**

Set the environment variable `NODE_ENV` to `production` before starting the Express process in production environments so that the built-in default error handler sanitizes uncaught error output to simple HTTP status messages rather than exposing full stack traces.

```bash
NODE_ENV=production node app.js
```

**Rule 2: Restrict debugging error handler middleware strictly to development environments.**

Load development-only error handling middleware conditionally after all route definitions by checking if `app.get('env')` is set to `development`, preventing verbose error details and stack traces from being exposed in production.

```javascript
app.get('/', routes.index);

// Load development-only error handling middleware after route definitions
if (app.get('env') === 'development') {
  app.use(errorHandler());
}
```

**Rule 3: Ensure production deployments depend exclusively on stable releases of Express.**

Do not deploy alpha or beta pre-release versions of Express in production environments, and configure `package.json` to depend exclusively on stable releases such as `^5.2.1` to avoid unpatched security vulnerabilities.

```json
{
  "dependencies": {
    "express": "^5.2.1"
  }
}
```
