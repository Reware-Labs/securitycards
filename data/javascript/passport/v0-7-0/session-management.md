# Security cards

Repository: `https://github.com/jaredhanson/passport#v0.7.0`
Category: session management

## session management

### Prevent Session Fixation and Manage Session State Securely with Passport

**Use when**

Implementing user login and logout workflows that manage persistent authentication sessions using Passport.

**Secure rules**

**Rule 1: Enable `{ keepSessionInfo: true }` only after auditing pre-authentication session content**

`req.login()` regenerates and clears the session by default, protecting against session-fixation. Setting `{ keepSessionInfo: true }` overrides that defense by merging every key from the unauthenticated session into the new, authenticated session. Use the default behavior unless you have explicitly reviewed each item stored in the session and confirmed that it is safe and necessary to persist across the login boundary.

```javascript
// Default (safer): let Passport regenerate and clear the session
req.login(user, function (err) {
  if (err) { return next(err); }
  res.redirect('/dashboard');
});

// After auditing the session, you may opt-in to persistence
req.login(user, { keepSessionInfo: true }, function (err) {
  if (err) { return next(err); }
  res.redirect('/dashboard');
});
```
