# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`

## Category: api contract misuse

### Configure Matching Ciphersuites and Initialize HPKE Endpoints Correctly

**Use when**

When establishing secure hybrid public-key encryption (HPKE) communications between sender and recipient endpoints.

**Secure rules**

**Rule 1: Configure HPKE sender and recipient instances with identical ciphersuites, modes, and info parameters.**

Bind shared session metadata into a consistent info Data object and supply identical configuration settings and parameters to both endpoints.

```swift
let sharedInfo = Data("protocol-v1-context".utf8)
let suite = HPKE.Ciphersuite.P256_SHA256_AES_GCM_128

var sender = try HPKE.Sender(
    recipientKey: recipientPK,
    ciphersuite: suite,
    info: sharedInfo
)

var recipient = try HPKE.Recipient(
    privateKey: recipientSK,
    ciphersuite: suite,
    info: sharedInfo,
    encapsulatedKey: sender.encapsulatedKey
)
```

**Rule 2: Avoid calling AEAD property introspection or decryption methods on an export-only ciphersuite.**

Select an active AEAD algorithm when message encryption or decryption is needed, and only select `.exportOnly` when HPKE is used purely for key derivation.

```swift
let aead = HPKE.AEAD.AES_GCM_256
let keyByteCount = aead.keyByteCount
```


### Maintain Hash Function Lifecycles and Context-Bound Signatures

**Use when**

When executing streaming hash operations or utilizing context-bound signing and verification APIs.

**Secure rules**

**Rule 1: Discard hash function instances immediately after finalization.**

Do not call update methods on a hash function instance after calling finalize. Discard the finalized instance and initialize a new hash function using init for subsequent operations.

```swift
var hasher = SHA256()
hasher.update(data: chunk1)
hasher.update(data: chunk2)
let digest = hasher.finalize()
```

**Rule 2: Use context-bound MLDSA signing and verification APIs for domain separation.**

Provide explicit context parameters when signing or verifying messages across specific domain boundaries to prevent signature reuse and replay attacks.

```swift
let domainContext = Data("MyApp-Authentication-v1".utf8)
let signature = try privateKey.signature(for: messageData, context: domainContext)
let isValid = publicKey.isValidSignature(signature, for: messageData, context: domainContext)
```


### Validate Sealed Box Parameters and Handle Authentication Errors

**Use when**

When instantiating sealed boxes, handling AEAD decryption, or performing authenticated decryption operations.

**Secure rules**

**Rule 1: Verify authentication errors and authenticated additional data when opening sealed boxes.**

Handle errors thrown by `ChaChaPoly.open` and verify that associated data matches expectations before trusting decrypted payloads.

```swift
do {
    let plaintext = try ChaChaPoly.open(sealedBox, using: key, authenticating: ad)
} catch {
    // Handle authentication or decryption failure
}
```

**Rule 2: Ensure standard tag length and nonce size when instantiating AES GCM sealed boxes.**

Ensure authentication tags are exactly 16 bytes and combined data meets required byte lengths when initializing `AES.GCM.SealedBox` to avoid throwing `CryptoKitError.incorrectParameterSize`.

```swift
let key = SymmetricKey(size: .bits256)
let combinedPayload: Data = getReceivedPayload()

do {
    let sealedBox = try AES.GCM.SealedBox(combined: combinedPayload)
    let decryptedData = try AES.GCM.open(sealedBox, using: key)
} catch CryptoKitError.incorrectParameterSize {
    // Handle payload structural validation failure
} catch {
    // Handle authentication or decryption failure
}
```


## Category: authentication

### Enforce Sender Authentication in HPKE Workflows

**Use when**

Implementing hybrid public-key encryption workflows requiring identity verification and sender authentication.

**Secure rules**

**Rule 1: Initialize HPKE recipients using authenticated modes with the sender's public key.**

Always initialize `HPKE.Recipient` using authenticated modes and provide the sender's public key via the `authenticatedBy` parameter to ensure proper sender identity verification.

```swift
var recipient = try HPKE.Recipient(
    privateKey: recipientPrivateKey,
    ciphersuite: ciphersuite,
    info: infoData,
    encapsulatedKey: encapsulatedKey,
    authenticatedBy: senderPublicKey
)
let plaintext = try recipient.open(ciphertext, authenticating: aadData)
```


## Category: configuration source integrity

### Restrict Certificate Lookup Directory Paths and Environment Overrides to Trusted Sources

**Use when**

Configuring directory paths and environment variable overrides for hash-based X.509 certificate and CRL resolution.

**Secure rules**

**Rule 1: Supply an explicit certificate directory to `X509_LOOKUP_add_dir` instead of relying on `SSL_CERT_DIR` defaults**

`X509_LOOKUP_add_dir` and `X509_STORE_set_default_paths` fall back to paths taken from the `SSL_CERT_DIR` or `SSL_CERT_FILE` environment variables. Treat those variables as untrusted input and avoid the fallback by always passing a concrete, trusted directory path and a specific file-type constant (`X509_FILETYPE_PEM`). Ignore the `X509_FILETYPE_DEFAULT` option and never pass `NULL`, which would re-enable the environment-based lookup.

