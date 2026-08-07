# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: injection

## injection

### Validate HTTP Header Names and Values to Prevent Injection

**Use when**

Constructing dynamic HTTP headers in SwiftNIO before outbound transmission to prevent header injection and request smuggling.

**Secure rules**

**Rule 1: Validate dynamically generated HTTP header names and values to ensure they contain only RFC 9110 compliant characters before adding them to `HTTPHeaders`.**

Check that header values do not contain ASCII control characters such as CR or LF unless permitted as HTAB, utilizing SwiftNIO's checks or explicit validation routines to prevent protocol violations.

```swift
func addSafeHeader(headers: inout HTTPHeaders, name: String, value: String) throws {
    guard !value.unicodeScalars.contains(where: { $0.value < 0x20 && $0.value != 0x09 }) else {
        throw HeaderValidationError.invalidHeaderValue
    }
    headers.add(name: name, value: value)
}
```
