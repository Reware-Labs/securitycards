# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`

## Category: access control

### Configure Explicit Access Control Lists and Authorizer Settings

**Use when**

When administering cluster security settings, defining topic or group access permissions, and configuring broker authorization mechanisms in Kafka.

**Secure rules**

**Rule 1: Configure the Kafka authorizer to enforce granular access control lists and maintain a fail-closed posture.**

Set `authorizer.class.name` to `org.apache.kafka.metadata.authorizer.StandardAuthorizer` in KRaft mode and ensure `allow.everyone.if.no.acl.found` is set to `false` to prevent unconfigured resources from being accessed by default.

```properties
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
allow.everyone.if.no.acl.found=false
super.users=User:admin
```

**Rule 2: Define explicit ACL bindings with specific principal types, resource patterns, and granular operations.**

Construct explicit `AclBinding` instances specifying resource types, restricted operations, and exact principal identifiers rather than using wildcard permissions or overly broad privileges.

```java
ResourcePattern pattern = new ResourcePattern(ResourceType.TOPIC, "orders-topic", PatternType.LITERAL);
AccessControlEntry entry = new AccessControlEntry("User:order-processor", "*", AclOperation.READ, AclPermissionType.ALLOW);
AclBinding binding = new AclBinding(pattern, entry);
adminClient.createAcls(Collections.singleton(binding)).all().get();
```


### Handle Authorization Exceptions and Inspect Authorized Operations

**Use when**

When executing administrative, produce, or consume operations in client applications that may encounter permission rejections or require permission introspection.

**Secure rules**

**Rule 1: Catch and handle granular authorization exceptions during cluster and resource management operations.**

Explicitly catch authorization-related execution exceptions such as `TopicAuthorizationException`, `ClusterAuthorizationException`, and `GroupAuthorizationException` when invoking administrative or data retrieval APIs to log security events and prevent unhandled application crashes.

```java
try {
    adminClient.deleteTopics(Collections.singleton("sensitive-topic")).all().get();
} catch (ExecutionException e) {
    if (e.getCause() instanceof TopicAuthorizationException) {
        TopicAuthorizationException authError = (TopicAuthorizationException) e.getCause();
        logger.error("Principal unauthorized to access topics: {}", authError.unauthorizedTopics());
    } else if (e.getCause() instanceof ClusterAuthorizationException) {
        logger.error("Principal lacks cluster-level authorization");
    }
}
```

**Rule 2: Request authorized operations explicitly when describing resource metadata.**

Call `includeAuthorizedOperations(true)` on options classes such as `DescribeTopicsOptions` when permission introspection is required to avoid receiving a `null` authorized operations response.

```java
DescribeTopicsOptions options = new DescribeTopicsOptions().includeAuthorizedOperations(true);
Map<String, TopicDescription> topicDescriptions = admin.describeTopics(List.of("my-topic"), options).allTopicNames().get();
Set<AclOperation> ops = topicDescriptions.get("my-topic").authorizedOperations();
if (ops != null && ops.contains(AclOperation.DELETE)) {
    // User is authorized to perform deletion
}
```


### Isolate Multi-Tenant Apache Kafka Resources and Prevent Cross-Tenant Access

**Use when**

Configuring access control lists, authorizers, prefixed resource patterns, and topic namespaces to isolate multiple tenants within a shared Apache Kafka cluster.

**Secure rules**

**Rule 1: Enforce granular resource-level ACL checks and scoping via prefixed resource patterns for multi-tenant Kafka operations.**

Validate tenant authorization against specific resource patterns and application identifiers before executing administrative operations or returning metadata. Restrict application principals to resources prefixed with their specific application ID to prevent cross-tenant access to changelog topics, repartition topics, and state stores.

```scala
val action = new Action(
  AclOperation.DESCRIBE_CONFIGS,
  new ResourcePattern(ResourceType.TOPIC, "tenant-a-topic", PatternType.LITERAL),
  1, true, true
)
authorizer.authorize(requestContext, util.List.of(action))
```

**Rule 2: Restrict controller management endpoints and administrative operations to authorized principals.**

Configure explicit authorizer plugins and super-user parameters to ensure non-administrative tenant principals are unauthorized to execute cluster-level operations, broker registrations, partition state alterations, or controller fetch operations.

```properties
authorizer.class.name=org.apache.kafka.metadata.authorizer.StandardAuthorizer
super.users=User:CN=systemtest
```

**Rule 3: Disable automatic topic creation and enforce custom topic naming policies to prevent cross-tenant leakage.**

