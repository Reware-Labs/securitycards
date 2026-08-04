# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`

## Category: access control

### Enforce strict tenant and role authorization checks in Spring web components

**Use when**

Developing or configuring interceptors, CORS rules, and HTTP requests requiring role-based access control or tenant isolation in Spring MVC and WebFlux applications.

**Secure rules**

**Rule 1: Configure explicit authorized roles and secure authorization handling in interceptors**

Explicitly set required roles using `setAuthorizedRoles` on `UserRoleAuthorizationInterceptor` to avoid defaulting to a denied state or over-permissive behavior. When extending the interceptor, override `handleNotAuthorized` to correctly signal authorization failures using HTTP error codes like `HttpServletResponse.SC_FORBIDDEN`.

```java
public class CustomRoleAuthorizationInterceptor extends UserRoleAuthorizationInterceptor {
    @Override
    protected void handleNotAuthorized(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws ServletException, IOException {
        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access denied: insufficient roles");
    }
}
```

**Rule 2: Restrict CORS origin patterns and configure explicit mappings for protected endpoints**

Avoid wildcard origins and empty `<mvc:cors/>` tags that expose endpoints globally. Use `setAllowedOriginPatterns` or explicit `allowed-origin-patterns` along with `setAllowCredentials(true)` to secure cross-origin resource sharing.

```java
CorsConfiguration config = new CorsConfiguration();
config.setAllowedOriginPatterns(List.of("https://*.example.com"));
config.setAllowCredentials(true);
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
```


### Isolate database connections and clean up thread-bound credentials and shards

**Use when**

Managing database connection adapters, multi-tenant schemas, or thread-local security identities in Spring JDBC components.

**Secure rules**

**Rule 1: Clear thread-bound database credentials in a finally block**

Always pair calls to `setCredentialsForCurrentThread` with a call to `removeCredentialsFromCurrentThread` inside a `finally` block when using `UserCredentialsDataSourceAdapter` to prevent cross-tenant data leakage across reused worker threads.

```java
UserCredentialsDataSourceAdapter adapter = new UserCredentialsDataSourceAdapter();
adapter.setTargetDataSource(targetDataSource);
try {
    adapter.setCredentialsForCurrentThread(username, password);
    try (Connection conn = adapter.getConnection()) {
        // Perform database operations under user credentials
    }
} finally {
    adapter.removeCredentialsFromCurrentThread();
}
```

**Rule 2: Safely map authenticated request context to database shards and schemas**

Derive sharding keys dynamically from authenticated security contexts using `ShardingKeyDataSourceAdapter`, throwing an exception if the context is unauthenticated. Additionally, enforce catalog and schema boundaries using `setCatalog` and `setSchema` on driver-based data sources.

```java
DriverManagerDataSource dataSource = new DriverManagerDataSource();
dataSource.setUrl("jdbc:postgresql://localhost:5432/appdb");
dataSource.setCatalog("appdb");
dataSource.setSchema("tenant_isolated_schema");
```


## Category: api contract misuse

### Validate Target Types and Pass Binding-Capable Errors When Invoking Spring Validators

**Use when**

When validating target objects, invoking validators programmatically, or handling complex nested property paths using Spring validation utilities.

**Secure rules**

**Rule 1: Verify target object support explicitly before invoking validation utilities.**

Check that the target object matches the target class supported by the validator using `validator.supports(target.getClass())` prior to invoking `ValidationUtils.invokeValidator` to prevent runtime `IllegalArgumentException` failures.

```java
if (validator.supports(target.getClass())) {
    ValidationUtils.invokeValidator(validator, target, errors, validationHints);
}
```

**Rule 2: Pass a binding-capable errors implementation when validating nested property paths.**

Avoid using `Validator.validateObject` for complex target objects with nested properties because its default `SimpleErrors` implementation does not support nested paths. Instead, pass a binding-capable `Errors` implementation such as `BeanPropertyBindingResult` to the `validate(Object, Errors)` method.

```java
BeanPropertyBindingResult errors = new BeanPropertyBindingResult(formObject, "formObject");
validator.validate(formObject, errors);
if (errors.hasErrors()) {
    throw new IllegalArgumentException("Validation failed for target: " + errors.getAllErrors());
}
```


## Category: authentication

### Clear thread-bound JMS user credentials after use

**Use when**

When supplying per-request dynamic credentials using UserCredentialsConnectionFactoryAdapter for JMS connections.

**Secure rules**

