# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: input interpretation safety

## input interpretation safety

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
