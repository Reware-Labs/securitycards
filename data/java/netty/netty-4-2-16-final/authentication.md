# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: authentication

## authentication

### Validate Client Certificates for QUIC Server Connections

**Use when**

Configuring mutual TLS (mTLS) authentication for QUIC servers in Netty to ensure connecting clients are properly authenticated.

**Secure rules**

**Rule 1: Require mutual TLS client authentication explicitly on QUIC server contexts.**

Set `clientAuth(ClientAuth.REQUIRE)` and provide trusted certificates via `trustManager(...)` when building server contexts to prevent unauthenticated client access.

```java
QuicSslContext sslContext = QuicSslContextBuilder.forServer(keyFile, keyPassword, certFile)
    .trustManager(trustCertFile)
    .clientAuth(ClientAuth.REQUIRE)
    .build();
```
