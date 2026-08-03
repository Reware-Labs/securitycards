# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: output encoding

## output encoding

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
