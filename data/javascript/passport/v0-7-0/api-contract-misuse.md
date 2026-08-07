# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`
Category: api contract misuse

## api contract misuse

### Configure Passport Authentication Options and Callbacks Correctly

**Use when**

Configuring `passport.authenticate()` options or invoking asynchronous login and logout methods where API contract compliance is required.

**Secure rules**

**Rule 1: Disable automatic `req.authInfo` when using `assignProperty` by setting `authInfo: false`**

In Passport v0.7.0, `authenticate()` populates **`req.authInfo` by default** when the `assignProperty` option is used. If that metadata should not be exposed to downstream middleware or API responses, pass `authInfo: false` alongside `assignProperty` to suppress the population of `req.authInfo`.

```javascript
app.post('/api/verify',
  passport.authenticate('bearer', {
    assignProperty: 'tokenDetails',
    authInfo: false          // prevent req.authInfo from being set
  }),
  (req, res) => {
    res.json({ tokenDetails: req.tokenDetails });
  }
);
```

**Rule 2: Provide a callback function to asynchronous login and logout methods**

Always pass a callback function as the final argument when invoking `req.login()` and `req.logout()` to ensure proper session handling and avoid unhandled exceptions.

```javascript
req.login(user, function(err) {
  if (err) {
    return next(err);
  }
  return res.redirect('/dashboard');
});

req.logout(function(err) {
  if (err) {
    return next(err);
  }
  return res.redirect('/login');
});
```
