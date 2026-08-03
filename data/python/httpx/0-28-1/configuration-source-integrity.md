# Security cards

Repository: `https://github.com/encode/httpx#0.28.1`
Category: configuration source integrity

## configuration source integrity

### Disable Environment Variable Proxy Reading in Untrusted Runtimes

**Use when**

Instantiating an `httpx.Client` or `httpx.AsyncClient` in multi-tenant or untrusted environments where ambient environment variables may be manipulated by external actors.

**Secure rules**

**Rule 1: Disable ambient environment proxy lookup by setting `trust_env=False` on client instantiation.**

By default, HTTPX reads ambient proxy settings from the environment. In untrusted or multi-tenant runtimes, explicitly pass `trust_env=False` to prevent external injection of proxy variables from redirecting client traffic.

```python
import httpx

client = httpx.Client(trust_env=False)
response = client.get("https://internal.service.local/health")
```
