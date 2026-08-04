# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: output encoding

## output encoding

### Enable HTML escaping for validation error messages and templates

**Use when**

Rendering Joi validation error messages or dynamic templates in HTML user interfaces where user-supplied input may be present.

**Secure rules**

**Rule 1: Set errors.escapeHtml to true when validating inputs to ensure error messages containing user input are safely HTML-escaped.**

By default, `escapeHtml` is `false`. When validation error messages containing user-supplied input are rendered directly into HTML without escaping, malicious input can lead to Cross-Site Scripting (XSS) vulnerabilities. Configure `errors.escapeHtml` to `true` within the `validate` options.

```javascript
const schema = Joi.object({
  username: Joi.string().alphanum().min(3)
});

const { error, value } = schema.validate(req.body, {
  errors: {
    escapeHtml: true
  }
});
```
