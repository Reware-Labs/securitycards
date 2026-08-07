# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: deserialization

## deserialization

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
