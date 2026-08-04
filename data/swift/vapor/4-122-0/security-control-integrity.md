# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: security control integrity

## security control integrity

### Position CORS Middleware Before Error Handling in Vapor

**Use when**

Configuring the application middleware chain in Vapor to ensure cross-origin resource sharing headers are correctly applied to error and abort responses.

**Secure rules**

**Rule 1: Register CORSMiddleware at the beginning of the middleware chain.**

Ensure that `CORSMiddleware` is positioned before any error-handling or abort middlewares by registering it at the beginning of the responder chain using `.beginning`. This guarantees that error responses retain necessary CORS headers for cross-origin clients.

```swift
let cors = CORSMiddleware(configuration: corsConfig)
app.middleware.use(cors, at: .beginning)
```
