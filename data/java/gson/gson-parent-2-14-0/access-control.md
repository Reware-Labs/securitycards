# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: access control

## access control

### Configure Exclusion Strategies for Both Serialization and Deserialization

**Use when**

When controlling data exposure and preventing unauthorized field population during object-to-JSON and JSON-to-object conversions.

**Secure rules**

**Rule 1: Apply exclusion strategies to both serialization and deserialization operations to prevent unauthorized data exposure and mass-assignment.**

Recognize that Gson exclusion strategies applied via `addSerializationExclusionStrategy` or `addDeserializationExclusionStrategy` are strictly directional. To ensure that sensitive or internal fields are completely restricted from both incoming payloads and outgoing responses, use `setExclusionStrategies` or explicitly register strategies for both operational directions.

```java
ExclusionStrategy sensitiveStrategy = new ExclusionStrategy() {
  @Override
  public boolean shouldSkipField(FieldAttributes f) {
    return f.getAnnotation(Sensitive.class) != null;
  }
  @Override
  public boolean shouldSkipClass(Class<?> clazz) {
    return false;
  }
};

Gson gson = new GsonBuilder()
    .setExclusionStrategies(sensitiveStrategy)
    .create();
```
