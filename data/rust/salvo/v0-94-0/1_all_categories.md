# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`

## Category: access control

### Configure Explicit CORS Security Headers and Restrict Cross-Origin Access

**Use when**

Developing and configuring cross-origin resource sharing (CORS) security headers, preflight caching, and origin boundaries in Salvo applications.

**Secure rules**

**Rule 1: Avoid permissive CORS settings and explicitly restrict allowed request origins.**

Do not use `Cors::very_permissive()`, `Cors::permissive()`, `AllowOrigin::mirror_request()`, or `AllowOrigin::any()` on endpoints handling sensitive data. Instead, define explicit trusted origins using `AllowOrigin::exact(...)` or `AllowOrigin::list(...)` to prevent untrusted third-party websites from reading sensitive API responses.

```rust
use salvo::cors::AllowOrigin;
use salvo::http::HeaderValue;

let allow_origin = AllowOrigin::list([
    HeaderValue::from_static("https://app.example.com"),
    HeaderValue::from_static("https://admin.example.com"),
]);
```

**Rule 2: Restrict cross-origin credentials using explicit dynamic validation.**

Avoid globally enabling credentials with `AllowCredentials::yes()` unless origin boundaries are strictly restricted. Prefer dynamic validation using `AllowCredentials::dynamic` or `AllowCredentials::dynamic_async` to verify the `Origin` header and request context before emitting true.

```rust
use salvo::cors::AllowCredentials;

let allow_credentials = AllowCredentials::dynamic(|origin, _req, _depot| {
    if let Some(origin) = origin {
        if let Ok(origin_str) = origin.to_str() {
            return origin_str == "https://app.example.com";
        }
    }
    false
});
```

**Rule 3: Explicitly define allowed request headers instead of mirroring or wildcards.**

Avoid permissive settings like `AllowHeaders::any()` or `AllowHeaders::mirror_request()` on endpoints handling sensitive data. Instead, explicitly define allowed cross-origin request headers using `AllowHeaders::list(...)` with concrete `HeaderName` values.

```rust
use salvo::cors::AllowHeaders;
use salvo::http::header::{AUTHORIZATION, CONTENT_TYPE};

let allow_headers = AllowHeaders::list([AUTHORIZATION, CONTENT_TYPE]);
```

**Rule 4: Explicitly define allowed CORS HTTP methods.**

Avoid using `AllowMethods::any()` or `AllowMethods::mirror_request()`. Explicitly define permitted HTTP methods using `AllowMethods::list()` or `AllowMethods::exact()` so that only designated HTTP verbs are allowed for cross-origin requests.

```rust
use salvo::cors::AllowMethods;
use salvo::http::Method;

let allow_methods = AllowMethods::list([Method::GET, Method::POST]);
```

**Rule 5: Validate requesting origin before granting private network access headers.**

Avoid indiscriminately granting access with `AllowPrivateNetwork::yes()` or `true.into()`. Use `AllowPrivateNetwork::dynamic` or `AllowPrivateNetwork::dynamic_async` to validate incoming `Origin` headers, target request paths, and context from the `Depot` before returning the private network access header.

```rust
use salvo::cors::AllowPrivateNetwork;
use salvo::http::HeaderValue;

let allow_pna = AllowPrivateNetwork::dynamic(|origin, req, _depot| {
    if let Some(origin_val) = origin {
        origin_val == HeaderValue::from_static("https://trusted.example.com")
            && req.uri().path().starts_with("/api/pna")
    } else {
        false
    }
});
```

**Rule 6: Restrict exposed CORS response headers to non-sensitive names.**

Explicitly declare only non-sensitive header names with `ExposeHeaders::list` rather than using wildcard exposure via `ExposeHeaders::any()` to prevent exposing sensitive tokens or internal metadata.

```rust
use salvo::cors::ExposeHeaders;
use salvo_core::http::header::{ACCEPT, CONTENT_TYPE};

let expose = ExposeHeaders::list([CONTENT_TYPE, ACCEPT]);
```

**Rule 7: Configure bounded max age for CORS preflight security headers.**

