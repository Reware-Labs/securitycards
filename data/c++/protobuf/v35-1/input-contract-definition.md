# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: input contract definition

## input contract definition

### Enforce Required Fields and Valid Input Structures During Parsing

**Use when**

Parsing text format strings or constructing protocol buffer messages from external input where required fields and valid contracts must be enforced.

**Secure rules**

**Rule 1: Use strict parsing methods to reject uninitialized messages with missing required fields.**

When constructing messages from text format strings, invoke `TextFormat.parse()` rather than raw `TextFormat.merge()` to ensure that any missing required fields trigger an `UninitializedMessageException` during parsing so that malformed input is properly rejected.

```java
try {
  MyMessage message = TextFormat.parse(textInput, MyMessage.class);
} catch (UninitializedMessageException e) {
  // Reject input with missing required fields
}
```

**Rule 2: Validate keys and values against null constraints before populating map builder fields.**

Protocol Buffer Lite map builder methods enforce strict non-null contracts for map keys and values. Explicitly check that keys and values are not null before invoking `put*` or `putAll*` operations to prevent unhandled `NullPointerException` errors from malformed or missing input data.

```java
if (key != null && value != null) {
  builder.putInt32ToStringField(key, value);
}
```
