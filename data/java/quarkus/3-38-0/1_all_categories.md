# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`

## Category: access control

### Configure Explicit Least-Privilege Kubernetes RBAC and Namespace Scoping

**Use when**

Configuring Kubernetes RBAC permissions and role bindings using Quarkus deployment properties for application workloads.

**Secure rules**

**Rule 1: Declare explicitly bounded policy rules with minimal required API groups, resources, and verbs in application properties**

Avoid granting administrative or wildcard permissions in Role and ClusterRole definitions. Specify exact resource names and targeted verbs to prevent excessive privileges if the application container is compromised.

```properties
quarkus.kubernetes.rbac.roles.pod-reader.policy-rules.0.api-groups=
quarkus.kubernetes.rbac.roles.pod-reader.policy-rules.0.resources=pods,configmaps
quarkus.kubernetes.rbac.roles.pod-reader.policy-rules.0.verbs=get,list,watch
```

**Rule 2: Prefer namespace-scoped Roles and RoleBindings over ClusterRoles and ClusterRoleBindings**

Limit workload permissions to their own deployment namespace when global cluster access is not required, thereby reducing the blast radius and preventing cross-namespace resource access.

```properties
quarkus.kubernetes.rbac.roles.app-role.namespace=my-namespace
quarkus.kubernetes.rbac.roles.app-role.policy-rules.0.resources=configmaps
quarkus.kubernetes.rbac.roles.app-role.policy-rules.0.verbs=get
```


### Configure Strict CORS Origins, Methods, and Credentials in Quarkus

**Use when**

Developing or configuring cross-origin resource sharing (CORS) rules in Quarkus applications via application properties, programmatic builders, or CDI observers.

**Secure rules**

**Rule 1: Explicitly define allowed CORS origins and avoid wildcard configurations in production environments.**

Enable the CORS filter using `quarkus.http.cors.enabled=true` and specify trusted origins via `quarkus.http.cors.origins`. Avoid using wildcard origins (`*`) in production unless the API is entirely read-only with no side effects or credential handling.

```properties
quarkus.http.cors.enabled=true
quarkus.http.cors.origins=https://example.com,https://app.mydomain.com
quarkus.http.cors.methods=GET,PUT,POST
quarkus.http.cors.headers=X-Custom
quarkus.http.cors.access-control-allow-credentials=true
```

**Rule 2: Enclose pattern-based CORS origin regular expressions in forward slashes and anchor boundaries**

When configuring pattern-based allowed origins, enclose regex strings inside forward slashes (`/.../`) and ensure boundaries are strictly anchored to prevent unintended domain suffix matching. Escape literal special characters properly.

```java
List<Pattern> regexList = CORSFilter.parseAllowedOriginsRegex(
    Optional.of(List.of("/^https://([a-z0-9\\-_]+)\\.app\\.mydomain\\.com$/"))
);
boolean isAllowed = CORSFilter.isOriginAllowedByRegex(regexList, "https://abc-123.app.mydomain.com");
```

**Rule 3: Avoid mixing programmatic and property-based CORS configurations**

If CORS options are configured in `application.properties`, calling `HttpSecurity.cors(...)` programmatically throws an `IllegalStateException`. Choose a single configuration method and use the CORS builder to specify required options explicitly.

```java
import io.quarkus.vertx.http.security.CORS;
import io.quarkus.vertx.http.security.HttpSecurity;
import java.util.Set;

public void configureCors(@jakarta.enterprise.event.Observes HttpSecurity httpSecurity) {
    httpSecurity.cors(CORS.origins(Set.of("https://app.example.com", "https://admin.example.com")).build());
}
```


### Restrict REST Endpoints and Web Resources Using Declarative Security Annotations

**Use when**

Enforcing access control, authentication, and role checks on JAX-RS endpoints, controllers, and web application paths.

**Secure rules**

**Rule 1: Protect Jakarta REST endpoints using standard authorization annotations such as `@RolesAllowed`, `@Authenticated`, or `@PermitAll` to restrict access to authorized callers.**

Annotate secure methods explicitly with required roles using `@RolesAllowed`, or require general authentication using `@Authenticated`. To prevent accidental exposure of unannotated resources, configure `quarkus.security.jaxrs.deny-unannotated-endpoints=true` in `application.properties` to apply `@DenyAll` access control defaults to all Jakarta REST endpoints lacking explicit security annotations.

```java
@GET
@Path("roles-allowed")
@RolesAllowed({ "User", "Admin" })
@Produces(MediaType.TEXT_PLAIN)
public String helloRolesAllowed(@Context SecurityContext ctx) {
    return "hello " + jwt.getName();
}
```

**Rule 2: Enforce HTTP path permissions and security policies to secure web application routes and virtual paths.**

Configure explicit HTTP auth permission paths and policies in `application.properties` such as `quarkus.http.auth.permission.authenticated.paths` to ensure protected paths enforce the `authenticated` policy and prevent unauthenticated access to virtual paths.

```properties
quarkus.http.auth.permission.authenticated.paths=/logout
quarkus.http.auth.permission.authenticated.policy=authenticated
```

