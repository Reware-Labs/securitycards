# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: input driven boundary selection

## input driven boundary selection

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
