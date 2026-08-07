# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: input interpretation safety

## input interpretation safety

### Normalize and Interpret Untrusted Input via Jsoup Parsers and URL Resolution

**Use when**

When parsing untrusted HTML/XML streams, resolving relative URLs, or processing input attributes and character entities.

**Secure rules**

**Rule 1: Ensure XML input is parsed using Parser.xmlParser() rather than standard HTML parsing.**

Developers must ensure that XML input is parsed using `Parser.xmlParser()` rather than standard HTML parsing to prevent misinterpretation of tags, namespaces, or attribute names, avoiding silent mutations or structural corruption.

```java
String xmlData = "<customNS:secureTag xmlns:customNS=\"http://example.com/ns\">value</customNS:secureTag>";
Document doc = Jsoup.parse(xmlData, "", Parser.xmlParser());
String cleanXml = doc.outerHtml();
```

**Rule 2: Resolve URL attributes with Node.absUrl()**

Use `Node.absUrl()` for URL-valued attributes that may be relative. It resolves the attribute against the node's base URI, removes ASCII control characters during resolution, and returns an empty string when an absolute URL cannot be produced. Do not call `StringUtil.resolve()` directly because `StringUtil` is an internal API whose behavior may change without notice.

```java
Document document = Jsoup.parse(
    "<a href=\"../resource\">Resource</a>",
    "https://example.com/path/"
);

String absoluteUrl = document.selectFirst("a").absUrl("href");
if (!absoluteUrl.isEmpty()) {
    // Process the resolved URL.
}
```

**Rule 3: Rely on Jsoup native stream parsing APIs for multibyte and entity-heavy inputs.**

When parsing HTML streams that contain numerous HTML entity references across large inputs, rely directly on Jsoup's native stream parsing APIs such as `Jsoup.parse(InputStream, String, String)` rather than manually pre-chunking or slicing input buffers.

```java
try (InputStream inputStream = new FileInputStream("input.html")) {
    Document doc = Jsoup.parse(inputStream, "UTF-8", "https://example.com/");
    String safeText = doc.body().text();
}
```
