# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: output encoding

## output encoding

### Maintain HTML Escaping in HTTP Settings and JSON Serialization

**Use when**

When configuring HTTP settings or serializing JSON payloads via `httplib` that may be rendered in web interfaces or HTML templates.

**Secure rules**

**Rule 1: Escape values that require HTML encoding with `htmlquote`**

Use Beego’s built-in `htmlquote` template function when a value requires HTML escaping. Do not use `str2html` for such values because it converts a string to HTML without escaping it.

```gotemplate
{{htmlquote .Content}}
```