Set `auto.create.topics.enable=false` in broker configurations and specify a custom topic policy implementation via `create.topic.policy.class.name` to ensure tenants cannot implicitly create or access topics outside their assigned prefix boundary.

**Rule 4: Bind ACLs explicitly to specific user principals and tenant-scoped resource prefixes without wide wildcards.**

Avoid wildcard principals and host bindings to prevent unintended cross-tenant access. Structure tenant namespaces with disjoint, non-overlapping prefixes so that broader DENY rules do not inadvertently block legitimate ALLOW permissions on sub-resources.

```scala
val tenant1User = new KafkaPrincipal(KafkaPrincipal.USER_TYPE, "tenant1-app")
val tenant1Topic = new ResourcePattern(ResourceType.TOPIC, "tenant1.", PatternType.PREFIXED)
val allowRead = new AccessControlEntry(tenant1User.toString, "192.168.1.10", AclOperation.READ, AclPermissionType.ALLOW)
authorizer.createAcls(requestContext, List(new AclBinding(tenant1Topic, allowRead)).asJava)
```


## Category: api contract misuse

### Differentiate Retriable and Non-Retriable Errors in Retry and Error Handling Workflows

**Use when**

Implementing retry logic, custom exception handlers, or error management across Kafka clients, admin operations, and producers to handle transient network issues without masking fatal security or state errors.

**Secure rules**

**Rule 1: Distinguish between retriable broker errors and non-retriable authentication, authorization, or state exceptions before retrying operations.**

Inspect underlying error causes and exception types to ensure that transient connection or cluster errors are retried according to configured limits, while fatal security exceptions such as `AuthorizationException` or `AuthenticationException` fail fast without triggering manual retry loops or resource exhaustion.

```java
try {
    admin.createTopics(Collections.singleton(new NewTopic("topic", 1, (short) 1))).all().get();
} catch (ExecutionException e) {
    if (e.getCause() instanceof AuthorizationException || e.getCause() instanceof AuthenticationException) {
        throw e;
    }
}
```

**Rule 2: Validate exception retriability within custom exception handlers before returning retry responses.**

Ensure that custom exception handlers like `ProductionExceptionHandler` verify that an exception instance implements `org.apache.kafka.common.errors.RetriableException` before returning `Response.retry()`, preventing non-retriable errors from being mishandled as retriable and bypassing proper failure handling.

```java
@Override
public Response handleError(ErrorHandlerContext context, ProducerRecord<byte[], byte[]> record, Exception exception) {
    if (exception instanceof org.apache.kafka.common.errors.RetriableException) {
        return Response.retry();
    }
    return Response.fail();
}
```

**Rule 3: Restrict transactional retry handling to transient errors and immediately halt on fatal transaction states.**

Strictly separate transient retriable errors such as `CONCURRENT_TRANSACTIONS` from non-retriable fatal errors like `ProducerFencedException`, allowing safe backoff retries only for transient issues while transitioning fatal errors to an abortable or fatal state.

```java
if (error.isRetriable()) {
    transactionManager.retryRequest(request, retryBackoffMs);
} else if (error == Errors.PRODUCER_FENCED.exception()) {
    transactionManager.transitionToFatalError(error);
} else {
    transactionManager.transitionToAbortableError(error);
}
```


### Initialize ClientCredentialsJwtRetriever before token retrieval

**Use when**

Instantiating and using custom SASL/OAUTHBEARER token retriever logic in Kafka clients.

**Secure rules**

**Rule 1: Invoke configuration methods on ClientCredentialsJwtRetriever before calling token retrieval operations.**

Always invoke `configure()` on `ClientCredentialsJwtRetriever` before calling `retrieve()` or attempting token fetch operations to prevent an `IllegalStateException` caused by an uninitialized internal HTTP retriever delegate.

```java
ClientCredentialsJwtRetriever retriever = new ClientCredentialsJwtRetriever();
retriever.configure(configs, saslMechanism, jaasConfigEntries);
String jwtToken = retriever.retrieve();
retriever.close();
```


## Category: authentication

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


## Category: boundary control

### Implement Dead Letter Queue Routing for Failed and Malformed Records

**Use when**

Building Kafka Streams or Kafka Connect applications that must safely isolate production errors, deserialization failures, or unprocessable records without causing data loss or application downtime.

**Secure rules**

**Rule 1: Route production and serialization errors to a dead letter queue using `ProductionExceptionHandler`**

