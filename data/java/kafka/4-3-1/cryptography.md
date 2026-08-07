# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: cryptography

## cryptography

### Configure Supported OAuthBearer Assertion Signing Algorithms and Private Keys Securely

**Use when**

Configuring OAuthBearer client assertions and signing algorithms when establishing secure authentication mechanisms in Kafka clients.

**Secure rules**

**Rule 1: Configure OAuthBearer client assertion signing algorithms using supported standard algorithms such as RS256 or ES256 with matching PKCS#8 private keys.**

When configuring client assertions, explicitly set `sasl.oauthbearer.assertion.algorithm` to either `RS256` or `ES256`, and supply a corresponding PKCS#8 encoded private key. For ES256, ensure Java uses the required signature format to generate RFC 7515 compliant signatures.

```java
Map<String, Object> configs = new HashMap<>();
configs.put("sasl.oauthbearer.assertion.algorithm", "RS256");
configs.put("sasl.oauthbearer.assertion.claim.exp.seconds", "300");
configs.put("sasl.oauthbearer.assertion.claim.aud", "https://auth.example.com/oauth/token");
```
