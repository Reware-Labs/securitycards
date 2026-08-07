# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: deserialization

## deserialization

### Enforce Safe Object Construction and Validate Deserialized State

**Use when**

When configuring GsonBuilder and designing classes for deserialization to prevent unsafe object instantiation, bypass of constructors, and invalid state processing.

**Secure rules**

**Rule 1: Disable JDK Unsafe allocation to enforce constructors during deserialization.**

Call `disableJdkUnsafe()` on `GsonBuilder` to prohibit JDK Unsafe allocation when instantiating target classes during deserialization. By default, Gson falls back to `sun.misc.Unsafe` to instantiate objects lacking default constructors, which bypasses constructor execution and class invariants.

```java
Gson gson = new GsonBuilder()
    .disableJdkUnsafe()
    .registerTypeAdapter(TargetClass.class, new TargetClassInstanceCreator())
    .create();
```

**Rule 2: Validate deserialized object state using PostConstructAdapterFactory.**

Standard Gson deserialization populates fields directly via reflection, bypassing constructor-based validation checks. By registering `PostConstructAdapterFactory`, methods annotated with `@PostConstruct` are automatically invoked after object creation, allowing developers to enforce domain invariants and validate input contracts on newly deserialized objects.

```java
Gson gson = new GsonBuilder()
    .registerTypeAdapterFactory(new PostConstructAdapterFactory())
    .create();

public class UserPayload {
  private String role;

  @PostConstruct
  private void validate() {
    if (role == null || !role.startsWith("ROLE_")) {
      throw new IllegalArgumentException("Invalid role supplied");
    }
  }
}
```


### Restrict Polymorphic Deserialization and Class Instantiation to Approved Allowlist Types

**Use when**

When implementing custom type adapters, polymorphic deserializers, or handling types that require strict type resolution and instantiation constraints from untrusted JSON inputs.

**Secure rules**

**Rule 1: Restrict type resolution in polymorphic custom deserializers using explicit allowlists.**

When implementing custom polymorphic deserializers in Gson that resolve target types based on JSON fields, avoid dynamically loading classes via unvalidated inputs like `Class.forName()`. Always restrict target types using an explicit allowlist or enum mapping prior to calling `JsonDeserializationContext.deserialize()`.

**Rule 2: Avoid custom type adapters that instantiate arbitrary classes from untrusted JSON values.**

Gson explicitly disables `java.lang.Class` serialization and deserialization by default, throwing an `UnsupportedOperationException`. Developers should not implement custom type adapters that resolve `java.lang.Class` from untrusted JSON string values using reflection, and should instead map allowed string identifiers to specific, safe target types using a strict whitelist.

```java
Map<String, Class<?>> ALLOWED_TYPES = Map.of(
    "user", UserDto.class,
    "admin", AdminDto.class
);

String typeKey = jsonObject.get("type").getAsString();
Class<?> targetClass = ALLOWED_TYPES.get(typeKey);
if (targetClass == null) {
  throw new IllegalArgumentException("Unauthorized target type");
}
Object payload = gson.fromJson(jsonObject.get("data"), targetClass);
```
