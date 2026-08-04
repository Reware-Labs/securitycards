# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: runtime environment hardening

## runtime environment hardening

### Disable Web Profiler and Security Data Collectors in Production Environments

**Use when**

Configuring Symfony application bundles and environment files for production deployment.

**Secure rules**

**Rule 1: Disable debug profiling and data collectors in production environments**

Ensure that the `WebProfilerBundle` and associated debugging features are restricted to non-production environments such as development. Explicitly set profiler functionality to `false` under production configuration blocks to prevent exposing sensitive security state, authorization decisions, user roles, and internal firewall configurations.

```yaml
when@dev:
    web_profiler:
        toolbar: true
        intercept_redirects: false

when@prod:
    framework:
        profiler: { enabled: false }
```