**Rule 3: Enforce fine-grained method-level permissions using `@PermissionsAllowed` and custom permission checkers.**

Annotate service methods and CDI beans with `@PermissionsAllowed` to enforce granular checks. Ensure custom permission checker methods are non-private, non-static CDI methods returning `boolean` or `Uni<Boolean>`, annotated with `@PermissionChecker`.

```java
@ApplicationScoped
public class OrderService {

    @PermissionsAllowed("order:create")
    public Uni<Void> createOrder() {
        return Uni.createFrom().nullItem();
    }
}
```


## Category: api contract misuse

### Configure valid OpenAPI filter execution stages and document names

**Use when**

When registering custom OpenAPI filters to sanitize or adjust API schemas using Quarkus smallrye-openapi.

**Secure rules**

**Rule 1: Declare valid execution stages and matching document names when using @OpenApiFilter.**

Ensure that custom OpenAPI filters configure explicit non-empty execution stages and valid document names. Mismatched document names or empty stages will trigger build-time errors and cause custom security filters to be skipped.

```java
@OpenApiFilter(
    stages = {OpenApiFilter.RunStage.BUILD},
    documentNames = {OpenApiFilter.DEFAULT_DOCUMENT_NAME}
)
public class CustomSecurityOpenApiFilter implements OASFilter {
    // Custom OASFilter implementation to adjust security schema
}
```


### Manage CDI Dependency Injection Scopes and Lifecycles Securely in Quarkus

**Use when**

Developing Quarkus applications using CDI dependency injection where normal-scoped beans, request contexts, programmatic lookups, and persistence units are configured.

**Secure rules**

**Rule 1: Ensure request contexts are active and restrict policy execution to Jakarta REST endpoints when injecting request-scoped beans into security policies.**

Standard HTTP authorization runs before Quarkus prepares certain request-scoped beans. To prevent context resolution failures, restrict policy execution to Jakarta REST endpoints by configuring applies-to=jaxrs in application properties or by using the AuthorizationPolicy annotation.

```properties
quarkus.http.auth.permission.custom1.paths=/custom/*
quarkus.http.auth.permission.custom1.policy=custom
quarkus.http.auth.permission.custom1.applies-to=jaxrs
```

**Rule 2: Qualify injected persistence units correctly using the Quarkus PersistenceUnit annotation.**

When injecting JPA or Hibernate components for named persistence units, always qualify the injection site with the Quarkus `PersistenceUnit` annotation instead of the standard Jakarta Persistence annotation to prevent cross-database data leakage.

```java
@ApplicationScoped
public class UserService {
    @Inject
    @PersistenceUnit("users")
    EntityManager entityManager;

    @Transactional
    public void createUser(User user) {
        entityManager.persist(user);
    }
}
```

**Rule 3: Access normal-scoped CDI bean state exclusively through public getter and setter methods.**

Do not read or write fields directly on normal-scoped CDI beans injected via client proxies. Direct field access interacts with the uninitialized proxy shell instead of the contextual instance, which can lead to state corruption or multi-tenant scope bleed.

```java
@ApplicationScoped
public class UserSession {
    private String tenantId;

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }
}

@ApplicationScoped
public class Service {
    @Inject
    UserSession userSession;

    public void process() {
        String id = userSession.getTenantId();
    }
}
```

**Rule 4: Define normal-scoped beans as proxyable types with non-final classes and default constructors.**

Normal-scoped beans require client proxies to enforce contextual lifecycles. Ensure bean classes are non-final and include accessible default constructors so client proxies can be correctly synthesized.

```java
@ApplicationScoped
public class IdentityResolver {
    public IdentityResolver() {
    }

    public String resolveUserToken(String user) {
        return "";
    }
}
```

**Rule 5: Release programmatically obtained dependent bean instance handles properly.**

When programmatically looking up dependency instances from ArcContainer, ensure returned instance handles are properly destroyed or closed after use to prevent memory leaks and gradual resource exhaustion.

```java
try (InstanceHandle<MyDependentService> handle = Arc.container().instance(MyDependentService.class)) {
    if (handle.isAvailable()) {
        MyDependentService service = handle.get();
        service.execute();
    }
}
```

**Rule 6: Use the Identifier qualifier instead of Named to prevent CDI dependency injection ambiguity.**

When using string-based qualifiers for dependency injection, prefer the SmallRye identifier qualifier over the standard named annotation to prevent beans from automatically receiving the default qualifier and causing deployment ambiguity.

```java
@ApplicationScoped
public class ServiceProducers {
    @Produces
    @Identifier("customService")
    MyService produceCustomService() {
        return new CustomServiceImpl();
    }
}

@ApplicationScoped
public class Consumer {
    @Inject
    @Identifier("customService")
    MyService service;
}
```


## Category: authentication

### Configure Multifactor Verification and Certificate Binding for Identity Assurance

**Use when**

Implementing WebAuthn multi-factor authentication or binding access tokens to client certificates in mTLS environments.

**Secure rules**

**Rule 1: Require user verification and user presence for WebAuthn authenticators.**

