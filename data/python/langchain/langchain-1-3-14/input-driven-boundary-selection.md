# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: input driven boundary selection

## input driven boundary selection

### Validate Model Fallback Specifications Against Trusted Allowlists

**Use when**

When configuring fallback models or routing specifications that instantiate models dynamically from string identifiers.

**Secure rules**

**Rule 1: Pass hardcoded model instances or strictly validate string model identifiers against an explicit allowlist.**

When configuring fallback models using `ModelFallbackMiddleware`, ensure that you pass explicit, trusted model instances rather than allowing dynamic construction from untrusted configuration or user input. This prevents primary model failures from inadvertently forwarding sensitive prompt data, context, and tool definitions to unauthorized external model providers or endpoints.

```python
from langchain.agents.middleware import ModelFallbackMiddleware
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic

# Configure fallbacks using explicit, trusted model instances
fallback_middleware = ModelFallbackMiddleware(
    ChatOpenAI(model="gpt-4o"),
    ChatAnthropic(model="claude-3-5-sonnet-20241022"),
)

agent = create_agent(
    model="openai:gpt-4o",
    middleware=[fallback_middleware],
)
```
