# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: input interpretation safety

## input interpretation safety

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