Ensure `userVerification` remains set to `required` and `userPresenceRequired` is set to `true` when configuring WebAuthn authentication mechanisms to maintain proper multifactor verification standards.

```properties
quarkus.webauthn.user-verification=required
quarkus.webauthn.user-presence-required=true
```

**Rule 2: Enable access token certificate binding in mTLS environments.**

Set `quarkus.oidc.token.binding.certificate=true` so `OidcIdentityProvider` verifies that the confirmation claim in the access token matches the client X.509 certificate thumbprint from the TLS session.

```properties
quarkus.oidc.token.binding.certificate=true
quarkus.http.ssl.client-auth=required
```


### Configure OIDC and JWT Token Signature, Issuer, and Audience Verification

**Use when**

Configuring OpenID Connect and SmallRye JWT authentication to validate bearer tokens and session tokens securely.

**Secure rules**

**Rule 1: Validate token signatures, algorithms, issuers, and audiences explicitly before accepting identity**

Ensure that `mp.jwt.verify.issuer` is set to the exact expected issuer string and `mp.jwt.verify.publickey.location` points to the valid public key PEM file. Configure exact expected issuer and audience properties instead of using wildcards like `any` to prevent accepting tokens from untrusted issuers or other applications.

```properties
mp.jwt.verify.publickey.location=publicKey.pem
mp.jwt.verify.issuer=https://example.com/issuer
mp.jwt.verify.audiences=my-service-client-id
quarkus.oidc.token.issuer=https://auth.example.com/realms/main
quarkus.oidc.token.audience=my-service-client-id
```

**Rule 2: Configure remote token introspection for opaque bearer tokens lacking digital signatures.**

When processing opaque tokens, define `quarkus.oidc.introspection-path` or enable discovery via `quarkus.oidc.discovery-enabled=true` so that tokens are verified remotely.

```properties
quarkus.oidc.auth-server-url=https://auth.example.com/auth/realms/main
quarkus.oidc.discovery-enabled=false
quarkus.oidc.introspection-path=/protocol/openid-connect/token/introspect
```

**Rule 3: Verify JWT token certificate chains correctly**

Ensure X.509 certificate chains embedded in JWT `x5c` headers are ordered leaf-first, validate to a trusted root, and verify the token signature with the leaf certificate's public key. Trust the leaf certificate directly or configure its expected name.

```properties
quarkus.oidc.certificate-chain.trust-store-file=truststore.p12
quarkus.oidc.certificate-chain.trust-store-password=secret
quarkus.oidc.certificate-chain.leaf-certificate-name=www.example.com
```


### Verify Passwords and Configure Credential Verifiers for Authentication

**Use when**

Setting up password-based authentication and database or custom identity providers in Quarkus.

**Secure rules**

**Rule 1: Configure JDBC principal queries with explicit 1-based index mapping and secure password verification.**

Configure `elytron-security-jdbc` using a parameterized SQL statement with bcrypt password mapping and accurate 1-based column index mappings for user role attributes.

```properties
quarkus.security.jdbc.enabled=true
quarkus.security.jdbc.principal-query.sql=SELECT u.password, u.role FROM test_user u WHERE u.username=?
quarkus.security.jdbc.principal-query.bcrypt-password-mapper.enabled=true
quarkus.security.jdbc.principal-query.bcrypt-password-mapper.password-index=1
quarkus.security.jdbc.principal-query.attribute-mappings.0.index=2
quarkus.security.jdbc.principal-query.attribute-mappings.0.to=groups
```

**Rule 2: Delegate authentication logic to `IdentityProviderManager` in custom authentication mechanisms.**

When creating a custom `HttpAuthenticationMechanism`, delegate authentication to `IdentityProviderManager` rather than validating credentials inline to ensure consistent identity handling across mechanisms.

```java
@Alternative
@Priority(1)
@ApplicationScoped
public class CustomAuthMechanism implements HttpAuthenticationMechanism {
    @Inject
    JWTAuthMechanism delegate;

    @Override
    public Uni<SecurityIdentity> authenticate(RoutingContext context, IdentityProviderManager identityProviderManager) {
        return delegate.authenticate(context, identityProviderManager);
    }
}
```


## Category: boundary control

### Prevent Observability Data Exposure in Traces and Telemetry Endpoints

**Use when**

Configuring OpenTelemetry tracing, span attributes, exporters, and telemetry endpoints in Quarkus applications.

**Secure rules**

**Rule 1: Restrict access to in-memory trace data export endpoints and isolate test span exporters.**

Do not expose in-memory trace data collected by `InMemorySpanExporter` through public REST endpoints in non-test builds. Isolate test exporter components within test source directories (`src/test/java`) or enforce authentication and authorization such as `@RolesAllowed` on telemetry endpoints.

```java
@GET
@Path("/export")
@RolesAllowed("admin")
public List<SpanData> exportTraces() {
    return inMemorySpanExporter.getFinishedSpanItems()
            .stream()
            .filter(sd -> !sd.getName().contains("export"))
            .collect(Collectors.toList());
}
```

**Rule 2: Disable OpenTelemetry End User attributes to prevent exposing PII in trace spans.**

