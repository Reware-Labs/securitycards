# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: output encoding

## output encoding

### Escape Untrusted Text Properly for Output Contexts

**Use when**

Rendering serialized Protocol Buffer text format output or handling external display contexts.

**Secure rules**

**Rule 1: Do not embed raw Protobuf Text Format output directly in user-facing contexts**

`TextFormat` is intended for **debugging and human inspection only**. Its built-in escaper covers just a handful of control-character and quote escapes, leaving HTML/JS/Shell-significant characters untouched. When you *must* surface a Text Format string (for example, on an admin web page), treat it as untrusted plain text and apply a context-appropriate encoder first.

```java
import com.google.protobuf.TextFormat;
import my.proto.Messages.MyMessage;

// Produce the text representation (debug use).
String protoText = TextFormat.printer().printToString(myMessage);

// Minimal HTML-escaping before writing to a page.
String safeHtml = protoText
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;");

response.getWriter().write(safeHtml);
```
