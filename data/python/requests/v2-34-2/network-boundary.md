# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: network boundary

## network boundary

### Configure Explicit Proxy Bypass Rules and Complete URI Schemes

**Use when**

Configuring trusted proxy environments and destination bypass rules for outbound requests.

**Secure rules**

**Rule 1: Specify proxy URL schemes explicitly**

Include an explicit scheme in every proxy URL, as shown in the documented proxy configuration. In Requests v2.34.2, omitting the scheme does not raise `MissingSchema`; Requests automatically prepends `http`. Specify the scheme explicitly instead of relying on that default.

```python
import requests

proxies = {
    "http": "http://10.10.1.10:3128",
    "https": "http://10.10.1.10:1080",
}

response = requests.get("http://example.org", proxies=proxies)
```

**Rule 2: Scope no_proxy entries to intended bypass destinations**

Configure `no_proxy` with only the destinations that should bypass configured proxies. Requests matches plain IPv4 entries exactly and supports IPv4 CIDR ranges. A hostname entry matches both that hostname and its subdomains on a domain-label boundary; it is not an exact-host-only rule. A hostname combined with a port limits the match to that port.

```python
import os

import requests

os.environ["https_proxy"] = "http://10.10.1.10:1080"
os.environ["no_proxy"] = "127.0.0.1,192.168.0.0/24,example.org"

response = requests.get("https://example.org")
```
