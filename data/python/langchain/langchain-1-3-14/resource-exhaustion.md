# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: resource exhaustion

## resource exhaustion

### Configure Resource Limits and Timeouts for Agent and Model Executions

**Use when**

When building agents and LLM-powered applications using LangChain where operations, model calls, tools, or shell commands could consume unbounded system resources, memory, or time.

**Secure rules**

**Rule 1: Configure strict execution timeouts and resource limits on execution policies for shell tools.**

When using `ShellToolMiddleware` or execution policies, set strict limits such as `command_timeout`, `max_output_bytes`, `max_output_lines`, `memory_bytes`, and `cpus` to prevent uncontrolled resource consumption and denial of service.

```python
from langchain.agents.middleware.shell_tool import HostExecutionPolicy, ShellToolMiddleware

policy = HostExecutionPolicy(
    command_timeout=10.0,
    max_output_bytes=50000,
    max_output_lines=200
)
middleware = ShellToolMiddleware(
    workspace_root="/safe/workspace",
    execution_policy=policy
)
```

**Rule 2: Enforce message and token limits to prevent context window exhaustion.**

Use utilities like `trim_messages`, `SummarizationMiddleware`, `ContextEditingMiddleware`, or `MessagesPlaceholder` with explicit token counters and count limits to prevent unbounded conversation histories from exhausting model context windows.

```python
from langchain_core.messages.utils import trim_messages

safe_messages = trim_messages(
    messages,
    max_tokens=4000,
    strategy="last",
    token_counter=model,
    allow_partial=False
)
```

**Rule 3: Configure explicit request timeouts and retry limits for model calls and runnables.**

Set explicit `timeout` and `max_retries` parameters when initializing model clients, and use `with_retry` with `stop_after_attempt` on runnables to prevent infinite execution loops and thread starvation.

```python
from langchain_mistralai import ChatMistralAI

model = ChatMistralAI(
    model="ministral-8b-latest",
    timeout=10,
    max_retries=3,
)
response = model.invoke("Summarize the incoming text.")
```
