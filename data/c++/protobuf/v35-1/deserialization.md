# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: deserialization

## deserialization

### Configure Explicit Type Registries and Extension Registries for Deserializing Any and Extension Fields

**Use when**

Deserializing Protocol Buffer messages containing `google.protobuf.Any` fields or custom extension fields from untrusted inputs.

**Secure rules**

**Rule 1: Explicitly define allowed types using a `TypeRegistry` when parsing messages with `google.protobuf.Any` fields.**

Supply a properly scoped `TypeRegistry` via `usingTypeRegistry(TypeRegistry)` when configuring `JsonFormat.Parser` to prevent arbitrary or unexpected type URL resolution.

```java
TypeRegistry registry = TypeRegistry.newBuilder()
    .add(AllowedPayloadMessage.getDescriptor())
    .build();

JsonFormat.Parser parser = JsonFormat.parser()
    .usingTypeRegistry(registry);
```

**Rule 2: Provide an explicit `ExtensionRegistry` containing only expected extensions during message parsing.**

Construct an explicit `ExtensionRegistry` and populate it solely with permitted extensions for each parsing context, avoiding global or implicit auto-registration to prevent untrusted type injection.

```java
ExtensionRegistry registry = ExtensionRegistry.newInstance();
registry.add(MyProto.barExtension);
MyProto.Foo message = MyProto.Foo.parseFrom(inputBytes, registry);
```
