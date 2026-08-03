# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: access control

## access control

### Restrict Agent Tool Execution Permissions and Allowed Decisions in Human-in-the-Loop Workflows

**Use when**

Configuring human-in-the-loop validation or access control boundaries for agent tool executions.

**Secure rules**

**Rule 1: Explicitly configure allowed decision types when using HumanInTheLoopMiddleware to control agent tool execution interrupts.**

Restrict tool-level `allowed_decisions` to prevent users or interface adapters from injecting synthetic tool responses or executing unreviewed actions that bypass security approval controls.

```python
from langchain.agents.middleware import HumanInTheLoopMiddleware

middleware = HumanInTheLoopMiddleware(
    interrupt_on={
        "execute_database_query": {
            "allowed_decisions": ["approve", "edit", "reject"]
        },
        "ask_user_confirmation": {
            "allowed_decisions": ["respond"]
        }
    }
)
```
