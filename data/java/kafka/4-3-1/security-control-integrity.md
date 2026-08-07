# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: security control integrity

## security control integrity

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
