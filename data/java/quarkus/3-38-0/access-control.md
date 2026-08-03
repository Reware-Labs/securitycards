# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: access control

## access control

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
