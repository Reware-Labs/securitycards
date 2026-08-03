# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: api contract misuse

## api contract misuse

### Access Error Attributes Supported by the Current Library API Contract

**Use when**

Handling connection errors and exception attributes when interacting with remote services using urllib3.

**Secure rules**

**Rule 1: Inspect supported exception attributes according to the library's API contract instead of deprecated properties.**

When handling `NewConnectionError` exceptions, inspect `error.conn` instead of `error.pool` to adhere to the supported signature usage and prevent future compatibility and runtime warnings.

```python
import urllib3
from urllib3.exceptions import NewConnectionError

try:
    http.request('GET', 'https://example.com')
except NewConnectionError as err:
    conn = err.conn
    print(f'Connection failed for host: {conn.host}')
```
