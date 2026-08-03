# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: output encoding

## output encoding

### Escape untrusted dynamic data before rendering in HTML responses

**Use when**

Rendering dynamic variables retrieved from session states or flash messages into HTML responses using `Text::Html` in Salvo handlers.

**Secure rules**

**Rule 1: Render dynamic HTML values through an Askama HTML template**

`Text::Html` marks its supplied string as HTML but does not escape that string. When a response contains request parameters, flash-message values, or other dynamic strings, place those values in an Askama template configured for HTML escape mode, render the template, and pass the rendered result to `Text::Html`. Keep the `.html` or `ext = "html"` escape mode enabled rather than concatenating dynamic values directly into an HTML string.

This example requires `salvo = { version = "0.94.0", features = ["flash"] }`, `askama = "0.11"`, and Tokio with its macros feature.

```rust
use askama::Template;
use salvo::flash::{CookieStore, FlashDepotExt};
use salvo::prelude::*;

#[derive(Template)]
#[template(
    source = "<!doctype html><html><body><div class=\"alert\">{{ message }}</div></body></html>",
    ext = "html"
)]
struct FlashPage<'a> {
    message: &'a str,
}

#[handler]
async fn set_flash(req: &mut Request, depot: &mut Depot, res: &mut Response) {
    let message = req.param::<&str>("message").unwrap_or("Saved");
    depot.outgoing_flash_mut().info(message);
    res.render(Redirect::other("/get"));
}

#[handler]
async fn get_flash(depot: &mut Depot, res: &mut Response) {
    let message = depot
        .incoming_flash()
        .and_then(|flash| flash.iter().next())
        .map(|message| message.value.as_str())
        .unwrap_or("");

    let page = FlashPage { message };
    res.render(Text::Html(page.render().unwrap()));
}

#[tokio::main]
async fn main() {
    let router = Router::new()
        .hoop(CookieStore::new().into_handler())
        .push(Router::with_path("set/{message}").get(set_flash))
        .push(Router::with_path("get").get(get_flash));

    let acceptor = TcpListener::new("0.0.0.0:8698").bind().await;
    Server::new(acceptor).serve(router).await;
}
```
