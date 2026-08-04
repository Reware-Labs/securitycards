# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: resource exhaustion

## resource exhaustion

### Enforce Explicit Body Collection Limits on Request Payloads

**Use when**

Configuring routes that handle incoming HTTP request payloads and file uploads to prevent resource exhaustion.

**Secure rules**

**Rule 1: Specify explicit byte limits when collecting request bodies.**

Routes configured with `body: .collect(maxSize:)` must specify explicit and reasonable byte limits rather than excessively large values to prevent memory allocation attacks during payload parsing. Use `app.routes.defaultMaxBodySize` for global settings or `body: .collect(maxSize:)` for per-route limits.

```swift
app.routes.defaultMaxBodySize = "500kb"
app.on(.POST, "upload-json", body: .collect(maxSize: 256_000)) { req -> HTTPStatus in
    return .ok
}
```

**Rule 2: Set HTTP request decompression limits.**

Enforce a strict uncompressed size limit using `app.http.server.configuration.requestDecompression` with `.enabled(limit: .size(...))` to automatically reject decompression bombs that exceed memory thresholds.

```swift
app.http.server.configuration.requestDecompression = .enabled(
    limit: .size(1024 * 1024)
)
```
