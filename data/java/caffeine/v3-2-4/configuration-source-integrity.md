# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`
Category: configuration source integrity

## configuration source integrity

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
