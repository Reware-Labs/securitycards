# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: output encoding

## output encoding

### Prevent Cross-Site Scripting by Setting Safe Content Types and Using Auto-Escaping View Contexts

**Use when**

Building HTTP responses or rendering dynamic templates with user-supplied data in Vapor.

**Secure rules**

**Rule 1: Use structured Encodable view contexts and rely on template auto-escaping to render dynamic data safely.**

When rendering templates via `ViewRenderer.render(_:_:)`, pass untrusted user data through structured `Encodable` context types and rely on template engine auto-escaping mechanisms such as Leaf's default variable interpolation instead of raw string concatenation.

```swift
struct ProfileContext: Encodable {
    let username: String
}

let context = ProfileContext(username: req.parameters.get("username") ?? "")
return try await req.view.render("profile", context)
```
