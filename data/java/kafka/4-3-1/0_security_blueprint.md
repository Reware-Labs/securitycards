# Security blueprint

Repository: `https://github.com/apache/kafka#4.3.1`

## Security posture

Developers working with Apache Kafka must assume a zero-trust model where network channels, administrative endpoints, and message payloads are untrusted by default. The framework provides robust mechanisms for mutual TLS, SASL authentication, granular ACLs, and encryption, but relies on explicit developer configuration to enforce fail-closed authorization and secure communication channels. Critical security-sensitive surfaces include broker listeners, credential providers, exception handlers, and multi-tenant topic boundaries, all of which must be strictly configured to prevent data leaks, unauthorized access, and resource exhaustion.

## Essential implementation rules

1. **Enforce Fail-Closed Granular Authorizers and Explicit ACLs**

Configure `authorizer.class.name` to `org.apache.kafka.metadata.authorizer.StandardAuthorizer` and ensure `allow.everyone.if.no.acl.found` is set to `false`. Construct explicit `AclBinding` instances with specific resource patterns and principal identifiers without using broad wildcards, and ensure applications fail closed on authorization initialization failures.

2. **Isolate Multi-Tenant Resources and Disable Automatic Topic Creation**

Disable automatic topic creation by setting `auto.create.topics.enable=false` and enforce prefixed resource patterns and disjoint naming boundaries to prevent cross-tenant data leakage across state stores and topics.

3. **Differentiate Retriable Errors from Fatal Security Exceptions**

Inspect exception types in retry loops and custom handlers to ensure transient network errors are retried while fatal security exceptions such as `AuthorizationException`, `AuthenticationException`, and `ProducerFencedException` fail fast without triggering endless retry storms.

4. **Configure Secure Transport and SASL Authentication Credentials**

Explicitly define `security.protocol`, `sasl.mechanism`, and `sasl.jaas.config` since clients default to unauthenticated `PLAINTEXT`. Enforce mutual TLS on server endpoints using `ssl.client.auth=required` and prefix broker listener configurations securely.

5. **Validate OAuth2 Tokens and Enforce Strict AllowLists**

Specify expected audiences, issuers, and JWKS endpoints for OAuth token validation, verify expiration and time consistency strictly, and avoid unsecured login callback handlers. Enforce allowlists for OAuth token URLs and file paths.

6. **Route Unprocessable Records and Serialization Errors to Dead Letter Queues**

Implement `ProductionExceptionHandler` and custom deserialization handlers using `handleError` to direct failed, malformed, or unparseable records to dedicated dead letter queue topics while preserving diagnostic headers and origin context.

7. **Externalize Sensitive Credentials via ConfigProviders**

Never hardcode plaintext passwords, private keys, or client secrets in configuration files or source code. Use `ConfigProvider` indirection and `${provider:path:key}` placeholders to load secrets securely at runtime.

8. **Enforce Producer Acknowledgement Safety and Idempotence**

Configure producers with `acks=all` and check send results. When enabling idempotence or transactions, explicitly enforce `acks=all` and non-zero retries to guarantee delivery persistence and prevent record loss.

9. **Restrict Keytab File Permissions and Validate Security Configuration Sources**

Ensure Kerberos keytab files are readable solely by the OS process user running Kafka. Validate that `security.providers` configuration sources contain only trusted fully qualified class names before reflection loading.

10. **Protect Against Resource Exhaustion Using Quotas and Connection Limits**

Configure global client quotas using `Admin.alterClientQuotas` with `null` entity names, set request percentage and byte rate overrides, enforce strict payload and SASL frame size limits, and prune inactive socket connections using `connections.max.idle.ms`.
