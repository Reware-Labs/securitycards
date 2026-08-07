# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: escape hatch

## escape hatch

### Secure Internal Reflection and Dynamic Class Loading

**Use when**

Use when performing reflective access to internal classes, constructors, or fields, or when dynamically loading providers via reflection.

**Secure rules**

**Rule 1: Guard reflective lookups and field accessibility changes inside controlled privileged blocks and catch access or reflection exceptions.**

When using reflection to access non-public members, internal constructors, or system classes, wrap operations in controlled blocks and catch exceptions like `NoSuchMethodException` or `IllegalAccessException` to prevent fatal runtime failures.

```java
Object result = AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
    try {
        Field field = TargetClass.getDeclaredField("privateField");
        Throwable cause = ReflectionUtil.trySetAccessible(field, false);
        if (cause != null) {
            return cause;
        }
        return field.get(targetInstance);
    } catch (NoSuchFieldException | IllegalAccessException | SecurityException e) {
        return e;
    }
});
```

**Rule 2: Restrict dynamic reflection to hardcoded fully qualified class names.**

When using reflection to dynamically load and instantiate security providers or engine classes, restrict class lookup exclusively to hardcoded, fully-qualified internal constants. Do not pass untrusted or externally controlled class names.

```java
private static final String BC_PROVIDER = "org.bouncycastle.jce.provider.BouncyCastleProvider";

Class<Provider> bcProviderClass = (Class<Provider>) Class.forName(BC_PROVIDER, true, classLoader);
Provider provider = bcProviderClass.getConstructor().newInstance();
```
