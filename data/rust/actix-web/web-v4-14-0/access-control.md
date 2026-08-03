# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: access control

## access control

### Enforce access control using guards, resource constraints, and middleware

**Use when**

Enforcing access control, permissions, and request filtering across routes, resources, scopes, and middleware handlers in Actix Web.

**Secure rules**

**Rule 1: Restrict access to endpoints using route-level guards and middleware wraps**

Attach custom guard functions or authorization middleware directly to route macros using `guard = "..."` and `wrap = "..."` to ensure requests are filtered before reaching the handler function.

```rust
use actix_web::{get, guard, HttpResponse, Responder};

fn admin_guard(ctx: &guard::GuardContext) -> bool {
    ctx.head().headers().contains_key("x-admin-token")
}

#[get("/admin", guard = "admin_guard", wrap = "actix_web::middleware::Logger")]
async fn admin_panel() -> impl Responder {
    HttpResponse::Ok().body("Admin Panel")
}
```

**Rule 2: Enforce request prerequisites uniformly using resource and scope guards**

Use `Resource::guard()` and `Scope::guard(...)` to enforce security constraints, headers, or policy checks uniformly across all nested resources and services within a path prefix or resource pattern.

```rust
use actix_web::{web, guard, App, HttpResponse};

let app = App::new().service(
    web::scope(
        "/admin"
    )
    .guard(guard::Header("X-Admin-Token", "secret"))
    .route("/dashboard", web::get().to(|| HttpResponse::Ok()))
);
```

**Rule 3: Short-circuit unauthorized requests in custom function middleware**

Use `from_fn` middleware to short-circuit unauthorized requests early by returning an error or early response via `req.into_response(...)` without executing `next.call(req)`.

```rust
async fn authorize_request(
    req: ServiceRequest,
    next: Next<impl MessageBody + 'static>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    if !is_authorized(&req) {
        return Ok(req.into_response(HttpResponse::Unauthorized().finish()).map_into_right_body());
    }
    let res = next.call(req).await?;
    Ok(res.map_into_left_body())
}
```
