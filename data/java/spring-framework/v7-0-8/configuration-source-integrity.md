# Security cards

Repository: `https://github.com/spring-projects/spring-framework#v7.0.8`
Category: configuration source integrity

## configuration source integrity

### Validate Required Configuration Properties During Application Startup

**Use when**

When configuring application environment properties and essential settings during application startup.

**Secure rules**

**Rule 1: Explicitly declare and validate required configuration properties using the property resolver during application startup.**

Use `PropertySourcesPropertyResolver` to define mandatory configuration keys with `setRequiredProperties(...)` and invoke `validateRequiredProperties()` during bootstrapping. This ensures that the application fails fast if expected settings or credentials are missing, preventing unexpected default behaviors or runtime misconfigurations.

```java
ConfigurablePropertyResolver resolver = new PropertySourcesPropertyResolver(propertySources);
resolver.setRequiredProperties("app.security.secret-key", "app.database.url");
resolver.validateRequiredProperties();
```
