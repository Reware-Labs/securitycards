# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: security control integrity

## security control integrity

### Merge environment settings explicitly for manually prepared requests

**Use when**

Building requests manually using `PreparedRequest` and sending them with `Session.send()` where system trust stores and environment configurations must be applied.

**Secure rules**

**Rule 1: Call `Session.merge_environment_settings` when sending manually prepared requests to ensure environment configurations and trust stores are consistently applied.**

PreparedRequest instances bypass environment evaluation by default. Omitting environment merging ignores custom CA bundles like `REQUESTS_CA_BUNDLE`, causing certificate validation failures or unexpected security setting bypasses. Always retrieve and pass the merged settings dictionary when executing `Session.send()`.

```python
from requests import Request, Session

s = Session()
req = Request('GET', 'https://example.com')
prepped = s.prepare_request(req)

settings = s.merge_environment_settings(prepped.url, {}, None, None, None)
resp = s.send(prepped, **settings)
```
