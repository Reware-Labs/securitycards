# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: input interpretation safety

## input interpretation safety

### Parse and Canonicalize Untrusted URLs Using HttpUrl

**Use when**

When handling user-provided URLs or constructing network requests from external input to prevent validation and policy bypasses.

**Secure rules**

**Rule 1: Always parse untrusted URL strings using HttpUrl parsing APIs to normalize representations before performing security decisions or routing requests.**

Use `HttpUrl.parse()` or `HttpUrl.get()` to process untrusted URLs. This ensures standard Web Platform URL canonicalization rules are applied to percent-encoded dot-segments, IP representations, control characters, and whitespace, preventing path traversal and host boundary validation bypasses.

```java
HttpUrl url = HttpUrl.parse(untrustedUrlInput);
if (url == null) {
  throw new IllegalArgumentException("Invalid or malformed URL");
}

if (!allowedHosts.contains(url.host())) {
  throw new SecurityException("Target host not allowed: " + url.host());
}

Request request = new Request.Builder()
    .url(url)
    .build();
```