**Rule 1: Always invoke removeCredentialsFromCurrentThread in a try-finally block when using setCredentialsForCurrentThread**

Failing to clean up ThreadLocal state in thread-pooled environments causes credentials to leak across operations, allowing subsequent tasks on the same thread to execute with incorrect user identities. Always call `removeCredentialsFromCurrentThread()` inside a `finally` block following connection creation.

```java
UserCredentialsConnectionFactoryAdapter adapter = new UserCredentialsConnectionFactoryAdapter();
adapter.setTargetConnectionFactory(targetConnectionFactory);

adapter.setCredentialsForCurrentThread(username, password);
try {
    Connection conn = adapter.createConnection();
    // Perform JMS operations
} finally {
    adapter.removeCredentialsFromCurrentThread();
}
```


## Category: boundary control

### Validate Request Path Boundaries and Prefix Alignment

**Use when**

Configuring test request builders, mock servlets, and request boundaries where URI paths, context paths, and servlet paths are processed to ensure path-based security controls evaluate correct URI segments.

**Secure rules**

**Rule 1: Ensure explicit context paths and servlet paths strictly match the request URI prefix and follow standard formatting.**

When constructing test requests or request wrappers, format context paths and servlet paths with a leading slash and no trailing slash. Verify that configured paths align accurately with the full request URI so that path-based security matchers and authorization filters evaluate the intended request paths.

```java
MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.get("/travel/main/hotels/42")
        .contextPath("/travel")
        .servletPath("/main");
```


## Category: configuration source integrity

### Validate Required Configuration Properties During Application Startup

**Use when**

When configuring application environment properties and essential settings during application startup.

**Secure rules**

**Rule 1: Explicitly declare and validate required configuration properties using the property resolver during application startup.**

Use `PropertySourcesPropertyResolver` to define mandatory configuration keys with `setRequiredProperties(...)` and invoke `validateRequiredProperties()` during bootstrapping. This ensures that the application fails fast if expected settings or credentials are missing, preventing unexpected default behaviors or runtime misconfigurations.

```java
ConfigurablePropertyResolver resolver = new PropertySourcesPropertyResolver(propertySources);
resolver.setRequiredProperties("app.security.secret-key", "app.database.url");
resolver.validateRequiredProperties();
```


## Category: deserialization

### Explicitly Configure Message Converters to Restrict Deserialized Formats

**Use when**

When configuring HTTP message converters in Spring MVC to control allowed payload formats and prevent unintended deserialization.

**Secure rules**

**Rule 1: Explicitly declare and register allowed HTTP message converters instead of relying on automatic classpath detection.**

Disable default message converter registration by setting `register-defaults="false"` and explicitly specify safe converters such as `MappingJackson2HttpMessageConverter` to control allowed payload formats and object mappers.

```xml
<mvc:annotation-driven>
    <mvc:message-converters register-defaults="false">
        <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter"/>
    </mvc:message-converters>
</mvc:annotation-driven>
```


## Category: file handling

### Validate Normalized Paths Against Storage Root to Prevent Traversal

**Use when**

Handling user-supplied file paths and resolving them against a storage root directory.

**Secure rules**

**Rule 1: Always verify that normalized user-supplied paths stay strictly within the designated base storage root directory.**

Do not rely on `StringUtils.cleanPath()` as a standalone security sanitizer against path traversal attacks. While `cleanPath()` normalizes path separators and reduces relative dot-segments, it does not prevent normalized paths from escaping a base directory if they retain leading relative segments or reference absolute paths. Always validate that the resolved path starts with the base path.

```java
Path basePath = Paths.get("/app/storage").toAbsolutePath().normalize();
String cleaned = StringUtils.cleanPath(userInput);
Path resolvedPath = basePath.resolve(cleaned).toAbsolutePath().normalize();
if (!resolvedPath.startsWith(basePath)) {
    throw new SecurityException("Access denied for path outside base directory");
}
```

**Rule 2: Retain PathResourceResolver at the end of resource resolver chains to enforce path traversal safety.**

Always retain `PathResourceResolver` at the end of the `ResourceResolver` chain when configuring custom resource resolvers on `ResourceHttpRequestHandler`. Omitting `PathResourceResolver` disables default path safety checks and could allow path traversal attacks to expose arbitrary files on the filesystem or classpath.

```java
List<ResourceResolver> resolvers = new ArrayList<>();
resolvers.add(new VersionResourceResolver().addFixedVersionStrategy("1.0", "/**/*.js"));
resolvers.add(new PathResourceResolver()); // Ensure PathResourceResolver is added last

ResourceHttpRequestHandler handler = new ResourceHttpRequestHandler();
handler.setLocations(List.of(new ClassPathResource("static/")));
handler.setResourceResolvers(resolvers);
```


