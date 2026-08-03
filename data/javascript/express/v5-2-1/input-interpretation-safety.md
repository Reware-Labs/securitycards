# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: input interpretation safety

## input interpretation safety

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
