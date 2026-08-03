# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: secret handling

## secret handling

### Load Session and Cookie Secrets from Environment Variables

**Use when**

Configuring session middleware or cookie-parser secrets for Express applications.

**Secure rules**

**Rule 1: Load session and cookie signing secrets dynamically from environment variables instead of hardcoding secret strings.**

Never hardcode secret keys or sensitive strings directly into source code configuration options. Instead, retrieve secrets securely at runtime using `process.env` when setting up middleware such as session management or `cookie-parser`.

```javascript
const express = require('express');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(function(req, res) {
  res.cookie('user', { name: 'tobi' }, {
    signed: true,
    httpOnly: true,
    secure: true
  }).end();
});
```
