# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`
Category: boundary control

## boundary control

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
