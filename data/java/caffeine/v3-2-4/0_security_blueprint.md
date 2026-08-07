# Security blueprint

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`

## Security posture

Caffeine provides high-performance in-memory caching where developers must explicitly manage resource boundaries, key/value integrity, and safe class instantiation. While built-in primitives control sizing and time-to-live, shared mutable states, configuration sources, and dynamic class loads remain security-sensitive surfaces. Developers should enforce strict bounds, reject null inputs, and validate untrusted configuration or instantiation pathways to fail closed against potential resource exhaustion and injection risks.

## Essential implementation rules

1. **Validate Cache Arguments and Configure Mandatory Options**

When configuring weighted eviction via `maximumWeight(long)`, explicitly provide a `Weigher` instance that returns non-negative integer weights without throwing unhandled exceptions. Never pass null keys to cache operations or null values to `put`, `putAll`, or the `asMap()` view, as Caffeine throws `NullPointerException` for these inputs.

2. **Enforce Store-by-Value Semantics or Immutability for Shared Caches**

Ensure mutable objects placed in JCache use store-by-value semantics by configuring a `CopierFactory` or enforce strict immutability for all key and value types. When store-by-value is disabled, direct object references return via identity copying, risking cross-tenant data corruption if mutated.

3. **Restrict and Validate Configuration Source URIs for JCache**

Ensure that `CacheManager` URIs originate from trusted file paths or trusted classpaths. Override `configSource` using `TypesafeConfigurator.setConfigSource()` to enforce safe location resolving and reject unexpected or untrusted schemes.

4. **Allowlist Class Names During JCache Configuration Instantiation**

Register a custom FactoryCreator using `TypesafeConfigurator.setFactoryCreator()` to validate requested class names against an approved allowlist before any reflection-based instantiation occurs.

5. **Configure Bounded Cache Capacities and Timeouts**

Use `maximumSize` to limit the cache's number of entries and `expireAfterWrite` when entries should be automatically removed after a fixed duration. Apply explicit timeout bounds to asynchronous computations using methods like `orTimeout` before storing them in an `AsyncCache` to prevent permanent heap occupation.
