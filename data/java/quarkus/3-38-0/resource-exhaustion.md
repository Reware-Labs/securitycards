# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: resource exhaustion

## resource exhaustion

### Configure OIDC Token Caching to Prevent Authorization Server Resource Exhaustion

**Use when**

Configuring OIDC bearer token authentication in Quarkus applications to handle remote token introspection and UserInfo endpoint responses efficiently.

**Secure rules**

**Rule 1: Enable and configure the built-in token cache for remote OIDC endpoints to reduce repetitive synchronous HTTP calls and prevent authorization server denial of service.**

Define properties such as `quarkus.oidc.token-cache.max-size`, `quarkus.oidc.token-cache.time-to-live`, and `quarkus.oidc.token-cache.clean-up-timer-interval` in `application.properties` to bound cache size and lifecycle.

```properties
quarkus.oidc.token-cache.max-size=1000
quarkus.oidc.token-cache.time-to-live=3M
quarkus.oidc.token-cache.clean-up-timer-interval=1M
```
