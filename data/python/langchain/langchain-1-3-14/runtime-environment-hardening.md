# Security cards

Repository: `https://github.com/langchain-ai/langchain#langchain==1.3.14`
Category: runtime environment hardening

## runtime environment hardening

### Harden Container Execution Policies for Shell Tools

**Use when**

Configuring container execution policies and runtime privileges when running shell tools.

**Secure rules**

**Rule 1: Enforce non-root execution and resource limits on container environments**

When configuring execution policies for shell tools, explicitly set non-root user restrictions, memory constraints, CPU limits, and read-only root filesystems to reduce attack surface and limit potential container compromise impact.

```python
from langchain.agents.middleware.shell_tool import DockerExecutionPolicy

policy = DockerExecutionPolicy(
    image="ubuntu:22.04",
    user="1000:1000",
    memory_bytes=512 * 1024 * 1024,
    cpus="1.0",
    read_only_rootfs=True
)
```
