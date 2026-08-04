# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: interface protocol hardening

## interface protocol hardening

### Configure Strict CORS Security Headers

**Use when**

Configuring Cross-Origin Resource Sharing in `config/cors.php` and ensuring the `HandleCors` middleware properly manages origin boundaries and HTTP response headers.

**Secure rules**

**Rule 1: Explicitly define trusted origins and allowed headers in `config/cors.php` instead of using global wildcards.**

Specify explicit allowed origins and headers in `config/cors.php` to prevent untrusted third-party origins or compromised subdomains from reading sensitive API responses. Ensure the `HandleCors` middleware runs to return proper `Access-Control-Allow-Origin` and `Access-Control-Allow-Headers` headers across all responses, including redirects and errors.

```php
return [
    'paths' => ['api/*'],
    'allowed_origins' => ['https://app.example.com'],
    'allowed_headers' => ['X-Requested-With', 'Content-Type', 'Authorization'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
    'supports_credentials' => true,
];
```


### Validate incoming HTTP Host headers and manage cross-site request forgery protections

**Use when**

Configuring network boundary routing, host validation, and CSRF protection settings for application middleware.

**Secure rules**

**Rule 1: Restrict trusted HTTP host headers to authorized domain patterns and avoid automatic wildcard subdomains.**

Configure `Middleware::trustHosts()` to validate the incoming `Host` request header against expected hostnames, disabling automatic subdomain matching when wildcard subdomains are not expected.

```php
$middleware->trustHosts(
    at: ['app.example.com'],
    subdomains: false
);
```

**Rule 2: Restrict allowSameSite to trusted cross-subdomain architectures.**

Use `PreventRequestForgery::allowSameSite()` only when subdomains sharing the same top-level domain are fully trusted, as enabling `allowSameSite` allows requests with a `Sec-Fetch-Site: same-site` header to bypass CSRF token checks.

```php
PreventRequestForgery::allowSameSite(true);
```
