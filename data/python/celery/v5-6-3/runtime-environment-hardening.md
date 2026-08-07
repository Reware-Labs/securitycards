# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: runtime environment hardening

## runtime environment hardening

### Run Celery worker processes under unprivileged user accounts and sandboxed environments

**Use when**

Configuring production runtime environments and process privileges for Celery background workers to minimize attack surface and prevent host compromise.

**Secure rules**

**Rule 1: Execute Celery worker services under dedicated, unprivileged operating system users rather than the root user account.**

Configure process managers or container entrypoints to execute background tasks under a non-root user. This ensures that a compromised task or deserialization vulnerability does not result in full administrative access to the host operating system.

```ini
[program:celery]
command=celery -A myproj worker --loglevel=INFO
user=celeryworker
```

**Rule 2: Drop root privileges programmatically using maybe_drop_privileges before initializing worker tasks.**

Use `celery.platforms.maybe_drop_privileges` to relinquish root privileges to an unprivileged user and group prior to running worker loops. Catch `SecurityError` to refuse execution if the privilege transition fails.

```python
from celery.platforms import maybe_drop_privileges
from celery.exceptions import SecurityError

try:
    maybe_drop_privileges(uid='celery', gid='celery')
except SecurityError as err:
    raise SystemExit(f"Refusing to run process with elevated privileges: {err}")
```
