# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: network boundary

## network boundary

### Configure Trusted HTTPS Proxy Forwarding and Remote DNS Resolution

**Use when**

Configuring outbound connections through proxy managers or SOCKS proxies where transport security and endpoint reachability must be protected across network boundaries.

**Secure rules**

**Rule 1: Restrict HTTPS request forwarding via ProxyManager to trusted or corporate proxies only.**

When initializing `urllib3.ProxyManager`, only enable `use_forwarding_for_https=True` when communicating with trusted or corporate proxies. Using HTTP forwarding for HTTPS requests exposes request paths, headers, and body content to intermediate proxy servers unless transport confidentiality is explicitly managed.

```python
import urllib3

trusted_proxy = urllib3.ProxyManager(
    "https://corporate-proxy.internal:3128",
    use_forwarding_for_https=True
)
```

**Rule 2: Enforce remote DNS resolution when using SOCKS proxies.**

When instantiating `SOCKSProxyManager`, specify the `socks5h://` or `socks4a://` scheme rather than `socks5://` or `socks4://`. This ensures hostname resolution occurs remotely on the proxy server rather than locally, preventing leakage of targeted hostnames over local DNS traffic.

```python
from urllib3.contrib.socks import SOCKSProxyManager

proxy = SOCKSProxyManager("socks5h://localhost:8889/")
resp = proxy.request("GET", "https://example.com/")
```
