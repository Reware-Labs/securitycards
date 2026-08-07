# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: injection

## injection

### Prevent Injection When Constructing Dynamic CSS Selectors and Query Parsers

**Use when**

Building dynamic CSS selector queries or regex pseudo-selectors using untrusted user input.

**Secure rules**

**Rule 1: Escape special meta-characters or wrap dynamic strings using Pattern.quote when building regex-based pseudo-selectors.**

Wrap dynamic strings in `Pattern.quote(...)` when building regex-based pseudo-selectors such as `:matches(...)` or `:matchesOwn(...)` with user input to prevent regex injection, parser crashes, or unexpected query alterations.

```java
String userInput = "user(data)";
Elements elements = doc.select("div:matches(" + Pattern.quote(userInput) + ")");
```

**Rule 2: Avoid concatenating untrusted input into CSS selector queries and escape special meta-characters.**

When querying the DOM using Jsoup CSS selector methods such as `select()` or `expectFirst()`, meta-characters including dots, hashes, slashes, and backslashes must be escaped using backslashes to prevent CSS selector injection.

```java
String safeId = untrustedId.replaceAll("([.#/\\\\])", "\\\\$1");
Element el = doc.expectFirst("#" + safeId);

// Or use direct element access without CSS parser syntax
Element directEl = doc.getElementById(untrustedId);
```
