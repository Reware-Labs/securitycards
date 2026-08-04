# Security cards

Repository: `https://github.com/laravel/framework#v13.22.0`
Documentation repository: `https://github.com/laravel/docs#13.x`
Category: configuration source integrity

## configuration source integrity

### Store environment files outside the public web root

**Use when**

Configuring application environment paths and loading configuration files in Laravel.

**Secure rules**

**Rule 1: Store environment files in a non-public directory located outside the web server root to ensure configuration source integrity.**

When configuring application environment paths using `useEnvironmentPath` or `loadEnvironmentFrom`, make sure that environment files like `.env` are stored outside the public directory and restrict file permissions on server environments to prevent unauthorized access to configuration settings.

```php
$app->useEnvironmentPath($app->basePath());
$app->loadEnvironmentFrom('.env');
```
