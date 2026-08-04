# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`

## Category: access control

### Chain authorization middleware to enforce ownership and role checks

**Use when**

Developing route handlers that require role checks, ownership verifications, or tenant constraints before executing business logic.

**Secure rules**

**Rule 1: Compose permission middleware sequentially in route definitions**

Attach authorization middleware directly to protected route definitions before the final handler. Middleware should call `next()` only when processing may continue and pass an error to `next()` when access is denied.

```javascript
function andRestrictToSelf(req, res, next) {
  if (req.authenticatedUser.id === req.user.id) {
    return next();
  }

  next(new Error('Unauthorized'));
}

function andRestrictTo(role) {
  return function (req, res, next) {
    if (req.authenticatedUser.role === role) {
      return next();
    }

    next(new Error('Unauthorized'));
  };
}

app.get('/user/:id/edit', loadUser, andRestrictToSelf, function (req, res) {
  res.send('Editing user ' + req.user.name);
});

app.delete('/user/:id', loadUser, andRestrictTo('admin'), function (req, res) {
  res.send('Deleted user ' + req.user.name);
});
```

**Rule 2: Enforce authentication and permission checks on all protected routes.**

Verify valid session states and permissions before granting access to restricted resources, redirecting or blocking unauthenticated clients appropriately.

```javascript
function restrict(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

app.get('/restricted', restrict, function (req, res) {
  res.send('Welcome to the protected area');
});
```

**Rule 3: Apply access control checks across all HTTP methods using app.all.**

Use `app.all()` or `app.use()` when attaching authorization middleware to route paths so that all HTTP request methods are guarded consistently without leaving endpoints vulnerable.

```javascript
app.all('/secret/*', (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).send('Access denied');
  }
  next();
});
```


## Category: api contract misuse

### Use correct Express 5 argument signatures and error-handling patterns for middleware and routes

**Use when**

Implementing request handlers, middleware functions, and routing logic in Express 5 applications.

**Secure rules**

**Rule 1: Await asynchronous operations before calling `next()` in middleware and allow Express 5 to automatically forward rejected promises.**

Ensure asynchronous validation or authentication checks are fully awaited before invoking `next()` in custom middleware. In Express 5, rejections in async middleware and route handlers are automatically forwarded to global error-handling middleware without requiring explicit try/catch blocks for promise rejections.

```javascript
async function validateCookies(req, res, next) {
  await cookieValidator(req.cookies);
  next();
}

app.use(validateCookies);

app.use((err, req, res, next) => {
  res.status(400).send('Invalid request');
});
```

**Rule 2: Mount error handling middleware after all application routes and standard middleware.**

Register error handling middleware functions with four arguments (`err`, `req`, `res`, `next`) only after all route handlers and standard middleware are mounted so errors are properly caught.

```javascript
app.get('/', (req, res) => {
  res.send('OK');
});

app.use((err, req, res, next) => {
  res.status(500).send('An unexpected error occurred');
});
```

**Rule 3: Use the status-first argument signature when calling `res.redirect()`.**

Provide the numeric status code as the first argument and the target URL as the second argument when invoking `res.redirect()` to match Express 5 signature requirements.

```javascript
app.get('/old-route', function (req, res) {
  res.redirect(301, '/new-route');
});
```

**Rule 4: Explicitly catch and forward errors thrown inside detached asynchronous callbacks to `next()`.**

Wrap non-Promise asynchronous callbacks such as `setTimeout` handlers in `try...catch` blocks and pass any caught exceptions directly to `next(err)` to prevent unhandled process crashes.

```javascript
app.get('/async-task', (req, res, next) => {
  setTimeout(() => {
    try {
      throw new Error('Asynchronous failure');
    } catch (err) {
      next(err);
    }
  }, 100);
});
```

**Rule 5: Validate that middleware handlers passed to `app.use()` are valid functions.**

Verify that middleware imports and components are valid functions before passing them to `app.use()` to prevent synchronous `TypeError` exceptions during application startup.

```javascript
const authMiddleware = require('./middleware/auth');

if (typeof authMiddleware === 'function') {
  app.use('/protected', authMiddleware);
} else {
  throw new TypeError('Expected auth middleware to be a function');
}
```

**Rule 6: Append additional cookies instead of replacing the `Set-Cookie` header**

Use `res.cookie()` to create cookies and `res.append('Set-Cookie', value)` when adding a raw cookie header after another middleware has already set cookies. Do not call `res.set('Set-Cookie', value)` afterward, because it resets the existing `Set-Cookie` values.

```javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
  res.cookie('session', 'secret-session-id', {
    httpOnly: true,
    secure: true
  });
  next();
});

app.get('/', (req, res) => {
  res.append('Set-Cookie', 'theme=dark; Path=/');
  res.send('OK');
});
```


## Category: boundary control

### Inspect req.originalUrl for Path-Based Security Checks in Mounted Middleware

**Use when**

When implementing authorization checks, security logging, or boundary access controls inside middleware or sub-applications mounted with prefix paths using `app.use()`.

**Secure rules**

**Rule 1: Inspect req.originalUrl instead of req.url within mounted middleware to correctly evaluate complete request paths for security boundaries.**

Because Express rewrites `req.url` inside mounted sub-routers to be relative to the prefix, security checks relying on `req.url` can be bypassed. Use `req.originalUrl` to evaluate the actual full path against security rules.

```javascript
app.use('/api', function (req, res, next) {
  // Access full original request URL for path checks
  if (req.originalUrl.startsWith('/api/admin') && !req.user?.isAdmin) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```


## Category: csrf

### Protect state-changing routes and cookies against CSRF with token validation and SameSite attributes

**Use when**

Developing state-changing Express endpoints, such as `POST` routes or session termination handlers, that rely on session cookies or issue sensitive cookies.

**Secure rules**

**Rule 1: Enforce anti-CSRF token validation and SameSite cookie policies on state-changing endpoints.**

When configuring session middleware or issuing cookies via `res.cookie()`, explicitly set `sameSite` to `'lax'` or `'strict'`. Ensure that state-changing routes utilize non-safe HTTP methods like `POST` and require the validation of anti-CSRF tokens to prevent cross-site request forgery attacks.

```js
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET,
  cookie: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.post('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});
```


## Category: file handling

### Enforce Strict Path Containment and Restrict Dotfiles in File Transfers and Static Serving

**Use when**

Handling file downloads via `res.sendFile()` or serving static assets using `express.static()` with user-influenced input.

**Secure rules**

**Rule 1: Use a restricted root when sending files selected by user input**

When using res.sendFile(), either pass an absolute file path or provide an absolute root option. An absolute path is valid when the application fully determines the exact file to send.

When user input influences the filename, provide a restricted root directory instead of accepting a user-supplied absolute path. Express resolves the filename against that root and verifies that the resulting path remains inside it.

```javascript
const express = require('express'); const app = express(); app.get('/download', (req, res, next) => { res.sendFile(req.query.name, { root: '/var/www/uploads' }, (err) => { if (err) { next(err); } }); }); app.listen(3000);
```

**Rule 2: Explicitly configure dotfile handling and expose only required hidden directories**

When using `express.static()` or `res.sendFile()`, use the `dotfiles` and `root` options instead of the unsupported legacy `hidden` and `from` options. Keep dotfiles ignored or denied by default, and use `dotfiles: 'allow'` only when serving a specific public dot-directory (such as `.well-known`) through a dedicated mount.

```javascript
// Ignore dotfiles in general static content
app.use(express.static('public', {
  dotfiles: 'ignore'
}));

// Allow only the required public dot-directory
app.use(
  '/.well-known',
  express.static('public/.well-known', {
    dotfiles: 'allow'
  })
);

// Deny dotfiles when serving request-selected files
app.get('/files/:name', (req, res) => {
  res.sendFile(req.params.name, {
    root: '/uploads',
    dotfiles: 'deny'
  });
});
```


## Category: injection

### Use Parameterized Queries for Database Interactions

**Use when**

Building database queries within Express handlers using user-supplied input.

**Secure rules**

**Rule 1: Always use parameterized queries, bind variables, or prepared statements when interacting with databases.**

Pass dynamic parameters separately as driver positional arguments, bind variables, or prepared statement inputs rather than concatenating user input directly into query strings to prevent injection vulnerabilities.

```javascript
// Safe PostgreSQL parameterized query using pg-promise
db.one('SELECT * FROM users WHERE id = $1', [userId]);
```


## Category: input interpretation safety

### Canonicalize and Validate Captured Route Parameters Before Use

**Use when**

Extracting and utilizing untrusted path parameters or wildcards captured by `path-to-regexp` v8 in Express 5 handlers.

**Secure rules**

