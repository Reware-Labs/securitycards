# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: cryptography

## cryptography

### Use secure random generation and cryptographic key lengths for encrypted session cookies

**Use when**

Configuring or encoding session cookies and implementing cryptographic key management within Beego applications.

**Secure rules**

**Rule 1: Provide cryptographic keys matching exact AES block requirements for session cookie encryption.**

Supply cryptographically generated random keys matching standard AES key sizes like 16, 24, or 32 bytes for AES-128, AES-192, or AES-256 when encoding or decoding session cookies using AES block ciphers.

```go
blockKey := session.GenerateRandomKey(32) // 256-bit AES key
block, err := aes.NewCipher(blockKey)
if err != nil {
	log.Fatalf("failed to initialize cipher: %v", err)
}

encoded, err := encodeCookie(block, hashKey, securityName, val)
```
