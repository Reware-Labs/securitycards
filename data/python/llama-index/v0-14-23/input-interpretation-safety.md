# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: input interpretation safety

## input interpretation safety

### Prevent unexpected string formatting vulnerabilities by setting formatted to true

**Use when**

Passing prompt templates or completion strings containing literal curly braces or untrusted user input to LLM completion methods.

**Secure rules**

**Rule 1: Set formatted to true when invoking completion methods with prompt text containing curly braces or user-controlled input.**

By default, prompt strings are formatted using string formatting via `prompt.format(**kwargs)`. Untrusted input or templates containing unescaped braces can cause parsing errors or improper string manipulation. Explicitly set `formatted=True` when passing such prompts to prevent unexpected Python string formatting.

```python
user_input = "Process this JSON object: {\"key\": \"value\"}"
response = llm.complete(user_input, formatted=True)
```
