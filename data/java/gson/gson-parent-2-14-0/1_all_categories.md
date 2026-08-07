# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`

## Category: access control

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


## Category: api contract misuse

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


## Category: boundary control

### Enforce Reflection Access Filters to Restrict Record Deserialization

**Use when**

Use when serializing or deserializing Java records or inaccessible types where data crosses untrusted application boundaries and runtime reflection must be strictly controlled.

**Secure rules**

**Rule 1: Configure a ReflectionAccessFilter on the GsonBuilder to enforce boundary checks against reflective instantiation of non-public record constructors or unexpected internal classes.**

Enforcing reflection access filters hardens runtime boundaries by blocking reflection on inaccessible types or restricted record constructors. Configure `GsonBuilder` with `addReflectionAccessFilter(...)` returning `FilterResult.BLOCK_INACCESSIBLE` or `FilterResult.BLOCK_ALL` before creating the Gson instance.

```java
Gson gson = new GsonBuilder()
    .addReflectionAccessFilter(c -> FilterResult.BLOCK_INACCESSIBLE)
    .create();

PublicRecord record = gson.fromJson(jsonString, PublicRecord.class);
```


## Category: csrf

### Prevent Cross-Site Script Inclusion by Generating Non-Executable JSON

**Use when**

serializing sensitive data served to web clients via JSON endpoints to prevent script-sourcing data theft.

**Secure rules**

**Rule 1: Invoke generateNonExecutableJson() when building Gson instances that handle sensitive responses.**

Use `GsonBuilder` and call `generateNonExecutableJson()` to prepend a non-executable header to the output JSON stream, protecting web client endpoints against unauthorized cross-site script inclusion and data hijacking.

```java
Gson gson = new GsonBuilder()
    .generateNonExecutableJson()
    .create();

String json = gson.toJson(sensitiveResponse);
```


## Category: deserialization

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


## Category: escape hatch

### Disable JDK Unsafe Fallback and Provide Explicit Zero-Argument Constructors for Custom Adapters

**Use when**

When defining custom type adapters using `jsonAdapter` annotations or registering type adapter instances that require instantiation without relying on low-level JVM unsafe mechanisms.

**Secure rules**

**Rule 1: Define an explicit zero-argument constructor in custom type adapter classes and configure Gson to disable the JDK Unsafe fallback mechanism.**

Explicitly implement a zero-argument constructor within custom adapter classes to ensure proper object initialization and prevent bypassing security checks. Additionally, harden the Gson instance configuration by calling `disableJdkUnsafe()` through the `GsonBuilder` to restrict raw or low-level instantiation APIs.

```java
public class UserAdapter extends TypeAdapter<User> {
  public UserAdapter() {
    // Explicit constructor initialization
  }

  @Override
  public void write(JsonWriter out, User user) throws IOException {
    // Implementation
  }

  @Override
  public User read(JsonReader in) throws IOException {
    // Implementation
    return null;
  }
}

// Hardening Gson configuration
Gson gson = new GsonBuilder()
    .disableJdkUnsafe()
    .create();
```


## Category: input contract definition

### Explicitly map JSON properties using SerializedName to define strict input contracts

**Use when**

When defining Java classes that will be populated via JSON deserialization and you need to enforce strict field contracts and allowed input keys.

**Secure rules**

**Rule 1: Bind Java fields explicitly to expected JSON keys using @SerializedName and specify allowed aliases via the alternate element.**

Use `@SerializedName` to explicitly bind Java fields to expected JSON keys rather than relying on field naming reflection or dynamic field naming policies. When accepting legacy or alternative keys during deserialization, use the alternate element to specify allowed aliases explicitly.

```java
public class UserProfile {
  @SerializedName(value = "user_id", alternate = {"userId", "id"})
  private String userId;

  @SerializedName("email_address")
  private String email;

  public UserProfile(String userId, String email) {
    this.userId = userId;
    this.email = email;
  }
}
```


## Category: input interpretation safety

### Enforce Strictness and Reject Duplicate Keys in Gson Parsing

**Use when**

Parsing untrusted JSON input streams or strings where strict RFC-compliant interpretation and duplicate key rejection are required to prevent parser differentials and input validation bypasses.

