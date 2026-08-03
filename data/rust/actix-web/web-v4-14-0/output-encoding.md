# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: output encoding

## output encoding

### Prevent Cross-Site Scripting (XSS) by setting explicit content types and encoding output

**Use when**

Building HTTP responses, serving files, or returning string responders that include dynamic user data in Actix Web applications.

**Secure rules**

**Rule 1: Explicitly set attachment dispositions or non-executable content types when serving user files.**

When serving untrusted user files using `NamedFile`, explicitly force attachment disposition with `set_content_disposition` or override the content type to a non-executable type like `application/octet-stream` to prevent browsers from executing inline scripts.

```rust
use actix_files::NamedFile;
use actix_web::http::header::{ContentDisposition, DispositionType};

async fn serve_user_file() -> actix_web::Result<NamedFile> {
    let file = NamedFile::open_async("./uploads/user_doc.html").await?;
    Ok(file.set_content_disposition(ContentDisposition {
        disposition: DispositionType::Attachment,
        parameters: vec![],
    }))
}
```

**Rule 2: Specify explicit safe content types or structured builders for responses containing dynamic data.**

When building responses with `HttpResponseBuilder` or `ResponseBuilder`, explicitly specify strict MIME types like `mime::APPLICATION_JSON` or `mime::TEXT_PLAIN_UTF_8` for non-HTML payloads, or use structured builders like `.json()` to avoid MIME-sniffing vulnerabilities.

```rust
use actix_web::{HttpResponse, http::header};

pub async fn safe_text_response(user_input: String) -> HttpResponse {
    HttpResponse::Ok()
        .content_type(mime::TEXT_PLAIN_UTF_8)
        .body(user_input)
}
```

**Rule 3: HTML-encode user-supplied data before overriding response content types to HTML.**

Actix Web default string responders automatically set `text/plain`, preventing script execution. When using `.customize().insert_header(...)` or response builders to set `text/html`, strictly encode all user input using an HTML escaping library to prevent XSS.

```rust
use actix_web::{web, Responder, http::header};
use html_escape::encode_text;

async fn user_profile(username: web::Path<String>) -> impl Responder {
    let safe_name = encode_text(&username);
    let html_body = format!("<h1>User Profile</h1><p>Welcome, {}</p>", safe_name);

    html_body
        .customize()
        .insert_header((header::CONTENT_TYPE, "text/html; charset=utf-8"))
}
```
