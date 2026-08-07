# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: session management

## session management

### Enforce Bounded SASL Session Re-Authentication Intervals

**Use when**

When configuring client connections and broker security parameters for SASL authentication to ensure session expiration and periodic re-authentication.

**Secure rules**

**Rule 1: Configure explicit and realistic maximum re-authentication intervals for active SASL client sessions.**

Specify connection lifetimes using `connections.max.reauth.ms` to force connected clients to periodically execute SASL re-authentication, preventing long-lived sessions from remaining active indefinitely after credential or token revocation. Ensure values are bounded and non-extreme to avoid arithmetic overflow exceptions.

```java
Map<String, Long> connectionsMaxReauthMs = Map.of(
    "SCRAM-SHA-512", 3600000L,
    "OAUTHBEARER", 1800000L
);
```
