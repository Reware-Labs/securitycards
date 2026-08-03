# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: cryptography

## cryptography

### Configure Strong Work Factors and Memory Limits for Password Hashing and Key Derivation

**Use when**

You are deriving encryption keys from user passwords or hashing passwords using PBKDF2 or Scrypt primitives in CryptoExtras and BoringSSL.

**Secure rules**

**Rule 1: Enforce high iteration counts and strong hash functions when deriving keys with PBKDF2.**

When using `KDF.Insecure.PBKDF2.deriveKey`, specify a secure hash function such as `.sha256`, `.sha384`, or `.sha512` and rely on the standard `rounds:` parameter enforcing at least 210,000 iterations. Avoid bypassing this threshold with `unsafeUncheckedRounds:` or using legacy primitives.

```swift
import Crypto
import CryptoExtras

let passwordData = Data("userSecretPassword".utf8)
let saltData = Data(saltBytes)
let derivedKey = try KDF.Insecure.PBKDF2.deriveKey(
    from: passwordData,
    salt: saltData,
    using: .sha256,
    outputByteCount: 32,
    rounds: 210_000
)
```

**Rule 2: Supply unique salts and explicit cost parameters with memory bounds for Scrypt derivation.**

When performing password hashing or key derivation using `KDF.Scrypt.deriveKey`, provide unique cryptographic salts alongside adequate cost parameters (`rounds`, `blockSize`, and `parallelism`), and set explicit memory bounds to prevent uncontrolled resource exhaustion.

```swift
import Crypto
import CryptoExtras

let passwordData = Data("user-passcode".utf8)
var salt = Data(count: 16)
try SymmetricKey(size: .bits128).withUnsafeBytes { salt.copyBytes(from: $0) }

let derivedKey = try KDF.Scrypt.deriveKey(
    from: passwordData,
    salt: salt,
    outputByteCount: 32,
    rounds: 32768,
    blockSize: 8,
    parallelism: 1
)
```


### Derive Symmetric Keys Using Cryptographic Key Derivation Functions

**Use when**

When deriving symmetric encryption or authentication keys from raw shared secrets, input key material, or salts.

**Secure rules**

**Rule 1: Derive symmetric keys from shared secrets using key derivation functions rather than using raw secrets directly.**

Do not use a `SharedSecret` directly as a symmetric encryption or MAC key. Always derive a `SymmetricKey` from the `SharedSecret` using key derivation functions like `hkdfDerivedSymmetricKey` or `x963DerivedSymmetricKey` with an appropriate hash function, salt, and shared information prior to performing cryptographic operations.

```swift
let sharedSecret = try privateKey.sharedSecretFromKeyAgreement(with: publicKeyShare)
let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
    using: SHA256.self,
    salt: saltBytes,
    sharedInfo: contextData,
    outputByteCount: 32
)
```

**Rule 2: Pass non-empty `salt` and `info` to `HKDF.deriveKey` for domain-separated outputs**

Swift Crypto’s HKDF overload that accepts both `salt` and `info` is designed for context-specific key derivation. Overloads that omit either parameter silently substitute zero-length byte arrays, so different call sites could generate identical keys. Always supply a unique salt (random or protocol-fixed) **and** a protocol-distinct `info` value to avoid cross-context key reuse.

```swift
import Crypto   // Swift-Crypto 4.5.1

let ikm  = SymmetricKey(size: .bits256)                 // secret input
let salt = Data("handshake-2".utf8)                     // context-specific salt
let info = Data("MyApp-MessageKey-v1".utf8)             // domain label

let key = HKDF<SHA256>.deriveKey(
    inputKeyMaterial: ikm,
    salt: salt,
    info: info,
    outputByteCount: 32
)
```


### Ensure Nonce Uniqueness and Automatic Generation for AEAD Primitives

**Use when**

When encrypting data using authenticated encryption primitives like AES-GCM or ChaCha20-Poly1305 and ensuring that nonces are never reused.

**Secure rules**

**Rule 1: Omit explicit nonce parameters or use parameterless initializers to let CryptoKit automatically generate secure, random nonces for every encryption operation.**

Reusing a nonce under the same symmetric key catastrophically destroys confidentiality and allows adversaries to recover keystream or forge authentication tags. When sealing data using `AES.GCM.seal` or `ChaChaPoly.seal`, omit the nonce parameter or pass `nil`, or rely on parameterless initializers such as `AES.GCM.Nonce()` and `ChaChaPoly.Nonce()` to auto-generate a secure 12-byte random nonce.

