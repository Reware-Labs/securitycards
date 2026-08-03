# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: access control

## access control

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
