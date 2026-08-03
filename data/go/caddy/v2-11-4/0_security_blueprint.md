# Security blueprint

Repository: `https://github.com/caddyserver/caddy#v2.11.4`

## Security posture

Caddy enforces a secure-by-default architecture for HTTP routing, TLS provisioning, and proxy handling, but requires explicit developer configuration to secure administrative APIs, sensitive internal proxies, and untrusted client inputs. Developers must assume that unconstrained listeners, missing proxy trust boundaries, and insecure credential storage will directly expose the server to remote compromise or data leakage. Security-sensitive surfaces include administrative endpoints, file traversal paths, reverse proxy upstreams, and authentication providers, all of which must fail closed when validation checks fail.

## Essential implementation rules

1. **Restrict Administrative API Access and Enforce Origin Checks**

Bind administrative endpoints strictly to loopback addresses or secure Unix domain sockets with explicit octal mode bits. Set `enforce_origin: true` and specify explicit allowed origins to prevent unauthorized configuration modifications and cross-site requests.

2. **Configure Trusted Upstream Proxies and Network Boundaries**

Explicitly define trusted proxy CIDRs using `trusted_proxies` and restrict `proxy_protocol` listener sources to prevent IP spoofing and malicious header injection. Always validate client identities and enforce strict right-to-left header evaluation.

3. **Use Constant-Time Comparisons and Argon2id for Passwords**

Hash user credentials using the Argon2id algorithm with cryptographically secure salts. Ensure credential verifiers execute constant-time comparisons and invoke fake hash operations for non-existent accounts to mitigate timing side-channel attacks.

4. **Enforce Strict Client Authentication and PKI Validation**

Configure mutual TLS enforcement modes to `require_and_verify` and ensure custom client certificate verifiers explicitly return errors upon validation failure. Validate key pair consistency and supply complete intermediate certificate trust chains.

5. **Sanitize File Paths and Restrict Document Roots**

Map untrusted HTTP request paths to local filesystem destinations using `caddyhttp.SanitizedPathJoin` rather than standard library path join functions. Ensure document roots and script paths remain isolated within intended base directories to prevent traversal attacks.

6. **Normalize Request Paths and Validate FastCGI Split Paths**

Write path matchers using unescaped characters to rely on automatic path cleaning and normalization. Specify pure ASCII substrings for FastCGI `split_path` configurations to prevent Unicode equivalence and case folding misidentifications.

7. **Enforce Strict Protocol Versioning and Proxy Transport Controls**

Restrict minimum TLS protocol versions to `tls1.2` or `tls1.3` and configure reverse proxy transport layers to send PROXY protocol headers only to trusted upstream servers. Restrict non-idempotent HTTP methods on early data requests by responding with status code `425`.

8. **Encode Untrusted URI Components and Render Template Inputs Safely**

Use URL-escaped placeholders such as `http.request.uri_escaped` when constructing dynamic configurations, headers, or redirects. Apply `stripHTML` or contextual escaping functions to untrusted input rendered within template responses.

9. **Enforce Memory, Buffer, and Timeout Limits on HTTP Services**

Configure positive byte bounds on request and response buffers in reverse proxy configurations, limit file browsing entry counts via `file_limit`, and set explicit read, header, and idle timeouts to prevent resource exhaustion and slowloris attacks.

10. **Define Absolute Runtime Environment Variables for Storage**

Explicitly set `HOME`, `USERPROFILE`, and `XDG_*` environment variables in systemd service or container manifests to prevent Caddy from storing sensitive cryptographic assets and state in working directory relative paths.

11. **Load Secrets Dynamically and Redact Sensitive Log Fields**

Supply sensitive keys, API tokens, and credentials dynamically using environment variable placeholders instead of hardcoding values in configuration files. Configure explicit log filters to automatically redact sensitive query parameters and cookie headers.

12. **Enforce Explicit Directive Execution Order via Route Blocks**

Wrap dependent directives in an explicit `route` block to override default pipeline sorting when security controls like authentication or header validation must execute before request rewrites or proxy forwarding.
