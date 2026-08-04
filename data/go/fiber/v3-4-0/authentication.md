# Security cards

Repository: `https://github.com/gofiber/fiber#v3.4.0`
Category: authentication

## authentication

### Implement secure authentication and credential verification in Fiber middleware

**Use when**

When configuring authentication mechanisms such as basic authentication or key-based token validation in Fiber applications.

**Secure rules**

**Rule 1: Provide a non-nil Validator function and use constant-time comparison for API keys**

When configuring `keyauth.New`, always supply a valid `Validator` function and use `subtle.ConstantTimeCompare` to evaluate API keys against expected values, preventing side-channel timing attacks.

```go
app.Use(keyauth.New(keyauth.Config{
    Validator: func(c fiber.Ctx, key string) (bool, error) {
        hashedKey := crypto.SHA256([]byte(key))
        return subtle.ConstantTimeCompare(hashedKey, expectedHashedKey) == 1, nil
    },
}))
```

**Rule 2: Use secure password hashes and constant-time comparisons in basic authentication**

Configure `basicauth.New` with bcrypt password hashes or an authorizer using constant-time comparison functions to protect stored credentials against offline brute-force and timing attacks.

```go
app.Use(basicauth.New(basicauth.Config{
    Users: map[string]string{
        "admin": "$2a$10$vI8aWBnW3fID.ZQ4/07.e.e1cTfE2wG8Pz6A0ZqYh123456789012",
    },
}))
```
