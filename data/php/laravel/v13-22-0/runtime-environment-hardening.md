# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode and Enforce Production Environment Configuration

**Use when**

Configuring deployment environments and application bootstrapping settings to prevent the exposure of debug details, file paths, and stack traces.

**Secure rules**

**Rule 1: Set application environment to production and disable debug mode to prevent exception trace leakage.**

Ensure that `APP_ENV` is set to `production` and `APP_DEBUG` is explicitly set to `false` in production deployment environments. Gate debug utilities and verify that the application checks `$app->isProduction()` or `$app->environment('production')` during bootstrapping to prevent stack trace and internal path exposures.

```env
APP_ENV=production
APP_DEBUG=false
```
