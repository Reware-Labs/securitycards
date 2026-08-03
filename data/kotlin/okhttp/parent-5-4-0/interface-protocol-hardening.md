# Security cards

Repository: `https://github.com/lysine-dev/okhttp#parent-5.4.0`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Strict Protocol Version Restriction for HTTP/2 Prior Knowledge

**Use when**

Configuring network protocols and client connections where cleartext HTTP/2 without ALPN negotiation is required.

**Secure rules**

**Rule 1: Do not combine Protocol.H2_PRIOR_KNOWLEDGE with other protocols in the protocol configuration list.**

When configuring HTTP protocols using `Protocol.H2_PRIOR_KNOWLEDGE`, ensure it is the sole protocol specified in the protocol list. Mixing prior knowledge HTTP/2 with fallback protocols like `Protocol.HTTP_1_1` or `Protocol.HTTP_2` introduces protocol ambiguity and causes runtime connection failures.

```kotlin
server.protocols = listOf(Protocol.H2_PRIOR_KNOWLEDGE)
```
