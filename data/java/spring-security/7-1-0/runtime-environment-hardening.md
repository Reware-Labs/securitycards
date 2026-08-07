# Security cards

Repository: `https://github.com/spring-projects/spring-security#7.1.0`
Category: runtime environment hardening

## runtime environment hardening

### Disable Spring Security Debug Infrastructure in Production

**Use when**

Configuring the application environment for production deployment.

**Secure rules**

**Rule 1: Omit or conditionally exclude the debug element in production environments.**

Do not enable the `debug` element in production environments because debug mode outputs detailed multi-line request filter logs that can expose sensitive information like authentication headers, tokens, and request parameters. Only include the `debug` element during active local development.

```xml
<!-- Development only -->
<debug />
```
