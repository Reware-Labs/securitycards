# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: output encoding

## output encoding

### Encode Untrusted URI Components and Template Inputs to Prevent Output Injection

**Use when**

When constructing dynamic Caddy configurations, headers, redirect targets, or rendering untrusted user input within Caddy template responses and markdown files.

**Secure rules**

**Rule 1: Use URL-escaped placeholders when referencing HTTP URI components inside dynamic configurations, headers, or redirects.**

When referencing HTTP URI components inside dynamic Caddy configurations, headers, or redirect targets, use URL-escaped placeholders such as `http.request.uri_escaped`, `http.request.uri.path_escaped`, and `http.request.uri.query_escaped` instead of raw unescaped values. This ensures special characters and control delimiters remain encoded and prevents HTTP response splitting, header injection, or query parameter ambiguity vulnerabilities.

```caddyfile
header_up X-Original-URI {http.request.uri_escaped}
redir https://auth.example.com/login?redirect={http.request.uri.query_escaped}
```

**Rule 2: Sanitize untrusted input using stripHTML and contextual escaping in template files.**

Developers outputting untrusted user input within Caddy template responses should use `stripHTML` or contextual escaping to prevent cross-site scripting attacks. Pipe untrusted inputs through `stripHTML` or apply `html` escaping functions to dynamic content rendered via file and HTTP includes.

```html
{{ .Req.URL.Query.Get "comment" | stripHTML }}
<p>User comment: {{ .Req.URL.Query.Get "comment" | stripHTML }}</p>
<a href="/files/{{ pathEscape .Req.URL.Query.Get "name" }}">Download</a>
```
