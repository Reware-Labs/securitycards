# Security cards

Repository: `https://github.com/axios/axios#v1.19.0`
Documentation repository: `https://github.com/axios/axios-docs#master`
Category: resource exhaustion

## resource exhaustion

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
