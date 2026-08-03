# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: configuration source integrity

## configuration source integrity

### Prevent Configuration and Prototype Pollution in Axios Request Options

**Use when**

Combining untrusted user inputs or external configurations into Axios request options, headers, authentication settings, or query parameters.

**Secure rules**

**Rule 1: Use Axios native configuration merging and built-in instance creation instead of custom deep merges with untrusted inputs.**

Always rely on `axios.create()` or request-level options handled by Axios to merge configurations securely. Axios automatically neutralizes dangerous prototype keys such as `__proto__`, `constructor`, and `prototype` using null-prototype objects and strict own-property checks, preventing untrusted objects from corrupting security-critical settings across requests.

```javascript
const client = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

const response = await client.get('/user/profile', {
  headers: {
    'X-Request-ID': 'req-123'
  }
});
```

**Rule 2: Allowlist and type-check untrusted properties before constructing Axios configuration**

When Basic-auth credentials originate from an untrusted object, construct a new `auth` object containing only own `username` and `password` properties after confirming both are strings. Do not pass the source object directly or treat value coercion as validation.

```js
import axios from 'axios';

function createBasicAuth(credentials) {
  const hasOwn = (property) =>
    Object.prototype.hasOwnProperty.call(credentials, property);

  if (
    credentials === null ||
    typeof credentials !== 'object' ||
    !hasOwn('username') ||
    !hasOwn('password') ||
    typeof credentials.username !== 'string' ||
    typeof credentials.password !== 'string'
  ) {
    throw new TypeError('Basic-auth credentials must contain own string properties');
  }

  return {
    username: credentials.username,
    password: credentials.password,
  };
}

export function fetchAccount(credentials) {
  return axios.get('https://api.example.com/account', {
    auth: createBasicAuth(credentials),
  });
}
```
