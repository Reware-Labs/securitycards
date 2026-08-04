# Security cards

Repository: `https://github.com/salvo-rs/salvo#v0.94.0`
Category: file handling

## file handling

### Configure Secure File Storage Roots and Path Containment in Salvo

**Use when**

Configuring static asset directories, file upload storage stores, or local file handling paths in Salvo applications.

**Secure rules**

**Rule 1: Isolate file storage and static asset directories to dedicated absolute paths with restrictive permissions.**

When configuring `DiskStore` for uploads or `StaticDir` for serving assets, always define a dedicated, isolated directory path using absolute paths rather than default relative locations. On Unix platforms, restrict file system permissions such as using `0700` modes on cache or storage directories so that only the application process owner can access sensitive contents.

```rust
use salvo_core::prelude::*;
use salvo_serve_static::StaticDir;

let router = Router::new().push(
    Router::with_path("static/{**}").get(
        StaticDir::new("/var/www/my-app/static-assets")
            .defaults("index.html")
    ),
);
```

**Rule 2: Validate and sanitize all user-supplied paths, filenames, and upload identifiers before filesystem operations.**

Verify that all user-supplied upload IDs are strictly validated using `is_safe_upload_id` and sanitize individual directory or filename components using `sanitize_path_component` before combining them into a full storage directory path to prevent path traversal.

```rust
let safe_component = sanitize_path_component(user_filename)
    .ok_or_else(|| ProtocolError::InvalidPath("Unsafe path component"))?;
let target_path = std::path::Path::new("/var/tmp/uploads").join(safe_component);
```
