# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`

## Category: access control

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


## Category: api contract misuse

### Inspect Cookie Changes Using Pending State API

**Use when**

When developing route handlers in Rocket that mutate session or cookie state and need to inspect those modifications within the same request lifecycle.

**Secure rules**

**Rule 1: Use CookieJar::get_pending() instead of standard retrieval methods when querying uncommitted cookie mutations within the same request lifecycle.**

Standard cookie retrieval methods such as get() and get_private() only evaluate incoming request headers and cannot observe additions made during the current handler execution. Always invoke get_pending() to query modified or newly assigned session cookies correctly.

```rust
use rocket::http::{CookieJar, Cookie};

#[get("/session")]
fn update_session(jar: &CookieJar<'_>) {
    jar.add_private(("session", "new_token"));

    if let Some(cookie) = jar.get_pending("session") {
        assert_eq!(cookie.value(), "new_token");
    }
}
```


## Category: authentication

### Authenticate Clients Using Mutual TLS and Certificate Guards

**Use when**

When implementing transport-layer client identity verification and requiring valid cryptographic certificates for endpoint access.

**Secure rules**

**Rule 1: Mandate client certificate verification using Rocket mTLS configuration features**

Enable Rocket’s mtls dependency feature in Cargo.toml. Configure trusted CA certificates and mandatory = true separately in Rocket.toml.

```toml
[dependencies]
rocket = { version = "0.5.1", features = ["mtls"] }

[default.tls.mutual]
ca_certs = "path/to/ca_certs.pem"
mandatory = true
```

**Rule 2: Validate certificate guard outcomes securely within route handlers.**

Use `rocket::mtls::Certificate` request guards to enforce valid certificate chains, or handle custom `mtls::Result` variants explicitly to prevent unauthenticated access.

```rust
use rocket::mtls::{self, Certificate};

#[get("/protected")]
fn protected(cert: Certificate<'_>) {
    // Handler executes only when a valid client certificate was supplied.
}

#[get("/custom-check")]
fn custom_check(cert: mtls::Result<Certificate<'_>>) -> Result<String, &'static str> {
    match cert {
        Ok(valid_cert) => Ok(format!("Authenticated serial: {:?}", valid_cert.serial())),
        Err(_) => Err("Invalid client certificate presented"),
    }
}
```

**Rule 3: Inspect the leaf certificate in peer certificate chains during authentication**

Use Rocket’s public mtls::Certificate request guard, which exposes the validated leaf certificate, and authorize the client by checking expected subject, SAN, or serial-number values. Do not treat a nonempty raw certificate blob as proof of an authorized identity.

```rust
use rocket::http::private::Connection;

fn verify_client<C: Connection>(conn: &C) -> bool {
    if let Some(certs) = conn.peer_certificates() {
        if let Some(chain) = certs.chain_data() {
            if let Some(peer_cert) = chain.first() {
                return !peer_cert.0.is_empty();
            }
        }
    }
    false
}
```


## Category: boundary control

### Disable client IP header inspection when untrusted

**Use when**

Configuring Rocket applications that are directly internet-facing and not behind a trusted reverse proxy.

**Secure rules**

**Rule 1: Set ip_header = false unless Rocket is reachable only through a trusted reverse proxy that overwrites the configured client-IP header**

By default, Request::real_ip() reads X-Real-IP, and Request::client_ip() prefers it over the connection peer address. Keep this enabled only when Rocket cannot be reached directly and the trusted proxy removes or overwrites incoming X-Real-IP headers; otherwise, attackers can spoof the IP observed by application controls and rate limiters.

```toml
[release]
ip_header = false
```


## Category: configuration source integrity

### Configure worker thread limits through trusted Figment and environment sources

**Use when**

Configuring concurrency and worker thread parameters for Rocket applications using `Config::figment()` or trusted environment variables.

**Secure rules**

**Rule 1: Set the `workers` configuration parameter only through trusted sources such as `ROCKET_WORKERS` or `Rocket.toml` evaluated via `Config::figment()`.**

