# Security cards

Repository: `https://github.com/expressjs/express#v5.2.1`
Documentation repository: `https://github.com/expressjs/expressjs.com#main`
Category: csrf

## csrf

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