Set explicit, bounded TTL values using `MaxAge::exact`, `MaxAge::seconds`, or dynamic resolvers (`MaxAge::dynamic` / `MaxAge::dynamic_async`) so preflight permissions are cached appropriately without lingering indefinitely.

```rust
use std::time::Duration;
use salvo::cors::{Cors, MaxAge};

let cors = Cors::new()
    .max_age(MaxAge::exact(Duration::from_secs(3600)));
```

**Rule 8: Attach CORS header middleware to Service instead of Router.**

Attach CORS middleware to the `Service` instance using `hoop()` rather than to a `Router`. Salvo routes do not naturally match browser preflight `OPTIONS` requests, so CORS headers will not be emitted for preflights if attached at the router level.

```rust
use salvo_core::prelude::*;
use salvo_cors::Cors;

let cors = Cors::new()
    .allow_origin("https://example.com")
    .allow_methods([Method::GET, Method::POST])
    .into_handler();

let router = Router::new().get(hello);
let service = Service::new(router).hoop(cors);
```


### Configure Strict CORS Policies and Middleware Placement in Salvo

**Use when**

Developing cross-origin resource sharing policies and attaching CORS handlers to Salvo services.

**Secure rules**

**Rule 1: Restrict CORS allowed headers using explicit lists instead of wildcards or reflection.**

Avoid using `AllowHeaders::any()` or `AllowHeaders::mirror_request()` in sensitive applications. Use `AllowHeaders::list(...)` or explicit `HeaderName` collections to enforce strict header boundaries.

```rust
use salvo_core::http::header;
use salvo_cors::AllowHeaders;

let allow_headers = AllowHeaders::list([
    header::AUTHORIZATION,
    header::CONTENT_TYPE,
    header::ACCEPT,
]);
```

**Rule 2: Restrict allowed CORS HTTP methods to expected operations.**

Avoid default broad allowances like `AllowMethods::any()` or `AllowMethods::mirror_request()` on sensitive routes. Declare minimal required methods using `AllowMethods::list(...)` or `AllowMethods::exact(...)`.

```rust
use salvo::cors::AllowMethods;
use salvo::http::Method;

let allow_methods = AllowMethods::list([Method::GET, Method::POST]);
```

**Rule 3: Validate origins explicitly when enabling CORS private network access.**

Avoid indiscriminately enabling private network requests via `AllowPrivateNetwork::yes()`. Use `AllowPrivateNetwork::dynamic` or `AllowPrivateNetwork::dynamic_async` to inspect the request origin and path before granting access.

```rust
use salvo::cors::{AllowPrivateNetwork, Cors};
use salvo::http::HeaderValue;

let allow_private = AllowPrivateNetwork::dynamic(|origin, req, _depot| {
    let trusted_origin = origin == Some(&HeaderValue::from_static("https://trusted-internal-app.example.com"));
    let safe_endpoint = req.uri().path().starts_with("/api/pna-allowed");
    trusted_origin && safe_endpoint
});

let cors_handler = Cors::new()
    .allow_private_network(allow_private)
    .into_handler();
```

**Rule 4: Restrict exposed CORS headers to explicit header lists.**

Avoid using `ExposeHeaders::any()` when responses contain sensitive headers. Explicitly specify only required response header names using `ExposeHeaders::list()`.

```rust
use salvo::cors::ExposeHeaders;
use salvo::http::header;

let expose = ExposeHeaders::list([
    header::HeaderName::from_static("x-request-id"),
]);
```

**Rule 5: Attach CORS middleware to Service instead of Router.**

Attach the `Cors` handler to the Salvo `Service` instance using `.hoop()`, rather than registering it at the `Router` level, to ensure preflight OPTIONS requests are handled properly.

```rust
use salvo_core::http::Method;
use salvo_core::prelude::*;
use salvo_cors::Cors;

let cors = Cors::new()
    .allow_origin("https://app.example.com")
    .allow_methods([Method::GET, Method::POST])
    .allow_headers(["authorization", "content-type"])
    .into_handler();

let router = Router::new();
let service = Service::new(router).hoop(cors);
```


