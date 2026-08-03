# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: boundary control

## boundary control

### Enforce strict tool invocation boundaries by disabling tools on choice none

**Use when**

Serving chat models and configuring request parameters to prevent unauthorized tool execution when tool use is explicitly disabled.

**Secure rules**

**Rule 1: Configure the server to exclude tool definitions when tool choice is set to none.**

Launch the vLLM server with `--exclude-tools-when-tool-choice-none` alongside `--tool-call-parser` and `--enable-auto-tool-choice`. Client applications can then reliably disable tool execution per request by passing `tool_choice="none"` so the model cannot issue tool calls when tool use is disabled.

```python
response = await client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "What is the weather in Dallas?"}],
    tools=tools,
    tool_choice="none",
    temperature=0.0,
)
assert response.choices[0].message.tool_calls is None
```
