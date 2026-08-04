# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: boundary control

## boundary control

### Restrict Anthropic Tool File Path Access Using Explicit Allowed Prefixes

**Use when**

When configuring Anthropic agent tool middleware such as state-based file or memory tool operations where untrusted model input dictates paths that cross application boundaries.

**Secure rules**

**Rule 1: Configure explicit allowed path prefixes when initializing Anthropic agent tool middleware to restrict file operations to designated directories and prevent directory traversal.**

Always pass explicit directory boundaries using `allowed_path_prefixes` when instantiating tool middleware classes to ensure that internal path validators successfully block directory traversal attempts and restrict access to expected boundaries.

```python
from langchain_anthropic.middleware.anthropic_tools import StateClaudeTextEditorMiddleware

middleware = StateClaudeTextEditorMiddleware(
    allowed_path_prefixes=["/workspace/"]
)
```
