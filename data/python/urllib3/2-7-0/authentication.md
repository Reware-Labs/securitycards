# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: authentication

## authentication

### Configure client certificates and passphrases for mutual TLS authentication

**Use when**

Establishing mutual TLS client identity verification using client certificates, private keys, and certificate authorities.

**Secure rules**

**Rule 1: Specify client certificate files, private keys, and certificate authorities along with required verification settings during connection pool initialization.**

When configuring mutual TLS authentication, supply `cert_file`, `key_file`, and `ca_certs` parameters while setting `cert_reqs="REQUIRED"` or providing a custom `ssl.SSLContext` via `ssl_context`. Ensure private key passphrases are correctly handled during certificate loading to prevent connection failures or unauthorized access.

```python
from urllib3 import HTTPSConnectionPool
import ssl

with HTTPSConnectionPool(
    "localhost",
    8443,
    cert_file="/path/to/client.pem",
    key_file="/path/to/key.pem",
    ca_certs="/path/to/ca.pem",
    cert_reqs="REQUIRED"
) as pool:
    response = pool.request("GET", "/protected", retries=0)
```
