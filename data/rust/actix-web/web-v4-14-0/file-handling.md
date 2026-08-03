# Security cards

Repository: `https://github.com/actix/actix-web#web-v4.14.0`
Category: file handling

## file handling

### Safely Handle and Restrict File Paths During Static Asset Serving

**Use when**

Configuring static file serving or processing user-influenced file paths and uploads to prevent unauthorized file access, path traversal, and dotfile disclosure.

**Secure rules**

**Rule 1: Isolate static file services to dedicated asset directories rather than broad root paths.**

Avoid mounting file services against broad roots like `.` or directories containing application source code. Always mount static file services against dedicated, isolated directories specifically intended for public asset distribution.

```rust
use actix_web::App;
use actix_files::Files;

let app = App::new()
    .service(Files::new("/static", "./public").prefer_utf8(true));
```

**Rule 2: Keep hidden file serving disabled to prevent exposing sensitive dotfiles.**

Do not call `use_hidden_files()` on `Files` unless serving dotfiles is an explicit requirement, as default configurations properly restrict access to files and directories starting with a dot.

```rust
use actix_files::Files;
use actix_web::App;

let app = App::new()
    .service(
        Files::new("/static", "./static")
    );
```

**Rule 3: Implement path filters to block symbolic links and unauthorized paths.**

Use `.path_filter()` to enforce explicit path constraints and prevent symlink traversal before static files are retrieved from disk.

```rust
use std::path::Path;
use actix_files::Files;

let files_service = Files::new("/", "./static").path_filter(|path, _| {
    path.components().count() == 1
        && Path::new("./static")
            .join(path)
            .symlink_metadata()
            .map(|m| !m.file_type().is_symlink())
            .unwrap_or(false)
});
```