## Category: injection

### Prevent Expression Language Injection by Using Safe Contexts and Variable Binding

**Use when**

Parsing and evaluating dynamic or user-influenced SpEL expressions.

**Secure rules**

**Rule 1: Avoid concatenating untrusted input directly into SpEL expressions and use evaluation context variables instead.**

Parse static expression templates using `SpelExpressionParser` and pass dynamic parameters safely via evaluation context variables (`#variableName` syntax) or evaluation context property accessors to prevent attackers from manipulating expression syntax.

```java
SpelExpressionParser parser = new SpelExpressionParser();
StandardEvaluationContext ctx = new StandardEvaluationContext();
Expression expr = parser.parseRaw("(hasRole('SUPERVISOR') or (#a < 1.042))");
ctx.setVariable("a", dynamicThresholdValue);
Boolean authorized = expr.getValue(ctx, Boolean.class);
```

**Rule 2: Restrict SpEL evaluation capabilities by using SimpleEvaluationContext for data binding.**

Use `SimpleEvaluationContext` instead of `StandardEvaluationContext` when processing dynamic or user-influenced expressions to restrict unsafe behaviors such as arbitrary variable assignment, constructor invocations, and arbitrary Java method execution.

```java
EvaluationContext context = SimpleEvaluationContext.forReadWriteDataBinding().build();
ExpressionParser parser = new SpelExpressionParser();
Expression expr = parser.parseExpression("name");
Object value = expr.getValue(context);
```

**Rule 3: Configure strict maximum expression lengths and operation limits on SpEL parsers.**

Instantiate `SpelParserConfiguration` with custom maximum bounds for expression length, maximum operations, and auto-growth limits to prevent resource-intensive operations and denial of service attacks.

```java
SpelParserConfiguration config = new SpelParserConfiguration(
    SpelCompilerMode.OFF,
    null,
    false,
    false,
    100,
    1000,
    5000
);
SpelExpressionParser parser = new SpelExpressionParser(config);
```

**Rule 4: Restrict callable methods on target objects by registering custom MethodFilters.**

Register custom `MethodFilter` instances via `context.registerMethodFilter()` when evaluating SpEL expressions using `StandardEvaluationContext` to ensure only explicitly allowed methods are executed.

```java
StandardEvaluationContext context = new StandardEvaluationContext(rootObject);
context.registerMethodFilter(TargetClass.class, methods -> {
    List<Method> allowed = new ArrayList<>();
    for (Method method : methods) {
        if (method.isAnnotationPresent(AllowedSpelMethod.class)) {
            allowed.add(method);
        }
    }
    return allowed;
});
```


### Use Parameterized Queries and Named Parameters to Prevent SQL Injection

**Use when**

When writing database queries, database startup validators, scripts, or stored procedures using Spring JDBC and Spring R2DBC.

**Secure rules**

**Rule 1: Avoid custom validation queries in DatabaseStartupValidator and rely on JDBC 4.0 connection validity checks.**

Do not supply dynamic or untrusted SQL query strings to DatabaseStartupValidator.setValidationQuery(). Rely on the default JDBC 4.0 Connection.isValid() check by leaving the validation query unset to avoid raw SQL statement execution on JDBC connections.

```java
DatabaseStartupValidator validator = new DatabaseStartupValidator();
validator.setDataSource(dataSource);
validator.setInterval(2);
validator.setTimeout(30);
```

**Rule 2: Use named parameter placeholders for R2DBC SQL queries instead of string concatenation.**

When defining SQL queries in Spring R2DBC, developers must use named parameter placeholders like `:name` or `:{name}` rather than concatenating user input directly into SQL strings. Always write parameterized SQL templates and pass values through DatabaseClient or BindParameterSource.

```java
String sql = "SELECT id, username, email FROM users WHERE status = :status AND tenant_id = :tenantId";

databaseClient.sql(sql)
    .bind("status", userStatus)
    .bind("tenantId", tenantId)
    .fetch()
    .all();
```

**Rule 3: Execute SQL initialization scripts exclusively from trusted and immutable application resources.**

Execute SQL scripts only from immutable and trusted application resources using `ScriptUtils.executeSqlScript()`. Ensure script paths or contents do not originate from unverified user inputs.

