# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: input contract definition

## input contract definition

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
