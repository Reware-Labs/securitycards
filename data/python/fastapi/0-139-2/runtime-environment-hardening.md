# Security cards

Repository: `https://github.com/fastapi/fastapi#0.139.2`
Category: runtime environment hardening

## runtime environment hardening

### Disable Debug Mode and Use Production Run Commands in Production

**Use when**

Configuring the production runtime environment for deployment to disable verbose error exposure and development-specific server settings.

**Secure rules**

**Rule 1: Explicitly disable debug mode in production to prevent leaking internal tracebacks and configuration details.**

Ensure the `debug` parameter is explicitly set to `False` when instantiating `FastAPI` in production configurations so internal exception tracebacks are not rendered and returned directly in HTTP server error responses.

```python
import os
from fastapi import FastAPI

app = FastAPI(debug=False)
```

**Rule 2: Use the production run command instead of the development server mode when deploying the application.**

Use the `fastapi run` command for production deployments instead of `fastapi dev` to avoid enabling auto-reloading via file system watchers and development server configurations.

```bash
fastapi run main.py
```
