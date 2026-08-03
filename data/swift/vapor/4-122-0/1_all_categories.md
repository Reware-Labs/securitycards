# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`

## Category: access control

### Implement Custom Access Control Middleware to Restrict Route Execution

**Use when**

Enforcing role or permission checks to determine whether an authenticated user may access a protected route or tenant resource in Vapor.

**Secure rules**

**Rule 1: Enforce explicit authorization checks in middleware before allowing access to protected route handlers.**

Implement `AsyncMiddleware` to inspect `request.auth` and throw an `Abort(.unauthorized)` or `Abort(.forbidden)` error if the user lacks the required privileges. Attach this middleware to route groups to prevent unauthorized users from executing downstream handlers.

```swift
struct EnsureAdminUserMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let user = request.auth.get(User.self), user.role == .admin else {
            throw Abort(.unauthorized)
        }
        return try await next.respond(to: request)
    }
}

let protectedGroup = app.grouped(EnsureAdminUserMiddleware())
protectedGroup.get("admin", "dashboard") { req in
    "Admin Content"
}
```


## Category: api contract misuse

### Use Request-Scoped Services Within Vapor Route Handlers

**Use when**

Developing route closures and handling incoming requests where request-bound services such as `req.client` must be accessed.

**Secure rules**

**Rule 1: Access request-bound services using the request instance instead of global application instances.**

Always use request-bound services such as `req.client` inside route closures to ensure requests are handled on the correct SwiftNIO event loop and to preserve request context. Avoid resolving global application instances inside route handlers to prevent thread-safety issues and unexpected behavior under load.

```swift
app.get("example") { req -> EventLoopFuture<ClientResponse> in
    return req.client.get("https://api.example.com")
}
```


## Category: authentication

### Verify User Passwords and JWT Tokens

**Use when**

Authenticating users with credentials or verifying incoming JWT bearer tokens in Vapor.

**Secure rules**

**Rule 1: Verify JWT token expiration and claims within JWTPayload.**

Always execute claim verification logic inside the custom payload's `verify(using:)` method by calling `verifyNotExpired()` on `ExpirationClaim` or verifying audience and not-before claims.

```swift
struct TestPayload: JWTPayload {
    enum CodingKeys: String, CodingKey {
        case subject = "sub"
        case expiration = "exp"
    }

    var subject: SubjectClaim
    var expiration: ExpirationClaim

    func verify(using algorithm: some JWTAlgorithm) async throws {
        try self.expiration.verifyNotExpired()
    }
}
```


## Category: cryptography

### Generate Cryptographically Secure Random Tokens and Keys

**Use when**

When generating high-entropy random values for bearer tokens, API credentials, or symmetric keys.

**Secure rules**

**Rule 1: Generate token values and symmetric keys using cryptographically secure random byte generation.**

Utilize `[UInt8].random(count:)` with sufficient entropy and encode the resulting bytes using Base64 for token generation, or instantiate `SymmetricKey` securely for cryptographic operations.

```swift
extension User {
    func generateToken() throws -> UserToken {
        try .init(
            value: [UInt8].random(count: 16).base64,
            userID: self.requireID()
        )
    }
}
```


### Hash User Passwords Securely Using Bcrypt

**Use when**

When implementing user authentication and persisting user passwords in application databases.

**Secure rules**

**Rule 1: Hash passwords with Bcrypt and verify them with Bcrypt.verify**

Hash every user-supplied password using `Bcrypt.hash` before persisting it, and authenticate by verifying the supplied password against the stored hash with `Bcrypt.verify`. **Passwords must never be stored in plaintext.**

```swift
// Hash before saving
let user = try User(
    name: create.name,
    email: create.email,
    passwordHash: Bcrypt.hash(create.password)
)
try await user.save(on: req.db)

// Verify during login
extension User: ModelAuthenticatable {
    static let usernameKey     = \User.$email
    static let passwordHashKey = \User.$passwordHash

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.passwordHash)
    }
}
```


## Category: csrf

### Configure SameSite session cookies to mitigate cross-site request forgery

**Use when**

Configuring session middleware and cookie factories for routes that use ambient credentials and state-changing actions.

**Secure rules**

**Rule 1: Configure explicit SameSite cookie policies on session cookies to prevent unauthorized cross-site request forgery.**

Set `app.sessions.configuration.cookieFactory` to explicitly define `sameSite: .lax` or `sameSite: .strict` alongside `isSecure` and `httpOnly` flags when using `SessionsMiddleware` in Vapor.

