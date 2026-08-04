# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: input contract definition

## input contract definition

### Validate Incoming Request Content and Query Parameters Using Validatable

**Use when**

Validating untrusted HTTP request content, query parameters, or JSON payloads against explicit type, range, format, and requirement rules before executing business logic.

**Secure rules**

**Rule 1: Conform request payload models to Validatable, define validation constraints, and assert validation results before processing.**

Implement the `Validatable` protocol on your request models and configure field validation rules inside `validations(_:)`. Invoke `validate(content:)` or `validate(request: req)` and explicitly call `.assert()` on the returned `ValidationsResult` to reject malformed or out-of-contract input before decoding or processing.

```swift
struct CreateUserRequest: Content, Validatable {
    var username: String
    var email: String

    static func validations(_ validations: inout Validations) {
        validations.add("username", as: String.self, is: .count(3...30) && .alphanumeric)
        validations.add("email", as: String.self, is: .email, required: true)
    }
}

app.post("users") { req -> CreateUserRequest in
    try CreateUserRequest.validate(content: req)
    let user = try req.content.decode(CreateUserRequest.self)
    return user
}
```