```java
Resource schemaScript = new ClassPathResource("db/schema.sql");
ScriptUtils.executeSqlScript(connection, schemaScript);
```

**Rule 4: Declare explicit parameters for Spring StoredProcedure execution.**

When executing database stored procedures with Spring JDBC `StoredProcedure` classes, always declare parameters using `SqlParameter` and `SqlOutParameter` and use parameter placeholders rather than dynamically concatenating input strings.

```java
public class AddInvoiceProcedure extends StoredProcedure {
    public AddInvoiceProcedure(DataSource dataSource) {
        setDataSource(dataSource);
        setSql("add_invoice");
        declareParameter(new SqlParameter("amount", Types.INTEGER));
        declareParameter(new SqlParameter("custid", Types.INTEGER));
        declareParameter(new SqlOutParameter("newid", Types.INTEGER));
        compile();
    }

    public int execute(int amount, int custid) {
        Map<String, Object> inParams = new HashMap<>();
        inParams.put("amount", amount);
        inParams.put("custid", custid);
        Map<String, Object> out = execute(inParams);
        return ((Number) out.get("newid")).intValue();
    }
}
```

**Rule 5: Construct SQL query strings using static templates with named parameter placeholders via NamedParameterUtils.**

Always construct SQL query strings using static templates with named parameter placeholders rather than dynamically concatenating untrusted user input into the SQL string prior to parsing.

```java
String sql = "SELECT id, username FROM users WHERE status = :status AND role = :role";
MapSqlParameterSource params = new MapSqlParameterSource()
    .addValue("status", userStatus)
    .addValue("role", userRole);
ParsedSql parsedSql = NamedParameterUtils.parseSqlStatement(sql);
String substitutedSql = NamedParameterUtils.substituteNamedParameters(parsedSql, params);
```


## Category: input contract definition

### Enforce Deep Bean Validation and Cascading Checks Across Complex Structures

**Use when**

When developers need to enforce Jakarta Bean Validation rules, nested object checks, and container element constraints across services, domain objects, and message payloads.

**Secure rules**

**Rule 1: Annotate nested objects and collection elements with @Valid to enforce deep structural validation.**

When validating domain objects or method arguments, ensure that nested structures and container elements (such as `List` or `Map`) are explicitly annotated with `@Valid` on the field declaration to prevent container element constraints from being bypassed.

```java
public class UserDTO {
    @Valid
    private List<@NotNull String> roles;

    @Valid
    private Map<@NotNull String, @NotNull String> attributes;
}
```

**Rule 2: Configure method-level validation on service classes and components using @Validated.**

Use class-level `@Validated` annotations and constraint annotations on method parameters and return types to ensure parameters strictly conform to Jakarta Validation constraints before core business logic executes.

```java
@Service
@Validated
public class AccountService {
    public Account createAccount(@NotNull @Valid AccountDto accountDto) {
        return repository.save(accountDto);
    }
}
```

**Rule 3: Pass explicit validation group classes as validation hints to SmartValidator.**

When using `SmartValidator` or validating with hints, pass explicit Jakarta Validation group classes as validation hints to ensure group-specific security and operational constraints are fully enforced.

```java
// Safe: Pass validation group Class types as validation hints
validator.validate(userDto, bindingResult, OnUpdateGroup.class, AdminGroup.class);
```


### Enforce Input Boundaries and Type Validation on Controller Parameters

**Use when**

When developers are implementing Spring MVC or WebFlux controllers and need to enforce required parameters, expected types, and constraints on incoming request bindings.

**Secure rules**

**Rule 1: Validate request parameters and path variables using explicit Java types and annotation constraints.**

Use annotations like `@RequestParam`, `@PathVariable`, and explicit types on controller method parameters to enforce input boundaries. Spring automatically validates required parameters and performs strong type conversion, returning HTTP 400 Bad Request when validation fails.

```java
@RestController
public class UserAccountController {

    @GetMapping("/account")
    public ResponseEntity<String> getAccount(@RequestParam(name = "id", required = true) Long id) {
        // Executed only if 'id' parameter is present and parseable as Long
        return ResponseEntity.ok("Account: " + id);
    }
}
```

**Rule 2: Inspect binding errors explicitly when Errors or BindingResult parameters are declared.**

When an `Errors` or `BindingResult` parameter is declared immediately following a validated argument, Spring does not automatically throw validation exceptions. Controllers must explicitly inspect `errors.hasErrors()` and handle validation failures before processing input.