### Validate Path Parameters and Resource Ownership Against Authenticated Sessions

**Use when**

When building route handlers that retrieve, modify, or delete resources based on URL path parameters or identifiers.

**Secure rules**

**Rule 1: Verify resource ownership and authorization against the authenticated user stored in the depot before executing database operations.**

Extract identifiers from the URL using `PathParam` and retrieve the current user or security model from Salvo's `Depot`. Perform a strict equality or permission check to ensure the authenticated actor owns the requested resource before proceeding with transactional logic, and return a `FORBIDDEN` status code if validation fails.

```rust
#[endpoint]
async fn delete_users(
    user_id: PathParam<Uuid>,
    res: &mut Response,
    depot: &mut Depot,
) {
    let current_user = depot.get::<users::Model>("user").unwrap();
    let target_uuid = user_id.into_inner();

    if current_user.id != target_uuid {
        res.status_code(StatusCode::FORBIDDEN);
        res.render(Json(ErrorResponseModel { detail: "Unauthorized action".to_string() }));
        return;
    }
}
```


## Category: api contract misuse

### Use Fallible Redirect Constructor for Untrusted URIs

**Use when**

When constructing HTTP redirects using untrusted or dynamically computed input data in Salvo handlers.

**Secure rules**

**Rule 1: Use the fallible `Redirect::with_status_code` method instead of panicking convenience constructors when handling potentially malformed or untrusted redirect locations.**

Panicking convenience constructors like `Redirect::found` will assert and panic internally if the computed URI is not a valid HTTP header value. Pass untrusted input to `Redirect::with_status_code` and handle the resulting `Result` gracefully to prevent Denial of Service vulnerabilities caused by engineered panics.

```rust
use salvo_core::prelude::*;
use salvo_core::writing::Redirect;

#[handler]
async fn safe_redirect_handling(req: &mut Request, res: &mut Response) {
    let destination = req.query::<String>("dest").unwrap_or_else(|| "/".to_string());
    match Redirect::with_status_code(StatusCode::FOUND, &destination) {
        Ok(redirect) => res.render(redirect),
        Err(_) => {
            res.status_code(StatusCode::BAD_REQUEST);
            res.render("Malformed redirect location");
        }
    }
}
```


## Category: authentication

### Configure Explicit Claims Validation and Token Decoders in Salvo

**Use when**

Setting up JWT authentication or token decoders in Salvo applications to authenticate clients and verify credentials.

**Secure rules**

**Rule 1: Explicitly configure audience and issuer validation when instantiating JWT decoders.**

When instantiating `ConstDecoder`, use `ConstDecoder::with_validation` with a configured `Validation` object to enforce checks on expected claims like `aud` and `iss` to prevent token replay and privilege escalation across applications.

```rust
use salvo::jwt_auth::{Algorithm, ConstDecoder, DecodingKey, Validation};

let mut validation = Validation::new(Algorithm::HS256);
validation.set_audience(&["api://salvo-service"]);
validation.required_spec_claims.insert("aud".to_owned());

let decoder = ConstDecoder::with_validation(
    DecodingKey::from_secret(SECRET),
    validation,
);
```

**Rule 2: Restrict token extraction mechanisms in production environments.**

Avoid extracting JWTs from URL query parameters using `QueryFinder` in production to prevent token exposure in logs, browser history, and referer headers. Use `HeaderFinder` or secure cookies instead.

```rust
use salvo::jwt_auth::{JwtAuth, ConstDecoder, HeaderFinder};

let auth_handler: JwtAuth<JwtClaims, _> = JwtAuth::new(
    ConstDecoder::from_secret(b"your_secure_secret_key")
)
.finders(vec![Box::new(HeaderFinder::new())]);
```


## Category: boundary control

### Enforce Middleware Boundaries by Isolating Public Routes

**Use when**

Structuring the router tree to ensure that authentication and authorization hoops are only applied to protected routes and do not inadvertently enclose public endpoints.

**Secure rules**

