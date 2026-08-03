# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: session management

## session management

### Use Unique Session Identifiers for Tenant Isolation

**Use when**

Developing multi-tenant applications using LlamaIndex chat memory or tool specifications where distinct user sessions must be isolated.

**Secure rules**

**Rule 1: Specify unique session identifiers when instantiating chat memory or executing tools to prevent cross-tenant state pollution and data leakage.**

Always pass a fresh UUID or securely generated user-session-bound identifier when calling `Memory.from_defaults()` or when providing `thread_id` parameters to tool specifications. Relying on default or hardcoded session identifiers causes chat history and session context to be shared across distinct users.

```python
import uuid
from llama_index.core.memory.memory import Memory

def create_user_memory(user_session_id: str) -> Memory:
    return Memory.from_defaults(
        session_id=user_session_id,
        async_database_uri="sqlite+aiosqlite:///:memory:"
    )
```
