# Security cards

Repository: `https://github.com/jhy/jsoup#jsoup-1.23.1`
Category: interface protocol hardening

## interface protocol hardening

### Control Request Method Retention and Redirect Behavior

**Use when**

Making HTTP POST or HEAD requests where redirect semantics must be explicitly controlled to prevent automatic re-transmission of sensitive payloads across network boundaries.

**Secure rules**

**Rule 1: Disable automatic redirect following when executing sensitive requests that should not re-transmit payloads to redirect locations.**

Be aware of HTTP redirect semantics when making `POST` or `HEAD` requests. Jsoup converts `POST` to `GET` during 301 and 302 redirects, but strictly preserves `POST` for 307 and 308 redirects. Disable redirect following on sensitive requests using `followRedirects(false)` if request payloads should not be automatically re-transmitted to redirect locations.

```java
Connection con = Jsoup.connect("https://example.com/login")
    .method(Connection.Method.POST)
    .requestBody("sensitive_data")
    .followRedirects(false);
Connection.Response res = con.execute();
```
