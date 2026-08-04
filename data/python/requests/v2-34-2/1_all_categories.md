# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`

## Category: api contract misuse

### Validate HTTP Response Status Codes Before Parsing Payloads

**Use when**

Processing response data or parsing payloads returned from HTTP requests.

**Secure rules**

**Rule 1: Always verify the response status code or call raise_for_status() before parsing response payloads.**

Successful execution of `r.json()` only indicates valid JSON formatting, not HTTP success. Error responses such as HTTP 500 or 400 may still contain valid JSON payloads, so calling `r.raise_for_status()` ensures that applications do not ingest error details as successful business data.

```python
import requests

r = requests.get('https://api.github.com/events', timeout=5)
# Check response status before parsing payload
r.raise_for_status()
data = r.json()
```


## Category: authentication

### Authenticate Requests Securely Using Supported Mechanisms

**Use when**

Establishing and verifying identity using credentials, tokens, or digest authentication when sending HTTP requests.

**Secure rules**

**Rule 1: Implement custom authentication mechanisms by subclassing AuthBase**

When standard HTTP Basic or Digest authentication is insufficient, implement custom authentication logic by subclassing `requests.auth.AuthBase` and modifying the `Request` object inside `__call__` to encapsulate header injection and token signing safely.

```python
import requests
from requests.auth import AuthBase

class CustomBearerTokenAuth(AuthBase):
    def __init__(self, token):
        self.token = token

    def __call__(self, r):
        r.headers['Authorization'] = f'Bearer {self.token}'
        return r

response = requests.get('https://httpbin.org/get', auth=CustomBearerTokenAuth('secret-token'))
```

**Rule 2: Disable automatic redirects when Digest credentials must not be forwarded**

Use `HTTPDigestAuth` when a server requires HTTP Digest authentication, but do not assume it removes credentials from every redirect. Its 401 handler limits authenticated resends, while its redirect hook only resets that retry state. Authorization stripping is handled separately and conditionally, so some same-host redirects retain the header. When no redirected request may carry the credentials, set `allow_redirects=False`.

```python
import requests
from requests.auth import HTTPDigestAuth

response = requests.get(
    "https://httpbin.org/digest-auth/auth/user/pass",
    auth=HTTPDigestAuth("user", "pass"),
    allow_redirects=False,
)
```


## Category: boundary control

### Validate URL Scheme and Domain Boundaries Before Request Execution

**Use when**

When accepting dynamic or user-supplied target URL strings before passing them to requests functions.

**Secure rules**

**Rule 1: Validate target URL schemes and host structures before passing dynamic URLs to `requests`.**

Check that the URL has an explicit and safe URI scheme and a valid network location prior to making network calls. This prevents requests from failing at runtime or encountering unexpected protocol parsing behaviors when processing untrusted input.

```python
import requests
from urllib.parse import urlparse

def fetch_url(target_url: str):
    parsed = urlparse(target_url)
    if parsed.scheme not in ("https", "http") or not parsed.netloc:
        raise ValueError(f"Untrusted or invalid target URL: {target_url}")
    return requests.get(target_url)
```


## Category: configuration source integrity

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


## Category: file handling

### Use atomic file opening for safe file creation and updates

**Use when**

Writing or updating files on disk to prevent race conditions or partially written data exposure.

**Secure rules**

**Rule 1: Use atomic_open() when creating or updating files on disk to safely write data to a secure temporary file before atomically replacing the destination path.**

Always use `atomic_open()` when writing files to disk so that data is written to a secure temporary location first and only replaces the final destination upon successful completion. This prevents race conditions and exposure of partially written files during concurrent operations or application crashes.

```python
from requests.utils import atomic_open

with atomic_open('/path/to/target_file.txt') as handle:
    handle.write(b'sensitive data content')
```


## Category: input interpretation safety

### Prevent Parser Desynchronization by Restricting Non-Standard JSON Numeric Formats

**Use when**

Serializing data structures to JSON payloads via the `json` parameter in requests.

**Secure rules**

**Rule 1: Avoid passing out-of-spec numeric values like `float('nan')` or `float('inf')` into JSON request payloads.**

Ensure all dictionary and sequence data passed to the `json` parameter contain valid standard JSON data types and do not include values that trigger an `InvalidJSONError` or break strict backend API parsers.

```python
import requests

payload = {"status": "success", "score": 98.5}
response = requests.post("https://api.example.com/submit", json=payload)
```


## Category: interface protocol hardening

### Validate response headers to prevent request desynchronization and framing ambiguity

**Use when**

When handling HTTP responses from external servers and parsing message framing and headers.

**Secure rules**

**Rule 1: Catch `requests.exceptions.InvalidHeader` exceptions to handle responses with conflicting `Content-Length` headers.**

Requests automatically rejects responses containing multiple conflicting `Content-Length` headers to prevent HTTP response desynchronization. Wrap request execution blocks in `try` and `except requests.exceptions.InvalidHeader:` to properly handle malformed or ambiguous protocol responses and prevent unsafe parsing of smuggled payloads.

```python
try:
    response = requests.get('https://example.com/api/data')
except requests.exceptions.InvalidHeader:
    pass
```


## Category: network boundary

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


## Category: resource exhaustion

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


## Category: secret handling

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


## Category: security control integrity

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


## Category: session management

### Configure Secure and Domain-Restricted Session Cookies

**Use when**

Creating custom cookies programmatically or adding them to a RequestsCookieJar for session management.

**Secure rules**

**Rule 1: Explicitly define the domain, path, and secure flag when creating session cookies.**

When creating cookies programmatically via `requests.cookies.create_cookie()` or adding them to a `RequestsCookieJar`, you must explicitly specify the `domain`, `path`, and set `secure=True`. Omitting the domain defaults to an empty string, turning the cookie into a supercookie that attaches to requests across all external domains. Leaving `secure=False` permits session cookies to be transmitted over unencrypted HTTP connections.

```python
from requests.cookies import create_cookie, RequestsCookieJar

jar = RequestsCookieJar()
cookie = create_cookie(
    name="session_id",
    value="secret_token_val",
    domain="api.example.com",
    path="/",
    secure=True
)
jar.set_cookie(cookie)
```
