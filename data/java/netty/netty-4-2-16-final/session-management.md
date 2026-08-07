# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: session management

## session management

### Configure Explicit SSL Session Cache Limits and Timeouts

**Use when**

When instantiating server SSL contexts and setting explicit upper bounds for session cache size and timeouts to prevent unbounded memory consumption from cached TLS sessions.

**Secure rules**

**Rule 1: Set explicit non-zero upper bounds for sessionCacheSize and sessionTimeout on the server SSL session context.**

When instantiating server SSL contexts using `SslContextBuilder`, configure `sessionCacheSize` and `sessionTimeout` with explicit values to prevent unbounded memory consumption from cached TLS sessions.

```java
SslContext sslContext = SslContextBuilder.forServer(keyCertChainFile, keyFile)
    .sslProvider(SslProvider.JDK)
    .sessionCacheSize(10000)
    .sessionTimeout(3600)
    .build();
```
