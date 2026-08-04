# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: authentication

## authentication

### Verify User Passwords and JWT Tokens

**Use when**

Authenticating users with credentials or verifying incoming JWT bearer tokens in Vapor.

**Secure rules**

**Rule 1: Verify JWT token expiration and claims within JWTPayload.**

Always execute claim verification logic inside the custom payload's `verify(using:)` method by calling `verifyNotExpired()` on `ExpirationClaim` or verifying audience and not-before claims.

```swift
struct TestPayload: JWTPayload {
    enum CodingKeys: String, CodingKey {
        case subject = "sub"
        case expiration = "exp"
    }

    var subject: SubjectClaim
    var expiration: ExpirationClaim

    func verify(using algorithm: some JWTAlgorithm) async throws {
        try self.expiration.verifyNotExpired()
    }
}
```
