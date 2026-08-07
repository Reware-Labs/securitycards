# Security cards

Repository: `https://github.com/google/gson#gson-parent-2.14.0`
Category: output encoding

## output encoding

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
