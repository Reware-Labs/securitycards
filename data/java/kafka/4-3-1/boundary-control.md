# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: boundary control

## boundary control

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