```swift
app.sessions.configuration.cookieFactory = { id in
    HTTPCookies.Value(
        string: id.string,
        isSecure: true,
        httpOnly: true,
        sameSite: .lax
    )
}
app.middleware.use(app.sessions.middleware)
```


## Category: file handling

### Restrict FileMiddleware Public Directory to Dedicated Static Folders

**Use when**

Configuring `FileMiddleware` for serving static assets in a Vapor application.

**Secure rules**

**Rule 1: Configure `FileMiddleware` with a restricted, dedicated static folder rather than application root or source code directories.**

Ensure that `FileMiddleware` points to a dedicated folder such as `app.directory.publicDirectory` instead of broader source paths. Because `FileMiddleware` serves files directly without evaluating route-level authentication, exposing root directories can allow unauthorized access to sensitive application code and credentials.

```swift
let fileMiddleware = FileMiddleware(
    publicDirectory: app.directory.publicDirectory,
    defaultFile: "index.html",
    directoryAction: .none
)
app.middleware.use(fileMiddleware)
```


## Category: input contract definition

### Validate Incoming Request Content and Query Parameters Using Validatable

**Use when**

Validating untrusted HTTP request content, query parameters, or JSON payloads against explicit type, range, format, and requirement rules before executing business logic.

**Secure rules**

**Rule 1: Conform request payload models to Validatable, define validation constraints, and assert validation results before processing.**

Implement the `Validatable` protocol on your request models and configure field validation rules inside `validations(_:)`. Invoke `validate(content:)` or `validate(request: req)` and explicitly call `.assert()` on the returned `ValidationsResult` to reject malformed or out-of-contract input before decoding or processing.

```swift
struct CreateUserRequest: Content, Validatable {
    var username: String
    var email: String

    static func validations(_ validations: inout Validations) {
        validations.add("username", as: String.self, is: .count(3...30) && .alphanumeric)
        validations.add("email", as: String.self, is: .email, required: true)
    }
}

app.post("users") { req -> CreateUserRequest in
    try CreateUserRequest.validate(content: req)
    let user = try req.content.decode(CreateUserRequest.self)
    return user
}
```


## Category: input interpretation safety

### Explicitly Inspect Media Type Parameters for Encoding Safety

**Use when**

You are verifying incoming request content types and security controls depend on specific parameters like character encodings.

**Secure rules**

**Rule 1: Inspect media type parameters explicitly when making security decisions based on content type attributes.**

Because `HTTPMediaType` equality checks ignore the `parameters` dictionary and handle wildcards automatically, relying solely on standard comparison can allow unexpected character encodings or parameters to bypass security controls. Always verify required parameters such as `charset` explicitly from the `parameters` dictionary.

```swift
guard let contentType = req.headers.contentType,
      contentType == .json,
      contentType.parameters["charset"]?.lowercased() == "utf-8" else {
    throw Abort(.unsupportedMediaType)
}
```


## Category: interface protocol hardening

### Enforce RFC-Compliant Case-Insensitive Header Matching Using Typed Constants

**Use when**

Handling incoming HTTP request headers or setting outgoing response headers where case sensitivity could lead to protocol confusion or security control bypasses.

**Secure rules**

**Rule 1: Use HTTPHeaders.Name typed constants or string literals for case-insensitive header lookups and modifications.**

Access headers through `HTTPHeaders` using predefined `HTTPHeaders.Name` constants or standard string literal indexing. This automatically converts header names to lowercase for hashing and equality comparisons, enforcing RFC-compliant case-insensitive header matching and preventing header bypass attacks.

```swift
if let auth = req.headers[.authorization].first {
    // Validate token
}
res.headers.replaceOrAdd(name: .contentSecurityPolicy, value: "default-src 'self'")
```


## Category: network boundary

### Enforce TLS for Authentication Transports

**Use when**

When configuring network boundaries or routing endpoints that handle Basic authentication and credentials.

**Secure rules**

**Rule 1: Require encrypted transport across network boundaries for Basic authentication endpoints.**

Never transmit or accept Basic authentication credentials over plaintext connections. Ensure that HTTPS and TLS are strictly enforced at the network boundary or via reverse proxy configuration before routing authentication requests.

```swift
let protected = app.grouped(UserAuthenticator())
    .grouped(User.guardMiddleware())

protected.post(
```


## Category: output encoding

