# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: dangerous execution

## dangerous execution

### Restrict Agent Shell Execution Policies and Avoid Untrusted Template Strings

**Use when**

Configuring execution environments for shell tool middleware and parsing prompt templates with string formatters or dynamic environments.

**Secure rules**

**Rule 1: Use isolated execution policies for agent shell command execution**

Explicitly pass an isolated execution policy such as `DockerExecutionPolicy` when running agents in untrusted or multi-tenant environments instead of relying on host execution privileges.

```python
from langchain.agents.middleware.shell_tool import ShellToolMiddleware
from langchain.agents.middleware._execution import DockerExecutionPolicy

shell_middleware = ShellToolMiddleware(
    execution_policy=DockerExecutionPolicy(
        image="python:3.11-slim",
        read_only_rootfs=True
    )
)
```

**Rule 2: Do not accept untrusted Jinja2 template strings**

Hardcode Jinja2 template structures in application source code and pass untrusted user data exclusively as variable arguments rather than inside the template string itself.

```python
from langchain_core.prompts.string import jinja2_formatter

trusted_template = "Hello {{ username }}, summary: {{ input_text }}"
output = jinja2_formatter(trusted_template, username="alice", input_text=untrusted_user_input)
```
