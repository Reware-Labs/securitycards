# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: secret handling

## secret handling

### Redact Sensitive Data During Protobuf Message Formatting

**Use when**

Logging, printing, or stringifying protobuf messages that contain sensitive credentials, tokens, or personal data.

**Secure rules**

**Rule 1: Enable safe debug formatting and redaction when converting sensitive protobuf messages to strings for logs or diagnostics.**

Use built-in debug formatting options such as `TextFormat.debugFormatPrinter()` or configure custom printers with `SetRedactDebugString(true)` to ensure fields marked with `debug_redact=true` in the proto schema are replaced with redaction markers instead of exposing plaintext secrets in logs.

```java
String debugString = TextFormat.debugFormatPrinter().printToString(message);
System.out.println(debugString);
```
