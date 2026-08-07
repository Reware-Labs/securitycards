# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: authentication

## authentication

### Configure SASL Authentication and Credentials Securely

**Use when**

When developers are configuring Kafka clients or brokers with SASL authentication mechanisms such as PLAIN, SCRAM, or OAuthBearer to verify identities.

**Secure rules**

**Rule 1: Explicitly set `security.protocol`, `sasl.mechanism`, and `sasl.jaas.config` for SASL-authenticated clients**

Kafka clients default to the unauthenticated **PLAINTEXT** protocol. Always override that default and supply matching SASL mechanism and JAAS credentials so the connection uses the intended secure channel.

```java
import org.apache.kafka.common.config.CommonClientConfigs;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.security.auth.SecurityProtocol;
import org.apache.kafka.clients.admin.Admin;

Map<String, Object> props = new HashMap<>();
props.put(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG, "broker1:9093");

// 1 – choose the secure wire protocol
props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, SecurityProtocol.SASL_SSL.name);

// 2 – declare the SASL mechanism that both client and broker support
props.put(SaslConfigs.SASL_MECHANISM, "SCRAM-SHA-256");

// 3 – embed (or externally supply) the JAAS login for that mechanism
props.put(SaslConfigs.SASL_JAAS_CONFIG,
    "org.apache.kafka.common.security.scram.ScramLoginModule required " +
    "username=\"alice\" password=\"alice-secret\";");

// authenticated, encrypted AdminClient
try (Admin admin = Admin.create(props)) {
    // secure operations here
}
```

**Rule 2: Use strong SCRAM mechanisms and sufficient iteration counts for user credentials.**

When managing user credentials via `Admin.alterUserScramCredentials`, ensure robust mechanisms like `SCRAM-SHA-512` or `SCRAM-SHA-256` are paired with adequate iteration counts to protect against offline brute-force attacks.

```java
Admin adminClient = Admin.create(props);
UserScramCredentialUpsertion userUpsertion = new UserScramCredentialUpsertion(
    "app_user",
    new ScramCredentialInfo(ScramMechanism.SCRAM_SHA_512, 8192),
    "securePassword123!"
);
adminClient.alterUserScramCredentials(Collections.singletonList(userUpsertion)).all().get();
```

**Rule 3: Prefix broker SASL configurations by listener and mechanism name.**

On brokers hosting multiple network listeners or SASL mechanisms, prefix configurations such as `sasl.jaas.config` with `listener.name.<listener_name>.<mechanism>.` to prevent credential and callback settings from leaking or conflicting across endpoints.

```properties
listener.name.sasl_ssl.scram-sha-256.sasl.jaas.config=org.apache.kafka.common.security.scram.ScramLoginModule required;
listener.name.sasl_ssl.scram-sha-256.sasl.login.callback.handler.class=com.example.CustomScramLoginCallbackHandler
```


### Enforce Mutual TLS and Client Authentication Settings

**Use when**

When configuring TLS network listeners and verifying client certificates for transport-layer identity authentication on brokers and clients.

**Secure rules**

**Rule 1: Enforce mutual TLS client authentication on server endpoints.**

Explicitly set `ssl.client.auth` to `required` (or use listener-specific configuration prefixes) to enforce client certificate authentication at the transport layer.

```java
Map<String, Object> serverConfigs = new HashMap<>();
serverConfigs.put(BrokerSecurityConfigs.SSL_CLIENT_AUTH_CONFIG, "required");
```

**Rule 2: Configure broker truststores with all required client CA certificates.**

Ensure the broker's truststore contains all root and intermediate CA certificates that signed the connecting client certificates when mutual TLS is enabled.

```properties
ssl.client.auth=required
ssl.truststore.certificates="-----BEGIN CERTIFICATE-----
<CA Certificate Material>
-----END CERTIFICATE-----"
```


### Validate OAuth2 and OIDC JWT Tokens Strictly

**Use when**

When implementing or configuring OAuth2 token validation, custom validators, or callback handlers for SASL/OAUTHBEARER authentication.

**Secure rules**

**Rule 1: Configure expected audience, issuer, and JWKS endpoints for OAuth token validation.**

Always explicitly specify `sasl.oauthbearer.expected.audience`, `sasl.oauthbearer.expected.issuer`, and `sasl.oauthbearer.jwks.endpoint.url` to ensure the broker validates token signatures, origins, and intended audiences.

```java
Map<String, Object> configs = new HashMap<>();
configs.put(SaslConfigs.SASL_OAUTHBEARER_JWKS_ENDPOINT_URL, "https://idp.example.com/oauth2/v1/keys");
configs.put(SaslConfigs.SASL_OAUTHBEARER_EXPECTED_ISSUER, "https://idp.example.com/");
configs.put(SaslConfigs.SASL_OAUTHBEARER_EXPECTED_AUDIENCE, List.of("kafka-cluster"));

OAuthBearerValidatorCallbackHandler handler = new OAuthBearerValidatorCallbackHandler();
handler.configure(configs, OAUTHBEARER_MECHANISM, jaasEntries);
```

**Rule 2: Validate token expiration times and time consistency strictly.**

Ensure expiration times (`exp`), issued-at times (`iat`), and internal time consistency (`exp > iat`) are verified against current time using non-negative clock skews to reject expired or inconsistent tokens.

```java
long currentTimeMs = System.currentTimeMillis();
int allowableClockSkewMs = 5000;

OAuthBearerValidationResult expResult = OAuthBearerValidationUtils.validateExpirationTime(jwt, currentTimeMs, allowableClockSkewMs);
if (!expResult.success()) {
    throw new SaslException(expResult.failureDescription());
}

OAuthBearerValidationResult timeResult = OAuthBearerValidationUtils.validateTimeConsistency(jwt);
if (!timeResult.success()) {
    throw new SaslException(timeResult.failureDescription());
}
```

**Rule 3: Avoid using unsecured OAuth2 login callback handlers in production.**

Do not use `OAuthBearerUnsecuredLoginCallbackHandler`, which generates unsigned JWS tokens using `alg: none`. Explicitly configure production-grade callback handlers like `OAuthBearerLoginCallbackHandler` instead.

```properties
sasl.mechanism=OAUTHBEARER
sasl.login.callback.handler.class=org.apache.kafka.common.security.oauthbearer.secured.OAuthBearerLoginCallbackHandler
```
