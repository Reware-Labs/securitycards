# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: boundary control

## boundary control

### Disable set_as_current for tenant-specific Celery application instances

**Use when**

Instantiating dynamic, per-tenant Celery app instances to segregate broker URLs, virtual hosts, or result backends in multi-threaded environments.

**Secure rules**

**Rule 1: Disable implicit current-app changes for dynamically created Celery applications**

When dynamically creating multiple Celery application instances, set `set_as_current=False` so construction does not replace the current application for the executing thread. Keep and use the returned application instance explicitly rather than relying on Celery’s implicit `current_app` selection.

```python
from celery import Celery

def create_app(name: str, broker_url: str) -> Celery:
    return Celery(
        main=name,
        broker=broker_url,
        set_as_current=False,
    )
```
