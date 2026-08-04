# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: resource exhaustion

## resource exhaustion

### Enforce Size Limits on User Input Before Processing

**Use when**

Handling raw user-supplied strings or inputs before submitting them to ingestion pipelines or query components.

**Secure rules**

**Rule 1: Validate payload sizes and string lengths before calling LlamaIndex query or ingestion components.**

Implement explicit input size checks in hosting applications to restrict raw text length before invocation, mitigating potential high computational load or Denial of Service.

```python
MAX_INPUT_LENGTH = 4096

def process_user_text(raw_text: str, query_engine):
    if len(raw_text) > MAX_INPUT_LENGTH:
        raise ValueError(f"Input size exceeds maximum threshold of {MAX_INPUT_LENGTH} characters")

    return query_engine.query(raw_text)
```
