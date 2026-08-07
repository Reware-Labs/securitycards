# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`
Category: api contract misuse

## api contract misuse

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
