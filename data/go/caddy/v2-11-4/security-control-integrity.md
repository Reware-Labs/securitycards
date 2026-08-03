# Security cards

Repository: `https://github.com/caddyserver/caddy#v2.11.4`
Category: security control integrity

## security control integrity

### Enforce explicit directive ordering with route blocks

**Use when**

Configuring Caddyfile directives where security controls like authentication or header validation depend on strict execution sequence relative to request rewrites or proxy handlers.

**Secure rules**

**Rule 1: Wrap dependent directives in an explicit `route` block to override default pipeline sorting and enforce literal top-to-bottom execution.**

Caddy sorts directives automatically according to a predefined pipeline where rewrites execute before authentication controls. When security controls must run before request modifications, use an explicit `route` block to ensure execution order and prevent authorization bypasses.

```caddyfile
example.com {
    route {
        basic_auth {
            user1 $2a$14$...
        }
        rewrite /protected/* /backend/{path}
        reverse_proxy http://backend:8080
    }
}
```