### Prevent Cross-Site Scripting by Setting Safe Content Types and Using Auto-Escaping View Contexts

**Use when**

Building HTTP responses or rendering dynamic templates with user-supplied data in Vapor.

**Secure rules**

**Rule 1: Use structured Encodable view contexts and rely on template auto-escaping to render dynamic data safely.**

When rendering templates via `ViewRenderer.render(_:_:)`, pass untrusted user data through structured `Encodable` context types and rely on template engine auto-escaping mechanisms such as Leaf's default variable interpolation instead of raw string concatenation.

```swift
struct ProfileContext: Encodable {
    let username: String
}

let context = ProfileContext(username: req.parameters.get("username") ?? "")
return try await req.view.render("profile", context)
```


## Category: resource exhaustion

### Enforce Explicit Body Collection Limits on Request Payloads

**Use when**

Configuring routes that handle incoming HTTP request payloads and file uploads to prevent resource exhaustion.

**Secure rules**

**Rule 1: Specify explicit byte limits when collecting request bodies.**

Routes configured with `body: .collect(maxSize:)` must specify explicit and reasonable byte limits rather than excessively large values to prevent memory allocation attacks during payload parsing. Use `app.routes.defaultMaxBodySize` for global settings or `body: .collect(maxSize:)` for per-route limits.

```swift
app.routes.defaultMaxBodySize = "500kb"
app.on(.POST, "upload-json", body: .collect(maxSize: 256_000)) { req -> HTTPStatus in
    return .ok
}
```

**Rule 2: Set HTTP request decompression limits.**

Enforce a strict uncompressed size limit using `app.http.server.configuration.requestDecompression` with `.enabled(limit: .size(...))` to automatically reject decompression bombs that exceed memory thresholds.

```swift
app.http.server.configuration.requestDecompression = .enabled(
    limit: .size(1024 * 1024)
)
```


## Category: runtime environment hardening

### Configure production error middleware with the application environment

**Use when**

Configuring global middleware and application error handling during server bootstrap to ensure internal error details are properly masked in production.

**Secure rules**

**Rule 1: Pass the application environment into ErrorMiddleware.default to control error verbosity based on the runtime environment.**

Always pass `app.environment` into `ErrorMiddleware.default(environment:)` when registering the error middleware. This ensures that sensitive internal implementation details, file structures, and stack traces are hidden from users when running in production.

```swift
app.middleware.use(ErrorMiddleware.default(environment: app.environment))
```


## Category: secret handling

### Load sensitive credentials and secrets securely from environment variables or secret files

**Use when**

When loading API keys, cryptographic secrets, or database credentials in Vapor route handlers and configuration setups.

**Secure rules**

**Rule 1: Fetch secrets dynamically using environment variables or secret helper functions instead of hardcoding them in source code.**

Avoid hardcoding secrets directly in configuration files or route handlers. Instead, fetch sensitive credentials dynamically using `Environment.get` or Vapor's `Environment.secret(path:)` helper to prevent accidental exposure in repositories or build artifacts.

```swift
guard let secret = Environment.get("JWT_SECRET") else {
    fatalError("JWT_SECRET environment variable is not configured")
}
await app.jwt.keys.add(hmac: secret, digestAlgorithm: .sha256)
```


## Category: security control integrity

### Position CORS Middleware Before Error Handling in Vapor

**Use when**

Configuring the application middleware chain in Vapor to ensure cross-origin resource sharing headers are correctly applied to error and abort responses.

**Secure rules**

**Rule 1: Register CORSMiddleware at the beginning of the middleware chain.**

Ensure that `CORSMiddleware` is positioned before any error-handling or abort middlewares by registering it at the beginning of the responder chain using `.beginning`. This guarantees that error responses retain necessary CORS headers for cross-origin clients.

```swift
let cors = CORSMiddleware(configuration: corsConfig)
app.middleware.use(cors, at: .beginning)
```


## Category: session management

### Configure Secure Session Cookies and Destroy Sessions on Logout

**Use when**

Configuring session cookie attributes, registering session middleware, and terminating user sessions in Vapor applications.

**Secure rules**

**Rule 1: Explicitly destroy sessions on logout to invalidate server storage and clear client cookies.**

Call `req.session.destroy()` during logout handling to remove session records from backend storage and clear the session cookie on the client side.

```swift
app.get("logout") { req -> HTTPStatus in
    req.session.destroy()
    return .ok
}
```
