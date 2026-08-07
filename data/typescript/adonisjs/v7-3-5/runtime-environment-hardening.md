# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: runtime environment hardening

## runtime environment hardening

### Set production environment to disable development route generation and debugging features

**Use when**

Deploying the application to a production server where development route generation and debug tooling must be disabled.

**Secure rules**

**Rule 1: Ensure NODE_ENV is set to production to prevent writing development route files to disk.**

Configure the production server environment to run with the production flag set so that providers inspect app.inProduction correctly and avoid generating routes.json metadata files.

```bash
NODE_ENV=production node bin/server.js
```