```c
/* Build a store that trusts only certificates in /etc/ssl/certs. */
X509_STORE *store = X509_STORE_new();
if (!store) { /* handle error */ }

X509_LOOKUP *lookup =
    X509_STORE_add_lookup(store, X509_LOOKUP_hash_dir());
if (!lookup ||
    !X509_LOOKUP_add_dir(lookup, "/etc/ssl/certs", X509_FILETYPE_PEM)) {
    /* Abort: explicit trust store failed to load. */
}
```


## Category: cryptography

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


## Category: deserialization

### Enforce strict DER constraints when parsing ASN.1 timestamps

**Use when**

Parsing DER-encoded ASN.1 data structures containing timestamps from untrusted sources.

**Secure rules**

**Rule 1: Reject malformed ASN.1 GeneralizedTime values**

Invoke `ASN1.GeneralizedTime(asn1Encoded:withIdentifier:)` inside a `do`-`catch` block and treat any `CryptoKitASN1Error` as a hard failure. The initializer enforces all DER-canonical rules for GeneralizedTime (four-digit year, `hhmmss` precision, mandatory “Z” suffix, and no trailing zeros in fractional seconds); propagating its errors ensures non-compliant timestamps are rejected.

```swift
do {
    let timestamp = try ASN1.GeneralizedTime(
        asn1Encoded: node,
        withIdentifier: .generalizedTime
    )
    // Safe to use `timestamp` here
} catch let error as CryptoKitASN1Error {
    // Reject malformed or non-canonical GeneralizedTime
    throw SecurityError.invalidCertificateFormat
}
```


## Category: input contract definition

### Validate cryptographic parameter and key byte lengths before processing

**Use when**

Instantiating cryptographic keys, nonces, or sealed boxes from external or raw binary inputs.

**Secure rules**

**Rule 1: Validate all raw key representations and nonce or tag byte lengths against strict sizing requirements before initialization.**

Ensure that incoming byte buffers match the exact required byte counts for primitives such as X25519 keys, NIST elliptic curve keys, and GCM or ChaChaPoly nonces and tags. Handle runtime exceptions like `CryptoKitError.incorrectParameterSize` or `CryptoKitError.incorrectKeySize` when buffer lengths are invalid.

```swift
import Crypto

do {
    let customNonceData = Data(repeating: 0x42, count: 12)
    let nonce = try ChaChaPoly.Nonce(data: customNonceData)
    let key = SymmetricKey(size: .bits256)
    let sealedBox = try ChaChaPoly.seal(Data("Hello".utf8), using: key, nonce: nonce)
} catch CryptoKitError.incorrectParameterSize {
    print("Nonce or tag byte count was invalid.")
}
```


## Category: input interpretation safety

### Strictly validate ASN.1 structures and encoded cryptographic keys

**Use when**

Decoding low-level ASN.1 data structures, encoded public/private keys, or PKCS#1 signature structures.

**Secure rules**

**Rule 1: Catch ASN.1 parsing errors explicitly when decoding raw or encoded keys to prevent processing corrupted data.**

When decoding low-level ASN.1 structures or encoded keys, explicitly handle errors thrown by the parser to ensure malformed or truncated inputs are safely rejected. This prevents acceptance of partially decoded or corrupted public and private key structures.

```swift
do {
    let parsedNode = try ASN1.parse(rawBytes)
    let spki = try ASN1.SubjectPublicKeyInfo(asn1Encoded: parsedNode)
} catch let error as CryptoKitASN1Error {
    throw KeyValidationError.invalidASN1Structure
}
```

**Rule 2: Rely on high-level signature verification methods to strictly enforce BER/DER encodings.**

Use high-level verification methods instead of implementing custom ASN.1 header, length, or signature padding parsers. CryptoKit strictly enforces encodings and rejects signatures with malformed length encodings or unexpected trailing data.

```swift
import CryptoExtras
import Crypto
import Foundation

let isValid = publicKey.isValidSignature(signatureData, for: digest, padding: .insecurePKCS1v1_5)
guard isValid else {
    throw SecurityError.invalidSignature
}
```


## Category: memory safety

### Allocate Sufficient Buffer Sizes and Verify Non-Overlapping Regions in Cryptographic Operations

**Use when**

When managing input and output memory buffers for low-level cryptographic primitives, key derivation, or block cipher operations.

**Secure rules**

**Rule 1: Pre-allocate destination buffers with sufficient capacity for cryptographic operations to prevent buffer overflows.**

Ensure output buffers supplied to functions like `HMAC_Final` are pre-allocated with at least `EVP_MAX_MD_SIZE` or the required maximum size before executing the operation.

```c
uint8_t out[EVP_MAX_MD_SIZE];
unsigned int out_len = 0;
if (HMAC_Final(ctx, out, &out_len) == 1) {
    // HMAC output successfully written to out
}
```

**Rule 2: Ensure input and output memory regions are strictly non-overlapping or identical when invoking block cipher and conditional memory operations.**

