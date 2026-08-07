# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: csrf

## csrf

### Configure Client Token Storage to Avoid CSRF

**Use when**

Configuring authentication client token storage in Feathers applications.

**Secure rules**

**Rule 1: Maintain default LocalStorage token persistence for client JWTs unless robust anti-CSRF mechanisms are implemented when switching to cookie storage.**

Feathers stores JWTs in browser `LocalStorage` by default to avoid Cross-Site Request Forgery. If authentication is configured to store JWTs in cookies instead, browser requests become susceptible to CSRF attacks, so you must keep client token storage in `LocalStorage` unless using proper CSRF protection like `SameSite` cookie flags and CSRF tokens.

```javascript
const client = feathers();
client.configure(feathers.authentication({
  storage: window.localStorage
}));
```
