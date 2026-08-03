# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`

## Category: api contract misuse

### Configure validateStatus to correctly handle HTTP response status codes

**Use when**

Configuring Axios requests when custom response status validation or proper error throwing on 4xx or 5xx status codes is required.

**Secure rules**

**Rule 1: Provide a correct `validateStatus` function that ensures HTTP error responses reject the promise.**

Use the `validateStatus` configuration option to explicitly verify that the HTTP status code falls within the successful 200-299 range, preventing 4xx or 5xx error responses from resolving as successful domain data.

```javascript
axios.get('/api/resource', {
  validateStatus: (status) => status >= 200 && status < 300
});
```


## Category: authentication

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


## Category: boundary control

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


## Category: configuration source integrity

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


## Category: csrf

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


## Category: injection

### Sanitize and Encode Header Values to Prevent HTTP Header Injection

**Use when**

Setting custom request headers or handling dynamic inputs intended for HTTP headers.

**Secure rules**

**Rule 1: Use `AxiosHeaders` methods or standard request configuration headers along with explicit encoding to neutralize untrusted input before header dispatch.**

Axios automatically strips carriage returns, line feeds, and null bytes to protect against HTTP header injection, but non-ASCII characters and arbitrary strings should be explicitly encoded or validated. Assign dynamic values through `AxiosHeaders` or standard request config headers to ensure sanitization is invoked, and wrap non-ASCII values using `encodeURIComponent`.

```javascript
import axios, { AxiosHeaders } from 'axios';

const headers = new AxiosHeaders();
headers.set('x-user-name', encodeURIComponent(untrustedUserName));

axios.get('https://example.com/api', { headers });
```


## Category: input contract definition

### Validate HTTP URL formatting before request dispatch

**Use when**

Making HTTP or HTTPS requests using Axios with untrusted dynamic endpoint URLs.

**Secure rules**

**Rule 1: Validate request URL formatting and handle ERR_INVALID_URL exceptions when processing untrusted URL input.**

Always wrap Axios requests in a try-catch block when utilizing untrusted dynamic endpoints to catch and handle `ERR_INVALID_URL` errors caused by malformed URLs missing double slashes or containing control characters.

```javascript
try {
  const response = await axios.get(userProvidedUrl, { adapter: 'fetch' });
} catch (error) {
  if (error.code === 'ERR_INVALID_URL') {
    // Reject invalid or malformed URL input safely
  }
}
```


## Category: input driven boundary selection

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


## Category: input interpretation safety

### Parse Header Directives with AxiosHeaders to Prevent Prototype Pollution

**Use when**

Parsing untrusted HTTP header directives and parameters where keys must be safely interpreted without allowing prototype pollution.

**Secure rules**

**Rule 1: Import `AxiosHeaders` from Axios’s public entry point when parsing header parameters**

Use the public `AxiosHeaders.parseParameters()` API to parse parameterized header values. It returns a null-prototype parameter map, normalizes parameter names, handles quoted values, and excludes the dangerous keys `__proto__`, `constructor`, and `prototype`. Do not import `axios/lib/core/AxiosHeaders.js`, because that internal subpath is not exported by the package.

```js
import { AxiosHeaders } from 'axios';

const parameters = AxiosHeaders.parseParameters(
  'attachment; filename="report.pdf"; charset=utf-8; __proto__=ignored'
);

console.log(parameters.filename); // report.pdf
console.log(parameters.charset); // utf-8
console.log(Object.getPrototypeOf(parameters)); // null
```


## Category: interface protocol hardening

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


## Category: network boundary

### Configure trusted proxy settings and bypass rules for secure network boundaries

**Use when**

Configuring network proxy options and `NO_PROXY` bypass rules for Axios requests across corporate or restricted network boundaries.

**Secure rules**

**Rule 1: Use HTTPS targets and explicitly declare HTTPS proxy protocols**

For end-to-end TLS to the origin, request an `https://` target so Axios’s Node adapter uses a CONNECT tunnel. When the configured proxy server itself uses HTTPS, set `proxy.protocol` to `https` explicitly. Axios sends proxy credentials on the CONNECT request rather than inside the origin TLS connection and re-evaluates its proxy configuration across redirects.

```js
import axios from 'axios';

export function fetchThroughSecureProxy() {
  return axios.get('https://api.example.com/data', {
    proxy: {
      protocol: 'https',
      host: 'proxy.example.com',
      port: 8443,
    },
  });
}
```

**Rule 2: Construct NO_PROXY environment variables using canonical formats and domain wildcards.**

Set `NO_PROXY` using standard domain patterns and canonical IP formats to ensure Axios correctly normalizes host representations and prevents security proxy bypass evasion.

```javascript
process.env.NO_PROXY = 'localhost,127.0.0.1,::1,*.internal.domain:8080';

await axios.get('http://[::ffff:127.0.0.1]:8080/api/health');
```


## Category: resource exhaustion

### Configure Content Size Limits and Bandwidth Throttling for Untrusted Endpoints

**Use when**

Making HTTP requests or streaming large payloads to and from untrusted servers or endpoints where payload expansion or unconstrained data transfers can exhaust memory and network resources.

**Secure rules**

**Rule 1: Explicitly configure maxContentLength and maxBodyLength limits**

Set explicit `maxContentLength` and `maxBodyLength` limits in request configurations or instance defaults to prevent memory exhaustion and denial of service from excessively large or maliciously compressed payloads.

```javascript
import axios from 'axios';

const response = await axios.get('https://api.example.com/data', {
  adapter: 'fetch',
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 5 * 1024 * 1024
});
```

**Rule 2: Disable HTTP redirects when uploading readable streams**

