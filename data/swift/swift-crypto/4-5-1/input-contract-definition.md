# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: input contract definition

## input contract definition

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