Keep `quarkus.otel.traces.eusp.enabled` disabled by default unless telemetry storage meets compliance requirements, to prevent leaking `SecurityIdentity` user principal and role details as span attributes.

```properties
# Keep disabled to prevent PII exposure in trace spans
quarkus.otel.traces.eusp.enabled=false
quarkus.http.auth.proactive=true
```

**Rule 3: Disable OpenTelemetry logging exporters in production environments.**

Do not configure OpenTelemetry logging exporters like `quarkus.otel.traces.exporter=logging` or `quarkus.otel.metrics.exporter=logging` in production deployments to prevent writing raw trace spans and metrics to standard console logs where unencrypted log aggregators might capture them. Limit logging exporters strictly to development profiles.

```properties
%dev.quarkus.otel.traces.exporter=logging
%dev.quarkus.otel.metrics.exporter=logging
```

**Rule 4: Disable instrumentation for sensitive data pathways in OpenTelemetry**

Selectively disable OpenTelemetry instrumentation for sensitive subsystems such as SQL and Redis clients when SQL statement text or database operation metadata must not be recorded in trace spans.

```properties
# Disable SQL Client and Redis database operation telemetry
quarkus.otel.instrument.vertx-sql-client=false
quarkus.otel.instrument.vertx-redis-client=false

# Disable the OpenTelemetry SDK entirely if telemetry collection is prohibited
quarkus.otel.sdk.disabled=true
```


### Validate Redirect Back Locations Against Request Scheme and Authority

**Use when**

Handling form authentication redirects where user-controlled return locations must be verified at the server boundary before transitioning state.

**Secure rules**

**Rule 1: Verify that redirect-back locations strictly match the request scheme and authority to prevent open redirect vulnerabilities**

Do not override verifyRedirectBackLocation with relaxed domain checks. When running behind reverse proxies, enable proxy forwarding only with quarkus.http.proxy.trusted-proxies limited to those proxies so untrusted forwarding headers cannot control the validated scheme and authority.

```properties
quarkus.http.proxy.proxy-address-forwarding=true
quarkus.http.proxy.trusted-proxies=127.0.0.1
```


## Category: configuration source integrity

### Avoid mixing programmatic and property security configurations

**Use when**

Configuring security controls in Quarkus using both configuration files and programmatic builders simultaneously.

**Secure rules**

**Rule 1: Choose a single primary mechanism for defining HTTP security configurations to prevent configuration overlap**

Avoid defining HTTP security controls such as CORS, form authentication, basic authentication, or mTLS simultaneously in `application.properties` and via the `HttpSecurity` programmatic builder. When using programmatic `HttpSecurity` customization, ensure related `application.properties` settings are omitted to prevent runtime exceptions or dropped configuration mappings.

```java
public void configureSecurity(@jakarta.enterprise.event.Observes HttpSecurity http) {
    http.path("/api/*")
        .methods("GET", "POST")
        .authenticated();
}
```


### Enforce Extension Catalog and BOM Integrity

**Use when**

Configuring Quarkus platform descriptors, extension catalogs, and dependencies to prevent untrusted artifact resolution during build time.

**Secure rules**

**Rule 1: Explicitly declare BOM origins, exact artifact coordinates, provided capabilities, and extension dependencies in Quarkus extension catalogs**

Ensure extension platform descriptors map explicit artifact coordinates and origin mappings to their platform BOMs so Quarkus tooling can identify extension origins and platform compatibility.

```json
{
  "id": "io.quarkus:quarkus-bom-quarkus-platform-descriptor:3.38.0:json:3.38.0",
  "platform": true,
  "bom": "io.quarkus:quarkus-bom::pom:3.38.0",
  "extensions": [
    {
      "name": "ArC",
      "artifact": "io.quarkus:quarkus-arc::jar:3.38.0",
      "origins": [ "io.quarkus:quarkus-bom-quarkus-platform-descriptor:3.38.0:json:3.38.0" ],
      "metadata": {
        "capabilities": { "provides": [ "io.quarkus.cdi" ] },
        "extension-dependencies": [ "io.quarkus:quarkus-core" ]
      }
    }
  ]
}
```


## Category: cryptography

### Hash user passwords securely before database persistence

**Use when**

You are implementing user registration or credential update workflows where passwords must be securely hashed prior to storage.

**Secure rules**

**Rule 1: Hash user passwords using BcryptUtil.bcryptHash before persisting credentials.**

Pass plain text passwords through `BcryptUtil.bcryptHash()` when adding or updating user records in persistent storage. Do not pre-hash passwords and never store plain text passwords in production.

```java
User user = new User();
user.username = username;
user.password = BcryptUtil.bcryptHash(password);
user.role = role;
user.persist();
```


### Use authenticated encryption and strong key generation for tokens

**Use when**

You are generating cryptographic secret keys or configuring token state encryption within Quarkus security features.

**Secure rules**

**Rule 1: Generate cryptographically sound secret keys with sufficient key sizes using KeyUtils.**

Ensure that symmetric secret keys match target algorithm requirements by utilizing `io.smallrye.jwt.util.KeyUtils` to produce correctly sized, cryptographically sound keys for signing and encryption.

