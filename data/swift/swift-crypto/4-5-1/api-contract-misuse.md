# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: api contract misuse

## api contract misuse

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
