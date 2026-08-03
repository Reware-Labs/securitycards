# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: api contract misuse

## api contract misuse

### Verify token attributes and avoid offline token session checks

**Use when**

When retrieving attributes from security tokens or evaluating authentication attributes in background workers and non-interactive contexts.

**Secure rules**

**Rule 1: Check token attribute existence before retrieval**

Use `hasAttribute()` to check if an attribute exists before calling `getAttribute()` on `AbstractToken` instances to prevent throwing an `InvalidArgumentException`.

```php
if ($token->hasAttribute('tenant_id')) {
    $tenantId = $token->getAttribute('tenant_id');
} else {
    // Handle missing attribute safely
}
```

**Rule 2: Avoid session authentication attributes on offline tokens**

Do not evaluate session-dependent authentication attributes against tokens implementing `OfflineTokenInterface`, as the `AuthenticatedVoter` will throw an `InvalidArgumentException`.

```php
if ($authorizationChecker->isGranted('PUBLIC_ACCESS')) {
    // Process public background task
}
```