```java
SecretKey signingKey = KeyUtils.generateSecretKey(SignatureAlgorithm.HS512);
SecretKey encryptionKey = KeyUtils.generateSecretKey(KeyEncryptionAlgorithm.A256KW);
String jwt = Jwt.claim("sensitiveClaim", getSensitiveClaim()).innerSign(signingKey).encrypt(encryptionKey);
```

**Rule 2: Maintain token state encryption with strong cryptographic algorithms.**

Keep token state encryption enabled and provide a secure encryption secret and algorithm when configuring token state management to prevent exposure of sensitive session tokens.

```java
var config = OidcTenantConfig.builder()
    .tenantId("encrypted-state-tenant")
    .tokenStateManager()
        .encryptionRequired(true)
        .encryptionSecret("secure-32-byte-long-secret-key-12345")
        .encryptionAlgorithm(OidcTenantConfig.TokenStateManager.EncryptionAlgorithm.A256GCMKW)
    .end()
    .build();
```


## Category: csrf

### Configure CSRF prevention and token verification in Quarkus REST

**Use when**

Building web forms or REST endpoints in Quarkus that handle state-changing browser requests using ambient credentials and require anti-CSRF token protection.

**Secure rules**

**Rule 1: Configure a strong token signature key for REST CSRF protection**

Add `quarkus.rest-csrf.token-signature-key` to your `application.properties` with a secure secret that is at least 32 characters long to generate and verify HMAC signatures for CSRF tokens.

```properties
quarkus.rest-csrf.token-signature-key=AyM1SysPpbyDfgZld3umj1qzKObwVMkoqQ-EstJQLr_T-1qS0gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr1Z9CAow
```

**Rule 2: Inject CSRF tokens into Qute templates and HTML forms**

Include the hidden CSRF token input field inside your Qute HTML templates so that the server filter can verify the submitted value against the CSRF cookie on state-changing requests.

```html
<form action="/service/csrfTokenForm" method="post">
    <input type="hidden" name="{inject:csrf.parameterName}" value="{inject:csrf.token}" />
    <p>Your Name: <input type="text" name="name" /></p>
    <p><input type="submit" name="submit"/></p>
</form>
```

**Rule 3: Restrict CSRF verification paths and content types safely**

Scope CSRF verification to specific form paths using `quarkus.rest-csrf.create-token-path` and set `quarkus.rest-csrf.require-form-url-encoded=false` if header-based token verification is required for non-form payloads.

```properties
# Limit CSRF verification to specific endpoint paths
quarkus.rest-csrf.create-token-path=/service/user

# Allow non-form content types on the token path when using header tokens
quarkus.rest-csrf.require-form-url-encoded=false
```


## Category: deserialization

### Use Type-Safe Deserializers and Strict Configurations for Untrusted Payloads

**Use when**

Deserializing untrusted incoming data streams such as Kafka records or JSON payloads in Quarkus applications.

**Secure rules**

**Rule 1: Use explicit type-safe deserializers and declare concrete payload types on messaging channels to prevent arbitrary object instantiation.**

When processing Kafka records or consuming messages from Kafka channels via `@Incoming`, configure structured type-safe deserializers like `ObjectMapperDeserializer` or `JsonbDeserializer` and declare concrete Java types on method parameters. Ensure underlying `ObjectMapper` instances do not enable unrestricted polymorphic default typing.

```java
@Incoming("orders-in")
public void processOrder(OrderDto order) {
    // Quarkus automatically configures ObjectMapperDeserializer for OrderDto
}
```

**Rule 2: Enforce strict JSON deserialization by rejecting unknown properties.**

Prevent unexpected input parameter injection during JSON deserialization by configuring `quarkus.jackson.fail-on-unknown-properties=true` in `application.properties` or annotating model classes with `@JsonIgnoreProperties(ignoreUnknown = false)`.

```properties
quarkus.jackson.fail-on-unknown-properties=true
```

**Rule 3: Apply all registered object mapper customizers when defining custom producers.**

When creating custom CDI producers for `ObjectMapper` or JSON-B components to override framework defaults, inject and iterate over all registered `ObjectMapperCustomizer` or `JsonbConfigCustomizer` beans to preserve security-relevant configurations.

```java
@Singleton
@Produces
ObjectMapper objectMapper(@All List<ObjectMapperCustomizer> customizers) {
    ObjectMapper mapper = new ObjectMapper();
    for (ObjectMapperCustomizer customizer : customizers) {
        customizer.customize(mapper);
    }
    return mapper;
}
```


## Category: file handling

### Configure Static File Paths to Prevent Directory Traversal

**Use when**

When configuring local filesystem static file paths and endpoints in Quarkus applications to serve web resources securely.

**Secure rules**

**Rule 1: Specify safe relative paths without directory traversal elements in application properties.**

Ensure that relative paths and endpoints do not contain directory traversal constructs like `..` or wildcards like `*`. Configure safe relative paths directly in `application.properties` using properties such as `quarkus.http.static-dir.path` and `quarkus.http.static-dir.endpoint` to prevent unauthorized access to sensitive files outside the intended web root.

