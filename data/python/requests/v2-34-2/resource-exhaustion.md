# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: resource exhaustion

## resource exhaustion

### Configure Explicit Timeouts and Manage Streaming Connections to Prevent Resource Exhaustion

**Use when**

Making HTTP requests using the requests library where unmanaged streams or missing timeouts can lead to connection exhaustion and thread blocking.

**Secure rules**

**Rule 1: Always specify explicit connection and read timeouts on request calls.**

Pass an explicit `timeout` parameter to prevent requests from blocking indefinitely and causing thread exhaustion when dealing with unresponsive servers.

```python
import requests

try:
    response = requests.get('https://api.github.com/events', timeout=(3.05, 10))
    response.raise_for_status()
except requests.exceptions.Timeout:
    pass
```

**Rule 2: Use context managers with streaming requests to ensure connections are closed.**

Wrap requests made with `stream=True` inside a `with` statement block to ensure underlying network connections are properly closed and returned to the connection pool.

```python
import requests

with requests.get('https://example.com/stream', stream=True) as response:
    response.raise_for_status()
    for chunk in response.iter_content(chunk_size=8192):
        pass
```