Implement `ProductionExceptionHandler` and override `handleError` or `handleSerializationError` to redirect failed records to a dead letter queue topic using non-deprecated methods.

```java
@Override
public Response handleError(ErrorHandlerContext context, ProducerRecord<byte[], byte[]> record, Exception exception) {
    ProducerRecord<byte[], byte[]> dlqRecord = new ProducerRecord<>("my-dlq-topic", record.key(), record.value());
    return Response.resume(Collections.singletonList(dlqRecord));
}
```

**Rule 2: Preserve diagnostic headers and context when routing records to dead letter queues**

Configure processing or deserialization exception handlers to emit records to a dedicated DLQ topic while retaining origin context and diagnostic headers to maintain complete forensic visibility.

```java
Properties props = new Properties();
props.put(StreamsConfig.PROCESSING_EXCEPTION_HANDLER_CLASS_CONFIG, LogAndContinueProcessingExceptionHandler.class.getName());
props.put(StreamsConfig.DESERIALIZATION_EXCEPTION_HANDLER_CLASS_CONFIG, LogAndContinueExceptionHandler.class.getName());
```

**Rule 3: Route unparseable records to dead letter queues using `handleError`**

Use the non-deprecated `handleError` method in custom deserialization handlers to return a `DeserializationExceptionHandler.Response` containing `ProducerRecord` objects directed to a designated dead letter queue topic.

```java
@Override
public Response handleError(ErrorHandlerContext context, ConsumerRecord<byte[], byte[]> record, Exception exception) {
    ProducerRecord<byte[], byte[]> dlqRecord = new ProducerRecord<>("my-dlq-topic", null, record.timestamp(), record.key(), record.value(), record.headers());
    return Response.resume(Collections.singletonList(dlqRecord));
}
```

**Rule 4: Isolate unprocessable inputs to dead letter queues using continue-on-error handlers to prevent denial of service**

Select appropriate exception handler strategies such as `LogAndContinueProcessingExceptionHandler` to direct bad inputs to a DLQ and maintain application availability.

```java
props.put(StreamsConfig.PROCESSING_EXCEPTION_HANDLER_CLASS_CONFIG, LogAndContinueProcessingExceptionHandler.class.getName());
```

**Rule 5: Secure Kafka Connect dead letter queue reporting and restrict target topic access**

Configure Kafka Connect `DeadLetterQueueReporter` with explicitly defined topic properties and strict access controls, auditing whether stack trace context headers expose sensitive information.

```java
Map<String, String> connectorConfig = new HashMap<>();
connectorConfig.put("errors.deadletterqueue.topic.name", "dlq-sensitive-connector-errors");
connectorConfig.put("errors.deadletterqueue.context.headers.enable", "true");
connectorConfig.put("errors.deadletterqueue.topic.replication.factor", "3");
```


### Restrict OAuth token endpoints and assertion file paths using security allowlists

**Use when**

Configuring authentication mechanisms and OAuth credential boundaries where untrusted external token URLs or local assertion files might be specified.

**Secure rules**

**Rule 1: Enforce explicit allowlists for allowed OAuth token URLs and assertion file paths to prevent unauthorized endpoint communication and file access.**

Set security allowlists for allowed OAuth URLs and file paths in the application or broker environment to ensure that authentication assertions are strictly validated and constrained at the security boundary before requests are processed.

```java
System.setProperty("org.apache.kafka.common.config.internals.BrokerSecurityConfigs.ALLOWED_SASL_OAUTHBEARER_URLS_CONFIG", "https://keycloak.example.com/realms/kafka/protocol/openid-connect/token");
System.setProperty("org.apache.kafka.common.config.internals.BrokerSecurityConfigs.ALLOWED_SASL_OAUTHBEARER_FILES_CONFIG", "/etc/kafka/keys/rsa-private-key.pem");
```


## Category: configuration source integrity

### Ensure Trusted and Verified Configuration Sources for Security Providers

**Use when**

Configuring security provider class names and dynamically instantiating Java Security Providers via `security.providers` configuration settings.

**Secure rules**

**Rule 1: Validate and restrict security provider configuration sources to ensure only trusted and fully qualified class names are loaded.**

Applications and administrative tooling must ensure that the `security.providers` configuration source is completely untampered and populated solely with trusted fully qualified `SecurityProviderCreator` class names. Because Kafka registers these providers via reflection, validating configuration sources prevents malicious or unintended classes from being loaded into the JVM.

