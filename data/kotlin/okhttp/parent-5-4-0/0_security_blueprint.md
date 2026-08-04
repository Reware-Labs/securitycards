# Security blueprint

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`

## Security posture

When developing network-enabled client applications using OkHttp, developers must assume that transport security, input canonicalization, resource limits, and credential protection require explicit configuration. While the library manages connection pooling and secure defaults for TLS when configured properly, it does not prevent logic flaws, host boundary bypasses, resource exhaustion, or credential leakage by default. All untrusted inputs, redirect behaviors, logging settings, and concurrency limits must be strictly controlled, failing closed when security validations or resource bounds are violated.

## Essential implementation rules

1. **Depend Only on Public OkHttp APIs**

Rely strictly on public API packages such as `okhttp3.*` and avoid importing or invoking internal classes from `okhttp3.internal` to ensure runtime stability and secure API contracts.

2. **Prevent Infinite Authentication Retry Loops**

When implementing the `Authenticator` interface for 401 unauthorized challenges, check if the `Authorization` header is already present and return null to stop infinite loops.

3. **Restrict Preemptive Authorization Headers to Intended Hosts**

Verify that the request URL host matches the target domain before injecting preemptive credentials via `Credentials.basic()` to prevent leaking authentication secrets to third-party domains.

4. **Enforce Dependency Verification and Artifact Signatures**

Verify downloaded OkHttp dependency artifacts using Gradle automated dependency signature verification against official release signing keys to guarantee supply-chain integrity.

5. **Enforce Strict TLS Verification and Public Key Pinning**

Configure `OkHttpClient` with `CertificatePinner`, explicit `SSLSocketFactory` and `X509TrustManager` implementations, platform trusted certificates via `addPlatformTrustedCertificates()`, and robust key algorithms like `ecdsa256()`.

6. **Restrict Insecure TLS Host Overrides to Non-Production Environments**

Limit the use of `HandshakeCertificates.Builder().addInsecureHost()` strictly to private development and testing environments where certificate authorities are unavailable.

7. **Validate OAuth State Tokens Against Cross-Site Request Forgery**

Generate cryptographically secure, unguessable state tokens using `SecureRandom` for OAuth authorization requests, validate them upon callback, and invalidate them immediately after token exchange to prevent replay attacks.

8. **Parse and Canonicalize Untrusted URLs Using HttpUrl**

Always process untrusted URL inputs using `HttpUrl.parse()` or `HttpUrl.get()` to normalize dot-segments, control characters, and whitespace before evaluating host validation or routing rules.

9. **Enforce Single Protocol Configuration for HTTP/2 Prior Knowledge**

When configuring network protocols, ensure `Protocol.H2_PRIOR_KNOWLEDGE` is specified as the sole protocol in the list without fallback protocols to prevent connection ambiguity.

10. **Configure Dispatcher Concurrency Limits and Read Timeouts**

Set explicit maximum concurrency limits on the `Dispatcher` and define an explicit `readTimeout` on `OkHttpClient.Builder` to prevent thread starvation and resource exhaustion.

11. **Stream Response Bodies Incrementally and Manage Streaming Lifecycles**

Stream response bodies using `ResponseBody.source()` or `ResponseBody.byteStream()` rather than loading large payloads into memory via `ResponseBody.string()`, and explicitly cancel active streams to release socket resources.

12. **Disable SSL-to-Cleartext Redirect Downgrades**

Configure `followSslRedirects(false)` on `OkHttpClient.Builder` and register network interceptors to inspect intermediate `Location` redirect headers when strict transport security is required.

13. **Redact Sensitive Headers and Securely Manage Application Credentials**

Mask sensitive headers such as `Authorization` and `Cookie` using `HttpLoggingInterceptor.redactHeader()`, restrict verbose logging to non-production environments, supply credentials via environment variables, and avoid transmitting tokens in URL query parameters.
