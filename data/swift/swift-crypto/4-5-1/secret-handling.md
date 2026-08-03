# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: secret handling

## secret handling

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
