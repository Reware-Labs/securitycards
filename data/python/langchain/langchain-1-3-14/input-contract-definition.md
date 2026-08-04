# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: input contract definition

## input contract definition

### Define explicit input schemas and validate inputs for tools and chains

**Use when**

Building tools and Runnable chains that process external user inputs or dynamic model calls in LangChain

**Secure rules**

**Rule 1: Specify explicit input schemas using `args_schema` or validate inputs against Pydantic models before chain execution**

Always define an explicit `args_schema` using a Pydantic `BaseModel` subclass or precise type annotations when defining `BaseTool` instances to enforce strong parameter boundary checks. Similarly, ensure raw user input passed into `Runnable` chains strictly conforms to expected input schemas defined via `get_input_schema()` to prevent unexpected key injection or type coercion.

```python
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool

class UserQuerySchema(BaseModel):
    user_id: int = Field(..., description="Target user ID")
    query: str = Field(..., max_length=100, description="Search query")

class SecureSearchTool(BaseTool):
    name: str = "secure_search"
    description: str = "Searches query for a specified user ID."
    args_schema: type[BaseModel] = UserQuerySchema

    def _run(self, user_id: int, query: str) -> str:
        return f"Results for user {user_id}: {query}"
```
