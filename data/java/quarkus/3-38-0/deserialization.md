# Security cards

Repository: `https://github.com/quarkusio/quarkus#3.38.0`
Category: deserialization

## deserialization

### Use Type-Safe Deserializers and Strict Configurations for Untrusted Payloads

**Use when**

Deserializing untrusted incoming data streams such as Kafka records or JSON payloads in Quarkus applications.

**Secure rules**

**Rule 1: Use explicit type-safe deserializers and declare concrete payload types on messaging channels to prevent arbitrary object instantiation.**

When processing Kafka records or consuming messages from Kafka channels via `@Incoming`, configure structured type-safe deserializers like `ObjectMapperDeserializer` or `JsonbDeserializer` and declare concrete Java types on method parameters. Ensure underlying `ObjectMapper` instances do not enable unrestricted polymorphic default typing.

```java
@Incoming("orders-in")
public void processOrder(OrderDto order) {
    // Quarkus automatically configures ObjectMapperDeserializer for OrderDto
}
```

**Rule 2: Enforce strict JSON deserialization by rejecting unknown properties.**

Prevent unexpected input parameter injection during JSON deserialization by configuring `quarkus.jackson.fail-on-unknown-properties=true` in `application.properties` or annotating model classes with `@JsonIgnoreProperties(ignoreUnknown = false)`.

```properties
quarkus.jackson.fail-on-unknown-properties=true
```

**Rule 3: Apply all registered object mapper customizers when defining custom producers.**

When creating custom CDI producers for `ObjectMapper` or JSON-B components to override framework defaults, inject and iterate over all registered `ObjectMapperCustomizer` or `JsonbConfigCustomizer` beans to preserve security-relevant configurations.

```java
@Singleton
@Produces
ObjectMapper objectMapper(@All List<ObjectMapperCustomizer> customizers) {
    ObjectMapper mapper = new ObjectMapper();
    for (ObjectMapperCustomizer customizer : customizers) {
        customizer.customize(mapper);
    }
    return mapper;
}
```
