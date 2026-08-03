# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: network boundary

## network boundary

### Configure Trusted Proxies and Hosts for Network Boundaries

**Use when**

Configuring the Symfony framework when running applications behind reverse proxies or load balancers to secure network boundaries.

**Secure rules**

**Rule 1: Explicitly define trusted hosts, proxies, and headers in framework configuration.**

Specify valid patterns in `trusted_hosts`, specific IP ranges in `trusted_proxies`, and valid header names in `trusted_headers` to prevent HTTP Host header attacks and client IP spoofing.

```yaml
framework:
    trusted_hosts: ['^example\.com$', '^api\.example\.com$']
    trusted_proxies: '10.0.0.0/8'
    trusted_headers: ['x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port']
```
