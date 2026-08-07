# Security cards

Repository: `https://github.com/ben-manes/caffeine#v3.2.4`
Category: dangerous execution

## dangerous execution

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
