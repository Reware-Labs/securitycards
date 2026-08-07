# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: boundary control

## boundary control

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