```java
Map<String, Object> configs = new HashMap<>();
configs.put(SecurityConfig.SECURITY_PROVIDERS_CONFIG, "org.example.security.MySecurityProviderCreator");
SecurityUtils.addConfiguredSecurityProviders(configs);
```


## Category: cryptography

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


## Category: deserialization

### Secure JSON Deserialization in Kafka Connect and OAuth Handlers

**Use when**

When parsing untrusted JSON payloads or template configuration files in Kafka Connect or client security components.

**Secure rules**

**Rule 1: Explicitly configure schema validation rules when deserializing JSON bytes in Kafka Connect.**

When deserializing JSON byte arrays into data representations using `JsonConverter`, explicitly configure schema settings and validation rules to prevent type coercion and unexpected data truncation.

```java
Map<String, Object> config = Map.of("schemas.enable", true);
JsonConverter converter = new JsonConverter();
converter.configure(config, false);
SchemaAndValue result = converter.toConnectData("my-topic", jsonBytes);
```


## Category: file handling

### Restrict Operating System Permissions on Keytab Files

**Use when**

Configuring Kerberos keytab files for authentication in Kafka environments.

**Secure rules**

**Rule 1: Ensure Kerberos keytab files are readable only by the Kafka process user**

Kafka 4.3.1 documentation requires that every keytab referenced in broker‐ or client‐side JAAS configurations be readable by *only* the operating-system account that launches the corresponding Kafka process. Apply restrictive filesystem permissions so no other local user can read or modify the keytab.

```conf
KafkaServer {
    com.sun.security.auth.module.Krb5LoginModule required
    useKeyTab=true
    storeKey=true
    keyTab="/etc/security/keytabs/kafka_server.keytab"
    principal="kafka/kafka1.example.com@EXAMPLE.COM";
};
```


## Category: input contract definition

### Validate Resource Types and ACL Enum Attributes Before Submission

**Use when**

When building ACL bindings, filters, or administrative configuration requests in Kafka applications to ensure all resource types, pattern types, operations, and permission types are explicitly specified and validated before processing.

**Secure rules**

**Rule 1: Validate all resource types, pattern types, and ACL enum values against explicit enums to reject unknown or malformed inputs.**

Ensure that bindings, filters, and configuration definitions do not contain `UNKNOWN` enum attributes or unrecognized resource types. Explicitly check attributes such as `ResourceType`, `PatternType`, `AclOperation`, and `AclPermissionType` before passing them to controller managers or admin clients, rejecting any out-of-contract inputs with an `IllegalArgumentException`.

```java
if (binding.pattern().resourceType() == ResourceType.UNKNOWN ||
    binding.pattern().patternType() == PatternType.UNKNOWN ||
    binding.entry().operation() == AclOperation.UNKNOWN ||
    binding.entry().permissionType() == AclPermissionType.UNKNOWN) {
    throw new IllegalArgumentException("ACL binding contains UNKNOWN attributes");
}
```


## Category: input interpretation safety

### Validate Topic Names to Prevent Interpretation and Metric Collisions

**Use when**

When validating topic names in client applications or via topic policies to ensure unambiguous input interpretation.

**Secure rules**

**Rule 1: Avoid metric-name collisions between topic names that differ only by `.` and `_`**

Before creating a topic, compare the “unified” form of the new name—obtained by replacing `.` with `_`—with the unified forms of all existing topics. If any match is found, pick another name so that JMX metrics remain unambiguous.

```java
import org.apache.kafka.common.internals.Topic;
import java.util.Collection;

public static void ensureDistinctMetrics(String newTopic,
                                         Collection<String> existingTopics) {
    for (String current : existingTopics) {
        if (Topic.hasCollision(newTopic, current)) {   // Kafka 4.3.1 API
            throw new IllegalArgumentException(
                "Topic '" + newTopic + "' collides with existing topic '" +
                current + "' when metrics replace '.' with '_'. Choose a different name.");
        }
    }
}
```


## Category: interface protocol hardening

### Validate API keys and enforce protocol framing during authentication

**Use when**

Developing or configuring Kafka custom transport layers, network handlers, or protocol authentication mechanisms where incoming request headers and API keys must be strictly verified.

**Secure rules**

**Rule 1: Reject unexpected request types and invalid API keys during SASL handshake.**

Ensure that custom transport or protocol handlers fail fast on unexpected API keys prior to authentication completion rather than attempting to parse unauthenticated payload data. Kafka ensures that non-SASL or invalid API requests received during SASL authentication immediately trigger an `InvalidRequestException` without reading past the header.


## Category: network boundary

