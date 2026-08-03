# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: input interpretation safety

## input interpretation safety

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
