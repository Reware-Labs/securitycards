# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: cryptography

## cryptography

### Hash user passwords securely before database persistence

**Use when**

You are implementing user registration or credential update workflows where passwords must be securely hashed prior to storage.

**Secure rules**

**Rule 1: Hash user passwords using BcryptUtil.bcryptHash before persisting credentials.**

Pass plain text passwords through `BcryptUtil.bcryptHash()` when adding or updating user records in persistent storage. Do not pre-hash passwords and never store plain text passwords in production.

```java
User user = new User();
user.username = username;
user.password = BcryptUtil.bcryptHash(password);
user.role = role;
user.persist();
```


### Use authenticated encryption and strong key generation for tokens

**Use when**

You are generating cryptographic secret keys or configuring token state encryption within Quarkus security features.

**Secure rules**

**Rule 1: Generate cryptographically sound secret keys with sufficient key sizes using KeyUtils.**

Ensure that symmetric secret keys match target algorithm requirements by utilizing `io.smallrye.jwt.util.KeyUtils` to produce correctly sized, cryptographically sound keys for signing and encryption.

```java
SecretKey signingKey = KeyUtils.generateSecretKey(SignatureAlgorithm.HS512);
SecretKey encryptionKey = KeyUtils.generateSecretKey(KeyEncryptionAlgorithm.A256KW);
String jwt = Jwt.claim("sensitiveClaim", getSensitiveClaim()).innerSign(signingKey).encrypt(encryptionKey);
```

**Rule 2: Maintain token state encryption with strong cryptographic algorithms.**

Keep token state encryption enabled and provide a secure encryption secret and algorithm when configuring token state management to prevent exposure of sensitive session tokens.

```java
var config = OidcTenantConfig.builder()
    .tenantId("encrypted-state-tenant")
    .tokenStateManager()
        .encryptionRequired(true)
        .encryptionSecret("secure-32-byte-long-secret-key-12345")
        .encryptionAlgorithm(OidcTenantConfig.TokenStateManager.EncryptionAlgorithm.A256GCMKW)
    .end()
    .build();
```
