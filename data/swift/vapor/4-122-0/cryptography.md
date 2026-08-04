# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: cryptography

## cryptography

### Generate Cryptographically Secure Random Tokens and Keys

**Use when**

When generating high-entropy random values for bearer tokens, API credentials, or symmetric keys.

**Secure rules**

**Rule 1: Generate token values and symmetric keys using cryptographically secure random byte generation.**

Utilize `[UInt8].random(count:)` with sufficient entropy and encode the resulting bytes using Base64 for token generation, or instantiate `SymmetricKey` securely for cryptographic operations.

```swift
extension User {
    func generateToken() throws -> UserToken {
        try .init(
            value: [UInt8].random(count: 16).base64,
            userID: self.requireID()
        )
    }
}
```


### Hash User Passwords Securely Using Bcrypt

**Use when**

When implementing user authentication and persisting user passwords in application databases.

**Secure rules**

**Rule 1: Hash passwords with Bcrypt and verify them with Bcrypt.verify**

Hash every user-supplied password using `Bcrypt.hash` before persisting it, and authenticate by verifying the supplied password against the stored hash with `Bcrypt.verify`. **Passwords must never be stored in plaintext.**

```swift
// Hash before saving
let user = try User(
    name: create.name,
    email: create.email,
    passwordHash: Bcrypt.hash(create.password)
)
try await user.save(on: req.db)

// Verify during login
extension User: ModelAuthenticatable {
    static let usernameKey     = \User.$email
    static let passwordHashKey = \User.$passwordHash

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.passwordHash)
    }
}
```
