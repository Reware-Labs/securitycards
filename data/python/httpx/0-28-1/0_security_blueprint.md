# Security blueprint

Repository: `https://github.com/encode/httpx#0.28.1`

## Security posture

When using `httpx`, developers must assume a secure-by-default posture regarding TLS verification and standard authorization header stripping, but remain vigilant around redirect boundaries, ambient proxy lookup, and custom header leakage. The library protects transport channels and manages connection pooling by default, but relies heavily on developer discipline to set explicit timeouts, validate untrusted inputs, and protect sensitive custom headers. Mistakes related to URL parsing, payload sizes, and resource management should fail closed to prevent out-of-memory errors and server-side request forgery.

## Essential implementation rules

1. **Validate Untrusted URLs and Handle Parsing Exceptions**

Always parse user-supplied URL strings using `httpx.URL` and wrap request calls or parsing logic in try-except blocks catching `httpx.InvalidURL`. Enforce strict URL schemes (`http` and `https`) to prevent parser differential vulnerabilities and invalid input interpretations.

2. **Maintain Strict TLS and Certificate Verification Settings**

Keep certificate verification enabled by retaining `verify=True` or supplying a configured `ssl.SSLContext` instance. Never pass `verify=False` in production code. Use explicit `ssl.SSLContext` objects for custom certificate authorities, client certificates, and explicit environment variable bindings, and set the `sni_hostname` request extension when connecting directly to IP addresses.

3. **Configure Explicit Timeouts and Connection Limits**

Always configure explicit non-zero timeouts using `httpx.Timeout` or numeric values to prevent stalled connections from hanging indefinitely. Define explicit connection pool limits using `httpx.Limits` on transports to prevent unbounded socket allocation and resource exhaustion.

4. **Disable Ambient Proxy Lookup in Untrusted Runtimes**

When instantiating `httpx.Client` or `httpx.AsyncClient` in multi-tenant or untrusted environments where ambient environment variables may be manipulated by external actors, explicitly pass `trust_env=False` to prevent external proxy injection.

5. **Enforce Redirect Boundary Validation and Control**

Maintain `follow_redirects=False` by default or strictly validate destination URLs before following HTTP redirects to prevent unintended credential leakage and server-side request forgery.

6. **Stream Large Response Payloads and Enforce Size Limits**

Leverage `httpx.stream()` to inspect response content length or process incoming chunks incrementally, avoiding full memory allocation of large unbounded payloads and preventing denial of service.

7. **Prevent Sensitive Credential Leaks Across Requests and Redirects**

Explicitly strip sensitive client default headers or custom authentication keys before dispatching third-party requests or when crossing cross-origin redirect boundaries where custom headers are not automatically purged.

8. **Sanitize and Obfuscate Credentials in Logs and Telemetry**

Rely on built-in credential obfuscation like `repr()` for `httpx.URL` instances containing embedded basic authentication, and explicitly filter or redact custom sensitive headers and API keys before recording header dictionaries in application logs or event hooks.

9. **Authenticate Requests Securely Using Explicit Parameters**

Provide authentication credentials explicitly via the `auth` parameter, ensuring Basic authentication is used exclusively over HTTPS. Override sync and async auth flows for custom I/O, and explicitly set `requires_request_body = True` or `requires_response_body = True` on custom `httpx.Auth` subclasses when inspecting payloads.

10. **Isolate Client Instances and Configure Persistent Cookies Safely**

Supply persistent cookies upon client creation rather than reusing a single client across multiple user sessions to prevent cross-session cookie leakage and unintended token exposure.

11. **Configure Transport Retries for Transient Connection Errors**

Explicitly set the `retries` parameter on `httpx.HTTPTransport` to handle transient connection errors safely, noting that transport retries apply exclusively to connection errors and timeouts.

12. **Enforce Automated HTTP Status Validation via Event Hooks**

Register a response event hook calling `response.raise_for_status()` to consistently enforce status code checks globally and trigger `httpx.HTTPStatusError` on HTTP 4xx or 5xx responses.
