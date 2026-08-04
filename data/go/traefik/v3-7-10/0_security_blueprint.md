# Security blueprint

Repository: `https://github.com/traefik/traefik#v3.7.10`

## Security posture

Traefik operates as a dynamic reverse proxy and load balancer where developers must explicitly configure security boundaries, protocol hardening, and authentication controls. The library handles routing, TLS termination, and traffic distribution by default, but it does not inherently prevent misconfigurations such as unrestricted source IPs, missing rate limits, or exposed administrative endpoints. Critical attack surfaces include entrypoints, middleware chains, credential stores, and dynamic configuration providers. All security controls, including rate limits, authentication verification, and fail-closed storage backends, must fail closed upon failure.

## Essential implementation rules

1. **Enforce Role-Based Access Control and Token Validation**

Configure claims expressions in OAuth2 and JWT middleware to verify authorized roles and scopes. Pass JWT tokens securely through standard `Authorization` header configurations rather than query parameters or form data.

2. **Restrict Network Exposure and Source IP Allowlists**

Implement explicit source IP CIDR ranges using `ipAllowList` middlewares or `ipAllowList` fields in `MiddlewareTCP` resources. Define separate `privateEntrypoints` and `publicEntrypoints` and explicitly set `entryPoints` on all HTTP routers and `IngressRoute` resources to prevent exposing internal services on public interfaces.

3. **Secure Credentials and Load Sensitive Secrets via URNs**

Store BasicAuth credentials using secure BCrypt hashes with properly escaped dollar signs in container labels, and use htdigest format for DigestAuth. Reference external secrets using `urn:k8s:secret:<secret-name>:<key>` syntax in middleware CRDs instead of embedding plaintext credentials in manifests, and avoid putting sensitive data in container labels or service tags.

4. **Enforce Strict Mutual TLS and Certificate Verification**

Set `clientAuth.clientAuthType` to `RequireAndVerifyClientCert` and specify trusted CAs using `caFiles` or Kubernetes secretNames. Keep `disableIssuerCheck` and `clientConfig.tls.insecureSkipVerify` disabled in production environments.

5. **Enforce Namespace and Cross-Provider Boundary Restrictions**

Explicitly scope provider discovery using namespace filtering flags and configure `crossProviderNamespaces` in static configuration to prevent unauthorized cross-namespace resource references. Set `allowExternalNameServices` to `false` to block routing to external CNAME records and prevent server-side request forgery.

6. **Secure Key-Value Store Backends and Configuration Sources**

Restrict write access to root key prefixes using KV backend ACLs and authenticated TLS connections. Ensure Traefik runs with read-only permissions on backend providers and exclude reserved symbols like `@` from router and service names in KV configuration keys.

7. **Configure Robust Cryptographic Key Types for ACME**

Explicitly set `keyType` to a strong algorithm option such as `EC256`, `EC384`, or `RSA4096` when configuring ACME certificate resolvers to ensure generated private keys have adequate cryptographic strength.

8. **Disable Snippet Annotations and Enforce Path Sanitization**

Keep `allowSnippetAnnotations` set to `false` in Ingress NGINX provider settings to prevent directive injection. Enable `sanitizePath: true` under HTTP entrypoints to neutralize relative directory traversal attempts, and keep encoded path flags set to false in `encodedCharacters` middleware unless strictly required.

9. **Enforce Protocol Upgrades, Header Validation, and Proxy Trust**

Configure automatic protocol upgrades from HTTP to HTTPS using entrypoint redirections or `redirectscheme` middleware. Set `underscoreHeadersStrategy` to `delete` or `reject` on entrypoints, enable `sniStrict: true` for TLS options, and explicitly define trusted client proxy sources using `forwardedHeaders.trustedIPs` while keeping `forwardedHeaders.insecure` disabled.

10. **Bound Retries, Timeouts, Request Bodies, and Rate Limits**

Configure finite limits for retry attempts, timeout durations, and `maxRequestBodyBytes` to prevent memory exhaustion and request amplification storms. Set explicit forwarding timeouts on server transports, enforce non-zero rate limits on rate-limiting middleware, and configure maximum request and response body size limits on buffering middlewares.

11. **Harden Container Runtime and Validate Plugin Trust Boundaries**

Run containers with `no-new-privileges:true` and connect to an authorized-docker-api-proxy. Enforce strict least-privilege filesystem boundaries for WASM plugins with `:ro` mount suffixes, specify fully qualified module names and explicit versions, keep `useUnsafe` set to `false` for Go plugins, and enforce hash verification when installing external plugins.

12. **Redact Sensitive Log Data and Secure Session Cookies**

Configure header and query parameter filtering in access logs to drop or redact sensitive authorization details, and set `removeHeader: true` on authentication middlewares to prevent forwarding `Authorization` headers to backends. Explicitly set `secure: true` and `httpOnly: true` flags on session and sticky session cookies.

13. **Enforce Fail-Closed Behavior and Correct Control Ordering**

Maintain `denyOnError: true` on distributed rate-limiting middleware so requests fail closed when storage backends are unreachable. Attach security-critical middlewares to routers or services in their correct execution order, and maintain at most one TLSOption resource named `default` to prevent fallback degradation.
