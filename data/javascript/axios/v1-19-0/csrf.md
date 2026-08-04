# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: csrf

## csrf

### Configure explicit cross-origin XSRF protection tokens

**Use when**

Making cross-origin requests using Axios where anti-CSRF token headers must be attached safely.

**Secure rules**

**Rule 1: Set both withCredentials and withXSRFToken explicitly to true when sending anti-CSRF headers on cross-origin requests.**

Axios attaches XSRF headers only to same-origin requests by default to prevent leaking CSRF tokens. Explicitly set `withCredentials: true` and `withXSRFToken: true` to enable protection for cross-origin requests.

```javascript
axios.get('https://api.example.com/user', {
  withCredentials: true,
  withXSRFToken: true
});
```