Ensure that concurrency parameters like `workers` are configured strictly through trusted channels like `ROCKET_WORKERS` or `Rocket.toml` evaluated via `Config::figment()`, as dynamic custom provider merges or runtime configuration updates are ignored by Rocket due to async runtime initialization constraints.

```rust
let figment = rocket::Config::figment();
rocket::custom(figment);
```


## Category: cryptography

### Initialize Secret Keys with Sufficient Cryptographic Entropy

**Use when**

Instantiating or configuring secret keys manually in the application configuration using Rocket's secret key management.

**Secure rules**

**Rule 1: Provide sufficiently long cryptographically secure random byte slices when manually instantiating `SecretKey`.**

When manually instantiating `SecretKey` using `SecretKey::from` or `SecretKey::derive_from`, ensure the source byte slices meet minimum length requirements such as 64 bytes for a master key and originate from a cryptographically secure random source to prevent application panic and ensure strong cryptographic protection.

```rust
use rocket::config::SecretKey;

let mut master = [0u8; 64];
let key = SecretKey::from(&master);
```


## Category: csrf

### Enforce SameSite Cookie Policies and Protect Method-Overridden Endpoints Against CSRF

**Use when**

Configuring session cookies and handling state-changing requests or method-overridden endpoints in Rocket.

**Secure rules**

**Rule 1: Maintain SameSite::Strict cookie attributes or explicitly configure strict or lax policies to prevent CSRF attacks.**

Rocket automatically defaults the `SameSite` attribute on cookies added via `CookieJar::add` and `CookieJar::add_private` to `SameSite::Strict`. When configuring custom cookies or modifying cookie properties, maintain `SameSite::Strict` or `SameSite::Lax` and avoid configuring `SameSite::None` unless cross-site request handling is required and backed by anti-CSRF tokens.

```rust
use rocket::http::{Cookie, SameSite, CookieJar};

#[get("/")]
fn handler(jar: &CookieJar<'_>) {
    // Automatically receives SameSite::Strict by default
    jar.add(("session_id", "secret_value"));

    // Explicitly set SameSite::Strict on custom cookies
    let cookie = Cookie::build(("session_id", "secret_value"))
        .same_site(SameSite::Strict)
        .path("/");
    jar.add(cookie);
}
```

**Rule 2: Apply explicit anti-CSRF protection to non-POST routes that handle method overrides**

During request preprocessing, Rocket v0.5.1 rewrites a POST only when its content type is application/x-www-form-urlencoded and its first form field, within the 32-byte body peek, is _method with a valid HTTP method value such as PUT, PATCH, or DELETE. Because standard browser HTML forms can easily issue cross-origin POST requests with a `_method` field, state-changing routes such as #[put], #[patch], and #[delete] remain vulnerable to Cross-Site Request Forgery and must enforce the same anti-CSRF token or origin validation as state-changing POST routes; SameSite=Strict authentication cookies are defense in depth, not a universal substitute.


## Category: deserialization

### Exclude server-managed structural fields and validate bounds during deserialization

**Use when**

Deserializing untrusted payloads into domain or model structures using Serde where primary keys or status codes are present.

**Secure rules**

**Rule 1: Ignore client-supplied primary keys during deserialization using Serde attributes.**

Annotate server-assigned structural fields like primary keys with `#[serde(skip_deserializing)]` on request body models to prevent clients from overriding identity fields or executing parameter tampering.

```rust
#[derive(Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
struct Post {
    #[serde(skip_deserializing, skip_serializing_if = "Option::is_none")]
    id: Option<i64>,
    title: String,
    text: String,
}
```

**Rule 2: Validate HTTP status code bounds during deserialization or manual instantiation.**

Rely on Serde's built-in range check when deserializing `Status` or validate raw integer codes using `Status::from_code()` to avoid violating HTTP standards and causing unexpected errors.

```rust
use rocket::http::Status;
use serde::Deserialize;

#[derive(Deserialize)]
struct StatusPayload {
    status: Status,
}

fn parse_raw_code(code: u16) -> Option<Status> {
    Status::from_code(code)
}
```


## Category: escape hatch

### Use Rocket Macro Attribute Routing Instead of Manual Routing

**Use when**

Defining web routes and handling parameters in a Rocket application.

