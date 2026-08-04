# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: security control integrity

## security control integrity

### Configure and Order Middleware Fairings and Policies Correctly

**Use when**

When registering global fairings, custom Shield policies, and request/response interceptors in a Rocket application.

**Secure rules**

**Rule 1: Use request guards instead of request fairings for route-level access control.**

Do not implement route-level authentication or authorization checks inside request fairings because fairings cannot abort or respond to incoming requests during `on_request` callbacks. Enforce authorization using `FromRequest` request guards instead.

```rust
#[derive(Debug)]
struct AdminUser;

#[rocket::async_trait]
impl<'r> rocket::request::FromRequest<'r> for AdminUser {
    type Error = ();
    async fn from_request(req: &'r rocket::Request<'_>) -> rocket::request::Outcome<Self, Self::Error> {
        rocket::request::Outcome::Error((rocket::http::Status::Unauthorized, ()))
    }
}
```

**Rule 2: Declare all implemented callback hooks explicitly in the fairing info bitset.**

Ensure every `Fairing` implementation correctly declares all implemented callback hooks in `info().kind`. Omitting flags like `Kind::Request` or `Kind::Response` from `Info` will cause Rocket to silently bypass those callback implementations.

```rust
use rocket::fairing::{Fairing, Info, Kind};
use rocket::{Request, Response};

pub struct SecurityHeaders;

#[rocket::async_trait]
impl Fairing for SecurityHeaders {
    fn info(&self) -> Info {
        Info {
            name: "Security Headers Interceptor",
            kind: Kind::Response
        }
    }

    async fn on_response<'r>(&self, _req: &'r Request<'_>, res: &mut Response<'r>) {
        res.set_raw_header("X-Content-Type-Options", "nosniff");
    }
}
```

**Rule 3: Attach security middleware in sequential execution order.**

Attach fairings in a deterministic order using `Rocket::attach()`, placing state-modifying or request-sanitizing fairings before security-checking or logging fairings so subsequent fairings do not evaluate stale data.

```rust
#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(RequestNormalizerFairing)
        .attach(SecurityAuditFairing)
}
```

**Rule 4: Implement the Policy trait correctly for custom response header middleware.**

When creating custom security header policies by implementing the `Policy` trait for Rocket's `Shield` middleware, ensure `const NAME` accurately identifies the target HTTP header and `header(&self)` returns a well-formed `Header` value.

```rust
use rocket::http::Header;
use rocket::shield::Policy;

#[derive(Default)]
pub struct CustomCspPolicy;

impl Policy for CustomCspPolicy {
    const NAME: &'static str = "Content-Security-Policy";

    fn header(&self) -> Header<'static> {
        Header::new(Self::NAME, "default-src 'self'")
    }
}
```


### Ensure Singleton Fairings Are Attached Once to Prevent Security Control Replacement

**Use when**

Configuring global security fairings such as Shield during Rocket application initialization.

**Secure rules**

**Rule 1: Attach singleton security fairings exactly once during application ignition to prevent earlier configuration rules from being overwritten.**

When attaching singleton fairings that return `Kind::Singleton` like `Shield`, avoid multiple attachments because Rocket preserves only the last attached instance at ignition time. Consolidate all required policy rules into a single final attached instance to ensure global security controls remain active and correctly applied.

```rust
use rocket::shield::Shield;

#[launch]
fn rocket() -> _ {
    let shield = Shield::default();
    rocket::build().attach(shield)
}
```
