# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: cryptography

## cryptography

### Configure Secure TLS Protocols, Cipher Suites, and Endpoint Verification

**Use when**

Configuring `SslContext` and client connections for Netty secure communications.

**Secure rules**

**Rule 1: Enable TLS hostname verification and configure strong protocols and cipher suites.**

Keep TLS endpoint verification enabled for client connections and avoid setting `io.netty.handler.ssl.defaultEndpointVerificationAlgorithm` to `NONE`. Explicitly restrict SSL/TLS contexts to secure protocols such as TLSv1.2 and TLSv1.3 and strong, authenticated cipher suites when building `SslContext` instances.

```java
SslContext sslCtx = SslContextBuilder.forClient()
    .protocols("TLSv1.2", "TLSv1.3")
    .ciphers(Arrays.asList("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", "TLS_AES_128_GCM_SHA256"))
    .build();
ChannelPipeline pipeline = ch.pipeline();
pipeline.addLast("ssl", sslCtx.newHandler(ch.alloc(), host, port));
```