```java
@PostMapping("/person")
public ResponseEntity<String> handlePerson(@Valid @ModelAttribute Person person, Errors errors) {
    if (errors.hasErrors()) {
        return ResponseEntity.badRequest().body("Validation failed");
    }
    return ResponseEntity.ok("Processed successfully");
}
```

**Rule 3: Disable model binding to mitigate mass assignment vulnerabilities on model attributes.**

Set `@ModelAttribute(binding = false)` on parameters that should not be populated directly from untrusted request data. This disables automatic parameter binding from form or query data while still allowing Spring to resolve the object and apply validation checks via `@Validated`.

```java
@PostMapping("/update")
public Mono<String> handleUser(
    @ModelAttribute(binding = false) @Validated UserProfile profile,
    BindingResult bindingResult) {
    if (bindingResult.hasErrors()) {
        return Mono.just("errorView");
    }
    return userService.save(profile).thenReturn("successView");
}
```


### Restrict DataBinder Property Binding and Prevent Unrestricted Mass Assignment

**Use when**

When configuring property binding settings or data binders to restrict which object properties can be modified via HTTP request parameters.

**Secure rules**

**Rule 1: Configure DataBinder with allowed fields or declarative binding to restrict property modification.**

Configure `DataBinder` with explicit allowed fields or enable declarative binding to prevent mass assignment vulnerabilities where incoming parameters modify unintended model properties.

```java
DataBinder binder = new DataBinder(target);
binder.setAllowedFields("firstName", "lastName", "email");
// Or enable declarative binding to restrict to explicit constructor/allowed fields:
binder.setDeclarativeBinding(true);
binder.bind(propertyValues);
```


## Category: input interpretation safety

### Configure Canonical URI Parsing and Reject Alternate Input Interpretations

**Use when**

Parsing and validating untrusted URLs, request paths, or class names where alternate interpretations or parser differentials could bypass security checks.

**Secure rules**

**Rule 1: Select consistent URL parsers and validate components explicitly to prevent parser differential vulnerabilities.**

When parsing user-supplied URLs for routing or security boundaries, explicitly specify `UriComponentsBuilder.ParserType.WHAT_WG` to ensure consistent browser-aligned parsing and evaluate the exact same parsed components in downstream authorization checks.

```java
UriComponents uriComponents = UriComponentsBuilder.fromUriString(untrustedUrl, UriComponentsBuilder.ParserType.WHAT_WG)
        .build();
String host = uriComponents.getHost();
if (host != null && allowedHosts.contains(host.toLowerCase(Locale.ROOT))) {
}
```

**Rule 2: Prefer PathPatternParser over legacy path matchers for consistent request path interpretation.**

Use `PathPatternParser` for parsed request path matching rather than deprecated helpers to avoid URL decoding inconsistencies and path matching discrepancies across security layers.

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        configurer.setPatternParser(new PathPatternParser());
    }
}
```

**Rule 3: Validate dynamic class names against an allowlist before resolution.**

Ensure that unvalidated user-supplied class names are strictly restricted against an explicit allowlist before passing them into `ClassUtils.forName` or `ClassUtils.resolveClassName`.

```java
Set<String> ALLOWED_CLASSES = Set.of(
    "com.example.dto.UserPayload",
    "com.example.dto.OrderPayload"
);

public Class<?> getValidatedClass(String className, ClassLoader cl) throws ClassNotFoundException {
    if (!ALLOWED_CLASSES.contains(className)) {
        throw new IllegalArgumentException("Unauthorized class resolution attempt: " + className);
    }
    return ClassUtils.forName(className, cl);
}
```


## Category: interface protocol hardening

### Configure HTTP Security and Cache Control Headers on Responses

**Use when**

Developing controllers, functional endpoints, or reactive server responses that serve sensitive data or require client-side security headers.

**Secure rules**

**Rule 1: Explicitly enforce security response headers and cache controls on HTTP responses**

When returning responses containing sensitive user data, configure applicable HTTP security headers using builder APIs and enforce strict cache restrictions with CacheControl.noStore() to prevent browsers and intermediary caches from retaining the response.

```java
ResponseEntity<UserData> response = ResponseEntity.ok()
    .cacheControl(CacheControl.noStore())
    .header("X-Content-Type-Options", "nosniff")
    .header("X-Frame-Options", "DENY")
    .body(userData);
