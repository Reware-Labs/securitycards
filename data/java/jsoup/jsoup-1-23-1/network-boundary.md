# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: network boundary

## network boundary

### Route session traffic through configured proxy endpoints

**Use when**

Configuring outbound HTTP/HTTPS connections and sessions to route traffic through authorized proxy endpoints.

**Secure rules**

**Rule 1: Enforce outbound traffic control by configuring proxy parameters on reusable Jsoup connection sessions.**

Use `Jsoup.newSession()` and invoke the `proxy()` method with the appropriate hostname and port to ensure all session requests are routed through the designated proxy gateway.

```java
Connection session = Jsoup.newSession()
    .proxy("10.0.0.1", 8080);

Document doc1 = session.newRequest("http://example.com/page1").get();
Document doc2 = session.newRequest("https://example.com/page2").get();
```
