# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: secret handling

## secret handling

### Redact Sensitive Headers and Credentials from Logs and Debug Output

**Use when**

When logging HTTP requests, client requests, or WebSocket connections containing sensitive credentials, bearer tokens, cookies, or authorization headers in Actix-web and `awc` applications.

**Secure rules**

**Rule 1: Avoid formatting or printing raw request objects or using unsafe logger format strings that expose sensitive headers**

Do not invoke Debug formatting on ClientRequest or WebsocketsRequest instances when they contain credentials or authorization headers, as this outputs raw sensitive tokens into log files. HttpRequest redacts Authorization, Proxy-Authorization, and Cookie header values, but prints other headers and the query string. Similarly, avoid configuring `Logger` format strings to directly print sensitive request headers or environment secrets, and use `custom_request_replace` to sanitize log output instead.

```rust
use actix_web::middleware::Logger;

let logger = Logger::new("%a \"%r\" %s %{AUTH_STATUS}xi")
    .custom_request_replace("AUTH_STATUS", |req| {
        if req.headers().contains_key("Authorization") {
            "present".to_string()
        } else {
            "missing".to_string()
        }
    });
```