```swift
let key = SymmetricKey(size: .bits256)
let message = "Sensitive Data".data(using: .utf8)!
let sealedBox = try AES.GCM.seal(message, using: key)
```


### Generate Cryptographic Keys with Secure Randomness and Parameters

**Use when**

When generating cryptographic keys, nonces, and blinding factors for elliptic-curve and post-quantum workflows.

**Secure rules**

**Rule 1: Generate cryptographic keys and nonces using the library's cryptographically secure random generators and approved settings.**

Ensure that private keys, scalars, and nonces rely on secure random generation. When instantiating P-256 private keys for FIPS-compliant environments, explicitly set `compactRepresentable` to `false` to avoid non-compliant compact point encoding.

```swift
// Generate a FIPS-compliant P-256 private key for signing
let fipsSigningKey = P256.Signing.PrivateKey(compactRepresentable: false)

// Generate a FIPS-compliant P-256 private key for key agreement
let fipsAgreementKey = P256.KeyAgreement.PrivateKey(compactRepresentable: false)
```

**Rule 2: Verify public key consistency and dimensions when instantiating post-quantum keys from seeds.**

When reconstructing post-quantum keys such as ML-DSA from seed representations or raw buffers, supply the expected public key or use integrity-checked initializers, and validate that buffer dimensions match expected byte counts exactly.

```swift
let privateKey = try MLDSA65.PrivateKey(
    seedRepresentation: seedBytes,
    publicKey: expectedPublicKey
)
```


### Use Authenticated Encryption and Secure Hash Primitives for Data Integrity and Confidentiality

**Use when**

When protecting sensitive data against tampering and unauthorized disclosure across network or storage boundaries.

**Secure rules**

**Rule 1: Use an AEAD cipher (AES-GCM or ChaChaPoly) when both confidentiality and authenticity are required**

`HMAC` protects integrity but leaves the plaintext visible. When your data must remain secret **and** tamper-evident, wrap it in an AEAD sealed box created by `AES.GCM` or `ChaChaPoly`. These ciphers encrypt the message and generate an authentication tag that also covers any associated data (AAD).

```swift
import Crypto

let key      = SymmetricKey(size: .bits256)
let message  = "Sensitive payload".data(using: .utf8)!
let aad      = "header".data(using: .utf8)!

// Encrypt and authenticate
let sealed = try ChaChaPoly.seal(message,
                                 using: key,
                                 authenticating: aad)

// Decrypt and verify
let plaintext = try ChaChaPoly.open(sealed,
                                    using: key,
                                    authenticating: aad)
```

**Rule 2: Use keyed message authentication codes instead of plain hash functions to guard against malicious modification.**

Do not rely on plain hash functions like SHA-256 or SHA-512 to verify data authenticity or guard against malicious tampering. Use keyed message authentication codes like HMAC when calculating digests across untrusted boundaries.

```swift
let key = SymmetricKey(size: .bits256)
let authenticationCode = HMAC<SHA256>.authenticationCode(for: data, using: key)
```


### Verify Signatures and Match Ciphersuites for Secure Cryptographic Workflows

**Use when**

When verifying digital signatures or configuring multi-party hybrid and post-quantum encryption suites.

**Secure rules**

**Rule 1: Verify digital signatures using native public key validation APIs and ensure matching algorithms and contexts.**

Always verify signatures using public key validation APIs such as `isValidSignature(_:for:)` before trusting signed messages. Ensure that digest algorithms, EC signature formats, and domain-separation context strings match strictly between generation and verification.

```swift
let publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: rawPublicKeyBytes)
guard publicKey.isValidSignature(signatureBytes, for: messageData) else {
    throw CryptographicError.invalidSignature
}
```

**Rule 2: Ensure identical ciphersuites and sequential processing are used for hybrid public key encryption.**

When performing Hybrid Public Key Encryption (HPKE), ensure senders and recipients specify identical ciphersuites, maintain dedicated recipient instances per message stream, and process messages in strict sequential order.

```swift
let ciphersuite = HPKE.Ciphersuite.P256_SHA256_AES_GCM_128
let info = Data("session_info".utf8)

var sender = try HPKE.Sender(recipientKey: recipientPublicKey, ciphersuite: ciphersuite, info: info)
var recipient = try HPKE.Recipient(
    privateKey: recipientPrivateKey,
    ciphersuite: ciphersuite,
    info: info,
    encapsulatedKey: sender.encapsulatedKey
)
```
