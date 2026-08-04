# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: deserialization

## deserialization

### Restrict allowed objects when deserializing untrusted payloads

**Use when**

Deserializing untrusted payloads or manifests in LangChain workflows where arbitrary object instantiation must be prevented.

**Secure rules**

**Rule 1: Restrict allowed objects to specific presets or explicit classes during deserialization of untrusted input.**

When calling `loads()` with untrusted input payloads, avoid default settings like `allowed_objects='core'` or `allowed_objects='all'` which can trigger side effects during object instantiation. Explicitly restrict `allowed_objects` to `'messages'` or provide an explicit list of trusted `Serializable` subclasses.

```python
from langchain_core.load import loads
from langchain_core.messages import AIMessage, HumanMessage

obj = loads(untrusted_payload, allowed_objects="messages")

obj = loads(
    untrusted_payload,
    allowed_objects=[AIMessage, HumanMessage]
)
```