```

**Rule 2: Protect HTTP security header integrity using defensive wrappers and copies.**

When passing `HttpHeaders` across security boundaries or downstream components, wrap headers using `HttpHeaders.readOnlyHttpHeaders(headers)` to prevent unauthorized modification of security configurations. Use `HttpHeaders.copyOf(headers)` when creating an isolated writable copy rather than the copy constructor.

```java
HttpHeaders readOnlyHeaders = HttpHeaders.readOnlyHttpHeaders(originalHeaders);
HttpHeaders writableCopy = HttpHeaders.copyOf(readOnlyHeaders);
writableCopy.set("X-Custom-Header", "value");
```


### Restrict Controller Endpoints to Explicit HTTP Methods

**Use when**

Developing Spring MVC controller endpoints that need to strictly enforce allowed HTTP methods and reject unexpected verbs.

**Secure rules**

**Rule 1: Explicitly declare supported HTTP methods on controller endpoints using dedicated mapping annotations.**

Use annotations such as `@GetMapping`, `@PostMapping`, or `@RequestMapping(method = ...)` to restrict controller endpoints to intended HTTP methods. Spring MVC automatically rejects unsupported methods with an HTTP 405 Method Not Allowed response and populates the `Allow` header.

```java
@Controller
public class MyController {

    @PostMapping("/submit")
    public ResponseEntity<Void> handlePost(@RequestParam("id") Long id) {
        // Handled securely only for POST requests
        return ResponseEntity.ok().build();
    }
}
```


## Category: network boundary

### Configure trusted hostnames on RedirectView to enforce redirect boundaries

**Use when**

Configuring dynamic HTTP redirects in Spring MVC applications where targets must be restricted to allowed internal domains.

**Secure rules**

**Rule 1: Specify allowed hostnames on RedirectView to distinguish between internal hosts and untrusted external destinations.**

Use `setHosts(...)` on `RedirectView` to define explicit allowed domains and evaluate target URLs using `isRemoteHost()` to prevent unauthorized external redirects.

```java
RedirectView view = new RedirectView(targetUrl);
view.setHosts("app.example.com", "auth.example.com");
if (view.isRemoteHost(targetUrl)) {
    throw new IllegalArgumentException("External redirects are not allowed");
}
```


### Validate Target URIs and Hostnames to Prevent Server-Side Request Forgery

**Use when**

Building outbound HTTP requests using `RestTemplate`, `WebClient`, or HTTP service proxies where user-supplied input dictates URIs, URI variables, or endpoint parameters.

**Secure rules**

**Rule 1: Strictly validate user-supplied URI parameters against an explicit allowlist before passing them to declarative HTTP client interfaces**

When using Spring HTTP service proxies built with `HttpServiceProxyFactory` and `WebClientAdapter` where method parameters are typed as `java.net.URI` to dynamically override the base URL, applications must validate user input to ensure the target scheme, host, and port match an explicit allowlist.

```java
public String getExternalData(URI userSuppliedUri, String id) {
    if (!"https".equalsIgnoreCase(userSuppliedUri.getScheme()) || !"api.example.com".equalsIgnoreCase(userSuppliedUri.getHost()) || (userSuppliedUri.getPort() != -1 && userSuppliedUri.getPort() != 443)) {
        throw new IllegalArgumentException("Invalid request destination");
    }
    return myService.getGreetingById(userSuppliedUri, id);
}
```

**Rule 2: Configure safe URI encoding modes when using `RestTemplate` with URI templates and variables.**

Configure `RestTemplate` to use `DefaultUriBuilderFactory` with `EncodingMode.TEMPLATE_AND_VALUES` when making HTTP requests with URI templates and variables to prevent untrusted input from injecting control characters that alter the target host or authority.

```java
DefaultUriBuilderFactory factory = new DefaultUriBuilderFactory();
factory.setEncodingMode(DefaultUriBuilderFactory.EncodingMode.TEMPLATE_AND_VALUES);

RestTemplate restTemplate = new RestTemplate();
restTemplate.setUriTemplateHandler(factory);

String response = restTemplate.getForObject("https://api.example.com/users/{userId}", String.class, userInput);
```

**Rule 3: Validate target hosts against an explicit allowlist before executing outbound `WebClient` requests**

When initiating outbound HTTP requests with `WebClient` using `uri(URI)`, `uri(String)`, or `baseUrl(String)`, untrusted input used to specify the host, scheme, or path must be strictly validated against an explicit allowlist before execution.

```java
Set<String> ALLOWED_HOSTS = Set.of("api.example.com", "partner.example.com");

