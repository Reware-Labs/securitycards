# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: output encoding

## output encoding

### Escape untrusted strings and serialize documents using safe output settings

**Use when**

When outputting untrusted data into HTML or attribute contexts or serializing documents to string representations.

**Secure rules**

**Rule 1: Use Entities.escape with appropriate OutputSettings to encode characters for target contexts.**

When outputting untrusted strings into HTML or attribute contexts, use `Entities.escape(data, outputSettings)` or `Document.OutputSettings` to encode characters such as `<`, `>`, `&`, `"`, and `
` to prevent Cross-Site Scripting (XSS) or HTML markup injection vulnerabilities.

```java
Document.OutputSettings settings = new Document.OutputSettings()
    .escapeMode(Entities.EscapeMode.base)
    .charset(java.nio.charset.StandardCharsets.UTF_8);
String escapedText = Entities.escape(untrustedInput, settings);
```
