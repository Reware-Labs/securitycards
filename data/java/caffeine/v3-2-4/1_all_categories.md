# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`

## Category: api contract misuse

### Validate Cache Arguments and Configure Mandatory Options Correctly

**Use when**

Use when constructing caches, configuring custom weighers, and interacting with cache methods or map views to ensure required arguments, non-null values, and valid signatures are correctly provided.

**Secure rules**

**Rule 1: Pair maximum weight settings with explicit weigher implementations and ensure weighers return non-negative weights.**

When configuring weighted eviction via `maximumWeight(long)`, you must explicitly provide a `Weigher` instance and pair them together to avoid startup exceptions. Ensure custom `Weigher` implementations return non-negative integer weights and do not throw unhandled exceptions.

```java
Weigher<String, byte[]> safeWeigher = (key, bytes) -> {
  if (bytes == null) {
    return 0;
  }
  int length = bytes.length;
  return Math.max(0, length);
};

Cache<String, byte[]> cache = Caffeine.newBuilder()
    .maximumWeight(100_000_000)
    .weigher(safeWeigher)
    .build();
```

**Rule 2: Reject null cache keys and stored values**

Do not pass null keys to cache operations or null keys or values to `put`, `putAll`, or the `asMap()` view. Caffeine throws `NullPointerException` for these inputs. A loading or mapping function may return null only when the cache declares a nullable value type; that result represents no mapping and is not stored.

```java
public String getValueSafely(Cache<String, String> cache, String key) {
  if (key == null) {
    return null;
  }
  return cache.getIfPresent(key);
}
```


## Category: boundary control

### Enforce Store-by-Value Semantics or Immutability for Shared Caches

**Use when**

Sharing JCache instances across application security boundaries where mutable objects are stored and accessed.

**Secure rules**

**Rule 1: Configure store-by-value semantics or use strictly immutable cache values when sharing JCache instances across security boundaries.**

When store-by-value is disabled, `CacheProxy` returns direct object references to callers via identity copying. If cached values are mutable, changes made by one caller will mutate shared state for all other users, leading to cross-tenant data corruption. Ensure mutable objects placed in JCache use store-by-value by configuring a `CopierFactory` or enforce immutability for all key and value types.

```java
CaffeineConfiguration<String, MyData> config = new CaffeineConfiguration<>();
config.setStoreByValue(true);
config.setCopierFactory(() -> new JavaSerializationCopier());
Cache<String, MyData> cache = cacheManager.createCache("secureCache", config);
```


## Category: configuration source integrity

### Restrict and validate configuration source URIs for JCache

**Use when**

When loading external configuration resources for Caffeine JCache using `CacheManager.getURI()` and `TypesafeConfigurator`.

**Secure rules**

**Rule 1: Validate external configuration source URIs before parsing them.**

Ensure that `CacheManager` URIs originate from trusted file paths or trusted classpaths. Override `configSource` using `TypesafeConfigurator.setConfigSource()` to enforce safe location resolving and reject unexpected or untrusted schemes.

```java
TypesafeConfigurator.setConfigSource((uri, classloader) -> {
  if (uri != null && !"classpath".equalsIgnoreCase(uri.getScheme())) {
    throw new IllegalArgumentException("Only classpath configuration URIs are allowed");
  }
  return ConfigFactory.load(classloader);
});
```


## Category: dangerous execution

### Validate Class Names During JCache Configuration Instantiation

**Use when**

Configuring JCache integrations that dynamically instantiate classes from configuration settings using TypesafeConfigurator.

**Secure rules**

**Rule 1: Allowlist class names before instantiation in TypesafeConfigurator.**

Register a custom FactoryCreator using `TypesafeConfigurator.setFactoryCreator()` to validate requested class names against an approved allowlist before reflection-based instantiation.

```java
TypesafeConfigurator.setFactoryCreator(className -> {
  if (!className.startsWith("com.example.cache.")) {
    throw new SecurityException("Unauthorized class instantiation: " + className);
  }
  return FactoryBuilder.factoryOf(className);
});
```


## Category: resource exhaustion

### Configure Bounded Cache Capacities and Timeouts to Prevent Resource Exhaustion

**Use when**

When building caches or handling asynchronous computations in Caffeine to prevent unbounded heap memory consumption and thread starvation.

**Secure rules**

**Rule 1: Configure cache eviction according to the required size and lifetime limits**

Use `maximumSize` to limit the cache's number of entries and `expireAfterWrite` when entries should be automatically removed after a fixed duration following creation or replacement.

```java
Cache<String, String> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(Duration.ofMinutes(30))
    .build();
```

**Rule 2: Enforce explicit application-level timeouts on pending asynchronous computations in AsyncCache.**

Apply explicit timeout bounds to asynchronous computations using methods like `orTimeout` before storing them in an `AsyncCache` so that unresolved futures do not permanently occupy heap memory.

```java
CompletableFuture<Data> future = fetchDataAsync(key)
    .orTimeout(10, TimeUnit.SECONDS);
asyncCache.put(key, future);
```
