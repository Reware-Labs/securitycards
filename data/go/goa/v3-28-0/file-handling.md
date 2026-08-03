# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: file handling

## file handling

### Restrict static file route definitions to public asset directories

**Use when**

When configuring static file serving and asset routing using Goa's design DSL.

**Secure rules**

**Rule 1: Restrict target filesystem paths strictly to dedicated public static directories and avoid pointing to root or internal application directories.**

When using the `Files` DSL function to configure static file serving, ensure target paths point specifically to safe assets folders rather than broad file system roots or internal directories to prevent exposing sensitive files.

```go
var _ = Service("web", func() {
    // Serve assets strictly from a dedicated static assets folder
    Files("/assets/{*path}", "./public/assets")
    // Serve specific safe index file
    Files("/", "./public/index.html")
})
```