**Secure rules**

**Rule 1: Use Rocket's standard attribute macros and request guards rather than manual routing.**

Manual routing bypasses Rocket's macro code generation and request parsing mechanisms, acting as an escape hatch that removes automatic parameter validation and type-checking security guarantees. Always prefer attribute macros like `#[get]` or `#[post]` to define routes securely.

```rust
#[get("/item/<id>")]
fn get_item(id: u64) -> String {
    format!("Item {}", id)
}
```


## Category: file handling

### Prevent Path Traversal and Unauthorized File Access Using Rocket File Handling Mechanisms

**Use when**

When serving static assets, handling multi-segment dynamic paths, processing file uploads, or mapping user-supplied input to file system paths.

**Secure rules**

**Rule 1: Use Rocket's `PathBuf` segment guard or `FileServer` to safely handle multi-segment dynamic paths and prevent directory traversal attacks.**

When matching multi-segment dynamic paths for dynamic or static file serving, use Rocket's `PathBuf` segment guard or `FileServer`. Rocket's `FromSegments` implementation for `PathBuf` automatically sanitizes path components and prevents directory traversal attacks across dynamic segments.

```rust
use std::path::{Path, PathBuf};
use rocket::fs::NamedFile;
use rocket::fs::FileServer;

#[get("/<file..>")]
async fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("static/").join(file)).await.ok()
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/files", routes![files])
        .mount("/public", FileServer::from("/www/static"))
}
```

**Rule 2: Validate dynamic path parameters with `FromParam` to prevent path traversal.**

Do not pass unvalidated dynamic string path parameters (`&str`) directly into file system path operations. Instead, define custom request parameter types that implement `FromParam` to enforce strict character validation before constructing system paths.

```rust
use rocket::request::FromParam;

pub struct PasteId<'a>(&'a str);

impl<'a> FromParam<'a> for PasteId<'a> {
    type Error = &'a str;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
        param.chars().all(|c| c.is_ascii_alphanumeric())
            .then(|| PasteId(param))
            .ok_or(param)
    }
}

#[get("/<id>")]
async fn retrieve(id: PasteId<'_>) -> Option<File> {
    File::open(id.file_path()).await.ok()
}
```

**Rule 3: Validate uploaded file extensions on `TempFile` form fields.**

When receiving uploaded files using Rocket's `TempFile` data type, enforce file type restrictions by attaching extension validation attributes such as `#[field(validate = ext(ContentType::PDF))]`.

```rust
#[derive(FromForm)]
struct Submission<'v> {
    #[field(validate = ext(ContentType::PDF))]
    file: TempFile<'v>,
}
```

**Rule 4: Serve static assets using compile-time relative path resolution.**

When serving static assets using Rocket's `FileServer`, specify path boundaries using the `relative!` macro to resolve asset directories relative to the crate manifest at compile time.

```rust
use rocket::fs::{FileServer, relative};

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", FileServer::from(relative!("static")))
}
```


## Category: injection

### Use parameterized queries when querying databases with rocket_db_pools

**Use when**

When executing database queries via `rocket_db_pools` and SQL drivers like `sqlx` in Rocket request handlers.

**Secure rules**

**Rule 1: Bind untrusted request parameters safely using query placeholders instead of string formatting or concatenation.**

Always use parameterized query placeholders and parameter binding methods such as `sqlx::query` with `.bind()` or compile-time macros like `sqlx::query!` rather than formatting or concatenating untrusted request inputs directly into SQL strings. This protects your application against SQL injection vulnerabilities.

```rust
#[get("/")]
async fn read(mut db: Connection<Logs>, id: i64) -> Option<String> {
    sqlx::query("SELECT content FROM logs WHERE id = ?")
        .bind(id)
        .fetch_one(&mut **db)
        .await
        .and_then(|r| Ok(r.try_get(0)?))
        .ok()
}
```


## Category: input contract definition

### Enforce Strict Validation and Input Constraints on Form Structs

**Use when**

Defining form structs and validating incoming form and query parameters using Rocket's `#[derive(FromForm)]` attribute and `#[field(validate = ...)]` annotations.

**Secure rules**

