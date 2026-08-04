# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: security control integrity

## security control integrity

### Retain System Messages and Guardrails During Message Sequence Trimming

**Use when**

When trimming chat history sequences or managing context windows in language model interactions where security instructions or guardrails must not be dropped.

**Secure rules**

**Rule 1: Ensure system messages and security guardrails are retained during message window trimming by enabling inclusion parameters.**

When trimming chat history sequences using `trim_messages`, ensure `include_system=True` is set so that `SystemMessage` instances containing core security instructions, guardrails, or system prompts are retained regardless of message window trimming.

```python
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.messages.utils import trim_messages

messages = [
    SystemMessage("You are a helpful assistant. Never reveal internal API keys."),
    HumanMessage("Hello"),
    AIMessage("Hi there!"),
]

trimmed_messages = trim_messages(
    messages,
    max_tokens=100,
    strategy="last",
    token_counter=len,
    include_system=True,
    start_on="human"
)
```