**Rule 1: Isolate public routes from protected sub-routers to prevent unauthorized access or unintended authentication requirements.**

Use distinct sibling routes and place authentication middleware only on sensitive branches of your router tree using the `.hoop()` method rather than applying it globally.

```rust
pub fn get_users_router() -> Router {
    Router::with_path("users")
        .push(Router::with_path("login").post(get_access_token))
        .push(Router::with_path("").post(create_users))
        .push(
            Router::with_path("{user_id}")
                .hoop(auth_user)
                .delete(delete_users)
                .push(Router::with_path("posts").get(get_posts_by_users)),
        )
}
```


## Category: configuration source integrity

### Disable query parameter configuration overrides in Swagger UI

**Use when**

Configuring Swagger UI endpoints in Salvo OpenAPI integrations where untrusted users could manipulate configuration parameters via URL query parameters.

**Secure rules**

**Rule 1: Explicitly disable query parameter configuration overrides for Swagger UI instances.**

Keep the `query_config_enabled` option disabled or explicitly set it to `false` to prevent attackers from overriding configuration parameters via URL query parameters and loading malicious external schemas.

```rust
use salvo_oapi::swagger_ui::Config;

let config = Config::new(["/api-docs/openapi.json"])
    .query_config_enabled(false);
```


## Category: cryptography

### Hash Passwords Securely Using Argon2id

**Use when**

When storing or verifying user credentials and passwords in Salvo database examples or applications.

**Secure rules**

**Rule 1: Hash user credentials using memory-hard password hashing algorithms such as Argon2id prior to database storage.**

Always hash passwords before database storage and use robust hashing libraries like `argon2` to protect against offline brute-force attacks.

```rust
use argon2::{password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString}, Argon2};

pub fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)?.to_string();
    Ok(password_hash)
}
```


### Use Cryptographically Secure Keys and Random Generators for Ciphers and Cookies

**Use when**

When initializing ciphers, session stores, or flash cookies requiring cryptographic keys or secure entropy.

**Secure rules**

**Rule 1: Load cryptographic keys from safe environment stores instead of using hardcoded or predictable sequences of bytes.**

Feed key-based ciphers like `HmacCipher`, `AesGcmCipher`, or `CcpCipher` with high-entropy cryptographically secure random keys loaded from safe environment variables to prevent token forgery.

```rust
use salvo_csrf::hmac_cookie_csrf;
use salvo_csrf::HeaderFinder;

let key_string = std::env::var("CSRF_SECRET_KEY").expect("CSRF_SECRET_KEY must be set");
let mut key = [0u8; 32];
let decoded = hex::decode(key_string).expect("Failed to decode key hex");
key.copy_from_slice(&decoded[..32]);

let csrf_middleware = hmac_cookie_csrf(key, HeaderFinder::new("x-csrf-token"));
```

**Rule 2: Assign a stable cryptographic key to flash cookies and session stores.**

Initialize stores like `CookieStore` with a stable, high-entropy secret loaded from environment variables rather than relying on random defaults that invalidate sessions on restart.

```rust
use salvo_core::http::cookie::Key;
use salvo_flash::CookieStore;

let secret_key_bytes = std::env::var("SESSION_SECRET_KEY")
    .expect("SESSION_SECRET_KEY must be set");
let key = Key::from(secret_key_bytes.as_bytes());

let store = CookieStore::new().key(key);
```


## Category: csrf

### Configure and Integrate Salvo CSRF Protection Middleware

**Use when**

Developing state-changing APIs and web routes in Salvo that require protection against cross-site request forgery using tokens, session stores, custom finders, and secure cookie configurations.

**Secure rules**

**Rule 1: Enable the csrf feature and register session handlers before CSRF middleware**

When protecting state-changing APIs using session stores, developers must enable the `csrf` feature flag and register the `SessionHandler` in the router before the `Csrf` middleware to ensure the request depot can successfully access session contexts.

