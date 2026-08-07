# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: input interpretation safety

## input interpretation safety

### Use Canonical Form Subscripting for Comma-Delimited Headers

**Use when**

When processing comma-separated HTTP headers like `connection` or `set-cookie` using `HTTPHeaders`.

**Secure rules**

**Rule 1: Retrieve comma-delimited HTTP header values using canonical form subscripting to prevent parsing corruption of embedded dates.**

Use `HTTPHeaders[canonicalForm:]` instead of manually splitting header strings on commas. This ensures that list-based headers are properly decomposed while preserving values like `Set-Cookie` that contain commas within HTTP date strings.

```swift
let connectionDirectives = headers[canonicalForm: "connection"]
for directive in connectionDirectives {
    // Safely evaluate normalized header tokens
}

let rawCookies = headers[canonicalForm: "set-cookie"]
```
