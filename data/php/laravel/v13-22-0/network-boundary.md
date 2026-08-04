# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: network boundary

## network boundary

### Configure trusted proxy IP addresses and forwarded headers explicitly

**Use when**

Configuring upstream proxy trust boundaries and forwarded headers within the application middleware setup.

**Secure rules**

**Rule 1: Explicitly define trusted proxy IP addresses and specify only necessary forwarded headers in middleware.**

Explicitly define trusted proxy IP addresses and specify only necessary forwarded headers in `Middleware::trustProxies()`. Avoid trusting wildcard proxies unless operating in a controlled network environment where upstream load balancers strip forged headers.

```php
$middleware->trustProxies(
    at: ['192.168.1.100', '10.0.0.1'],
    headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO
);
```
