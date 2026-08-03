# Security blueprint

Repository: `https://github.com/quarkusio/quarkus#3.38.0`

## Security posture

Quarkus applications enforce security across reactive boundaries, CDI dependency injection scopes, and enterprise authentication channels. The framework protects HTTP routes, REST endpoints, and messaging pipelines by default, while requiring explicit configuration for authorization, CORS, secrets, and native reflections. Developers must ensure that all security mechanisms fail closed and that sensitive endpoints, management interfaces, and telemetry exposures are strictly isolated.

## Essential implementation rules

1. **Configure Least-Privilege Kubernetes RBAC and Namespace Scoping**

Specify exact resource names, API groups, and targeted verbs in application properties for Kubernetes roles and prefer namespace-scoped roles over cluster-wide privileges.

2. **Enforce Strict CORS and Avoid Wildcard Origins**

Enable CORS filters using `quarkus.http.cors.enabled=true`, define explicit trusted origins via `quarkus.http.cors.origins`, and avoid mixing programmatic builders with property configurations.

3. **Protect Jakarta REST Endpoints with Declarative Security Annotations**

Secure endpoints using `@RolesAllowed`, `@Authenticated`, or `@PermissionsAllowed`, and enable default denial of unannotated routes via `quarkus.security.jaxrs.deny-unannotated-endpoints=true`.

4. **Manage CDI Dependency Injection Scopes and Lifecycles Securely**

Qualify persistence units explicitly using `@PersistenceUnit`, access normal-scoped bean state via getters and setters, and ensure dependent Arc bean instance handles are properly closed.

5. **Verify OIDC and JWT Tokens, Signatures, and Certificate Chains**

Validate token signatures, algorithms, exact issuer strings, and audience properties explicitly while enabling access token certificate binding in mTLS environments.

6. **Prevent Observability Data and Telemetry Exposure**

Restrict access to in-memory trace data export endpoints, keep OpenTelemetry user principal attribute export disabled by default, and disable logging exporters in production environments.

7. **Enforce Extension Catalog and Configuration Integrity**

Declare explicit BOM origins, exact artifact coordinates, and platform capabilities in extension catalogs while separating static build-time configurations from runtime overrides.

8. **Hash Passwords Securely and Configure Cryptographic Keys**

Pass plain-text passwords through `BcryptUtil.bcryptHash()` prior to database persistence and generate cryptographically sound keys with sufficient sizes using `KeyUtils`.

9. **Configure CSRF Prevention and Token Verification for Web Forms**

Set `quarkus.rest-csrf.token-signature-key` with a secure secret of at least 32 characters and embed hidden CSRF token input fields inside Qute HTML templates.

10. **Use Type-Safe Deserializers and Strict JSON Configurations**

Configure structured type-safe deserializers like `ObjectMapperDeserializer` for messaging channels and enable strict JSON parsing by setting `quarkus.jackson.fail-on-unknown-properties=true`.

11. **Isolate and Secure Management and Health Endpoints**

Place management endpoints on a dedicated internal network interface and port using `quarkus.management.enabled=true`, enforce HTTP basic auth, and enable TLS encryption.

12. **Configure Reflection and Native Initialization for GraalVM Images**

Register reflectively accessed classes explicitly using `@RegisterForReflection`, defer random number generator initialization to runtime, and avoid side effects during static initialization.

13. **Load Sensitive Credentials Securely Using External Stores**

Inject sensitive database passwords and client secrets dynamically using Quarkus CredentialsProvider or environment variables rather than embedding plain text credentials in configuration files.

14. **Set Secure and HttpOnly Attributes on Session Cookies**

Ensure form-based authentication and OIDC session cookies are protected by enabling HttpOnly and secure attributes to prevent client-side script access and unencrypted transmission.