**Rule 1: Enforce strict field-level validation rules using built-in or custom validators on derived form structs.**

Annotate form struct fields with `#[field(validate = ...)]` using built-in validators or custom validation functions to ensure input data conforms strictly to expected formats before handler processing.

```rust
use rocket::form::FromForm;

#[derive(FromForm)]
struct AccountUpdate<'r> {
    #[field(validate = len(3..20))]
    username: &'r str,
    #[field(validate = omits(".."))]
    relative_path: &'r str,
}
```

**Rule 2: Validate custom form field names to prevent parameter parsing ambiguity.**

Ensure custom field names defined using `#[field(name = "...")]` or `#[field(value = "...")]` use valid ASCII graphic characters excluding reserved query and form delimiters.

```rust
use rocket::form::FromForm;

#[derive(FromForm)]
pub struct UserSettings {
    #[field(name = "user_email")]
    pub email: String,
    #[field(name = "is_active")]
    pub active: bool,
}
```

**Rule 3: Parse URIs using explicit target types to prevent structural ambiguity.**

Use explicit typed parsing methods such as `Uri::parse::<Origin>()` instead of `Uri::parse_any()` to ensure incoming input strictly conforms to the intended URI variant.

```rust
use rocket::http::uri::{Uri, Origin};

let uri = Uri::parse::<Origin>("/api/v1/resource?id=123").expect("valid origin URI");
if let Some(origin) = uri.origin() {
    assert_eq!(origin.path(), "/api/v1/resource");
}
```


## Category: input driven boundary selection

### Use the uri! macro to validate and construct redirect targets

**Use when**

Building HTTP redirect responses where untrusted input or dynamic values might otherwise be passed directly into redirect constructors.

**Secure rules**

**Rule 1: Always construct route URIs using the uri! macro or validate external destination URIs against a strict allowlist before creating a redirect.**

When constructing HTTP redirects using `Redirect::to`, `Redirect::temporary`, `Redirect::permanent`, `Redirect::found`, or `Redirect::moved`, avoid passing unvalidated dynamic strings or unescaped user input into redirect constructors. Use the `uri!` macro to type-check and securely construct internal redirects.

```rust
use rocket::response::Redirect;

#[get("/hello/<name>/<age>")]
fn hello(name: String, age: u8) -> String {
    format!("Hello, {} year old named {}!", age, name)
}

#[get("/hi/<name>/<age>")]
fn hi(name: String, age: u8) -> Redirect {
    Redirect::to(uri!(hello(name, age)))
}
```


## Category: input interpretation safety

### Normalize and Validate Untrusted URIs and Inputs in Rocket

**Use when**

Parsing, decoding, normalizing, or validating untrusted URIs, query strings, and input parameters to prevent path ambiguity, parser differentials, and validation bypasses.

**Secure rules**

**Rule 1: Normalize absolute URIs before routing or access control checks**

When parsing dynamic or external absolute URI strings using `Absolute::parse` or `Absolute::parse_owned`, normalize the resulting URI structure with `into_normalized()` or verify its state using `is_normalized()` before passing it to routing, proxying, or access control checks.

```rust
use rocket::http::uri::Absolute;

fn process_external_uri(input: String) -> Result<Absolute<'static>, String> {
    let uri = Absolute::parse_owned(input).map_err(|e| e.to_string())?;
    Ok(uri.into_normalized())
}
```

**Rule 2: Normalize URI references before making access or routing decisions**

When parsing dynamic or untrusted strings into `Reference` instances using `Reference::parse` or `Reference::parse_owned`, normalize the URI using `normalize()` or `into_normalized()` before performing path validation, authorization checks, or redirect decisions.

```rust
use rocket::http::uri::Reference;

fn validate_and_extract_path(raw_url: &str) -> Result<String, &'static str> {
    let uri = Reference::parse(raw_url).map_err(|_| "invalid URI")?;
    let normalized_uri = uri.into_normalized();

    Ok(normalized_uri.path().as_str().to_string())
}
```

**Rule 3: Decode and validate raw strings before use**

