# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: input contract definition

## input contract definition

### Enforce Input and Parameter Constraints Using OpenAPI Validation Attributes

**Use when**

When defining request data transfer objects, parameters, and schema structures using Salvo's OpenAPI integration macros to ensure malformed input is rejected.

**Secure rules**

**Rule 1: Apply macro-driven validation attributes to enforce explicit structural and size boundaries on data structures.**

Decorate your request data transfer objects with schema constraints such as `min_length`, `max_length`, `pattern`, `minimum`, `maximum`, `max_items`, and `min_items` to restrict input values and formats directly at compile time.

```rust
#[derive(serde::Deserialize, salvo::oapi::ToSchema)]
pub struct RegisterUser {
    #[salvo(schema(min_length = 3, max_length = 30, pattern = "^[a-zA-Z0-9_]+$"))]
    pub username: String,
    #[salvo(schema(minimum = 18, maximum = 120))]
    pub age: u8
}
```

**Rule 2: Specify parameter boundaries within endpoint annotations for path and query inputs.**

Use parameter validation attributes supported by the `#[endpoint]` macro to enforce size, length, and pattern constraints on query and path parameters.

```rust
use salvo_core::prelude::*;
use salvo_oapi::endpoint;

#[endpoint(
    parameters(
        (
            "user_id" = String,
            Path,
            description = "The target user's UUID",
            max_length = 36,
            min_length = 36,
            pattern = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
        ),
        (
            "limit" = i32,
            Query,
            description = "Max number of items to fetch",
            minimum = 1,
            maximum = 100
        )
    )
)]
pub async fn get_user_data() {}
```

**Rule 3: Restrict parameter formats directly in route paths using wisps or regular expressions.**

Prevent unconstrained path parameters by utilizing built-in wisps like `{id:num}` or custom regular expressions registered via `PathFilter::register_wisp_regex` to centralize pattern matching.

```rust
use salvo_core::prelude::*;
use salvo_core::routing::filters::PathFilter;

#[handler]
async fn show_article(req: &mut Request) {
    let id = req.param::<i64>("id").unwrap();
}

let guid_regex = regex::Regex::new("[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}").unwrap();
PathFilter::register_wisp_regex("guid", guid_regex);

let router = Router::new()
    .push(Router::with_path("articles/{id:num}").get(show_article))
    .push(Router::with_path("users/{id:guid}").get(show_article));
```

**Rule 4: Apply explicit limits on collection fields using item count bounds.**

Specify explicit constraints like `max_items` and `min_items` on collection fields such as vectors or sets to prevent unbounded payload processing and resource exhaustion.

```rust
#[derive(salvo::oapi::ToSchema)]
struct BulkPayload {
    #[salvo(schema(max_items = 100, min_items = 1))]
    items: Vec<String>,
}
```
