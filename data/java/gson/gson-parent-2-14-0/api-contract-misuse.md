# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: api contract misuse

## api contract misuse

### Prevent Infinite Recursion and Type Errors in Custom Deserializers and Adapters

**Use when**

When implementing custom `JsonDeserializer` or configuring type adapters and deserialization contexts to prevent infinite recursion, stack overflows, and runtime type errors.

**Secure rules**

**Rule 1: Avoid delegating deserialization to the same `JsonElement`.**

When implementing a custom `JsonDeserializer`, never call `JsonDeserializationContext.deserialize(...)` using the exact `JsonElement` and `Type` received as parameters in the `deserialize` method to prevent infinite recursion and `StackOverflowError`.

```java
public class UserDeserializer implements JsonDeserializer<User> {
  @Override
  public User deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
    JsonObject jsonObject = json.getAsJsonObject();
    // Delegate deserialization for child elements, not 'json' itself
    Address address = context.deserialize(jsonObject.get("address"), Address.class);
    return new User(jsonObject.get("name").getAsString(), address);
  }
}
```

**Rule 2: Register type adapters for both primitive and wrapper classes.**

Gson treats primitive types as distinct types from their corresponding boxed wrapper classes. When custom serialization or validation logic is required, explicitly register adapters for both primitive and wrapper types so that boxed objects do not bypass the adapter.

```java
JsonSerializer<Boolean> customBoolSerializer = (src, type, context) -> new JsonPrimitive(src ? 1 : 0);
Gson gson = new GsonBuilder()
    .registerTypeAdapter(boolean.class, customBoolSerializer)
    .registerTypeAdapter(Boolean.class, customBoolSerializer)
    .create();
```

**Rule 3: Specify explicit base type in `toJson` to prevent subclass field exposure.**

When calling `gson.toJson(Object)` without an explicit `Type` parameter, Gson uses the runtime instance class, including all fields defined on any subclass. To restrict JSON output strictly to the fields of a superclass or interface boundary, invoke `gson.toJson(Object, Type)` or `gson.toJsonTree(Object, Type)` with the explicit parent type.

```java
Base instance = new SubClassWithSensitiveFields();

// Unsafe: serializes all fields of SubClassWithSensitiveFields
String unsafeJson = gson.toJson(instance);

// Safe: limits serialization strictly to fields declared in Base class
String safeJson = gson.toJson(instance, Base.class);
```


### Safely Parse and Handle Primitives and JsonElements in Gson

**Use when**

When validating types, extracting values from JSON elements, or handling narrowing conversions and null values on `JsonPrimitive`, `JsonObject`, and `JsonArray` instances.

**Secure rules**

**Rule 1: Validate element types before calling `JsonObject` convenience getters.**

Avoid calling typed convenience getters like `getAsJsonObject()`, `getAsJsonArray()`, or `getAsJsonPrimitive()` directly on untrusted JSON properties without validating the element type first using methods such as `isJsonObject()` to prevent unhandled `ClassCastException` and application crashes.

```java
JsonElement element = jsonObject.get("details");
if (element != null && element.isJsonObject()) {
    JsonObject details = element.getAsJsonObject();
    // Safely process details
} else {
    // Handle missing or invalid payload structure safely
}
```

**Rule 2: Handle runtime exceptions during `JsonPrimitive` format conversions.**

Narrowing conversions on `JsonPrimitive` instances can throw unchecked exceptions on invalid or edge-case input. Always validate inputs or handle runtime exceptions when parsing untrusted primitive values.

```java
if (primitive.isString() && !primitive.getAsString().isEmpty()) {
  char firstChar = primitive.getAsCharacter();
} else if (primitive.isNumber()) {
  BigDecimal bigDecimal = primitive.getAsBigDecimal();
}
```

**Rule 3: Handle nulls explicitly when mutating `JsonArray` via its list view.**

When mutating a `JsonArray` through its `List` view obtained via `asList()`, passing Java `null` throws a `NullPointerException`. Explicitly supply `JsonNull.INSTANCE` instead of `null` when mutating the list view.

```java
List<JsonElement> list = jsonArray.asList();
// Use JsonNull.INSTANCE instead of passing Java null
list.add(JsonNull.INSTANCE);
```

**Rule 4: Use `JsonNull` instead of Java `null` when mutating `asMap` view.**

Do not pass Java `null` keys or values into the `Map` view returned by `asMap()`. Use `JsonNull.INSTANCE` instead to avoid throwing a `NullPointerException`.

```java
Map<String, JsonElement> map = jsonObject.asMap();
// Correct: Use JsonNull.INSTANCE for null JSON values when using asMap()
map.put("optionalField", JsonNull.INSTANCE);
```
