# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: security control integrity

## security control integrity

### Account for Interceptor Execution Order in Security Workflows

**Use when**

Registering multiple request and response interceptors to apply security controls, authorization headers, or cryptographic signatures.

**Secure rules**

**Rule 1: Register dependent interceptors in their actual execution order**

With Axios v1.19.0’s default `legacyInterceptorReqResOrdering` setting, request interceptors execute in reverse registration order, while response interceptors execute in registration order. When request signing depends on authentication changes, register the signing interceptor first and the authentication interceptor second so authentication executes first. If `legacyInterceptorReqResOrdering` is set to `false`, request interceptors instead execute in registration order.

```javascript
import axios from 'axios';

export function createAuthenticatedSigningClient(
  addAuthentication,
  signAuthenticatedRequest
) {
  const client = axios.create();

  // Registered first, so it executes second under the default LIFO ordering.
  client.interceptors.request.use((config) =>
    signAuthenticatedRequest(config)
  );

  // Registered second, so it executes first and authentication precedes signing.
  client.interceptors.request.use((config) =>
    addAuthentication(config)
  );

  return client;
}
```