**Secure rules**

**Rule 1: Explicitly configure strict parsing and reject duplicate keys.**

Use `setStrictness(Strictness.STRICT)` on `GsonBuilder` or `JsonReader` instead of relying on default lenient behavior, ensuring that malformed inputs and duplicate keys are reliably rejected to prevent interpretation discrepancies.

```java
Gson gson = new GsonBuilder()
    .setStrictness(Strictness.STRICT)
    .create();
MyTargetObject target = gson.fromJson(untrustedJsonString, MyTargetObject.class);
```

**Rule 2: Handle syntax and duplicate key exceptions.**

Catch `JsonSyntaxException` and `JsonParseException` when deserializing maps or inputs with potential duplicate keys or malformed structures to safely handle validation failures and prevent unhandled runtime errors.

```java
Gson gson = new GsonBuilder().enableComplexMapKeySerialization().create();
Type type = new TypeToken<Map<String, String>>() {}.getType();

try {
  Map<String, String> map = gson.fromJson(jsonInput, type);
} catch (JsonSyntaxException e) {
  // Handle malformed JSON input or duplicate key validation failure
}
```


## Category: output encoding

### Keep HTML escaping enabled in Gson and JsonWriter to prevent injection

**Use when**

Serializing objects or writing JSON output that may be embedded directly into web responses, HTML documents, or script contexts.

**Secure rules**

**Rule 1: Maintain default HTML escaping behavior in Gson and JsonWriter to prevent output-context injection.**

Do not disable HTML escaping via `disableHtmlEscaping()` when serializing data for web outputs. When writing JSON via `JsonWriter`, explicitly invoke `setHtmlSafe(true)` to ensure HTML-sensitive characters are properly encoded into Unicode escape sequences, preventing Cross-Site Scripting vulnerabilities.

```java
JsonWriter writer = new JsonWriter(outputWriter);
writer.setHtmlSafe(true);
writer.beginObject();
writer.name("userComment").value("<script>alert('xss')</script>");
writer.endObject();
```


## Category: resource exhaustion

### Limit JSON nesting depth to prevent stack exhaustion

**Use when**

Parsing untrusted JSON input streams using JsonReader to prevent stack overflow from deep nesting.

**Secure rules**

**Rule 1: Configure a maximum nesting limit on JsonReader before parsing untrusted input.**

Use `setNestingLimit(int)` on `JsonReader` to restrict the maximum depth of nested JSON arrays and objects processed. This prevents deeply nested untrusted JSON inputs from causing recursive `TypeAdapter` calls to exceed the stack limit and throw a `StackOverflowError`.

```java
JsonReader reader = new JsonReader(new StringReader(untrustedJson));
reader.setNestingLimit(64);
```


## Category: secret handling

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


## Category: security control integrity

### Account for Precedence Rules Between Global Adapters and Field Annotations

**Use when**

Configuring global type adapters and domain model classes while relying on consistent serialization and deserialization controls.

**Secure rules**

**Rule 1: Account for field-level @JsonAdapter annotations overriding globally registered type adapters.**

When configuring global type adapters to enforce sanitization, safety checks, or data normalization, developers must audit domain models because field-level `@JsonAdapter` annotations take precedence over global adapters registered via `GsonBuilder.registerTypeAdapter()` and can silently bypass security handling.

```java
Gson gson = new GsonBuilder()
    .registerTypeAdapter(Part.class, new SanitizingPartAdapter())
    .create();
```

**Rule 2: Override class-level JsonAdapter annotations using GsonBuilder registrations.**

Programmatically register type adapters, serializers, and deserializers directly on `GsonBuilder` to ensure application-level controls take precedence over `@JsonAdapter` annotations declared on target classes and prevent domain models from bypassing centralized input validation.

```java
TypeAdapter<A> secureAdapter = new TypeAdapter<A>() {
  @Override
  public void write(JsonWriter out, A value) throws IOException {
    out.value("sanitized");
  }
  @Override
  public A read(JsonReader in) throws IOException {
    return new A(in.nextString());
  }
};

Gson gson = new GsonBuilder()
    .registerTypeAdapter(A.class, secureAdapter)
    .create();
```
