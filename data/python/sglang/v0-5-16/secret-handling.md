# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: secret handling

## secret handling

### Load Credentials and Secrets Dynamically via Environment Variables

**Use when**

When configuring gateways, database connections, API keys, and external service integrations in SGLang.

**Secure rules**

**Rule 1: Load sensitive credentials and keys from environment variables rather than hardcoding them in source files or configuration strings.**

Retrieve credentials such as database URLs, API keys, and access tokens dynamically using `os.environ.get` or environment variable substitution in configuration files to prevent secret leakage in version control.

```python
import os

args = RouterArgs(
    postgres_db_url=os.environ.get("POSTGRES_DB_URL"),
    redis_url=os.environ.get("REDIS_URL"),
)
```
