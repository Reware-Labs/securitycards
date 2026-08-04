# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: input interpretation safety

## input interpretation safety

### Canonicalize and Normalize Request Paths and Certificate PEM Blocks

**Use when**

When configuring HTTP path matchers, routing rules, or decoding certificate PEM structures in Caddy to ensure unambiguous input interpretation and prevent security bypasses.

**Secure rules**

**Rule 1: Write path matchers using unescaped characters and standard wildcard patterns to rely on automatic path cleaning and normalization.**

Caddy normalizes request paths including downcasing, slash merging, and converting Windows backslashes, operating in unescaped path space by default. Define standard path matchers using unescaped characters so that Caddy's path cleaning protects against bypass attempts, and use `%*` only when explicitly targeting raw percent-encoded sequences.

```json
{
  "match": [
    {
      "path": ["/api/v1/*"]
    }
  ]
}
```

**Rule 2: Enforce strict single-block PEM validation when decoding individual certificates.**

When processing individual certificate PEM payloads, ensure the input buffer contains strictly one PEM block with the header block type `CERTIFICATE` and no trailing bytes or secondary blocks. For multi-certificate bundles, always use chain-aware parsing functions.

```go
cert, err := pemDecodeCertificate(pemDER)
if err != nil {
    // Handle multiple blocks, wrong PEM block type, or invalid DER data
}
```
