# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: api contract misuse

## api contract misuse

### Use correct attribute and selector API signatures and prevent duplicate attributes

**Use when**

When programmatically setting attributes, querying text nodes, or instantiating attributes using Jsoup.

**Secure rules**

**Rule 1: Use Attributes#put() instead of Attributes#add() to set attributes.**

When setting attributes programmatically, use `Attributes#put(key, value)` rather than `Attributes#add(key, value)` to overwrite existing attributes and prevent duplicate attribute names that could cause parser discrepancies or security control bypasses.

```java
element.attributes().put("href", sanitizedUrl);
```

**Rule 2: Use Element#selectNodes() instead of the deprecated matchText selector.**

Avoid using the deprecated `:matchText` pseudo-selector when querying text nodes since it mutates the underlying DOM tree. Instead, use `Element#selectNodes()` with node pseudo-selectors like `::text` or `::textnode` to query text nodes safely without unexpected side-effects.

```java
List<TextNode> textNodes = root.selectNodes("p::text", TextNode.class);
```

**Rule 3: Choose the correct Attribute constructor based on encoding state.**

Use standard constructors like `new Attribute(key, value)` for raw unencoded strings, and restrict `Attribute.createFromEncoded(key, encodedValue)` exclusively to cases where the attribute value is already HTML entity-encoded to prevent unexpected unescaping.

```java
Attribute rawAttr = new Attribute("data-text", "5 &lt; 10");
Attribute encodedAttr = Attribute.createFromEncoded("data-text", "5 &amp;lt; 10");
```
