# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: access control

## access control

### Implement Custom Access Control Middleware to Restrict Route Execution

**Use when**

Enforcing role or permission checks to determine whether an authenticated user may access a protected route or tenant resource in Vapor.

**Secure rules**

**Rule 1: Enforce explicit authorization checks in middleware before allowing access to protected route handlers.**

Implement `AsyncMiddleware` to inspect `request.auth` and throw an `Abort(.unauthorized)` or `Abort(.forbidden)` error if the user lacks the required privileges. Attach this middleware to route groups to prevent unauthorized users from executing downstream handlers.

```swift
struct EnsureAdminUserMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let user = request.auth.get(User.self), user.role == .admin else {
            throw Abort(.unauthorized)
        }
        return try await next.respond(to: request)
    }
}

let protectedGroup = app.grouped(EnsureAdminUserMiddleware())
protectedGroup.get("admin", "dashboard") { req in
    "Admin Content"
}
```