```properties
quarkus.http.static-dir.path=static
quarkus.http.static-dir.endpoint=/
```


## Category: input driven boundary selection

### Safely Resolve OIDC Tenants Using Validated Routing Context

**Use when**

Implementing custom tenant resolution via `TenantResolver` or `TenantConfigResolver` in a Quarkus OIDC multi-tenancy application.

**Secure rules**

**Rule 1: Validate request paths and verify routing context attributes before assigning tenant configurations to prevent cross-tenant access vulnerabilities.**

Check the `RoutingContext` for an existing attribute such as `tenant-id` before parsing request paths. Explicitly validate request paths against known allowed patterns before assigning tenant identifiers to prevent attackers from redirecting operations into unauthorized trust domains.

```java
@ApplicationScoped
public class CustomTenantResolver implements TenantResolver {
    @Override
    public String resolve(RoutingContext context) {
        String tenantId = context.get("tenant-id");
        if (tenantId != null) {
            return tenantId;
        }
        String path = context.request().path();
        if (path.startsWith("/tenant-a/")) {
            return "tenant-a";
        }
        return null;
    }
}
```


## Category: interface protocol hardening

### Enforce Protocol Version Restriction and Transport Security for WebSockets

**Use when**

Configuring network transport schemes and protocol versions for WebSocket communication in production environments.

**Secure rules**

**Rule 1: Require TLS encryption using the `wss://` protocol scheme for WebSocket connections.**

Unencrypted `ws://` connections transmit frames over raw TCP in plain text, exposing handshake HTTP headers, authentication tokens, and message payloads to network eavesdropping and tampering. Ensure HTTP/TLS is properly configured for the application and require clients to initiate connections using the `wss://` protocol URL scheme.

```text
wss://example.com/chat/username
```


### Secure and Isolate Management and Health Endpoints

**Use when**

Configuring management, health checks, and metrics endpoints in Quarkus to prevent unauthorized exposure.

**Secure rules**

**Rule 1: Isolate management endpoints on a separate internal network interface.**

Configure a dedicated internal network host and port for management traffic using `quarkus.management.enabled=true`, `quarkus.management.host`, and `quarkus.management.port` properties to prevent exposing sensitive internal telemetry on public application interfaces.

```properties
quarkus.management.enabled=true
quarkus.management.host=127.0.0.1
quarkus.management.port=9002
```

**Rule 2: Enforce authentication and role-based access policies on management endpoints.**

Explicitly enable authentication on the management interface using `quarkus.management.auth.enabled=true` and define path-based permissions and role policies to restrict operational routes.

```properties
quarkus.management.enabled=true
quarkus.management.auth.enabled=true
quarkus.management.auth.basic=true
quarkus.management.auth.policy.management-policy.roles-allowed=management
quarkus.management.auth.permission.health.paths=/q/health/*
quarkus.management.auth.permission.health.policy=management-policy
```

**Rule 3: Enable TLS encryption on the dedicated management interface.**

Configure HTTPS on the management server using `quarkus.management.tls-configuration-name` to ensure management traffic and HTTP Basic Auth credentials are encrypted in transit.

```properties
quarkus.management.enabled=true
quarkus.management.host=localhost
quarkus.management.port=9002
quarkus.management.tls-configuration-name=management
```

**Rule 4: Validate Host headers and reverse proxy forwarding headers for management endpoints.**

Configure explicit host header validation via `quarkus.management.host-validation.allowed-hosts` and restrict forwarding headers using `quarkus.management.proxy.proxy-address-forwarding=true` to prevent host spoofing and header injection.

```properties
quarkus.management.enabled=true
quarkus.management.host-validation.allowed-hosts=management.example.com
quarkus.management.proxy.proxy-address-forwarding=true
quarkus.management.proxy.allow-x-forwarded=true
```


## Category: network boundary

### Enable TLS Certificate Validation and Hostname Verification for Outbound REST Clients

**Use when**

Configuring outbound REST client connections, OIDC integration, and Keycloak policy enforcer endpoints that communicate across network trust boundaries.

**Secure rules**

**Rule 1: Enforce strict TLS certificate validation and hostname verification for all outgoing REST client and authentication connections**

Ensure that `trust-all` is not set to true and hostname verification is not disabled in production configurations. Configure valid truststores and explicit TLS configurations to prevent interception and man-in-the-middle attacks.

```properties
quarkus.rest-client.extensions-api.tls-configuration-name=production-tls
quarkus.oidc.tls.verification=required
quarkus.oidc.tls.trust-store-file=certs/truststore.p12
quarkus.oidc.tls.trust-store-password=changeit
```


## Category: resource exhaustion

### Configure OIDC Token Caching to Prevent Authorization Server Resource Exhaustion

**Use when**

Configuring OIDC bearer token authentication in Quarkus applications to handle remote token introspection and UserInfo endpoint responses efficiently.

**Secure rules**

**Rule 1: Enable and configure the built-in token cache for remote OIDC endpoints to reduce repetitive synchronous HTTP calls and prevent authorization server denial of service.**