Avoid accessing raw HTTP message content directly via `RawStr::as_str()` or `RawStr::as_uncased_str()` unless input safe-handling is guaranteed. Always decode and validate HTTP message parameters using specific conversion methods like `RawStr::url_decode()` or `RawStr::percent_decode()` before passing data to application logic.

```rust
use rocket::http::RawStr;

let raw: &RawStr = RawStr::new("Hello%2C+world%21");
let decoded = raw.url_decode().expect("valid UTF-8 input");
assert_eq!(decoded, "Hello, world!");
```

**Rule 4: Validate URI strings fully without unparsed trailing bytes**

Rely on Rocket's built-in URI parsing methods such as `Uri::parse` or `Origin::parse` instead of manual string slicing or loose regexes to guarantee that trailing unvalidated characters or malformed authorities are rejected.

```rust
use rocket::http::uri::Origin;

fn parse_request_target(input: &str) -> Result<String, String> {
    let origin = Origin::parse(input)
        .map_err(|e| format!("Malformed URI origin: {}", e))?;
    Ok(origin.path().to_string())
}
```

**Rule 5: Validate HTTP status codes during configuration deserialization**

Deserialize configuration values into Status to reject non-integer codes and values outside 100..600. Status still accepts unregistered codes within that range; when logic requires a registered status or specific class, additionally validate with Status::from_code(status.code) or status.class().

```rust
use rocket::http::Status;
use figment::Figment;

let status: Result<Status, _> = config_figment.extract_inner("status_code");
let valid_status = status.expect("status_code must be an integer from 100 through 599");
```


## Category: interface protocol hardening

### Use Typed Responders and Dedicated Status Types for Protocol-Mandated Headers

**Use when**

When crafting HTTP responses in Rocket that require protocol-level headers or when registering protocol upgrade handlers.

**Secure rules**

**Rule 1: Use dedicated typed responders instead of bare tuples to ensure protocol headers are properly enforced.**

When returning responses that require specific protocol-level headers, such as authentication challenges or redirect targets, avoid returning bare tuples. Use dedicated types in `rocket::response::status` to guarantee that required HTTP headers accompany status codes.

```rust
use rocket::response::status;

#[get("/protected")]
fn protected() -> status::Unauthorized<&'static str> {
    status::Unauthorized(Some("Realm or auth prompt details"))
}
```

**Rule 2: Do not manually configure protocol upgrade status codes or headers.**

When registering protocol upgrade handlers using `Response::build().upgrade(...)`, rely on Rocket to automatically validate upgrade headers and assign status codes. Avoid manually setting `101 Switching Protocols` or injecting connection upgrade headers directly.

```rust
use std::pin::Pin;
use rocket::Response;
use rocket::http::Status;
use rocket::data::{IoHandler, IoStream};
use rocket::tokio::io;

struct EchoHandler;

#[rocket::async_trait]
impl IoHandler for EchoHandler {
    async fn io(self: Pin<Box<Self>>, io: IoStream) -> io::Result<()> {
        let (mut reader, mut writer) = io::split(io);
        io::copy(&mut reader, &mut writer).await?;
        Ok(())
    }
}

let response = Response::build()
    .status(Status::BadRequest)
    .upgrade("raw-echo", EchoHandler)
    .streamed_body(std::io::Cursor::new("Protocol upgrade failed or not requested."))
    .finalize();
```


## Category: network boundary

### Configure trusted reverse proxy headers for client IP determination

**Use when**

When deploying a Rocket application behind a reverse proxy or load balancer and handling client IP addresses for network boundary enforcement.

**Secure rules**

**Rule 1: Ensure upstream reverse proxies sanitize incoming client-supplied IP headers to prevent IP spoofing.**

Because `Request::client_ip()` and `Request::real_ip()` rely on HTTP headers such as `ip_header`, an attacker can forge these headers if the application is directly exposed or if the upstream proxy fails to strip incoming values. Configure your upstream reverse proxy to strip incoming client-supplied headers and ensure trusted proxy boundaries are maintained.

```rust
#[get("/")]
fn index(client_ip: Option<std::net::IpAddr>) {
    if let Some(ip) = client_ip {
        // Handled IP derived from configured ip_header or remote socket fallback
    }
}
```


