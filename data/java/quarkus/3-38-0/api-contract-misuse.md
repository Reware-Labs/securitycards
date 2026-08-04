# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: api contract misuse

## api contract misuse

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
