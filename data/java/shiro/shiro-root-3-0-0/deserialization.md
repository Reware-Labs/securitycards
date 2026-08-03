# Security cards

Repository: `https://github.com/apache/shiro#shiro-root-3.0.0`
Category: deserialization

## deserialization

### Configure a Hardened Serializer for Remembered Identity Payloads

**Use when**

When managing remembered user identity payloads via `AbstractRememberMeManager` in Apache Shiro to prevent deserialization vulnerabilities.

**Secure rules**

**Rule 1: Supply a custom Serializer implementation with strict class filtering using setSerializer.**

To prevent gadget chain execution during Java object deserialization, avoid default insecure deserialization and configure `AbstractRememberMeManager` with a hardened serializer by calling `setSerializer` with an implementation that performs strict class filtering.

```java
rememberMeManager.setSerializer(new SafeRememberedIdentitySerializer());
```
