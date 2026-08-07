# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`
Category: resource exhaustion

## resource exhaustion

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
