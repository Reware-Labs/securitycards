# Security blueprint

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`

## Security posture

When developing applications or integrations with aiohttp, developers must assume full responsibility for boundary enforcement, request validation, resource limits, and credential safety. While aiohttp provides robust parsing and built-in connection primitives, it does not implicitly validate authorization, sanitize untrusted file paths, or prevent resource exhaustion from large payloads. Security-sensitive surfaces including request headers, cookies, routing paths, file uploads, and proxy configurations must fail closed when invalid or unauthorized data is encountered.

## Essential implementation rules

1. **Perform Early Authorization and Expect Validation**

Implement custom expect handlers to inspect request headers and reject unauthorized clients before reading request body payloads or acknowledging `Expect: 100-continue` requests by raising `web.HTTPForbidden()`.

2. **Manage WebSocket States and Session Terminations Safely**

Ensure that only a single asyncio task handles incoming receive calls or iteration over a `web.WebSocketResponse` to prevent state machine contract violations. Explicitly close all active WebSocket connections when a user session terminates.

3. **Handle Client and Server Errors Explicitly**

Configure `raise_for_status=True` on `ClientSession` and catch `aiohttp.ClientError` exceptions. In server handlers, raise explicit HTTP exception instances rather than returning them, and catch parsing errors like `json.JSONDecodeError` to prevent leaking tracebacks.

4. **Enforce Domain and Path Isolation for Cookies**

Use `CookieJar.filter_cookies(url)` with valid `yarl.URL` objects to enforce domain, path, and IDNA boundary rules. When loading cookies, rely on safe JSON parsing and restrict unpickling to approved allowlists.

5. **Disable Implicit Proxy Environment Reading and Secure Client Sessions**

Set `trust_env=False` on `ClientSession` to prevent implicitly reading proxy settings or netrc authentication credentials from environment variables. Avoid `https://` schemes in proxy environment variables.

6. **Sanitize File Uploads and Restrict Static File Symlinks**

Sanitize multipart filenames using `os.path.basename()` before writing to disk, stream file uploads via `field.read_chunk()`, and keep `follow_symlinks=False` disabled on static file routes to prevent sandbox escapes.

7. **Validate Target URLs and Canonicalize Untrusted Inputs**

Catch `InvalidURL` and `NonHttpUrlClientError` when handling user-supplied destination URLs. Use decoded `request.path` attributes for routing and authorization checks, and validate IP strings using `is_canonical_ipv4_address`.

8. **Harden HTTP Interfaces, Methods, and Challenge Headers**

Include appropriate `WWW-Authenticate` challenge response headers on `401 Unauthorized` responses. Validate HTTP method strings to ensure they contain only valid token characters, and rely on standard server protocol parsers.

9. **Validate Reverse Proxy Headers and Request Contexts**

Verify that incoming proxy headers originate from trusted proxy IP addresses before updating request schemes or host attributes in the request context.

10. **Prevent Cross-Site Scripting via Output Encoding and Content Types**

Set explicit `content_type` and `charset` parameters on responses containing dynamic user input, and escape HTML content using standard libraries like `html.escape` before writing response text.

11. **Configure Resource Exhaustion Limits and Connection Pools**

Enforce bounded limits for `client_max_size` on `web.Application` and configure `max_line_size`, `max_field_size`, `max_headers`, connection pools, and operation timeouts on `ClientSession` to prevent denial of service.

12. **Disable Debug Mode and Traceback Leakage in Production**

Disable asyncio event loop debug mode via `loop.set_debug(False)`, avoid passing deprecated `debug` arguments to `web.Application`, use application middleware to catch unexpected errors and return generic HTTP 500 responses, and configure explicit production log levels.

13. **Load Authentication Credentials Securely and Sanitize Logs**

Retrieve sensitive credentials from environment variables or vaults rather than hardcoding them. Build Basic Authentication authorization headers using `encode_basic_auth`, and filter sensitive headers like `Authorization` and `Cookie` from log messages.

14. **Preserve Session-Level Middlewares on Request Overrides**

Explicitly retain session-level security middlewares when passing per-request middleware tuples to request methods to prevent overriding and bypassing critical security controls.