```rust
use salvo::prelude::*;
use salvo::csrf::{Csrf, SessionStore, BcryptCipher};
use salvo_session::{SessionHandler, MemoryStore};

let session_handler = SessionHandler::builder()
    .store(MemoryStore::new())
    .build()
    .unwrap();

let csrf_handler = Csrf::new(
    BcryptCipher::new(*b"01234567890123456789012345678901"),
    SessionStore::new(),
);

let router = Router::new()
    .hoop(session_handler)
    .hoop(csrf_handler)
    .get(index);
```

**Rule 2: Configure secure cookie policies and rotation settings**

Explicitly enforce secure cookie attributes when hosting behind TLS-terminating proxies using `.secure(true)`, and select appropriate rotation policies such as `CsrfRotationPolicy::PerRequest` or `CsrfRotationPolicy::PerSession` based on your application security and usability needs.

```rust
use salvo_csrf::{Csrf, CsrfRotationPolicy, BcryptCipher, CookieStore, HeaderFinder};
use salvo_core::http::SecureCookiePolicy;

let csrf_store = CookieStore::new()
    .name("app.csrf_token")
    .secure(true);

let csrf = Csrf::new(
    BcryptCipher::new(),
    csrf_store,
    HeaderFinder::new("x-csrf-token")
)
.rotation_policy(CsrfRotationPolicy::PerRequest);
```

**Rule 3: Embed and retrieve CSRF tokens safely using hidden inputs and headers**

Retrieve the generated token from the depot using `depot.csrf_token()` to render it securely into form fields or use `HeaderFinder` to require custom headers like `X-CSRF-Token` for stronger cross-origin defense-in-depth.

```rust
#[handler]
pub async fn get_page(depot: &mut Depot, res: &mut Response) {
    let csrf_token = depot.csrf_token().unwrap_or_default();
    let html = format!("<input type=\"hidden\" name=\"csrf_token\" value=\"{}\" />", csrf_token);
    res.render(Text::Html(html));
}
```


## Category: file handling

### Configure Secure File Storage Roots and Path Containment in Salvo

**Use when**

Configuring static asset directories, file upload storage stores, or local file handling paths in Salvo applications.

**Secure rules**

**Rule 1: Isolate file storage and static asset directories to dedicated absolute paths with restrictive permissions.**

When configuring `DiskStore` for uploads or `StaticDir` for serving assets, always define a dedicated, isolated directory path using absolute paths rather than default relative locations. On Unix platforms, restrict file system permissions such as using `0700` modes on cache or storage directories so that only the application process owner can access sensitive contents.

```rust
use salvo_core::prelude::*;
use salvo_serve_static::StaticDir;

let router = Router::new().push(
    Router::with_path("static/{**}").get(
        StaticDir::new("/var/www/my-app/static-assets")
            .defaults("index.html")
    ),
);
```

**Rule 2: Validate and sanitize all user-supplied paths, filenames, and upload identifiers before filesystem operations.**

Verify that all user-supplied upload IDs are strictly validated using `is_safe_upload_id` and sanitize individual directory or filename components using `sanitize_path_component` before combining them into a full storage directory path to prevent path traversal.

```rust
let safe_component = sanitize_path_component(user_filename)
    .ok_or_else(|| ProtocolError::InvalidPath("Unsafe path component"))?;
let target_path = std::path::Path::new("/var/tmp/uploads").join(safe_component);
```


## Category: input contract definition

### Enforce Input and Parameter Constraints Using OpenAPI Validation Attributes

**Use when**

When defining request data transfer objects, parameters, and schema structures using Salvo's OpenAPI integration macros to ensure malformed input is rejected.

**Secure rules**

**Rule 1: Apply macro-driven validation attributes to enforce explicit structural and size boundaries on data structures.**

Decorate your request data transfer objects with schema constraints such as `min_length`, `max_length`, `pattern`, `minimum`, `maximum`, `max_items`, and `min_items` to restrict input values and formats directly at compile time.

```rust
#[derive(serde::Deserialize, salvo::oapi::ToSchema)]
pub struct RegisterUser {
    #[salvo(schema(min_length = 3, max_length = 30, pattern = "^[a-zA-Z0-9_]+$"))]
    pub username: String,
    #[salvo(schema(minimum = 18, maximum = 120))]
    pub age: u8
}
```

