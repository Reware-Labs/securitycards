# Security cards

Repository: `https://github.com/ktorio/ktor#3.5.1`
Category: cryptography

## cryptography

### Use secure cryptographic algorithms and parameters for encryption and token generation

**Use when**

When configuring cryptographic mechanisms such as HTTP digest authentication, session encryption transformers, and random nonce generation within Ktor applications.

**Secure rules**

**Rule 1: Configure strong cryptographic hash algorithms for HTTP Digest authentication**

Avoid legacy `MD5` defaults in HTTP Digest authentication by specifying strong algorithms like `DigestAlgorithm.SHA_256` or `DigestAlgorithm.SHA_512_256` to prevent collision and offline cracking attacks.

```kotlin
install(Authentication) {
    digest {
        realm = "Protected Realm"
        algorithms = listOf(DigestAlgorithm.SHA_256, DigestAlgorithm.SHA_512_256)
        supportedQop = listOf(DigestQop.AUTH)
        digestProvider { userName, realm, algorithm ->
            computeHA1(userName, realm, password, algorithm)
        }
    }
}
```

**Rule 2: Disable session encryption backward compatibility after migration**

Keep `backwardCompatibleRead` set to `false` in `SessionTransportTransformerEncrypt` during normal operations to prevent older payload formats and legacy cryptographic signature layouts from being accepted.

```kotlin
val encryptKey = "00112233445566778899aabbccddeeff".hexToByteArray()
val signKey = "02030405060708090a0b0c".hexToByteArray()

install(Sessions) {
    cookie<TestUserSession>("SESSION_COOKIE") {
        transform(
            SessionTransportTransformerEncrypt(
                encryptKey = encryptKey,
                signKey = signKey,
                backwardCompatibleRead = false
            )
        )
    }
}
```

**Rule 3: Generate cryptographically secure nonces using Ktor utilities**

Utilize `generateNonceBlocking()` or `generateNonce()` to generate secure random strings, session identifiers, and tokens across platforms to prevent predictable values.

```kotlin
import io.ktor.util.generateNonceBlocking

val nonce: String = generateNonceBlocking()
check(nonce.length == 32)
```
