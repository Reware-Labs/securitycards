# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: cryptography

## cryptography

### Configure Secure TLS Protocol Versions and Cipher Selection

**Use when**

Configuring TLS server protocols, minimum version thresholds, cipher suites, curves, and cryptographic parameters in Caddy.

**Secure rules**

**Rule 1: Restrict minimum TLS protocol versions to secure standards and avoid weak cryptographic primitives.**

When customizing TLS connection policies or protocol blocks, keep minimum protocol thresholds restricted to `tls1.2` or `tls1.3` to prevent downgrade attacks and cryptanalytic vulnerabilities.

```caddyfile
example.com {
    tls {
        protocols tls1.2 tls1.3
    }
}
```


### Hash Passwords Securely Using Argon2id and Cryptographically Secure Salts

**Use when**

Hashing user passwords for authentication configurations and implementing password verification comparers.

**Secure rules**

**Rule 1: Use the Argon2id algorithm with cryptographically secure random salts and constant-time verification.**

Prefer the Argon2id hashing algorithm over older algorithms when hashing user passwords, rely on `crypto/rand` for salt generation, and ensure custom hashing comparers use constant-time comparison operations.

```bash
caddy hash-password \
  --algorithm argon2id \
  --argon2id-time 1 \
  --argon2id-memory 65536 \
  --argon2id-threads 4
```


### Verify and Validate PKI Key Pairs and Certificate Chains

**Use when**

Loading custom PKI key pairs, managing internal certificate authorities, and verifying certificate chain consistency.

**Secure rules**

**Rule 1: Validate key pair consistency and ensure complete intermediate certificate chains are provided.**

When configuring custom PKI key pairs or internal certificate authorities, ensure that private keys match lead certificate public components and supply complete intermediate certificate trust chains in a single PEM bundle.

```go
kp := caddypki.KeyPair{
    Certificate: "/etc/ssl/pki/ca.crt",
    PrivateKey:  "/etc/ssl/pki/ca.key",
    Format:      "pem_file",
}
chain, signer, err := kp.Load()
if err != nil {
    // Handle file access error or key mismatch error
}
```
