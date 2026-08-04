# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: file handling

## file handling

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
