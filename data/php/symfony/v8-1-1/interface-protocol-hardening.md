# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: interface protocol hardening

## interface protocol hardening

### Restrict Allowed HTTP Method Overrides on POST Requests

**Use when**

Configuring request handling and HTTP method overriding mechanisms in Symfony applications.

**Secure rules**

**Rule 1: Keep `http_method_override` disabled unless explicitly required, and restrict allowed overridden methods if enabled.**

When method override support is required, enable `http_method_override` explicitly and restrict the list of allowed methods to safe options such as `PUT`, `PATCH`, and `DELETE` via framework configuration.

```yaml
framework:
    http_method_override: true
    allowed_http_method_override: ['PUT', 'PATCH', 'DELETE']
```
