# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: csrf

## csrf

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
