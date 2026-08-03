# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: authentication

## authentication

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