Define properties such as `quarkus.oidc.token-cache.max-size`, `quarkus.oidc.token-cache.time-to-live`, and `quarkus.oidc.token-cache.clean-up-timer-interval` in `application.properties` to bound cache size and lifecycle.

```properties
quarkus.oidc.token-cache.max-size=1000
quarkus.oidc.token-cache.time-to-live=3M
quarkus.oidc.token-cache.clean-up-timer-interval=1M
```


## Category: runtime environment hardening

### Configure Reflection and Native Initialization for Native Images

**Use when**

Developing or packaging Quarkus applications as GraalVM native images where dynamic reflection, native initialization, and proxy configurations are required.

**Secure rules**

**Rule 1: Explicitly register reflectively accessed classes, dynamic proxies, and third-party dependency hierarchies for native image compilation.**

Use `@RegisterForReflection` or `ReflectiveClassBuildItem` to ensure that classes requiring dynamic instantiation or field access are preserved during GraalVM closed-world dead-code elimination. Ensure dynamic proxy interfaces are declared using `@RegisterForProxy` to prevent runtime `UnsupportedFeatureError` exceptions.

```java
@RegisterForReflection(targets = { User.class, UserImpl.class })
public class MyReflectionConfiguration {
}
```

**Rule 2: Defer pseudo-random number generator initialization and stateful security managers to runtime**

Prevent static build-time caching of `SecureRandom` seed values or sensitive security contexts by explicitly configuring `--initialize-at-run-time` for PRNG-dependent classes and registering stateful managers using `RuntimeInitializedClassBuildItem`.

```properties
quarkus.native.additional-build-args=--initialize-at-run-time=com.example.CryptoService\\,sun.security.provider.NativePRNG
```

**Rule 3: Avoid performing side effects and runtime operations during static initialization.**

Restrict `@Record(STATIC_INIT)` build steps strictly to immutable build-time metadata setup, and defer port binding, thread creation, and runtime configuration access to `@Record(RUNTIME_INIT)` steps executed when the application launches.

```java
@BuildStep
@Record(ExecutionTime.RUNTIME_INIT)
void startRuntimeServices(ServiceRecorder recorder, RuntimeConfig config) {
    recorder.startServer(config.port());
}
```


### Disable Development Mode in Production Environments

**Use when**

Configuring deployment environments and packaging Quarkus applications for live production or staging usage.

**Secure rules**

**Rule 1: Run packaged Quarkus applications using standard production launch modes to prevent development-only exception message disclosure.**

Ensure application deployments run in production mode and do not enable development flags or interactive debugging features in live environments, preventing detailed authentication failure exceptions from exposing sensitive internal behavior.

```bash
java -jar target/quarkus-app/quarkus-run.jar
```


### Secure Container and Deployment Configuration in Quarkus

**Use when**

Configuring container runtimes, deployment manifests, build-time versus runtime configuration separation, and development utilities for Quarkus applications.

**Secure rules**

**Rule 1: Restrict custom Dev UI actions to local development and validate configuration targets**

When implementing Dev UI actions in a Quarkus extension, register mutating actions only for local development by using `@BuildStep(onlyIf = IsLocalDevelopment.class)`. Validate dynamically supplied configuration filenames against an explicit allowlist before resolving them within the resource directory.

```java
private static final Set<String> ALLOWED_CONFIG_FILES = Set.of(
        "application.properties",
        "application.yaml",
        "application.yml");

@BuildStep(onlyIf = IsLocalDevelopment.class)
void registerBuildTimeActions(
        BuildProducer<BuildTimeActionBuildItem> buildTimeActionProducer) {
    // Register local-development actions
}

private static Path getConfigPath(String target) throws IOException {
    Path fileName = Paths.get(target).getFileName();
    if (fileName == null || !ALLOWED_CONFIG_FILES.contains(fileName.toString())) {
        throw new IllegalArgumentException("Unsupported configuration file");
    }

    Path resourceDir = DevConsoleManager.getHotReplacementContext()
            .getResourcesDir().get(0);
    return resourceDir.resolve(fileName);
}
```

**Rule 2: Separate build-time configuration from container runtime overrides and enforce strict configuration binding.**

Ensure configuration properties that require container environment customization or dynamic runtime overrides are defined using `@ConfigRoot(phase = ConfigPhase.RUN_TIME)`. Reserve build-time phases strictly for static build optimizations. When defining deployment configuration models using Spring Boot `@ConfigurationProperties`, explicitly set `ignoreUnknownFields = false` to force Quarkus to validate that all supplied deployment configuration keys strictly match defined model fields.

```java
@ConfigurationProperties(prefix = "app.deployment", ignoreUnknownFields = false)
public class DeploymentConfig {
    private String trustedSubnet;
    private boolean enforceTls;

    public String getTrustedSubnet() { return trustedSubnet; }
    public void setTrustedSubnet(String trustedSubnet) { this.trustedSubnet = trustedSubnet; }
    public boolean isEnforceTls() { return enforceTls; }
    public void setEnforceTls(boolean enforceTls) { this.enforceTls = enforceTls; }
}
```

**Rule 3: Configure explicit security contexts, least-privilege service accounts, and secure secret mounting in generated Kubernetes manifests.**

