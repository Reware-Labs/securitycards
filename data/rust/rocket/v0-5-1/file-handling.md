# Security cards

Repository: `https://github.com/rwf2/Rocket#v0.5.1`
Category: file handling

## file handling

### Prevent Path Traversal and Unauthorized File Access Using Rocket File Handling Mechanisms

**Use when**

When serving static assets, handling multi-segment dynamic paths, processing file uploads, or mapping user-supplied input to file system paths.

**Secure rules**

**Rule 1: Use Rocket's `PathBuf` segment guard or `FileServer` to safely handle multi-segment dynamic paths and prevent directory traversal attacks.**

When matching multi-segment dynamic paths for dynamic or static file serving, use Rocket's `PathBuf` segment guard or `FileServer`. Rocket's `FromSegments` implementation for `PathBuf` automatically sanitizes path components and prevents directory traversal attacks across dynamic segments.

```rust
use std::path::{Path, PathBuf};
use rocket::fs::NamedFile;
use rocket::fs::FileServer;

#[get("/<file..>")]
async fn files(file: PathBuf) -> Option<NamedFile> {
    NamedFile::open(Path::new("static/").join(file)).await.ok()
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/files", routes![files])
        .mount("/public", FileServer::from("/www/static"))
}
```

**Rule 2: Validate dynamic path parameters with `FromParam` to prevent path traversal.**

Do not pass unvalidated dynamic string path parameters (`&str`) directly into file system path operations. Instead, define custom request parameter types that implement `FromParam` to enforce strict character validation before constructing system paths.

```rust
use rocket::request::FromParam;

pub struct PasteId<'a>(&'a str);

impl<'a> FromParam<'a> for PasteId<'a> {
    type Error = &'a str;

    fn from_param(param: &'a str) -> Result<Self, Self::Error> {
        param.chars().all(|c| c.is_ascii_alphanumeric())
            .then(|| PasteId(param))
            .ok_or(param)
    }
}

#[get("/<id>")]
async fn retrieve(id: PasteId<'_>) -> Option<File> {
    File::open(id.file_path()).await.ok()
}
```

**Rule 3: Validate uploaded file extensions on `TempFile` form fields.**

When receiving uploaded files using Rocket's `TempFile` data type, enforce file type restrictions by attaching extension validation attributes such as `#[field(validate = ext(ContentType::PDF))]`.

```rust
#[derive(FromForm)]
struct Submission<'v> {
    #[field(validate = ext(ContentType::PDF))]
    file: TempFile<'v>,
}
```

**Rule 4: Serve static assets using compile-time relative path resolution.**

When serving static assets using Rocket's `FileServer`, specify path boundaries using the `relative!` macro to resolve asset directories relative to the crate manifest at compile time.

```rust
use rocket::fs::{FileServer, relative};

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", FileServer::from(relative!("static")))
}
```
