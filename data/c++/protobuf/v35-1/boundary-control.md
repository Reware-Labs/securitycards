# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: boundary control

## boundary control

### Restrict Descriptor Pools When Parsing Messages Containing Any Types

**Use when**

Parsing or converting messages containing `google.protobuf.Any` types using text format functions in Python.

**Secure rules**

**Rule 1: Provide an isolated descriptor pool when parsing or converting messages containing google.protobuf.Any types.**

Explicitly pass an isolated descriptor_pool instance to text_format functions when processing messages containing google.protobuf.Any types to prevent falling back to the default global descriptor pool which exposes all globally registered protobuf message descriptors.

```python
from google.protobuf import descriptor_pool, text_format
from myproject_pb2 import MyMessage

isolated_pool = descriptor_pool.DescriptorPool()
isolated_pool.AddDescriptor(MyMessage.DESCRIPTOR)

def safe_message_to_string(message) -> str:
    return text_format.MessageToString(message, descriptor_pool=isolated_pool)
```