## Category: output encoding

### Escape HTML content when rendering RawHtml responses

**Use when**

When rendering dynamic or user-controlled content inside `rocket::response::content::RawHtml` responses.

**Secure rules**

**Rule 1: Always escape user-supplied inputs before inserting them into RawHtml responses to prevent Cross-Site Scripting.**

Since `rocket::response::content::RawHtml` streams string content directly as HTML without performing output escaping, you must explicitly encode untrusted data using an HTML escaping library or template engine before wrapping it in `RawHtml`.

```rust
#[catch(404)]
fn safe_not_found(request: &rocket::Request<'_>) -> rocket::response::content::RawHtml<String> {
    let safe_uri = html_escape::encode_text(&request.uri().to_string());
    rocket::response::content::RawHtml(format!("<p>Path '{}' was not found.</p>", safe_uri))
}
```


## Category: resource exhaustion

### Configure Request Data Limits and Capped Wrappers to Mitigate Resource Exhaustion

**Use when**

Configuring global data limits, handling file uploads, or processing incoming streams and form payloads in Rocket applications.

**Secure rules**

**Rule 1: Set explicit size limits for incoming payload types using Rocket's configuration parameters.**

Define application limits under `[default.limits]` in `Rocket.toml` to prevent unrestricted request payload sizes from exhausting server memory and disk space.

```toml
[default.limits]
form = "64 kB"
json = "1 MiB"
msgpack = "2 MiB"
"file/jpg" = "5 MiB"
```

**Rule 2: Specify an explicit byte limit when opening data streams and wrap dynamic uploads in capped types.**

When processing raw request body data using Rocket's `Data` guard, specify an explicit byte limit when invoking `Data::open()` or wrap file uploads in `Capped<TempFile<'_>>` to inspect truncation status and prevent resource exhaustion.

```rust
use rocket::data::{Data, ToByteUnit};

#[post("/", data = "<paste>")]
async fn upload(paste: Data<'_>) -> std::io::Result<String> {
    let id = PasteId::new(3);
    paste.open(128.kibibytes()).into_file(id.file_path()).await?;
    Ok(uri!(HOST, retrieve(id)).to_string())
}
```

**Rule 3: Cap form string and byte field sizes against resource exhaustion**

Configure Rocket’s form, data-form, and relevant field-type limits to establish size bounds. Capped<T> only reports whether an existing limit truncated the value; when it is used, reject incomplete values with is_complete().

```rust
use rocket::data::Capped;
use rocket::form::FromForm;

#[derive(FromForm)]
struct CommentForm<'r> {
    #[field(validate = len(..=4096))]
    comment: &'r str,
}
```


## Category: runtime environment hardening

### Disable Development Mode and Configure Production TLS Profiles

**Use when**

Configuring the Rocket application for production deployment to ensure secure runtime settings and default protective header injection.

**Secure rules**

**Rule 1: Compile and run the Rocket application in a non-debug profile with TLS enabled in production.**

Rocket automatically injects `Strict-Transport-Security` (HSTS) headers and applies default protective headers only when TLS is configured and running in a non-debug profile such as release mode. Developers must ensure TLS credentials and the non-debug compilation profile are active in production environments to rely on these built-in runtime security mechanisms.


## Category: secret handling

### Secure Secret Keys and Protect Private Cookie Data in Rocket

**Use when**

Configuring cryptographic secret keys, handling encrypted private cookies, and managing sensitive authentication tokens or credentials in Rocket applications.

**Secure rules**

**Rule 1: Configure a persistent, high-entropy 256-bit secret key in Rocket configuration for non-debug and release environments.**

Always configure an explicit `secret_key` in your Rocket configuration or environment variables when deploying applications or using private cookie methods like `add_private`, `get_private`, and `remove_private`. Avoid relying on auto-generated ephemeral keys in production environments to prevent session invalidation and ensure cryptographic integrity.

```toml
[default]
secret_key = "<your-base64-encoded-256-bit-key>"
```

**Rule 2: Use CookieJar::get_private to retrieve and decrypt confidential cookie data.**

When working with private cookies encrypted via `CookieJar::add_private()`, developers must explicitly call `CookieJar::get_private()` to retrieve and decrypt the value. Standard `CookieJar::get()` returns raw ciphertext rather than the decrypted plaintext.

```rust
use rocket::http::{Cookie, CookieJar};
use rocket::{get, post};

