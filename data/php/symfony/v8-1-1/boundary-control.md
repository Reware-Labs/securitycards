# Security cards

Repository: `https://github.com/symfony/symfony#v8.1.1`
Category: boundary control

## boundary control

### Enforce Request Middleware Boundaries and Early Request Short-Circuiting

**Use when**

Implementing HTTP kernel request event listeners, security filters, or failure handling middleware where untrusted inputs or sub-requests cross into trusted execution pipelines.

**Secure rules**

**Rule 1: Restrict forward paths in authentication failure handling middleware using static configuration.**

When enabling internal request forwarding via `failure_forward => true` in authentication failure middleware, ensure failure target paths are strictly controlled via static handler configuration rather than user-controlled request attributes. Request-supplied `_failure_path` inputs must be ignored.

```php
$options = [
    'failure_forward' => true,
    'failure_path' => '/login',
];
$handler = new DefaultAuthenticationFailureHandler($httpKernel, $httpUtils, $options, $logger);
```

**Rule 2: Prevent session state creation during stateless middleware authentication failures.**

When processing authentication failures in stateless HTTP middleware pipelines, verify that request attributes mark the request as stateless (`_stateless => true`) so authentication exceptions are not persisted to the session, avoiding session leakage across unauthenticated client requests.

```php
$request->attributes->set('_stateless', true);
$response = $handler->onAuthenticationFailure($request, $exception);
```
