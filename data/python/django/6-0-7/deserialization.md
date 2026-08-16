# Security cards

Repository: `https://github.com/django/django#6.0.7`
Category: deserialization

## deserialization

### Use safe JSON serialization for session data and signed objects

**Use when**

When configuring session serialization or handling signed objects and payloads to prevent unsafe arbitrary object construction and remote code execution.

**Secure rules**

**Rule 1: Configure session serialization to use JSON serialization rather than pickle-based serializers**

Keep SESSION_SERIALIZER configured to use django.contrib.sessions.serializers.JSONSerializer, do not introduce a custom serializer that performs unsafe object deserialization, such as pickle.loads().

```python
# settings.py
SESSION_SERIALIZER = 'django.contrib.sessions.serializers.JSONSerializer'
```

**Rule 2: Rely on built-in JSON-based signing functions for structured objects.**

Use `Signer.sign_object()`, `unsign_object()`, `signing.dumps()`, and `signing.loads()`, which use `JSONSerializer` by default, rather than custom untrusted object deserializers like pickle.

```python
from django.core import signing

# Uses JSON serialization safely under the hood
signed_data = signing.dumps({"user_id": 42, "action": "download"}, salt="user-action")

# Verification decodes JSON safely without arbitrary code execution risk
payload = signing.loads(signed_data, salt="user-action", max_age=3600)
```
