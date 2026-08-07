# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: dangerous execution

## dangerous execution

### Avoid dynamic function invocation and arbitrary callable execution from task arguments

**Use when**

Defining Celery tasks and handling incoming task message payloads that could otherwise lead to arbitrary code execution if dynamic callables are evaluated.

**Secure rules**

**Rule 1: Accept only safe serialization formats for task messages**

Avoid the pickle serializer when task producers may be untrusted or unauthenticated, because it can deserialize executable Python objects, including functions. Use JSON for task arguments and restrict workers to accepting JSON-serialized messages.

```python
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
)
```
