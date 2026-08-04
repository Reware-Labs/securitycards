# Security cards

Repository: `https://github.com/apple/swift-crypto#4.5.1`
Category: deserialization

## deserialization

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
