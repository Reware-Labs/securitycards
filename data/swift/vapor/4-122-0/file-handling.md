# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: file handling

## file handling

### Restrict FileMiddleware Public Directory to Dedicated Static Folders

**Use when**

Configuring `FileMiddleware` for serving static assets in a Vapor application.

**Secure rules**

**Rule 1: Configure `FileMiddleware` with a restricted, dedicated static folder rather than application root or source code directories.**

Ensure that `FileMiddleware` points to a dedicated folder such as `app.directory.publicDirectory` instead of broader source paths. Because `FileMiddleware` serves files directly without evaluating route-level authentication, exposing root directories can allow unauthorized access to sensitive application code and credentials.

```swift
let fileMiddleware = FileMiddleware(
    publicDirectory: app.directory.publicDirectory,
    defaultFile: "index.html",
    directoryAction: .none
)
app.middleware.use(fileMiddleware)
```
