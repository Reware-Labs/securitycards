# Security blueprint

Repository: `https://github.com/urllib3/urllib3#2.7.0`

## Security posture

Developers working with urllib3 must assume that network requests, redirects, proxies, and decompression pipelines require explicit security boundaries and timeouts to prevent resource exhaustion and credential leakage. The library provides robust connection management and parsing utilities by default, but relies on the application to enforce strict hostname validation, certificate verification, and redirect header scrubbing. Mistakes in handling untrusted inputs, proxy configurations, or large response streams should fail closed to protect system integrity.

## Essential implementation rules

1. **Validate Exception Attributes**

When catching `NewConnectionError`, inspect `error.conn` instead of `error.pool` to adhere to the supported API contract and prevent compatibility issues.

2. **Configure Mutual TLS Authentication**

Specify client certificate files (`cert_file`), private keys (`key_file`), and certificate authorities (`ca_certs`) alongside `cert_reqs="REQUIRED"` or a custom `ssl.SSLContext` during connection pool initialization.

3. **Enforce Boundary Host Verification**

Use `urllib3.util.parse_url()` at system boundaries to extract and validate untrusted hostnames against allowlists, preventing parser differential attacks and SSRF bypasses.

4. **Secure Server Certificate Fingerprints**

Supply a 64-character SHA-256 hex string when invoking `assert_fingerprint()` to guarantee constant-time digest comparisons against timing side-channel attacks.

5. **Catch URL Parsing Errors**

Wrap untrusted URL inputs in exception handlers calling `urllib3.util.parse_url()` and catch `LocationParseError` to reject malformed syntax and out-of-range ports safely.

6. **Validate HTTP Request Methods**

Send requests via `PoolManager.request()` to normalize methods and automatically reject malformed verbs or non-token characters with a `ValueError`.

7. **Configure Trusted Proxies and DNS**

Restrict `ProxyManager` forwarding via `use_forwarding_for_https=True` to trusted corporate proxies only, and enforce remote DNS resolution using `socks5h://` or `socks4a://` for SOCKS proxies.

8. **Enforce Operation Timeouts and Streaming Limits**

Set explicit read and connect timeouts using `urllib3.util.Timeout`, and separately enforce overall time or byte limits when consuming streaming responses.

9. **Apply Strict Decompression Limits**

Ensure Brotli dependencies support bounded-output decompression (`brotli >= 1.2.0`), maintain a processed-byte counter during streaming, and catch `DecodeError` exceptions from exceeded decoder depth limits.

10. **Stream Large Responses Safely**

Configure `preload_content=False` and consume large response payloads incrementally via `stream()` or `read()`, ensuring connections are drained or closed prior to pool release.

11. **Harden Runtime Environments**

Deploy applications on Python 3.10+ runtimes compiled with OpenSSL 1.1.1 or higher to ensure full cryptographic support and modern TLS features.

12. **Strip Sensitive Headers on Redirects**

Include standard sensitive headers (`Authorization`, `Cookie`, `Proxy-Alongside`) alongside custom secret headers in `remove_headers_on_redirect` to prevent token exposure on cross-host redirects.

13. **Preserve Security Warning Visibility**

Keep HTTPS certificate verification enabled with `cert_reqs="CERT_REQUIRED"` and resolve `InsecureRequestWarning` by fixing verification rather than suppressing warnings globally.

14. **Extract Session Cookies Securely**

Pass `HTTPResponse` instances directly to `http.cookiejar.CookieJar.extract_cookies()` alongside the request object to correctly interpret security attributes like `HttpOnly`, `expires`, and `path` restrictions.
