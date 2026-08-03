# Security cards

Repository: `https://github.com/traefik/traefik#v3.7.10`
Category: input contract definition

## input contract definition

### Enforce valid naming syntax for router and service keys

**Use when**

Configuring router and service names in key-value stores to ensure compliance with expected naming syntax and prevent syntax misuse.

**Secure rules**

**Rule 1: Exclude reserved symbols from router and service names**

Do not include the `@` character within router names or service names when creating KV configuration keys. The `@` character is reserved by Traefik to delimit resource names from provider namespaces. Use alphanumeric names separated by hyphens instead.

```bash
consul kv put traefik/http/routers/web-router/rule "Host(`example.com`)"
consul kv put traefik/http/routers/web-router/service "web-service"
```
