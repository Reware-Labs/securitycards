# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: boundary control

## boundary control

### Restrict Route Registration Order and Segment Boundaries to Enforce Request Boundaries

**Use when**

When registering routes, scopes, and dynamic path segments in Actix-web applications to ensure requests are routed through proper security boundaries.

**Secure rules**

**Rule 1: Order specific route and service registrations before broader patterns and static file catch-alls.**

Ensure that specific application routes and API services are registered before mounting broader prefix matching or catch-all static file services like `Files::new`. Registering broad catch-alls or generic scope prefixes first causes request matching to short-circuit prematurely, shadowing specialized handlers and bypassing route-specific security checks.

```rust
use actix_web::{web, App, HttpResponse, Responder};
use actix_files::Files;

async fn api_handler() -> impl Responder {
    HttpResponse::Ok().body("OK")
}

let app = App::new()
    .route("/api/health", web::get().to(api_handler))
    .service(Files::new("/", "./static").index_file("index.html"));
```

**Rule 2: Restrict custom dynamic segment patterns to prevent path traversal across segments.**

When defining custom dynamic segment patterns using the `{name:regex}` syntax, ensure the regular expression explicitly restricts matched characters and does not inadvertently match slash `/` characters. Allowing slashes inside custom dynamic segment regexes permits input to cross segment boundaries and bypass route scoping controls.

```rust
use actix_router::ResourceDef;

let resource = ResourceDef::new(r"/user/{id:\d+}");
assert!(resource.is_match("/user/123"));
assert!(!resource.is_match("/user/123/details"));
```