public Mono<String> fetchExternalData(String targetUrl) {
    URI uri = URI.create(targetUrl);
    if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || !ALLOWED_HOSTS.contains(uri.getHost().toLowerCase(Locale.ROOT))) {
  return Mono.error(new IllegalArgumentException("Target host not allowed"));
 }
    return webClient.get()
        .uri(uri)
        .retrieve()
        .bodyToMono(String.class);
}
```


## Category: output encoding

### Use URI template placeholders in RedirectView for automatic URL encoding

**Use when**

When constructing dynamic redirect URLs with RedirectView to prevent open redirect vulnerabilities and URL injection.

**Secure rules**

**Rule 1: Use URI template placeholders instead of manual string concatenation when creating dynamic redirect URLs.**

Construct dynamic redirect URLs with `RedirectView` by using URI template placeholders and supplying dynamic values via the model map rather than performing manual string concatenation. `RedirectView` automatically URL-encodes substituted URI variables.

```java
Map<String, Object> model = new HashMap<>();
model.put("foo", "bar/bar baz");

RedirectView redirectView = new RedirectView("https://example.com/context/{foo}");
redirectView.renderMergedOutputModel(model, request, response);

RedirectView staticView = new RedirectView("/test#{'one'}", true);
staticView.setExpandUriTemplateVariables(false);
```


## Category: resource exhaustion

### Enforce Strict Size And Collection Limits To Prevent Resource Exhaustion

**Use when**

When bounding input parameters, data binders, database query collection parameters, and streaming decoders to prevent excessive memory or connection consumption.

**Secure rules**

**Rule 1: Enforce safe upper limits on collection auto-growing during data binding.**

Configure `setAutoGrowCollectionLimit` on your `DataBinder` instance to a safe lower bound based on application requirements, preventing excessive memory allocations and `OutOfMemoryError` when binding out-of-bounds collection indices.

```java
DataBinder binder = new DataBinder(target);
binder.setAutoGrowCollectionLimit(50);
```

**Rule 2: Validate and cap collection sizes bound to named parameters in SQL queries**

Check and cap the size of input collections before executing queries with collection parameter expansion to bound generated SQL and bind-marker growth.

```java
List<String> userIds = getUserIdsFromRequest();
if (userIds.size() > 100) {
    throw new IllegalArgumentException("Requested user count exceeds maximum batch limit of 100");
}

databaseClient.sql("SELECT * FROM users WHERE id IN (:ids)")
    .bind("ids", userIds)
    .fetch()
    .all();
```

**Rule 3: Configure positive memory buffer limits when tokenizing reactive JSON streams.**

Always configure an explicit non-negative `maxInMemorySize` limit when tokenizing reactive JSON streaming byte buffers to protect server heap memory from unbounded accumulation.

```java
int maxInMemorySize = 256 * 1024;
Flux<TokenBuffer> tokens = Jackson2Tokenizer.tokenize(
    dataBufferFlux,
    jsonFactory,
    objectMapper,
    tokenizeArrays,
    forceUseOfBigDecimal,
    maxInMemorySize
);
```

**Rule 4: Configure explicit WebSocket frame payload limits to prevent buffer exhaustion.**

Explicitly configure maximum frame payload limits on WebSocket client specs or engine containers to prevent remote peers from consuming disproportionate memory resources.

```java
ReactorNettyWebSocketClient nettyClient = new ReactorNettyWebSocketClient(
    httpClient,
    () -> WebsocketClientSpec.builder().maxFramePayloadLength(65536)
);
```


## Category: runtime environment hardening

### Disable Debug Mode and Verbose Diagnostic Logging in Production

**Use when**

Configuring application production runtime environments, logging levels, and debugging properties for Spring components.

**Secure rules**

**Rule 1: Disable CGLIB debug mode in production environments.**

Do not set the `cglib.debugLocation` system property in production environments. When this property is set, `DebuggingClassWriter` turns on debug mode, automatically creating directory structures and writing generated `.class` files and `.asm` trace files to disk which can exhaust disk space or leak proxy structures.

```java
System.clearProperty("cglib.debugLocation");
```

**Rule 2: Disable stack trace logging in production cache error handlers.**

When instantiating `LoggingCacheErrorHandler`, ensure `logStackTraces` is set to false in production runtime environments. Reserve `logStackTraces = true` exclusively for active debug or development environments to prevent exposing internal operational details in logs.

```java
@Bean
public CacheErrorHandler cacheErrorHandler(Environment environment) {
    boolean isDebug = environment.acceptsProfiles(Profiles.of("dev", "debug"));
    return new LoggingCacheErrorHandler(isDebug);
}
```

**Rule 3: Restrict WebSocket logging levels in production environments.**

Avoid enabling `DEBUG` or `TRACE` logging levels for `LoggingWebSocketHandlerDecorator` in production environments. When TRACE logging is active, full message payloads can be recorded, and DEBUG logging records session metadata and error stack traces.

```properties
logging.level.org.springframework.web.socket.handler.LoggingWebSocketHandlerDecorator=INFO
```


## Category: secret handling

### Prevent Secret Disclosure in Logs and String Conversion

**Use when**

When logging diagnostic information, writing error messages, or handling database and messaging credentials in Spring applications.

**Secure rules**

**Rule 1: Avoid logging credential values or parameter-value maps that contain secrets**

Do not pass credentials or parameter-value maps such as MapSqlParameterSource.getValues() to loggers, string formatters, or exception details. Instead, log only safe non-sensitive metadata or parameter names.

```java
// Unsafe: getValues() exposes all parameter values
logger.debug("Executing query with parameters: {}", paramSource.getValues());