### Isolate controller bootstrap endpoints from broker client endpoints

**Use when**

Configuring administrative or management connections to Kafka KRaft cluster controllers to ensure control-plane endpoints remain segregated from data-plane client traffic.

**Secure rules**

**Rule 1: Configure AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG exclusively when administering controllers and remove standard bootstrap servers.**

When targeting cluster controllers directly for administrative operations, maintain strict isolation between broker data-plane endpoints and controller quorum administrative endpoints. Configure `AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG` exclusively and ensure standard `CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG` is removed so that control-plane metadata quorums are not exposed to unprivileged data-plane network clients.

```java
Map<String, Object> props = new HashMap<>();
props.put(AdminClientConfig.BOOTSTRAP_CONTROLLERS_CONFIG, "controller1:9093");
props.remove(CommonClientConfigs.BOOTSTRAP_SERVERS_CONFIG);
try (Admin admin = Admin.create(props)) {
    // Execute controller management operations
}
```


## Category: resource exhaustion

### Configure Client Quotas and Connection Limits to Prevent Resource Exhaustion

**Use when**

Setting up administrative quotas, throttling policies, and group membership limits to prevent Denial of Service from excessive producer, consumer, or coordinator loads.

**Secure rules**

**Rule 1: Pass null entity names when configuring default client quotas to ensure policies apply broadly.**

When setting global default client or user quotas using `Admin.alterClientQuotas`, pass `null` for the entity name in `ClientQuotaEntity` instead of the literal string `<default>` to correctly apply default rate limits across unconfigured clients.

```java
ClientQuotaEntity defaultUserEntity = new ClientQuotaEntity(
    Collections.singletonMap(ClientQuotaEntity.USER, null)
);
ClientQuotaAlteration quotaAlteration = new ClientQuotaAlteration(
    defaultUserEntity,
    Collections.singleton(new ClientQuotaAlteration.Op("consumer_byte_rate", 10485760.0))
);
adminClient.alterClientQuotas(Collections.singletonList(quotaAlteration)).all().get();
```

**Rule 2: Configure request percentage and byte rate quotas for broker users and client IDs.**

Use `QuotaConfig` properties such as `request_percentage`, `producer_byte_rate`, and `consumer_byte_rate` via administrative APIs or broker defaults to prevent rogue or high-volume clients from exhausting thread pools.

```java
Properties quotaProps = new Properties();
quotaProps.put(QuotaConfig.REQUEST_PERCENTAGE_OVERRIDE_CONFIG, "10.0");
quotaProps.put(QuotaConfig.PRODUCER_BYTE_RATE_OVERRIDE_CONFIG, "10485760");
quotaProps.put(QuotaConfig.CONSUMER_BYTE_RATE_OVERRIDE_CONFIG, "20971520");
adminClient.alterClientQuotas(Collections.singleton(new ClientQuotaAlteration(entity, entries)));
```


### Limit Inbound Request Payload and Connection Sizes in Kafka Brokers

**Use when**

Configuring network listeners and broker socket options to handle incoming client payloads, SASL authentication negotiation frames, and connection limits securely.

**Secure rules**

**Rule 1: Enforce strict byte-length boundaries on incoming request payloads and SASL negotiation frames.**

Configure `socket.request.max.bytes` and `sasl.server.max.receive.size` to drop oversized client requests and authentication frames before allocating excessive broker memory or processing headers.

```java
Map<String, Object> configs = new HashMap<>();
configs.put(BrokerSecurityConfigs.SASL_SERVER_MAX_RECEIVE_SIZE_CONFIG, "1048576");
```

**Rule 2: Automatically harvest inactive client socket connections.**

Set `connections.max.idle.ms` in the server configuration to prune dormant socket connections, freeing active file descriptors and preventing socket starvation from abandoned sessions.

```properties
connections.max.idle.ms=60000
```


## Category: secret handling

### Externalize Sensitive Credentials and Secrets via Config Providers and Secure Storage

**Use when**

Configuring brokers, clients, connectors, or mirror makers where sensitive credentials like passwords, private keys, and client secrets need to be supplied securely without hardcoding plaintext values in configuration files or code.

**Secure rules**

**Rule 1: Externalize sensitive credentials with ConfigProviders instead of hard-coding them or placing them in JAAS files**

Never commit plaintext passwords, private keys, or client secrets to source code or static `jaas.conf`.
Kafka 4.3 supports `ConfigProvider` indirection so that configuration files reference secrets stored in protected locations (files, directories, environment variables, vaults). Define the provider and use the `${provider:path:key}` placeholder to load the secret at runtime.