Avoid partial memory overlap across input and output parameters in functions like `AES_cbc_encrypt` to prevent unrecoverable data corruption. Use completely separate buffers or identical pointers for in-place processing.

```c
// Safe: In-place processing using identical pointers
AES_cbc_encrypt(buffer, buffer, buffer_len, &key, ivec, AES_ENCRYPT);

// Safe: Completely separate input and output memory regions
AES_cbc_encrypt(in_buffer, out_buffer, buffer_len, &key, ivec, AES_ENCRYPT);
```


## Category: resource exhaustion

### Enforce RSA Key Bit Length Limits During Parsing

**Use when**

Parsing RSA keys from external sources to prevent excessive computational resource consumption.

**Secure rules**

**Rule 1: Inspect and constrain RSA key bit lengths using key inspection functions.**

When parsing RSA keys, explicitly inspect the key bit length and ensure it falls within acceptable safety boundaries. Reject keys with insecure or excessive lengths to protect against CPU exhaustion.

```c
EVP_PKEY *pkey = EVP_PKEY_from_subject_public_key_info(der_data, der_len, algs, alg_count);
if (pkey != NULL) {
    int bits = EVP_PKEY_bits(pkey);
    if (bits < 2048 || bits > 4096) {
        EVP_PKEY_free(pkey);
    }
}
```


## Category: runtime environment hardening

### Initialize Cryptographic Resources Before Restricting Process Sandboxes

**Use when**

Configuring process sandboxing and system access restrictions in applications utilizing underlying cryptographic components.

**Secure rules**

**Rule 1: Call `CRYPTO_pre_sandbox_init()` prior to enabling strict process sandboxing or restricting system access rights.**

Invoke `CRYPTO_pre_sandbox_init()` before setting up sandbox policies to ensure underlying system resources and entropy required by BoringSSL are pre-acquired before sandbox boundaries block them.

```c
// Call before setting up sandbox restrictions
CRYPTO_pre_sandbox_init();

// Proceed with enabling sandbox policies
apply_process_sandbox_policy();
```


## Category: secret handling

### Prevent Exposure of Secret Material in Memory and Storage

**Use when**

When managing derived keys, shared secrets, and private key representations in application workflows.

**Secure rules**

**Rule 1: Store sensitive derived shared secrets and keys within native CryptoKit containers to leverage automated memory zeroization.**

Keep generated `SharedSecret` and key instances stored within native CryptoKit representations backed by `SecureBytes` rather than converting them into plain `Data` or raw array buffers, ensuring backing memory is zeroized upon deallocation.

```swift
let privateKey = Curve25519.KeyAgreement.PrivateKey()
let sharedSecret = try privateKey.sharedSecretFromKeyAgreement(with: peerPublicKey)

let derivedKey = sharedSecret.hkdfDerivedSymmetricKey(
    using: SHA256.self,
    salt: saltData,
    sharedInfo: infoData,
    outputByteCount: 32
)
```


### Secure Secret Loading and Memory Cleanup in CryptoKit

**Use when**

When loading encrypted keys with passphrases, handling sensitive secret materials, or managing cryptographic contexts and key buffers.

**Secure rules**

**Rule 1: Immediately zeroize passphrase memory and temporary key buffers after initializing encrypted keys or completing cryptographic tasks.**

When loading encrypted keys via callbacks such as `init(encryptedPEMRepresentation:passphraseCallback:)`, pass the passphrase bytes via the provided setter and immediately clear or deallocate the passphrase memory in application space. Always zeroize intermediate secret keys and derived key buffers immediately after completing integrity checks or encryption/decryption tasks using memory cleansing primitives like `OPENSSL_cleanse` or `SecureBytes` backing stores.

```swift
let privateKey = try _RSA.Signing.PrivateKey(
    encryptedPEMRepresentation: encryptedPemString
) { setter in
    var passphraseBytes = fetchPassphraseBytes()
    setter(passphraseBytes)
    passphraseBytes.resetBytes(in: 0..<passphraseBytes.count)
}
```


## Category: security control integrity

### Configure Certificate Verification Parameters Without Unsupported CRL Flags

**Use when**

Configuring X509 verification parameters where unauthorized or unsupported verification flags could cause verification failures or fail-closed behavior.

**Secure rules**

**Rule 1: Avoid setting unsupported extended or delta CRL verification flags to prevent unconditional verification failures.**

Do not set `X509_V_FLAG_EXTENDED_CRL_SUPPORT` or `X509_V_FLAG_USE_DELTAS` in `X509_VERIFY_PARAM` flags, because unsupported CRL processing causes verification requests to fail closed unconditionally. Instead, configure certificate verification parameters using standard supported CRL checking flags such as `X509_V_FLAG_CRL_CHECK`.

```c
X509_VERIFY_PARAM *param = X509_VERIFY_PARAM_new();
X509_VERIFY_PARAM_set_flags(param, X509_V_FLAG_CRL_CHECK);
X509_STORE_CTX_set0_param(ctx, param);
```
