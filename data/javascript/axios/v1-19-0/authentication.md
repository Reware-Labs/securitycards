# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: authentication

## authentication

### Configure authentication credentials safely using explicit Axios options and interceptors

**Use when**

When establishing and verifying user or service identity using HTTP Basic authentication, Bearer tokens, or custom headers in Axios requests.

**Secure rules**

**Rule 1: Pass HTTP Basic authentication credentials via the explicit auth configuration object rather than embedding them in request URLs.**

Always provide username and password credentials using the structured `auth` configuration option instead of placing them directly in the request URL string to prevent sensitive credential exposure in server logs, proxy logs, referrer headers, and browser history.

```js
const response = await axios.get("https://api.example.com/data", {
  auth: {
    username: "myUser",
    password: "myPassword"
  }
});
```

**Rule 2: Attach dynamic Bearer tokens with a request interceptor**

Use a custom `Authorization` header for Bearer tokens because Axios’s `auth` option configures HTTP Basic authentication and overwrites an existing `Authorization` header. When the token can change after creating the Axios instance, read and attach it in a request interceptor so the current value is used for each request.

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.example.com',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
```
