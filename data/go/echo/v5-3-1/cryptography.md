# Security cards

Repository: `https://github.com/labstack/echo#v5.3.1`
Category: cryptography

## cryptography

### Generate Cryptographic Nonces Using Secure Random Sources

**Use when**

Generating custom security tokens, nonces, or secrets in application workflows.

**Secure rules**

**Rule 1: Derive security nonces and tokens directly from cryptographic random sources without modulo bias.**

When creating custom token generation routines or security nonces, pull entropy directly from `crypto/rand` using `io.ReadFull` rather than relying on weak pseudo-random sources. Handle any entropy source errors explicitly.

```go
bytes := make([]byte, 32)
if _, err := io.ReadFull(rand.Reader, bytes); err != nil {
    // Handle random reader failure
}
```
