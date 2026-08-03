# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: secret handling

## secret handling

### Protect credentials and secrets in Axios requests and logs

**Use when**

Configuring authentication headers, sensitive fields, and credentials for HTTP requests.

**Secure rules**

**Rule 1: Redact sensitive request parameters in serialized error logs**

Configure the `redact` array in request configuration to obscure sensitive field names when error objects are serialized via `toJSON()`.

```javascript
axios.get('/user/12345', {
  headers: { Authorization: 'Bearer token' },
  auth: { username: 'me', password: 'secret' },
  redact: ['authorization', 'password']
}).catch((error) => {
  console.log(error.toJSON().config);
});
```

**Rule 2: Scope authentication credentials using dedicated instance defaults**

Do not set `Authorization` headers on global Axios defaults when making requests to multiple domain endpoints. Instead, isolate credentials by creating dedicated Axios instances with scoped `baseURL` settings.

```javascript
const authenticatedApi = axios.create({
  baseURL: 'https://api.example.com',
  headers: {
    Authorization: `Bearer ${AUTH_TOKEN}`
  }
});

authenticatedApi.get('/user/profile');
```

**Rule 3: Protect sensitive headers on cross-origin redirects**

Configure `sensitiveHeaders` when sending custom authorization tokens or secrets in headers to ensure Axios automatically strips them upon cross-origin redirects while preserving them for same-origin requests.

```javascript
await axios.get('https://example.com/api/data', {
  headers: {
    'X-API-Key': 'secret-token-123',
    'X-Custom-Auth': 'user-session-id'
  },
  sensitiveHeaders: ['X-API-Key', 'X-Custom-Auth']
});
```

**Rule 4: Verify the trusted hostname and HTTPS protocol before restoring redirect credentials**

In Node.js, `beforeRedirect` runs after redirect credentials have been stripped. Reattach credentials only when `options.hostname` matches an explicitly trusted destination and `options.protocol` is `https:`; otherwise leave the credentials removed. An HTTPS check alone does not establish that the redirect destination is trusted.

```javascript
import axios from 'axios';

export function getWithTrustedRedirectAuth(url, trustedHostname, basicCredentials) {
  return axios.get(url, {
    beforeRedirect(options) {
      if (
        options.hostname === trustedHostname &&
        options.protocol === 'https:'
      ) {
        options.auth = basicCredentials;
      }
    }
  });
}
```

**Rule 5: Explicitly overwrite or clear default auth and proxy configurations**

Set configuration keys like `auth` and `proxy` explicitly to `null` or `false` rather than providing an empty object when a request needs to disable or strip inherited default credentials or proxy settings.

```javascript
await axios.get('https://public.example.com/data', {
  auth: null,
  proxy: false
});
```
