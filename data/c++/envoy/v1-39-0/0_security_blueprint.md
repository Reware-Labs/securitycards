# Security blueprint

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`

## Security posture

The Envoy security model relies on strict validation, zero-trust network boundaries, strongly-typed configuration encapsulation, and fail-closed security filtering to protect downstream clients and upstream services. Developers must assume all external inputs, dynamic extensions, and administrative interfaces are untrusted and enforce rigorous canonicalization, access controls, and explicit cryptographic verification. State-mutating administrative operations, authorization bypasses, and protocol parsing misconfigurations must explicitly fail closed.

## Essential implementation rules

1. **Enforce Strict CORS, RBAC, and Administrative Access Controls**

Use strict string matchers for allowed origins with `filter_enabled` active at 100% in production. Configure HTTP RBAC filters using `HttpAttributesCelMatchInput` and ensure admin listeners are bound strictly to local loopback addresses (`127.0.0.1` or `::1`) or protected Unix sockets with path normalization enabled.

2. **Secure Administrative State-Modifying Handlers and Endpoints**

Explicitly set `mutates_server_state = true` and enforce HTTP POST semantics for custom administrative handlers or endpoints that alter server state. Populate target path matchers via `AdminImpl::addAllowlistedPath` and invoke `shutdownAdmin()` early during server termination.

3. **Validate OAuth2 Authentication, Secrets, and Header Options**

Prevent conflicting header flags by selecting only one Authorization header handling option per OAuth2 configuration. Provide valid token secrets when `auth_type` is not `TLS_CLIENT_AUTH`, enforce positive assertion lifetimes for `PRIVATE_KEY_JWT`, and use AES-256-GCM token encryption (`oauth2_use_gcm_encryption`).

4. **Ensure JWT Audience, Issuer, and Extraction Security**

Explicitly configure allowed `audiences` and `issuer` fields in every `JwtProvider` configuration to prevent confused deputy attacks. Declare explicit extraction locations such as `from_headers` to disable insecure query parameter extraction.

5. **Enforce Upstream and Downstream TLS, SAN, and Certificate Validation**

Configure `match_typed_subject_alt_names` alongside trusted CAs in `CertificateValidationContext` and `UpstreamTlsContext` to prevent man-in-the-middle attacks. Ensure certificate fingerprint formats adhere strictly to 64-character hex strings for hashes and base64 digests for SPKI.

6. **Isolate Redis Transactions and Apply Connection Pool Authentication**

Isolate dedicated Redis transaction clients, bind transaction keys to hash slots, and explicitly call `Transaction::close()` upon completion. Pass authentication credentials during connection pool instantiation and ensure transaction states route exclusively to primary cluster nodes.

7. **Verify Signatures, Cryptographic Status, and Dynamic Module Integrity**

Always evaluate `result.ok()` from `verifySignature()` before trusting signed data payloads. Load dynamic modules and certificate validator shared libraries exclusively from trusted local filesystem paths (`module.local.filename`), ensuring full ABI compatibility.

8. **Validate Protobuf Deserialization and Percent-Encode AWS STS Parameters**

Use `TestUtility::validate` with `recurse_into_any = true` to enforce strict message integrity during protobuf deserialization, catching `ProtoValidationException` and `EnvoyException`. Percent-encode all parameters using `Envoy::Http::Utility::PercentEncoding::encode` when constructing AWS STS AssumeRole query strings.

9. **Sanitize HTTP Request Paths, Parameters, and Preserve Pseudo-Headers**

Enable `ignore_path_parameters_in_path_matching` and `strip_fragment_from_path` to prevent path-based security bypasses and URI fragment pollution. Custom HTTP filters running prior to the router must preserve mandatory HTTP pseudo-headers such as `:method`.

10. **Harden Protocol Options, Header Rewrites, and Kafka Filtering**

Set `headers_with_underscores_action` to `REJECT_REQUEST` in header validators to prevent header spoofing. When rewriting or mutating headers, use `set(key, value)` or configure `append: false` to prevent duplicate header injection. Restrict Kafka downstream clients using explicit `api_keys_allowed` rules.

11. **Secure Client IP Trust, Forwarded Headers, and Mitigate SSRF**

Evaluate downstream source IPs using `envoy.matching.inputs.source_ip` rather than unvalidated HTTP headers. Sanitize incoming client certificate headers via `SANITIZE` or `SANITIZE_SET`, and enforce resolved address filtering (`resolved_address_filter`) in dynamic forward proxy caches to block outbound traffic to private IPs and metadata endpoints.

12. **Prevent Resource Exhaustion with Bounded Retries and Buffer Limits**

Define absolute global request timeouts, per-try timeouts, and bounded `num_retries` with retry budget tracking. Set explicit `request_body_buffer_limit` on virtual hosts and `per_connection_buffer_limit_bytes` on listeners to prevent memory exhaustion.

13. **Harden Runtime Environments and Automate Secret Discovery Service Rotation**

Build Envoy using default BoringSSL or FIPS-compliant BoringSSL/AWS-LC rather than OpenSSL. Run containers with a read-only root filesystem (`readOnlyRootFilesystem: true`) and non-root users. Configure dynamic TLS contexts and tokens using Secret Discovery Service (SDS) and watched directories with atomic renames.

14. **Enforce Fail-Closed Security Control Integrity**

Configure `deny_at_disable` with a default value of `true` on external authorization filters (`ext_authz`) to ensure requests fail closed when disabled. Ensure extension factory creation methods validate configurations and abort initialization via `EnvoyException` on failure.
