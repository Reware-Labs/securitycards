# Security blueprint

Repository: `https://github.com/axios/axios#v1.19.0`

## Security posture

When building network clients with Axios, developers must assume that inputs, endpoints, and environment variables are untrusted and require strict validation, boundary scoping, and resource throttling. The library handles baseline transport and object sanitization but does not protect against domain-level SSRF, protocol downgrades, unbounded response sizes, or misconfigured cross-origin credentials by default. Security-sensitive surfaces include interceptor pipelines, custom transport agents, URL construction, proxy routing, and credential forwarding across redirects. All deviations from strict protocol validation, request limits, and authorization scoping must fail closed to protect application integrity.

## Essential implementation rules

1. **Validate request status codes explicitly**

Use the `validateStatus` configuration option to explicitly verify that HTTP status codes fall within the successful 200-299 range so that 4xx and 5xx error responses do not resolve as successful domain data.

2. **Manage authentication credentials securely**

Pass HTTP Basic authentication credentials via the structured `auth` configuration object rather than embedding them in request URLs, and attach dynamic Bearer tokens using request interceptors. Isolate credentials using dedicated Axios instances rather than global defaults, and explicitly clear or overwrite inherited auth configurations with `null` when needed.

3. **Gate interceptors on resolved destinations**

Gate sensitive request interceptors on the resolved destination origin rather than `baseURL` alone. Use `getUri()` and `runWhen` to verify destination endpoints before attaching shared secret fields, and account for interceptor execution order when combining authentication and signing.

4. **Prevent prototype pollution and configuration tampering**

Rely on `axios.create()` and native request-level option merging to neutralize dangerous keys like `__proto__`, `constructor`, and `prototype`. Allowlist and type-check untrusted property sources before constructing request configurations, and use `AxiosHeaders.parseParameters()` to parse header directives safely.

5. **Configure cross-origin XSRF protection and credentials**

Explicitly set `withCredentials: true` and `withXSRFToken: true` when sending anti-CSRF headers on cross-origin requests, and enable `withCredentials` when communicating with cross-origin APIs that depend on session cookies.

6. **Sanitize and encode HTTP headers**

Assign dynamic header values through `AxiosHeaders` or standard request configuration headers, and wrap non-ASCII values using `encodeURIComponent` to neutralize untrusted input before header dispatch.

7. **Enforce strict URL formatting and protocol allowlists**

Wrap Axios requests in try-catch blocks to handle `ERR_INVALID_URL` exceptions from malformed inputs and validate complete request destinations against application-controlled allowlists. When interpolating an ID into a fixed route, validate it and encode it as one path segment with `encodeURIComponent()`; reject empty IDs and standalone `.` or `..` segments. Do not treat `baseURL` as a path boundary, and validate redirects and the server's handling of encoded separators separately.

8. **Enforce TLS verification and custom CA configuration**

Ensure `rejectUnauthorized` is explicitly set to `true` and configure trusted custom CA certificates through a custom `https.Agent` passed via `httpsAgent` on HTTPS requests in Node.js.

9. **Configure secure proxy settings and bypass rules**

Set `proxy.protocol` to `https` explicitly for secure CONNECT tunnels, and construct `NO_PROXY` environment variables using canonical formats and domain wildcards to prevent proxy bypass evasion.

10. **Enforce content size limits, timeouts, and safe retries**

Explicitly configure finite `maxContentLength` and `maxBodyLength` limits, set positive non-zero `timeout` thresholds, disable redirects when uploading readable streams, set appropriate `maxRate` bandwidth limits, and enforce strict maximum retry limits with progressive backoff while disabling retries for non-idempotent mutations.

11. **Protect secrets in logs, redirects, and environments**

Configure the `redact` array to obscure sensitive fields in error logs, configure `sensitiveHeaders` to strip custom secrets on cross-origin redirects, verify trusted hostnames and HTTPS protocols before restoring redirect credentials in `beforeRedirect`, and set `ignore-scripts=true` in build workflows.