**Rule 2: Specify parameter boundaries within endpoint annotations for path and query inputs.**

Use parameter validation attributes supported by the `#[endpoint]` macro to enforce size, length, and pattern constraints on query and path parameters.

```rust
use salvo_core::prelude::*;
use salvo_oapi::endpoint;

#[endpoint(
    parameters(
        (
            "user_id" = String,
            Path,
            description = "The target user's UUID",
            max_length = 36,
            min_length = 36,
            pattern = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        ),
        (
            "limit" = i32,
            Query,
            description = "Max number of items to fetch",
            minimum = 1,
            maximum = 100
        )
    )
)]
pub async fn get_user_data() {}
```

**Rule 3: Restrict parameter formats directly in route paths using wisps or regular expressions.**

Prevent unconstrained path parameters by utilizing built-in wisps like `{id:num}` or custom regular expressions registered via `PathFilter::register_wisp_regex` to centralize pattern matching.

```rust
use salvo_core::prelude::*;
use salvo_core::routing::filters::PathFilter;

#[handler]
async fn show_article(req: &mut Request) {
    let id = req.param::<i64>("id").unwrap();
}

let guid_regex = regex::Regex::new("[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}").unwrap();
PathFilter::register_wisp_regex("guid", guid_regex);

let router = Router::new()
    .push(Router::with_path("articles/{id:num}").get(show_article))
    .push(Router::with_path("users/{id:guid}").get(show_article));
```

**Rule 4: Apply explicit limits on collection fields using item count bounds.**

Specify explicit constraints like `max_items` and `min_items` on collection fields such as vectors or sets to prevent unbounded payload processing and resource exhaustion.

```rust
#[derive(salvo::oapi::ToSchema)]
struct BulkPayload {
    #[salvo(schema(max_items = 100, min_items = 1))]
    items: Vec<String>,
}
```


## Category: input interpretation safety

### Keep Strict Path Normalization Enabled to Prevent Path Confusion and Traversal

**Use when**

Configuring proxy routing in Salvo to handle upstream requests safely and prevent attackers from bypassing security controls via encoded or relative path components.

**Secure rules**

**Rule 1: Ensure strict path normalization remains enabled on proxy configurations to reject ambiguous path components and percent-encoded characters.**

Do not disable path normalization on proxy instances unless you have verified that the upstream target is completely immune to path traversal and path confusion vulnerabilities. Keep the normalization filter active so that literal relative path components and ambiguous percent-encoded characters are properly rejected before reaching the upstream server.

```rust
Proxy::new(upstreams, client).strict_path_normalization(true)
```


## Category: interface protocol hardening

### Configure Protocol Versions and Timeouts to Prevent Protocol Abuse

**Use when**

Configuring network connection settings, transport negotiation protocols, and request timeouts in Salvo applications.

**Secure rules**

**Rule 1: Restrict transport negotiation to explicit, secure ALPN protocols instead of relying on default fallbacks.**

Call `.alpn_protocols()` on your configuration object to explicitly restrict negotiation to a specific subset of protocols, such as HTTP/2 only, preventing unencrypted or outdated protocol fallbacks.

```rust
let openssl_config = OpensslConfig::new(keycert)
    .alpn_protocols(vec![b"\x02h2".to_vec()]);
```

**Rule 2: Manage HTTP/1 header timeouts using server fuse policies rather than lower-level protocol builder settings.**

Configure header and connection timeouts via `FuseConfig` to properly handle slow client connections and prevent hangs during initial protocol detection.

```rust
use salvo_core::prelude::*;
use salvo_core::fuse::FuseConfig;

#[tokio::main]
async fn main() {
    let acceptor = TcpListener::new("127.0.0.1:8698").bind().await;

    let server = Server::new(acceptor).fuse_config(FuseConfig::default());
    server.serve(Router::new()).await;
}
```


## Category: network boundary

### Configure Trusted Proxy Identifiers to Prevent Client IP Spoofing

**Use when**

