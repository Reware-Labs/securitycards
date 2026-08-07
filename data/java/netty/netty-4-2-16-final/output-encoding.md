# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: output encoding

## output encoding

### Validate HTTP Header Values and Control Characters in Netty Codecs

**Use when**

Use when constructing HTTP/2 headers or translating HTTP/1.x objects to HTTP/2 frames to prevent header injection and control character smuggling.

**Secure rules**

**Rule 1: Enable value validation when constructing HTTP/2 headers from untrusted values**

When adding untrusted values to `DefaultHttp2Headers`, use the three-argument constructor with both header-name and header-value validation enabled. The second boolean enables rejection of prohibited characters such as NUL, CR, LF, DEL, and other control characters.

```java
Http2Headers headers = new DefaultHttp2Headers(true, true, 16);
headers.add("x-custom-header", userProvidedValue);
```

**Rule 2: Enable validateHeaders during outbound conversion from HTTP/1.x objects to HTTP/2 frames.**

Pass `validateHeaders` as true when instantiating `HttpToHttp2ConnectionHandler` so that `HttpConversionUtil.toHttp2Headers` checks header names, values, and control characters, blocking improper header content from being emitted in outbound traffic.

```java
HttpToHttp2ConnectionHandler handler = new HttpToHttp2ConnectionHandler(
    decoder,
    encoder,
    initialSettings,
    true /* validateHeaders */
);
```
