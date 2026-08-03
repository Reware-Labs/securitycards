# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: input driven boundary selection

## input driven boundary selection

### Sanitize URL path segments to prevent protocol-relative request redirection

**Use when**

Building request paths using dynamic user input combined with a `baseURL` in Axios.

**Secure rules**

**Rule 1: Strip leading slashes from user-supplied path segments before appending them to base URLs.**

Prevent protocol-relative URL injection by normalizing dynamic input. If user input contains leading slashes, concatenating it with `baseURL` can alter the target origin and redirect requests to an external server.

```javascript
const api = axios.create({
  baseURL: 'http://internal.service'
});

function fetchUserData(userId) {
  const safePath = String(userId).replace(/^\/+/, '');
  return api.get(`/users/${safePath}`);
}
```
