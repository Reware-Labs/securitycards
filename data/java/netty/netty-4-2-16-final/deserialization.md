# Security cards

Repository: `https://github.com/netty/netty#netty-4.2.16.Final`
Documentation repository: `https://github.com/netty/netty-website#master`
Category: deserialization

## deserialization

### Enforce Strict Size Limits During Object Unmarshalling

**Use when**

When configuring decoders like `CompatibleMarshallingDecoder` to unmarshal network byte streams into Java objects.

**Secure rules**

**Rule 1: Configure an explicit maximum object size limit when unmarshalling untrusted byte streams to prevent memory exhaustion.**

When using `CompatibleMarshallingDecoder`, avoid using `Integer.MAX_VALUE` or unlimited sizes for object unmarshalling. Supply a strict byte size limit to `CompatibleMarshallingDecoder` to ensure that payload boundaries are validated before binding input bytes into Java object graphs.

```java
int maxObjectSize = 1024 * 1024;
ChannelHandler decoder = new CompatibleMarshallingDecoder(
    new DefaultUnmarshallerProvider(marshallerFactory, marshallingConfig),
    maxObjectSize
);
pipeline.addLast(decoder);
```


### Secure Object Deserialization and Enforce Payload Bounds

**Use when**

Configuring Netty serialization decoders such as `ObjectDecoder` and `ObjectDecoderInputStream` to process Java object streams from untrusted network sources.

**Secure rules**

**Rule 1: Enforce JVM-level serialization filters and custom allowlists to restrict deserialized classes.**

When using `ObjectDecoder`, `ObjectDecoderInputStream`, or `ClassResolvers`, avoid unrestricted object deserialization. Configure JVM-level serialization filters via the `jdk.serialFilter` system property or supply a custom `ClassResolver` to explicitly allowlist expected safe classes and prevent remote code execution through gadget chains.

```java
Set<String> ALLOWED_CLASSES = Set.of("com.example.MyDataDTO");
ClassResolver safeResolver = className -> {
    if (!ALLOWED_CLASSES.contains(className)) {
        throw new ClassNotFoundException("Class deserialization restricted: " + className);
    }
    return Class.forName(className);
};
CompactObjectInputStream in = new CompactObjectInputStream(inputStream, safeResolver);
```

**Rule 2: Configure explicit maximum object size limits on decoders to prevent memory exhaustion.**

Always provide an explicit `maxObjectSize` parameter when instantiating `ObjectDecoder` or `ObjectDecoderInputStream` to constrain incoming object frame lengths and stop oversized payloads from triggering `OutOfMemoryError` exceptions.

```java
int maxObjectSize = 1048576; // 1 MB limit
pipeline.addLast(new ObjectDecoder(maxObjectSize, ClassResolvers.weakCachingConcurrentResolver(getClass().getClassLoader())));
```
