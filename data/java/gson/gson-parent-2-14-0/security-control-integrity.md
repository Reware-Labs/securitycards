# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: security control integrity

## security control integrity

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
