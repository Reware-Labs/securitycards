# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: configuration source integrity

## configuration source integrity

### Disable environment variable and .netrc credential loading in untrusted execution contexts

**Use when**

Configuring HTTP sessions in multi-tenant, serverless, or untrusted environments where local environment variables or .netrc files could be manipulated by external actors.

**Secure rules**

**Rule 1: Set trust_env to False on the requests Session to prevent automatic configuration overrides from local environment variables and .netrc files.**

When running applications in environments where local configuration sources like environment variables or .netrc files may be untrusted or ambiguous, instantiate a requests `Session` and set `trust_env` to `False`. This ensures that proxy settings and authentication credentials are not implicitly loaded from the local environment, protecting against configuration tampering or unauthorized traffic redirection.

```python
import requests

s = requests.Session()
# Disable reading proxies and auth from environment and .netrc
s.trust_env = False
resp = s.get("https://internal.example.com/api")
```
