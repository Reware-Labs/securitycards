# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: network boundary

## network boundary

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
