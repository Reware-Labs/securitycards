# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: runtime environment hardening

## runtime environment hardening

### Configure production error middleware with the application environment

**Use when**

Configuring global middleware and application error handling during server bootstrap to ensure internal error details are properly masked in production.

**Secure rules**

**Rule 1: Pass the application environment into ErrorMiddleware.default to control error verbosity based on the runtime environment.**

Always pass `app.environment` into `ErrorMiddleware.default(environment:)` when registering the error middleware. This ensures that sensitive internal implementation details, file structures, and stack traces are hidden from users when running in production.

```swift
app.middleware.use(ErrorMiddleware.default(environment: app.environment))
```
