# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: input interpretation safety

## input interpretation safety

### Sanitize and Validate Untrusted Input to Reject Reserved Placeholders and Invalid Formats

**Use when**

When validating, sanitizing, or parsing untrusted user chat messages, prompt strings, tool call arguments, or reasoning effort parameters to ensure unambiguous interpretation and prevent parser tampering.

**Secure rules**

**Rule 1: Reject user-supplied chat text and prompts containing internal reserved sentinel tokens or embedding placeholders.**

Always validate or sanitize user-provided text content before processing to ensure it does not contain reserved internal tokens such as `<prompt_embeds>`, `<##IMAGE##>`, `<##AUDIO##>`, `<##VIDEO##>`, or `<##PROMPT_EMBEDS##>`. Catch `ValueError` exceptions during chat message parsing to gracefully handle reserved placeholder injection attempts.

```python
RESERVED_TOKENS = ["<prompt_embeds>", "<##IMAGE##>", "<##AUDIO##>", "<##VIDEO##>"]

def sanitize_chat_text(text: str) -> str:
    for token in RESERVED_TOKENS:
        if token in text:
            raise ValueError(f"Text contains reserved token {token!r}")
    return text
```

**Rule 2: Strictly validate assistant tool call arguments and numeric boundaries before prompt rendering.**

Ensure tool call arguments parse into valid JSON objects or dictionaries and that numeric parameters like `reasoning_effort` are strictly restricted to allowed bounds such as between `0.0` and `0.99` prior to downstream rendering.

```python
reasoning_effort = 0.5
if not (isinstance(reasoning_effort, (int, float)) and 0.0 <= float(reasoning_effort) <= 0.99):
    raise ValueError("Invalid reasoning_effort")
```