Explicitly set `maxRedirects: 0` when uploading large readable streams in Node.js to prevent the underlying redirect module from buffering entire stream contents into memory.

```javascript
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

const form = new FormData();
form.append("file", fs.createReadStream("/path/to/large-file.jpg"));

await axios.post("https://example.com/upload", form, {
  maxRedirects: 0
});
```

**Rule 3: Enforce maximum bandwidth limits using maxRate**

Configure the `maxRate` option in Node.js requests to restrict upload and download speeds during bulk transfers and prevent network interface saturation.

```javascript
await axios.post(SERVER_URL, largeBuffer, {
  maxRate: [100 * 1024, 500 * 1024]
});
```


### Configure Explicit Request Timeouts and Handle Timeouts Properly

**Use when**

Making HTTP requests to external or untrusted remote endpoints where unbounded waits can cause connection hanging, socket leakage, and resource exhaustion.

**Secure rules**

**Rule 1: Always configure an explicit positive timeout value in milliseconds on Axios instances or per-request configurations to enforce bounded execution times.**

Set a non-zero `timeout` property when creating an Axios instance or initiating requests to prevent connections from hanging indefinitely. Avoid relying on default unbounded behavior or setting `timeout: 0` which disables timeout enforcement entirely. Additionally, ensure timeout configuration values passed to options are valid numbers or numeric strings.

```js
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000
});

try {
  const response = await api.get('/data', {
    timeout: 5000,
    transitional: {
      clarifyTimeoutError: true
    }
  });
} catch (error) {
  if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
    console.error('Request timed out');
  }
}
```


### Configure Safe Retry Policies and Limits for Axios Requests

**Use when**

Implementing custom retry logic or handling failed HTTP requests using Axios response interceptors.

**Secure rules**

**Rule 1: Enforce strict maximum retry limits and progressive backoff delays in response interceptors.**

When implementing HTTP retry logic in Axios response interceptors, always enforce a strict maximum retry limit and introduce progressive backoff delays or honor server-provided `Retry-After` headers. Limit retries strictly to transient failures such as network drops or `5xx` server errors to prevent cascading resource exhaustion.

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status < 600);
    if (!shouldRetry) return Promise.reject(error);
    config._retryCount = config._retryCount ?? 0;
    if (config._retryCount >= 3) return Promise.reject(error);
    config._retryCount += 1;
    const backoff = 100 * 2 ** config._retryCount;
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return api(config);
  }
);
```

**Rule 2: Explicitly disable retry mechanisms for non-idempotent mutation requests.**

Explicitly disable retry logic for non-idempotent requests such as state-changing `POST` or charge requests by evaluating custom request config flags like `_noRetry` before triggering retry mechanisms in interceptors, preventing duplicate transactions or state corruption.

```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (config._noRetry) return Promise.reject(error);
    // Perform retry logic for retryable errors...
  }
);

// Opt out of retries for non-idempotent mutations:
await api.post('/payments/charge', body, { _noRetry: true });
```


### Secure Response Streaming and Prevent Resource Exhaustion

**Use when**

Handling streaming HTTP responses, large payloads, or data streams from untrusted servers where unbounded memory consumption or decompression-bomb vulnerabilities must be prevented.

**Secure rules**

**Rule 1: Configure an explicit maxContentLength limit when handling response streams from untrusted endpoints.**

Set `maxContentLength` to a finite byte threshold instead of relying on the default unlimited value of `-1` to prevent excessive memory usage or decompression-bomb denial-of-service attacks.

```javascript
const client = axios.create({
  responseType: 'stream',
  maxContentLength: 10 * 1024 * 1024
});
```

**Rule 2: Process fetch adapter response streams incrementally using a reader.**

Configure `responseType` to `stream` when using the fetch adapter to retrieve large payloads, returning a native `ReadableStream` so chunks can be processed incrementally rather than buffering the entire response body into memory.

```javascript
const response = await axios.get('https://example.com/large-file', {
  adapter: 'fetch',
  responseType: 'stream'
});
const reader = response.data.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
}
```

**Rule 3: Configure Node.js transfer limits with the public `maxRate` request option**

For requests handled by Axios’s Node.js HTTP adapter, set `maxRate` in bytes per second instead of constructing `AxiosTransformStream` directly. A single number limits upload and download to the same rate; an array specifies `[uploadRate, downloadRate]`. This option has no effect in browsers.

```javascript
import axios from 'axios';

export async function openRateLimitedDownload(url) {
  const response = await axios.get(url, {
    responseType: 'stream',
    maxRate: [Infinity, 200 * 1024]
  });

  return response.data;
}
```


## Category: runtime environment hardening

### Enable ignore-scripts in build environments handling secrets

**Use when**

Configuring build environments, CI/CD pipelines, or package installations that process sensitive credentials and require minimized runtime attack surfaces.

**Secure rules**

**Rule 1: Configure ignore-scripts to true in project configuration or build commands to prevent automatic dependency lifecycle script execution.**

Set `ignore-scripts=true` in the project `.npmrc` file or pass `--ignore-scripts` directly to package manager commands during build and deployment workflows to eliminate automated script execution vectors.

```bash
# In .npmrc:
ignore-scripts=true

# Or via npm command:
npm ci --ignore-scripts
```


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

### Configure withCredentials for cross-origin session authentication

**Use when**

When making requests from a frontend application to a cross-origin API that relies on session cookies for authentication.

**Secure rules**

**Rule 1: Enable withCredentials on Axios client instances when communicating with cross-origin APIs dependent on session cookies.**

Set `withCredentials: true` on the Axios client configuration to ensure that browser session cookies are automatically attached and transmitted with cross-origin requests.

```js
const api = axios.create({
  baseURL: "https://api.example.com",
  withCredentials: true
});
```