#[post("/login")]
fn login(jar: &CookieJar<'_>) {
    jar.add_private(Cookie::new("user_session", "secret_session_token"));
}

#[get("/dashboard")]
fn dashboard(jar: &CookieJar<'_>) -> String {
    match jar.get_private("user_session") {
        Some(cookie) => format!("Session active for: {}", cookie.value()),
        None => "Unauthorized access".into(),
    }
}
```

**Rule 3: Avoid placing sensitive data in flash messages**

Do not include secrets, authentication tokens, passwords, or sensitive personal data in Flash messages. Rocket v0.5.1 always stores the message and kind in the public, unencrypted, unsigned _flash cookie; enabling Rocket’s secrets feature does not make this cookie private.

```rust
use rocket::response::{Flash, Redirect};

#[post("/login")]
fn login() -> Flash<Redirect> {
    Flash::error(Redirect::to(uri!(index)), "Invalid username or password.")
}
```


## Category: security control integrity

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


## Category: session management

### Secure and manage session states using Rocket CookieJar mechanisms

**Use when**

Developing authentication, session management, or stateful cookie handling features using Rocket's `CookieJar`.

**Secure rules**

**Rule 1: Use private encrypted cookies for storing sensitive session identifiers and user state.**

When storing session identifiers or authenticated user state in HTTP cookies using Rocket's `CookieJar`, use private cookies via `add_private`, `get_private`, and `remove_private`. Private cookies provide authenticated encryption, protecting sensitive session tokens from client-side tampering, forgery, or eavesdropping.

```rust
#[post("/login", data = "<login>")]
fn post_login(jar: &CookieJar<'_>, login: Form<Login<'_>>) -> Result<Redirect, Flash<Redirect>> {
    if login.username == "Sergio" && login.password == "password" {
        jar.add_private(("user_id", "1"));
        Ok(Redirect::to(uri!(index)))
    } else {
        Err(Flash::error(Redirect::to(uri!(login_page)), "Invalid credentials."))
    }
}

#[post("/logout")]
fn logout(jar: &CookieJar<'_>) -> Flash<Redirect> {
    jar.remove_private("user_id");
    Flash::success(Redirect::to(uri!(login_page)), "Successfully logged out.")
}
```

**Rule 2: Explicitly match path and domain attributes when invalidating or removing session cookies.**

When invalidating session cookies using `jar.remove()` or `jar.remove_private()`, explicitly match the `path` and `domain` attributes with which the original cookie was set. Browsers strictly reject cookie removal headers if the `path` or `domain` attributes do not exactly match the original cookie.

```rust
use rocket::http::{Cookie, CookieJar};

#[post("/logout")]
fn logout(jar: &CookieJar<'_>) {
    jar.remove_private(Cookie::build("session").path("/app"));
}
```

**Rule 3: Explicitly configure transient expiration for private session cookies.**

When issuing encrypted or authenticated session state using `CookieJar::add_private()`, ensure expiration behavior is intentionally set. Explicitly setting `.expires(None)` on the `CookieBuilder` creates a transient session cookie that is cleared when the user agent closes, ensuring sensitive session identifiers do not persist unnecessarily on client disk storage.

```rust
use rocket::http::{CookieJar, Cookie};

#[rocket::get("/session")]
fn create_session(jar: &CookieJar<'_>) {
    jar.add_private(Cookie::build(("session_id", "encrypted_session_val")).expires(None));
}
```

**Rule 4: Manage session cookies inside error catchers to clear stale session tokens.**

When handling security-relevant failure states such as authentication or authorization errors, developers should explicitly manipulate cookies directly through `request.cookies()` to invalidate expired session tokens or convey state safely, accounting for automatic cookie delta resets during error dispatch.

```rust
#[catch(401)]
fn unauthorized(request: &rocket::Request) -> &'static str {
    request.cookies().remove("session_id");
    "401 Unauthorized"
}
```
