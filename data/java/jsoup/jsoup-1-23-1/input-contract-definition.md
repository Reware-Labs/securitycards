# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: input contract definition

## input contract definition

### Validate Element Schemas and HTML Structure Against Defined Allowlist Contracts

**Use when**

When validating untrusted DOM nodes or HTML fragments against expected structure, namespaces, and safelist rules before processing or rendering.

**Secure rules**

**Rule 1: Validate DOM element names and namespaces using elementIs instead of raw string comparisons.**

When validating DOM nodes against expected element schemas or structural contracts, use `elementIs(normalName, namespace)` instead of checking element tag names using raw string comparisons on `tagName()`. This ensures that both normalized element tag names and explicit document namespaces are strictly validated according to the schema rules.

```java
if (element.elementIs("a", Parser.NamespaceHtml)) {
    String href = element.attr("href");
} else {
    throw new IllegalArgumentException("Unexpected element or namespace schema violation");
}
```

**Rule 2: Validate untrusted HTML fragments against an explicit Safelist schema before processing.**

Use `Jsoup.isValid(bodyHtml, safelist)` to validate whether untrusted HTML fragments conform to the schema rules defined by a Safelist allowance structure. Ensure that input validated with `isValid` is still normalized using `Jsoup.clean()` prior to storage or rendering to enforce attributes and parse normalization.

```java
Safelist schema = Safelist.relaxed();
if (!Jsoup.isValid(userInput, schema)) {
    throw new IllegalArgumentException("Input HTML does not match the required schema rules.");
}
String safeHtml = Jsoup.clean(userInput, "https://example.com/", schema);
```


### Validate connection URLs are absolute and use allowed schemes

**Use when**

When accepting external URL strings from users before passing them into `Jsoup.connect()`.

**Secure rules**

**Rule 1: Enforce absolute URLs with explicit http or https schemes before connection processing.**

Verify that input strings start with the required scheme prefix before calling `Jsoup.connect()` to prevent malformed inputs or missing protocols from causing runtime exceptions or unexpected application failures.

```java
String url = "https://example.com/page";
if (url.startsWith("http://") || url.startsWith("https://")) {
    Connection con = Jsoup.connect(url);
    Document doc = con.get();
}
```
