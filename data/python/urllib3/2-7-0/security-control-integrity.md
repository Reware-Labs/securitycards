# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: security control integrity

## security control integrity

### Preserve urllib3 security warning visibility and avoid global suppression

**Use when**

Configuring warning management and logging for HTTP request execution where security controls and transport alerts must remain active.

**Secure rules**

**Rule 1: Keep HTTPS certificate verification enabled and resolve InsecureRequestWarning**

Keep HTTPS certificate verification enabled with `cert_reqs="CERT_REQUIRED"`. If `InsecureRequestWarning` appears, restore certificate verification instead of merely silencing the warning. urllib3 uses the default system certificate stores unless another trusted certificate bundle is configured.

```python
import urllib3

http = urllib3.PoolManager(cert_reqs="CERT_REQUIRED")
response = http.request("GET", "https://httpbin.org/")

print(response.status)
```
