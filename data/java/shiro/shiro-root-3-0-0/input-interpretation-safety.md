# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: input interpretation safety

## input interpretation safety

### Validate Format Identifiers Before Resolving Hash Formats

**Use when**

Parsing and interpreting untrusted format strings or class identifiers when obtaining dynamic `HashFormat` instances.

**Secure rules**

**Rule 1: Validate format identifiers against an explicit allowlist or registered aliases before passing user-controlled strings to `getInstance()`.**

Prevent heuristic class loading and resolution issues by ensuring that untrusted strings are verified against expected format IDs or registered mappings before invoking `DefaultHashFormatFactory.getInstance()`.

```java
DefaultHashFormatFactory factory = new DefaultHashFormatFactory();
Map<String, String> customFormats = Map.of("myformat", "com.example.crypto.MyHashFormat");
factory.setFormatClassNames(customFormats);

if (customFormats.containsKey(userInput) || ProvidedHashFormat.byId(userInput) != null) {
    HashFormat format = factory.getInstance(userInput);
}
```
