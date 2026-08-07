# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: resource exhaustion

## resource exhaustion

### Configure Connection Idle Timeouts and Certificate Limits to Prevent Resource Exhaustion

**Use when**

Setting up Netty network services, QUIC servers, or SSL contexts where malicious clients could trigger resource exhaustion or memory denial-of-service.

**Secure rules**

**Rule 1: Enforce maximum peer certificate chain size limits on OpenSSL-backed SSL contexts.**

When configuring Netty's OpenSSL-backed SSL context, enforce limits on the maximum accepted peer certificate chain size by setting `OpenSslContextOption.MAX_CERTIFICATE_LIST_BYTES` on `SslContextBuilder` to prevent excessive memory allocation during TLS handshakes.

```java
SslContext sslCtx = SslContextBuilder.forServer(certFile, keyFile)
    .sslProvider(SslProvider.OPENSSL)
    .option(OpenSslContextOption.MAX_CERTIFICATE_LIST_BYTES, 64 * 1024)
    .build();
```

**Rule 2: Configure maximum idle timeouts on QUIC server and client builders.**

Explicitly configure a maximum idle timeout on `QuicServerBuilder` and `QuicClientBuilder` instances using `maxIdleTimeout()` to ensure abandoned connections are properly cleaned up and do not remain allocated in memory indefinitely.

```java
QuicServerBuilder serverBuilder = QuicServerBuilder.forServer(key, certificate)
    .maxIdleTimeout(30, TimeUnit.SECONDS);
```
