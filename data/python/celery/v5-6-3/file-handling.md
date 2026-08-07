# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: file handling

## file handling

### Use create_pidlock and restrictive umask settings for safe file creation and permissions

**Use when**

Writing daemon process lock files or launching detached background Celery worker processes.

**Secure rules**

**Rule 1: Utilize create_pidlock or Pidfile objects when writing daemon process lock files.**

Use `create_pidlock` or `Pidfile` objects rather than implementing custom file writing logic. The `Pidfile` class uses strict file creation flags (`O_CREAT | O_EXCL`) and explicit mode permissions to prevent race conditions and symlink exploitation.

```python
from celery.platforms import create_pidlock

pidlock = create_pidlock('/var/run/celery/worker.pid')
```

**Rule 2: Specify a restrictive umask when launching detached Celery worker processes.**

Explicitly specify a restrictive umask such as `--umask=022` or integer `18` when launching detached or background Celery worker processes to prevent worker tasks from creating world-writable files and directories.

```bash
celery -A my_app worker --detach --umask=022
```