```properties
# client.properties
config.providers=file
config.providers.file.class=org.apache.kafka.common.config.provider.FileConfigProvider
config.providers.file.param.allowed.paths=/etc/kafka/creds

ssl.keystore.key=${file:/etc/kafka/creds/keystore.properties:privateKey}
ssl.keystore.certificate.chain=${file:/etc/kafka/creds/keystore.properties:certChain}
ssl.keystore.password=${file:/etc/kafka/creds/keystore.properties:keystorePass}
sasl.oauthbearer.client.credentials.client.secret=${file:/etc/kafka/creds/oauth.properties:clientSecret}
```

**Rule 2: Do not expect sensitive values from describeConfigs**

Use `Admin.describeConfigs` to inspect Kafka resource configurations, but treat entries for which `ConfigEntry.isSensitive()` is true as unavailable. Kafka returns `null` for sensitive values to prevent their disclosure. Check both `isSensitive()` and `value()` before processing a configuration value.

```java
import org.apache.kafka.clients.admin.Admin;
import org.apache.kafka.clients.admin.Config;
import org.apache.kafka.clients.admin.ConfigEntry;
import org.apache.kafka.common.config.ConfigResource;

import java.util.Collections;
import java.util.Map;

public final class ConfigReader {
    public static void printVisibleConfigs(
            Admin admin,
            ConfigResource resource
    ) throws Exception {
        Map<ConfigResource, Config> configs = admin
                .describeConfigs(Collections.singleton(resource))
                .all()
                .get();

        for (ConfigEntry entry : configs.get(resource).entries()) {
            if (!entry.isSensitive() && entry.value() != null) {
                System.out.println(entry.name() + "=" + entry.value());
            }
        }
    }
}
```


## Category: security control integrity

### Configure Producer Acknowledgements and Handle Send Errors for Delivery Safety

**Use when**

Developing Kafka producers that send records to a cluster and must ensure delivery persistence and transaction reliability.

**Secure rules**

**Rule 1: Use `acks=all` and check producer send results**

Configure the producer with `acks=all`. With this setting, the leader waits for all current in-sync replicas to acknowledge the record, providing Kafka's strongest available acknowledgment guarantee. For non-transactional sends, call `get()` on the returned `Future` or provide a callback that checks its exception argument. Close the producer after use.

```java
import java.util.Properties;
import java.util.concurrent.ExecutionException;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;

public static void sendRecord()
        throws InterruptedException, ExecutionException {
    Properties props = new Properties();
    props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    props.put(ProducerConfig.ACKS_CONFIG, "all");
    props.put(
        ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,
        StringSerializer.class.getName()
    );
    props.put(
        ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG,
        StringSerializer.class.getName()
    );

    try (KafkaProducer<String, String> producer = new KafkaProducer<>(props)) {
        ProducerRecord<String, String> record =
            new ProducerRecord<>("my-topic", "key", "value");

        producer.send(record).get();
    }
}
```

**Rule 2: Enforce acks=all and non-zero retries for idempotent and transactional producers.**

When enabling `enable.idempotence=true` or configuring a `transactional.id`, you must set `acks=all` and specify a non-zero `retries` value. Kafka Producer API contracts strictly require `acks=all` when idempotence or transactions are active to prevent unacknowledged record loss during partition failovers.

```java
Properties props = new Properties();
props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
props.put(ProducerConfig.ACKS_CONFIG, "all");
props.put(ProducerConfig.RETRIES_CONFIG, Integer.MAX_VALUE);
props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true");
KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```


### Fail Closed and Handle Uninitialized Authorizer States

**Use when**

When initializing custom authorizer components or interacting with authorizer metadata and access control checks during cluster startup.

**Secure rules**

**Rule 1: Fail closed when authorizer initialization fails or when authorization data cache loading is incomplete.**

Configure `authorizer.class.name` explicitly and ensure custom authorizer implementations fail fast during cluster startup if misconfigured. Additionally, propagate `AuthorizerNotReadyException` or reject incoming requests if authorization checks occur before cache loading completes so that access controls never run in a degraded or unmonitored state.

```java
try {
    AuthorizationResult result = authorizerData.authorize(requestContext, action);
    if (result != AuthorizationResult.ALLOWED) {
        throw new ClusterAuthorizationException("Access denied");
    }
} catch (AuthorizerNotReadyException e) {
    throw e;
}
```


## Category: session management

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