// Safe: Log parameter names without revealing sensitive values
if (logger.isDebugEnabled() && paramSource.getParameterNames() != null) {
    logger.debug("Executing query with parameters: {}", Arrays.toString(paramSource.getParameterNames()));
}
```

**Rule 2: Load credentials from external configuration instead of hardcoding them**

Avoid embedding plain-text secrets directly into source code, bean definitions, or unsecured configuration files. Inject database and connection factory credentials from externalized property sources via @Value or environment lookup, and secure the underlying property source separately.

```java
@Bean
public UserCredentialsConnectionFactoryAdapter connectionFactory(
        ConnectionFactory targetConnectionFactory,
        @Value("${jms.username}") String username,
        @Value("${jms.password}") String password) {
    UserCredentialsConnectionFactoryAdapter adapter = new UserCredentialsConnectionFactoryAdapter();
    adapter.setTargetConnectionFactory(targetConnectionFactory);
    adapter.setUsername(username);
    adapter.setPassword(password);
    return adapter;
}
```


## Category: security control integrity

### Maintain Consistent Path Matching and Non-Final Proxies to Prevent Security Control Bypasses

**Use when**

Configuring Spring WebMVC path matching configurations or implementing AOP security proxies.

**Secure rules**

**Rule 1: Avoid marking proxy target methods as final when applying security advice.**

When using CGLIB class-based AOP proxies, ensure that methods requiring security interceptors or authorization checks are non-final. Marking them as final prevents CGLIB from overriding and intercepting them, which silently bypasses security checks.

```java
@Service
public class UserService {
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        // business logic
    }
}
```

**Rule 2: Align path matching strategies between security filters and web MVC handlers.**

Ensure that security authorization layers are explicitly configured to use the same path matching algorithm as the underlying WebMVC handler mappings to prevent subtle parsing discrepancies and authorization bypasses.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers(new AntPathRequestMatcher("/api/**")).hasRole("ADMIN")
    );
    return http.build();
}
```


## Category: session management

### Configure Secure and HttpOnly Cookie Attributes for Sessions

**Use when**

Developing and configuring session cookie resolvers, response cookies, or managing cookie security attributes in Spring Web applications.

**Secure rules**

**Rule 1: Explicitly set secure, HttpOnly, and SameSite attributes when creating and configuring session cookies**

When creating cookies for sensitive state or session tokens using `ResponseCookie`, explicitly set boolean flags such as `httpOnly(true)` and `secure(true)`, along with an appropriate `sameSite` policy like `'Strict'` or `'Lax'`. Omitting HttpOnly permits client-side script access, omitting Secure permits transmission over insecure channels, and omitting SameSite allows broader cross-site cookie attachment.

```java
ResponseCookie cookie = ResponseCookie.from("SESSION", sessionId)
    .httpOnly(true)
    .secure(true)
    .sameSite("Lax")
    .path("/")
    .maxAge(Duration.ofHours(2))
    .build();
```

**Rule 2: Preserve secure cookie defaults and enforce flags when customizing session cookie resolvers.**

When using `CookieWebSessionIdResolver` to manage session cookies, ensure security flags are not downgraded or overridden with unsafe values. Use `addCookieInitializer` to explicitly enforce `secure(true)` and stricter SameSite policies when operating behind TLS-terminating proxies.

```java
CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
resolver.setCookieName("SESSION");
resolver.addCookieInitializer(builder -> builder
    .secure(true)
    .sameSite("Strict"
));
```
