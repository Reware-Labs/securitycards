# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: resource exhaustion

## resource exhaustion

### Configure Timeouts, Memory Safeguards, and Result Limits to Prevent Resource Exhaustion

**Use when**

When defining tasks, configuring workers, and handling long-running or unbounded operations in Celery applications.

**Secure rules**

**Rule 1: Set explicit execution time limits on tasks and task signatures.**

Define explicit hard `time_limit` and soft `soft_time_limit` attributes on task definitions or when invoking tasks via `apply_async` to enforce execution boundaries and prevent worker starvation.

```python
from celery import Task

class TimeBoundedTask(Task):
    soft_time_limit = 60
    time_limit = 120

my_task.apply_async(args=[payload], time_limit=120, soft_time_limit=60)
```

**Rule 2: Configure worker resource limits and task retention policies.**

Prevent memory and queue exhaustion by configuring `worker_eta_task_limit`, `worker_max_memory_per_child`, and `worker_max_tasks_per_child`, and bound result retention globally using `result_expires` while ignoring unneeded results with `ignore_result=True`.

```python
@app.task(ignore_result=True)
def process_log_entry(data):
    pass

app.conf.update(
    worker_eta_task_limit=10000,
    worker_max_memory_per_child=200000,
    worker_max_tasks_per_child=1000,
    result_expires=3600,
)
```

**Rule 3: Configure explicit I/O network timeouts inside tasks.**

Always configure explicit connection and read timeouts on external network requests and I/O operations performed inside Celery tasks to prevent tasks from hanging indefinitely and exhausting worker pool capacity.

```python
import requests

@app.task
def fetch_remote_resource(url):
    connect_timeout, read_timeout = 5.0, 30.0
    response = requests.get(url, timeout=(connect_timeout, read_timeout))
    return response.status_code
```
