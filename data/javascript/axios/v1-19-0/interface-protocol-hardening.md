# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: interface protocol hardening

## interface protocol hardening

### Configure HTTPS Agent TLS Options to Preserve Certificate Verification

**Use when**

Making HTTPS requests in Node.js using Axios where custom TLS verification options or custom CA certificates are required.

**Secure rules**

**Rule 1: Explicitly enforce certificate verification and configure trusted custom CA certificates through a custom https.Agent in Axios requests.**

When making HTTPS requests in Node.js using Axios, ensure that `rejectUnauthorized` is explicitly set to `true` or left at its secure default to prevent accepting invalid or untrusted TLS certificates. Custom CA certificates and validation flags must be configured via a custom `https.Agent` passed through the `httpsAgent` configuration option. Axios will forward these options from `httpsAgent` into CONNECT-tunneling agents when proxying, ensuring origin TLS handshake rules are preserved.

```javascript
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  ca: fs.readFileSync('/path/to/trusted-ca.pem')
});

const response = await axios.get('https://secure-api.internal', {
  httpsAgent
});
```


### Enforce strict protocol allowlists on request URLs

**Use when**

Handling untrusted or dynamic URIs before dispatching network requests to prevent unintended protocol routing.

**Secure rules**

**Rule 1: Validate the complete request destination, not only its protocol**

Before passing an untrusted URL to Axios, parse it and require its resolved origin and pathname to match an application-controlled allowlist. Checking only for `http:` or `https:` does not prevent requests to unintended loopback, metadata, or internal hosts. Do not treat `baseURL` as a security boundary because absolute URLs can override it by default and normalized relative paths can escape an intended path prefix.

```javascript
import axios from 'axios';

export async function getAllowedDestination(inputUrl, allowedUrls) {
  const destination = new URL(inputUrl);

  const isAllowed = allowedUrls.some((allowedUrl) => {
    const trustedDestination = new URL(allowedUrl);

    return (
      destination.origin === trustedDestination.origin &&
      destination.pathname === trustedDestination.pathname
    );
  });

  if (!isAllowed) {
    throw new Error('Request destination is not allowed');
  }

  return axios.get(destination.href);
}
```
