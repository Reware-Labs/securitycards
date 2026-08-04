# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: resource exhaustion

## resource exhaustion

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

Configure Rocket’s form, data-form, and relevant field-type limits to establish size bounds. `Capped<T>` only reports whether an existing limit truncated the value; when it is used, reject incomplete values with `is_complete()`.

```rust
use rocket::data::Capped;
use rocket::form::FromForm;

#[derive(FromForm)]
struct CommentForm<'r> {
    #[field(validate = len(..=4096))]
    comment: &'r str,
}
```