Configuring rate-limiting, proxy routing, or client origin identification behind network load balancers or reverse proxies where incoming request headers can be manipulated.

**Secure rules**

**Rule 1: Use TrustedProxyIssuer with explicitly defined proxy IP addresses instead of unconditionally trusting client-controlled forwarding headers.**

Initialize the `TrustedProxyIssuer` with a verified list of your proxy IPs to securely identify clients while avoiding header-spoofing attacks that bypass rate limits.

```rust
use std::net::IpAddr;
use salvo_rate_limiter::{RateLimiter, TrustedProxyIssuer, BasicQuota, FixedGuard, MokaStore};

let trusted_proxies = [
    "10.0.0.5".parse::<IpAddr>().unwrap(),
    "10.0.0.6".parse::<IpAddr>().unwrap(),
];

let limiter = RateLimiter::new(
    FixedGuard::default(),
    MokaStore::default(),
    TrustedProxyIssuer::new(trusted_proxies),
    BasicQuota::per_minute(100),
);
```


## Category: output encoding

### Escape untrusted dynamic data before rendering in HTML responses

**Use when**

Rendering dynamic variables retrieved from session states or flash messages into HTML responses using `Text::Html` in Salvo handlers.

**Secure rules**

**Rule 1: Render dynamic HTML values through an Askama HTML template**

`Text::Html` marks its supplied string as HTML but does not escape that string. When a response contains request parameters, flash-message values, or other dynamic strings, place those values in an Askama template configured for HTML escape mode, render the template, and pass the rendered result to `Text::Html`. Keep the `.html` or `ext = "html"` escape mode enabled rather than concatenating dynamic values directly into an HTML string.

This example requires `salvo = { version = "0.94.0", features = ["flash"] }`, `askama = "0.11"`, and Tokio with its macros feature.

```rust
use askama::Template;
use salvo::flash::{CookieStore, FlashDepotExt};
use salvo::prelude::*;

#[derive(Template)]
#[template(
    source = "<!doctype html><html><body><div class=\"alert\">{{ message }}</div></body></html>",
    ext = "html"
)]
struct FlashPage<'a> {
    message: &'a str,
}

#[handler]
async fn set_flash(req: &mut Request, depot: &mut Depot, res: &mut Response) {
    let message = req.param::<&str>("message").unwrap_or("Saved");
    depot.outgoing_flash_mut().info(message);
    res.render(Redirect::other("/get"));
}

#[handler]
async fn get_flash(depot: &mut Depot, res: &mut Response) {
    let message = depot
        .incoming_flash()
        .and_then(|flash| flash.iter().next())
        .map(|message| message.value.as_str())
        .unwrap_or("");

    let page = FlashPage { message };
    res.render(Text::Html(page.render().unwrap()));
}

#[tokio::main]
async fn main() {
    let router = Router::new()
        .hoop(CookieStore::new().into_handler())
        .push(Router::with_path("set/{message}").get(set_flash))
        .push(Router::with_path("get").get(get_flash));

    let acceptor = TcpListener::new("0.0.0.0:8698").bind().await;
    Server::new(acceptor).serve(router).await;
}
```


## Category: resource exhaustion

### Configure Request Body and Path Parameter Limits

**Use when**

When defining routes and handling incoming requests in Salvo to prevent resource exhaustion from large payloads or unbounded path parameters.

**Secure rules**

**Rule 1: Restrict large payloads using route-specific body size limits rather than expanding global settings.**

Keep the global default request body size at its secure value and register the `SecureMaxSize` middleware only on specific routers or routes that require handling larger payloads.

```rust
use salvo::prelude::*;
use salvo::http::SecureMaxSize;

#[handler]
async fn upload_handler(req: &mut Request) {}

let router = Router::with_path("/upload")
    .hoop(SecureMaxSize::new(10 * 1024 * 1024))
    .post(upload_handler);
```

**Rule 2: Apply explicit length constraints on character-based path parameters.**

When configuring path parameters using wisps like `CharsWispBuilder`, specify an explicit min and max range to prevent dynamic heap allocation issues from malicious inputs.