**Rule 1: Explicitly validate and sanitize captured route parameters and wildcards before passing them into sensitive operations.**

Express 5 captures path parameters and wildcards as untrusted client strings or arrays. Always normalize and canonicalize raw parameter values to prevent path traversal or parser differential vulnerabilities before using them in filesystem operations or queries.

```javascript
const path = require('node:path');

app.get('/files/*filepath', (req, res) => {
  const safeRelativePath = path.normalize(req.params.filepath.join('/')).replace(/^(\.\.[\/\\])+/, '');
  res.sendFile(safeRelativePath, { root: '/var/www/uploads' });
});
```


## Category: interface protocol hardening

### Enforce Strict HTTP Method Selection and Avoid Query-Based Method Overriding

**Use when**

When configuring routing handlers and handling method dispatch in Express applications to prevent method confusion and protocol abuse.

**Secure rules**

**Rule 1: Use a request header getter for method overriding and restrict allowed methods to POST**

When using `method-override` middleware, pass an `X-`-prefixed header name as the getter rather than a query string key. The `options.methods` list defaults to `['POST']`; the official README warns that adding other methods "may introduce security issues and cause weird behavior when requests travel through caches." Keep the allowed methods set to `['POST']` only.

```javascript
app.use(methodOverride('X-HTTP-Method-Override'));
```


## Category: network boundary

### Validate redirect URLs against trusted paths or allowed destinations

**Use when**

Handling HTTP redirect responses where target URLs are derived from request parameters or untrusted inputs.

**Secure rules**

**Rule 1: Validate target URLs against an allowed list or restrict destination paths to relative paths starting with a single slash before performing a redirect.**

Do not pass user-provided input directly to `res.redirect()`. Check that the target URL starts with a single slash and does not start with double slashes to prevent open redirects. In Express 5, when supplying a status code, use the `res.redirect(status, url)` signature.

```javascript
app.get('/login-redirect', (req, res) => {
  const target = req.query.url;
  if (target && target.startsWith('/') && !target.startsWith('//')) {
    res.redirect(302, target);
  } else {
    res.redirect(302, '/dashboard');
  }
});
```


## Category: output encoding

### Escape HTML-sensitive characters in JSON and JSONP responses

**Use when**

When serving JSON or JSONP responses that may be embedded directly within HTML documents or inline script blocks in Express.

**Secure rules**

**Rule 1: Enable the json escape application setting to convert HTML-sensitive characters into Unicode escape sequences**

Call `app.enable('json escape')` to ensure that characters such as `<`, `>`, and `&` are automatically converted into Unicode escape sequences like `\u003c`, `\u003e`, and `\u0026` in responses generated by `res.json()` and `res.jsonp()`. This prevents premature closing of inline script tags and mitigates Cross-Site Scripting vulnerabilities when content is embedded in HTML pages.

```javascript
const express = require('express');
const app = express();

// Enable Unicode escaping of HTML characters in JSON/JSONP responses
app.enable('json escape');

app.get('/api/data', (req, res) => {
  res.jsonp({ userContent: '<script>alert(1)</script>' });
});
```


## Category: resource exhaustion

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


## Category: runtime environment hardening

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


## Category: secret handling

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


## Category: security control integrity

### Mount Security Controls and Error Handlers Correctly in the Middleware Stack

**Use when**

Building and structuring the Express application middleware stack and defining error-handling routes.

**Secure rules**

**Rule 1: Delegate to the default error handler when headers are already sent.**

Always check `res.headersSent` in custom error-handling middleware before attempting to write or send an error response. If headers have already been transmitted, pass the error to `next(err)` so Express's default error handler can safely close the connection.

```javascript
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).render('error', { error: err });
});
```


## Category: session management

### Regenerate session identifiers upon user authentication

**Use when**

Handling user authentication and privilege elevation events in Express session middleware.

**Secure rules**

**Rule 1: Regenerate the session identifier immediately upon successful user authentication.**

Invoke `req.session.regenerate()` when a user successfully authenticates before populating session credentials. This prevents session fixation attacks by ensuring session IDs are not reused across unauthenticated and authenticated states.

```javascript
app.post('/login', function (req, res, next) {
  if (!req.body) return res.sendStatus(400);
  authenticate(req.body.username, req.body.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      req.session.regenerate(function (err) {
        if (err) return next(err);
        req.session.user = user;
        res.redirect('/restricted');
      });
    } else {
      res.redirect('/login');
    }
  });
});
```
