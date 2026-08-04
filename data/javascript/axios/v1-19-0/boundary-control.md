# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: boundary control

## boundary control

### Verify destination endpoints in request interceptors before attaching sensitive state

**Use when**

When appending shared sensitive payload fields or headers using request interceptors or `transformRequest` in Axios.

**Secure rules**

**Rule 1: Gate sensitive request interceptors on the resolved destination, not `baseURL` alone**

When a request interceptor adds a shared sensitive body field, scope it to an allowlisted resolved origin. `baseURL` is not a security boundary: absolute request URLs can override it, and relative paths can resolve outside an intended path prefix. Use `getUri()` to resolve the request destination and `runWhen` to skip the secret-bearing interceptor for every other origin.

```js
import axios from 'axios';

const TRUSTED_ORIGIN = 'https://api.example.com';

export function createInternalClient(internalToken) {
  const instance = axios.create({
    baseURL: TRUSTED_ORIGIN,
  });

  instance.interceptors.request.use(
    (config) => {
      config.data = { ...config.data, internalToken };
      return config;
    },
    undefined,
    {
      runWhen: (config) =>
        new URL(instance.getUri(config)).origin === TRUSTED_ORIGIN,
    }
  );

  return instance;
}
```