```rust
use salvo::prelude::*;

let router = Router::with_path("users/{id:num(1..=12)}");
```


### Limit Concurrent Connections and Request Timeouts

**Use when**

When initializing server acceptors and configuring timeout behaviors to protect against slow HTTP and connection exhaustion attacks.

**Secure rules**

**Rule 1: Configure maximum concurrent connections on the server.**

Apply the `max_connections` method during server initialization to limit active concurrent connections and defend against denial-of-service attacks.

```rust
use salvo_core::prelude::*;

#[tokio::main]
async fn main() {
    let acceptor = TcpListener::new("127.0.0.1:8698").bind().await;
    let server = Server::new(acceptor).max_connections(1000);
    server.serve(Router::new()).await;
}
```

**Rule 2: Configure strict timeouts for standard REST or JSON APIs.**

Opt for `FuseConfig::strict()` or explicitly configure idle, write-stall, and request body timeouts when serving applications that do not require long-lived streaming.

```rust
use std::time::Duration;
use salvo_core::fuse::FuseConfig;

let config = FuseConfig::strict();

let hardened_config = FuseConfig::default()
    .with_connection_idle_timeout(Duration::from_secs(60))
    .with_write_stall_timeout(Duration::from_secs(30))
    .with_request_body_timeout(Duration::from_secs(45));
```


## Category: secret handling

### Load Cryptographic Secret Keys and Session Secrets Securely at Runtime

**Use when**

When configuring authentication, session handlers, JWT decoders, or encrypted keys in Salvo applications.

**Secure rules**

**Rule 1: Use a cryptographically random session secret of at least 64 bytes**

Generate the secret passed to `SessionHandler` with a cryptographically secure random number generator. Salvo requires this secret to contain at least 64 bytes and uses it to derive the key that signs and verifies session cookies.

```rust
use rand::RngCore;
use salvo::session::{CookieStore, SessionHandler};

let mut secret = [0u8; 64];
rand::rngs::OsRng.fill_bytes(&mut secret);

let session_handler = SessionHandler::builder(
    CookieStore::new(),
    &secret,
)
.build()
.unwrap();
```


## Category: security control integrity

### Halt Execution on Authentication Failure in Custom Salvo Middleware

**Use when**

When writing custom authentication handlers or middleware in Salvo that need to reject unauthorized requests and prevent downstream handler execution.

**Secure rules**

**Rule 1: Call skip_rest() on FlowCtrl when an authentication failure occurs to halt the execution chain.**

When writing custom authentication handlers or middleware in Salvo, you must explicitly halt the routing execution chain on failure. Always retrieve the `FlowCtrl` parameter in your handler and call `ctrl.skip_rest()` immediately after setting the unauthorized response status to ensure Salvo does not continue executing downstream handlers in the routing table.

```rust
#[handler]
pub fn auth_middleware(res: &mut Response, ctrl: &mut FlowCtrl) {
    if !check_auth_header() {
        res.status_code(StatusCode::UNAUTHORIZED);
        res.render("Unauthorized Access");
        ctrl.skip_rest();
        return;
    }
}
```


## Category: session management

### Force Secure Cookie Attributes for Sessions Behind Upstream TLS Termination

**Use when**

Configuring session handling in Salvo applications deployed behind an upstream proxy or load balancer that terminates TLS.

**Secure rules**

**Rule 1: Explicitly force the secure attribute on session cookies when TLS is terminated upstream.**

By default, `SessionHandler` automatically detects whether to append the `Secure` flag based on the request URI scheme. When deployed behind an upstream proxy that terminates TLS, the local request may appear as unencrypted HTTP, causing Salvo to omit the `Secure` attribute. To prevent session cookies from being transmitted over unencrypted HTTP channels, explicitly configure the session handler builder with `secure_cookie(true)`.

```rust
use salvo::session::SessionHandler;
use saysion::MemoryStore;

let store = MemoryStore::new();
let secret = [0u8; 64];

let handler = SessionHandler::builder(store, &secret)
    .secure_cookie(true)
    .build()
    .unwrap();
```
