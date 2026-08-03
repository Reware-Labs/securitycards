# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: file handling

## file handling

### Enforce Strict Root Directory Boundaries and Path Containment for Filesystem Tools

**Use when**

Configuring file search middleware or processing file patch tool operations in agentic workflows.

**Secure rules**

**Rule 1: Configure filesystem search middleware with an explicit isolated root path to block path traversal and symlink escapes.**

When creating file search tools for AI agents, developers should configure `FilesystemFileSearchMiddleware` with a specific `root_path`. The middleware automatically blocks path traversal vectors, including relative parent directory references, absolute paths outside the root, tilde expansions, and symlinks resolving outside the root boundary.

```python
from langchain.agents.middleware.file_search import FilesystemFileSearchMiddleware

middleware = FilesystemFileSearchMiddleware(
    root_path="/app/sandbox",
    use_ripgrep=False
)

glob_tool = middleware.glob_search
grep_tool = middleware.grep_search
```
