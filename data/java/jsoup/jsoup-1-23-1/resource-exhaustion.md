# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: resource exhaustion

## resource exhaustion

### Enforce Resource Limits on Connections and Parsers

**Use when**

fetching and parsing remote content, network connections, or untrusted HTML and XML inputs.

**Secure rules**

**Rule 1: Configure explicit response body limits and connection timeouts.**

Always configure explicit response body limits using `maxBodySize(int bytes)` and timeout limits using `timeout(int)` when fetching content from untrusted network endpoints. Avoid disabling timeouts or limits with a value of `0` to prevent memory exhaustion and denial of service from slow or massive payloads.

```java
Connection conn = Jsoup.connect("https://example.com/data")
    .timeout(15000)
    .maxBodySize(2 * 1024 * 1024);
Document doc = conn.get();
```

**Rule 2: Configure explicit stack depth limits on parser instances for untrusted markup.**

When processing untrusted XML or HTML documents, configure explicit stack depth limits on the `Parser` instance using `Parser#setMaxDepth(int)`. This prevents resource exhaustion and unbounded DOM stack growth caused by deeply nested tags.

```java
Parser parser = Parser.htmlParser();
parser.setMaxDepth(100);
Document doc = parser.parseInput(htmlInput, baseUri);
```
