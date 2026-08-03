# Security cards

Repository: `https://github.com/vapor/vapor#4.122.0`
Documentation repository: `https://github.com/vapor/docs#main`
Category: input interpretation safety

## input interpretation safety

### Explicitly Inspect Media Type Parameters for Encoding Safety

**Use when**

You are verifying incoming request content types and security controls depend on specific parameters like character encodings.

**Secure rules**

**Rule 1: Inspect media type parameters explicitly when making security decisions based on content type attributes.**

Because `HTTPMediaType` equality checks ignore the `parameters` dictionary and handle wildcards automatically, relying solely on standard comparison can allow unexpected character encodings or parameters to bypass security controls. Always verify required parameters such as `charset` explicitly from the `parameters` dictionary.

```swift
guard let contentType = req.headers.contentType,
      contentType == .json,
      contentType.parameters["charset"]?.lowercased() == "utf-8" else {
    throw Abort(.unsupportedMediaType)
}
```
