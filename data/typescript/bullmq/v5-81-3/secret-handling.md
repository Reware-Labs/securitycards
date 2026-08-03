# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: secret handling

## secret handling

### Load Redis connection credentials securely via environment variables or trusted secret providers

**Use when**

Configuring Redis connection parameters, client options, or private registries when initializing BullMQ queues, workers, or package managers.

**Secure rules**

**Rule 1: Load Redis authentication credentials from environment variables or managed secret providers instead of hardcoding them into source code or connection strings.**

When instantiating a Queue or Redis connection, pass credentials dynamically from environment variables rather than embedding plaintext passwords or secrets directly in code, configuration files, or supervision tree specifications.

```php
$queue = new Queue('email-queue', [
    'connection' => [
        'host' => getenv('REDIS_HOST') ?: '127.0.0.1',
        'port' => (int)(getenv('REDIS_PORT') ?: 6379),
        'username' => getenv('REDIS_USER') ?: null,
        'password' => getenv('REDIS_PASSWORD') ?: null,
    ],
]);
```

**Rule 2: Use environment variable interpolation for private package registry authentication tokens.**

When configuring `.npmrc` to download packages from private registries, use environment variable interpolation instead of hardcoding actual authentication tokens into configuration files or container files.

```ini
@taskforcesh:registry=https://npm.taskforce.sh/
//npm.taskforce.sh/:_authToken=${NPM_TASKFORCESH_TOKEN}
always-auth=true
```
