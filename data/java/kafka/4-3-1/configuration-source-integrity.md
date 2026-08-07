# Security cards

Repository: `https://github.com/apache/kafka#4.3.1`
Category: configuration source integrity

## configuration source integrity

### Ensure Trusted and Verified Configuration Sources for Security Providers

**Use when**

Configuring security provider class names and dynamically instantiating Java Security Providers via `security.providers` configuration settings.

**Secure rules**

**Rule 1: Validate and restrict security provider configuration sources to ensure only trusted and fully qualified class names are loaded.**

Applications and administrative tooling must ensure that the `security.providers` configuration source is completely untampered and populated solely with trusted fully qualified `SecurityProviderCreator` class names. Because Kafka registers these providers via reflection, validating configuration sources prevents malicious or unintended classes from being loaded into the JVM.

```java
Map<String, Object> configs = new HashMap<>();
configs.put(SecurityConfig.SECURITY_PROVIDERS_CONFIG, "org.example.security.MySecurityProviderCreator");
SecurityUtils.addConfiguredSecurityProviders(configs);
```
