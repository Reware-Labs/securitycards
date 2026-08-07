# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: resource exhaustion

## resource exhaustion

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
