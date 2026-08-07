# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: secret handling

## secret handling

### Exclude Sensitive Fields Using GsonBuilder and Exclusion Strategies

**Use when**

Serializing or deserializing objects that contain sensitive fields such as passwords, secrets, or internal tokens to prevent unauthorized exposure.

**Secure rules**

**Rule 1: Configure Gson to explicitly exclude unannotated sensitive fields using GsonBuilder and exclusion strategies.**

To ensure that unannotated sensitive fields are excluded during serialization and deserialization, construct the Gson instance using `GsonBuilder` and invoke `excludeFieldsWithoutExposeAnnotation()`, or implement custom `ExclusionStrategy` instances to explicitly exclude sensitive classes, fields, or annotations. Register directional strategies using `GsonBuilder.addSerializationExclusionStrategy` or `GsonBuilder.addDeserializationExclusionStrategy` when fields should be hidden during serialization or skipped during deserialization.

```java
Gson gson = new GsonBuilder()
    .excludeFieldsWithoutExposeAnnotation()
    .create();

public class User {
  @Expose private String firstName;
  @Expose(serialize = false) private String password;
  private String secretToken;
}
```
