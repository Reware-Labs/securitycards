# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: secret handling

## secret handling

### Protect Sensitive Credentials and Tokens During Storage and Transport

**Use when**

Configuring requests with client certificates, basic authentication, netrc files, or handling ephemeral tokens.

**Secure rules**

**Rule 1: Disable automatic netrc authentication when it is not intended**

When a session must not use credentials from the user's netrc file, set `trust_env` to `False` before sending requests. Otherwise, Requests attempts to obtain netrc credentials when no `auth` argument is supplied, and those credentials override a raw authentication header supplied through `headers`.

```python
import requests

session = requests.Session()
session.trust_env = False
response = session.get("https://httpbin.org/basic-auth/user/pass")
```

**Rule 2: Provide credentials as explicit string or byte types for basic authentication.**

Pass username and password arguments as explicit `str` or `bytes` objects compatible with `latin1` encoding to authentication handlers to avoid unexpected encoding exceptions.

```python
import requests
from requests.auth import HTTPBasicAuth

username = "service_account"
password = "secret_key_value"

response = requests.get(
    "https://api.example.com/resource",
    auth=HTTPBasicAuth(username, password)
)
```
