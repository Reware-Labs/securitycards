# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: resource exhaustion

## resource exhaustion

### Enforce explicit body size limits and parameter thresholds on Express middleware

**Use when**

Configuring request body parsing middleware such as `express.json()`, `express.urlencoded()`, `express.text()`, or `express.raw()` in an Express application.

**Secure rules**

**Rule 1: Configure explicit body size limits on all body parser middleware**

Specify an explicit `limit` option using string units or numeric byte values when registering body parser middleware like `express.json()`, `express.urlencoded()`, `express.text()`, and `express.raw()`. This prevents attackers from sending oversized payloads or compressed streams that lead to memory exhaustion and denial of service.

```javascript
const express = require('express');
const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', parameterLimit: 1000, extended: false }));
```


### Prevent Hanging Requests and Connection Exhaustion in Middleware

**Use when**

Developing custom middleware or route handlers that process incoming HTTP requests and need to manage the request-response cycle safely.

**Secure rules**

**Rule 1: Always terminate the request-response cycle or invoke next() in middleware and route handlers**

Ensure every execution branch in your middleware functions and route handlers either terminates the connection by calling a response method like `res.send()` or `res.json()`, or delegates control by invoking `next()`. Omitting both leaves the HTTP connection hanging indefinitely, consuming server sockets and leading to connection pooling issues.

```javascript
app.use((req, res, next) => {
  if (!req.headers['x-api-key']) {
    return res.status(400).send('Missing API key header');
  }
  next();
});
```

**Rule 2: Finalize error responses or delegate via next(err) in error-handling middleware**

Ensure custom error-handling middleware completes the request by sending an error response or forwarding the error via `next(err)`. Leaving an error handler path uncompleted results in hanging requests that consume server resources and degrade availability.

```javascript
app.use((err, req, res, next) => {
  if (req.xhr) {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    next(err);
  }
});
```
