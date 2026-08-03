# Security cards

Repository: `https://github.com/tokio-rs/axum#axum-v0.8.9`
Category: output encoding

## output encoding

### Escape untrusted input before rendering HTML responses

**Use when**

Rendering dynamic user-supplied data inside `Html` response types in Axum handlers.

**Secure rules**

**Rule 1: HTML-escape untrusted text before wrapping it in `Html` responses.**

Axum's `Html` response type sends content as `text/html` without performing automatic HTML escaping. Direct string formatting of user-controlled input into `Html` can expose application users to Cross-Site Scripting. User input must be explicitly escaped or processed using an HTML escaping library or secure templating engine prior to wrapping in `Html`.

```rust
use axum::response::Html;

async fn handler(ValidatedForm(input): ValidatedForm<NameInput>) -> Html<String> {
    let escaped_name = html_escape::encode_safe(&input.name);
    Html(format!("<h1>Hello, {}!</h1>", escaped_name))
}
```
