# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: api contract misuse

## api contract misuse

### Use Request-Scoped Services Within Vapor Route Handlers

**Use when**

Developing route closures and handling incoming requests where request-bound services such as `req.client` must be accessed.

**Secure rules**

**Rule 1: Access request-bound services using the request instance instead of global application instances.**

Always use request-bound services such as `req.client` inside route closures to ensure requests are handled on the correct SwiftNIO event loop and to preserve request context. Avoid resolving global application instances inside route handlers to prevent thread-safety issues and unexpected behavior under load.

```swift
app.get("example") { req -> EventLoopFuture<ClientResponse> in
    return req.client.get("https://api.example.com")
}
```
