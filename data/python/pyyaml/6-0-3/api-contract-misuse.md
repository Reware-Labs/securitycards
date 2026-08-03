# Security cards

Repository: `https://github.com/yaml/pyyaml#6.0.3`
Documentation repository: `https://github.com/yaml/pyyaml.org#master`
Category: api contract misuse

## api contract misuse

### Enforce Correct Serializer Lifecycle State When Processing Streams

**Use when**

When managing direct serializer lifecycles to emit YAML events from AST nodes.

**Secure rules**

**Rule 1: Strictly follow the serializer lifecycle contract by invoking `open()` prior to serialization and `close()` upon completion.**

When invoking `Serializer` directly to emit YAML events, ensure that `open()` is called before passing any nodes to `serialize()`. Place `close()` in a cleanup block to prevent unhandled `SerializerError` exceptions and malformed YAML streams.

```python
from yaml.serializer import Serializer

serializer = Serializer()
serializer.open()
try:
    serializer.serialize(node)
finally:
    serializer.close()
```
