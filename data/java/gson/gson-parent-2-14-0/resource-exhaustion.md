# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: resource exhaustion

## resource exhaustion

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
