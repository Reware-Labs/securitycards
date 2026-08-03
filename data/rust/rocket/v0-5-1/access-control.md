# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: access control

## access control

### Enforce Authorization and Access Control with Rocket Request Guards

**Use when**

Use when implementing custom authentication, role checks, or ownership validation for Rocket route handlers to prevent unauthorized access.

**Secure rules**

**Rule 1: Return explicit error outcomes from custom request guards on authorization failure.**

When implementing `FromRequest` for authorization, return `Outcome::Error` with an appropriate HTTP status code like `Status::Forbidden` rather than `Outcome::Forward` to prevent Rocket from falling back to lower-ranked or unauthenticated routes.

```rust
use rocket::request::{FromRequest, Request, Outcome};
use rocket::http::Status;

struct AdminUser;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminUser {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        if is_admin(req) {
            Outcome::Success(AdminUser)
        } else {
            Outcome::Error((Status::Forbidden, ()))
        }
    }
}
```

**Rule 2: Use request guards instead of fairings for route-level access control.**

Enforce authentication and authorization using request guards and data guards rather than fairings, as fairings execute globally and cannot directly terminate or respond to incoming requests during the `on_request` callback.

```rust
use rocket::request::{FromRequest, Outcome, Request};

struct ApiKey<'r>(&'r str);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ApiKey<'r> {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        match req.headers().get_one("X-API-Key") {
            Some(key) if key == "valid_key" => Outcome::Success(ApiKey(key)),
            _ => Outcome::Error((rocket::http::Status::Unauthorized, ()))
        }
    }
}

#[get("/sensitive")]
fn sensitive_endpoint(_key: ApiKey<'_>) -> &'static str {
    "Secure payload"
}
```


### Implement CORS Headers and Preflight Handling Using Response Fairings

**Use when**

Developing web applications or APIs with Rocket that require secure cross-origin resource sharing (CORS) configurations and proper handling of HTTP OPTIONS preflight requests.

**Secure rules**

**Rule 1: Inspect incoming request headers such as `Origin` and validate them against an explicit allowlist rather than setting unrestricted origins on sensitive or authenticated endpoints.**

Attach an `AdHoc::on_response` fairing to the Rocket builder instance to inspect incoming `Origin` headers and append validated CORS headers to the mutable response.

```rust
use rocket::fairing::AdHoc;
use rocket::http::Header;

pub fn cors_fairing() -> AdHoc {
    AdHoc::on_response("CORS Management", |req, res| Box::pin(async move {
        if let Some(origin) = req.headers().get_one("Origin") {
            if origin == "https://app.example.com" {
                res.set_header(Header::new("Access-Control-Allow-Origin", origin));
                res.set_header(Header::new("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"));
                res.set_header(Header::new("Access-Control-Allow-Headers", "Content-Type, Authorization"));
                res.set_header(Header::new("Vary", "Origin"));
            }
        }
    }))
}
```

**Rule 2: Handle unhandled OPTIONS preflight requests by checking for `Status::NotFound` and injecting appropriate CORS headers and success status**

Implement a custom response fairing using `Kind::Response` to check if `req.method()` is `Method::Options` and `res.status()` is `Status::NotFound`, then set the necessary headers and update the status code.

```rust
use rocket::{Request, Response};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};

pub struct Cors;

#[rocket::async_trait]
impl Fairing for Cors {
    fn info(&self) -> Info {
        Info {
            name: "CORS Preflight Fairing",
            kind: Kind::Response
        }
    }

    async fn on_response<'r>(&self, req: &'r Request<'_>, res: &mut Response<'r>) {
        if req.headers().get_one("Origin") == Some("https://app.example.com") {
    res.set_header(Header::new("Access-Control-Allow-Origin", "https://app.example.com"));
    res.set_header(Header::new("Access-Control-Allow-Methods", "POST, GET, PATCH, OPTIONS"));
    res.set_header(Header::new("Access-Control-Allow-Headers", "Content-Type, Authorization"));
    res.set_header(Header::new("Vary", "Origin"));

    if req.method() == Method::Options && res.status() == Status::NotFound {
        res.set_status(Status::Ok);
    }
}
    }
}
```
