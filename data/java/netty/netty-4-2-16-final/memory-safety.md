# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: memory safety

## memory safety

### Safely Manage Reference-Counted OpenSSL Contexts and Engines

**Use when**

Managing the lifecycle of Netty's `ReferenceCountedOpenSslContext` and `ReferenceCountedOpenSslEngine` native resources.

**Secure rules**

**Rule 1: Ensure OpenSSL engines are released before releasing their parent OpenSSL context to prevent native use-after-free access.**

Explicitly manage the lifecycle of `ReferenceCountedOpenSslEngine` instances by invoking `release()` when they are no longer needed, ensuring all child engines are shut down and released prior to releasing the parent `ReferenceCountedOpenSslContext`.

```java
ReferenceCountedOpenSslEngine engine = (ReferenceCountedOpenSslEngine) sslContext.newEngine(alloc);
try {
    // Conduct SSL communication
} finally {
    // Always release the engine before context release
    engine.release();
}
```