Configure explicit security contexts, least-privilege service accounts, and resource boundaries via Quarkus Kubernetes deployment settings. Define `securityContext()`, `serviceAccount()`, and `resources()` to restrict container privileges and resource limits. Mount sensitive runtime application credentials via `appSecret` or `secretVolumes` rather than embedding them in plain environment variables or `appConfigMap`.

```properties
quarkus.kubernetes.security-context.run-as-non-root=true
quarkus.kubernetes.security-context.read-only-root-filesystem=true
quarkus.kubernetes.service-account=my-app-sa
quarkus.kubernetes.resources.limits.memory=512Mi
quarkus.kubernetes.app-secret=my-app-secret
```


## Category: secret handling

### Load and configure sensitive client and database credentials securely using external stores and environment variables

**Use when**

When configuring authentication client secrets, database passwords, SSL key store passwords, and third-party service credentials in Quarkus applications.

**Secure rules**

**Rule 1: Avoid hardcoding plaintext credentials and secrets in source code or configuration files.**

Use Quarkus CredentialsProvider, MicroProfile config properties, or environment variables to inject sensitive values dynamically rather than committing plain text secrets into `application.properties`.

```properties
quarkus.oidc.auth-server-url=http://localhost:8180/realms/quarkus/
quarkus.oidc.client-id=quarkus-app
quarkus.oidc.credentials.client-secret.provider.key=mysecret-key
quarkus.oidc.credentials.client-secret.provider.name=oidc-credentials-provider
```

**Rule 2: Explicitly configure encryption keys for session management, token state, and form authentication.**

Supply static and robust encryption keys using configuration properties like `quarkus.http.auth.session.encryption-key` or `quarkus.oidc.token-state-manager.encryption-secret` instead of relying on runtime auto-generated keys that break across cluster nodes and restarts.

```properties
quarkus.http.auth.session.encryption-key=${FORM_AUTH_ENCRYPTION_KEY}
quarkus.http.auth.form.enabled=true
```


## Category: security control integrity

### Configure Throttled Commit Strategy and Unprocessed Record Max Age for Kafka Streams

**Use when**

Configuring incoming Kafka messaging consumers in Quarkus to protect against resource exhaustion caused by unacknowledged records.

**Secure rules**

**Rule 1: Maintain a positive max age threshold for throttled offset commits to prevent unbounded memory accumulation.**

When using the `throttled` commit strategy in the Kafka connector, ensure `throttled.unprocessed-record-max-age.ms` remains set to a positive value such as `60000`. Never disable this health check by setting the value to less than or equal to zero, as unacknowledged poison pill records could otherwise stall offset commits indefinitely and lead to application resource exhaustion.

```properties
mp.messaging.incoming.prices.throttled.unprocessed-record-max-age.ms=60000
```


### Maintain Consistent State and Fail Closed When Access Tokens and Role Sources Depend on Preservation

**Use when**

Configuring OIDC tenant authorization and token state manager strategies where role validation or UserInfo lookups depend on retained access tokens.

**Secure rules**

**Rule 1: Ensure the token state manager strategy retains access tokens when token-based role sources or UserInfo requirements are enabled.**

When configuring OIDC tenant authorization with `quarkus.oidc.roles.source` set to `accesstoken` or `userinfo`, you must configure `quarkus.oidc.token-state-manager.strategy` to retain all tokens (such as `keep-all-tokens`). Discarding tokens prevents subsequent authorization checks and security control enforcement from functioning correctly.

```properties
quarkus.oidc.roles.source=accesstoken
quarkus.oidc.token-state-manager.strategy=keep-all-tokens
```


## Category: session management

### Configure Secure and HttpOnly Attributes for Session Cookies

**Use when**

Configuring session cookies and form authentication in Quarkus web applications to protect authentication state against cross-site scripting and unauthorized interception.

**Secure rules**

**Rule 1: Enable HttpOnly and Secure cookie attributes on form-based authentication and OIDC session configurations.**

Ensure that session cookies are protected by enabling HttpOnly and secure attributes to prevent client-side script access and unencrypted transmission.

```java
HttpAuthenticationMechanism formAuth = Form.builder()
    .httpOnlyCookie(true)
    .cookieSameSite(FormAuthConfig.CookieSameSite.STRICT)
    .timeout(Duration.ofMinutes(30))
    .cookieName("quarkus-credential")
    .build();
```


### Manage Server-Side and Local Session Invalidation on Logout

**Use when**

Implementing user logout workflows to ensure both server-side authentication state and local web session cookies are properly invalidated and destroyed.

**Secure rules**

**Rule 1: Invalidate server-side session state and clear local web session cookies during logout operations.**

Invoke the authentication mechanism logout method on the server side and redirect users through the appropriate logout endpoints to clear local session cookies.

```java
@Inject
SecurityIdentity identity;

@POST
@Path("/logout")
public Response logout() {
    if (identity.isAnonymous()) {
        throw new UnauthorizedException("Not authenticated");
    }
    FormAuthenticationMechanism.logout(identity);
    return Response.noContent().build();
}
```
