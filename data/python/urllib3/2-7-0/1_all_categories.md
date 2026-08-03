# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`

## Category: api contract misuse

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


## Category: authentication

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


## Category: boundary control

### Enforce boundary checks using parsed authority hostnames

**Use when**

Validating untrusted URLs or enforcing host allowlists at a system boundary before passing state to trusted logic or network clients.

**Secure rules**

**Rule 1: Extract and validate target hostnames using urllib3 parse_url to prevent parser differential attacks and domain spoofing at trust boundaries.**

When checking untrusted URL inputs at a system boundary, use `urllib3.util.parse_url()` to extract the hostname. This ensures that characters like backslashes are correctly parsed as part of the path component rather than host delimiters, preventing attackers from bypassing allowlists or SSRF filters via inconsistent parsing.

```python
from urllib3.util import parse_url

def is_allowed_host(url_string: str) -> bool:
    parsed = parse_url(url_string)
    return parsed.host in {"api.example.com", "services.example.com"}
```


## Category: cryptography

### Verify Server Certificate Fingerprints Securely with SHA-256

**Use when**

When pinning server certificates to validate peer identity and prevent timing side-channel attacks.

**Secure rules**

**Rule 1: Use SHA-256 hashes and constant-time comparison when validating certificate fingerprints.**

Supply a 64-character SHA-256 hex string rather than legacy hashes when calling `assert_fingerprint()` to ensure constant-time digest comparison.

```python
from urllib3.util.ssl_ import assert_fingerprint

cert_bytes = ssl_socket.getpeercert(binary_form=True)
sha256_fingerprint = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
assert_fingerprint(cert_bytes, sha256_fingerprint)
```


## Category: input contract definition

### Validate URL syntax and port ranges using parse_url

**Use when**

When validating untrusted input string URLs and enforcing strict port boundaries before passing them to networking components.

**Secure rules**

**Rule 1: Always catch LocationParseError when calling parse_url() on untrusted input string URLs to reject malformed URLs and out-of-bound port numbers.**

Wrap URL parsing in exception handlers to validate user-supplied URLs before passing them to networking components. Use urllib3.util.parse_url() and catch LocationParseError to handle invalid formats or out-of-range ports safely.

```python
import urllib3
from urllib3.exceptions import LocationParseError

def validate_url(raw_url: str) -> urllib3.util.Url:
    try:
        return urllib3.util.parse_url(raw_url)
    except LocationParseError as err:
        raise ValueError(f"Invalid URL provided: {err}")
```


## Category: input interpretation safety

### Sanitize and normalize URLs to prevent control character and header injection

**Use when**

Constructing URLs with user-supplied components or parsing hostnames and parameters in urllib3

**Secure rules**

**Rule 1: Parse untrusted URLs with `parse_url()` and explicitly validate the resulting components**

Use `urllib3.util.parse_url()` and handle `LocationParseError` to reject malformed URLs. After parsing, validate security-sensitive components such as the scheme, hostname, and port against application policy. Do not assume that parsing alone makes an arbitrary URL safe for network access.

```python
from urllib3.exceptions import LocationParseError
from urllib3.util import parse_url

ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_HOSTS = {"api.example.com", "services.example.com"}


def validate_url(raw_url: str):
    try:
        parsed = parse_url(raw_url)
    except LocationParseError as err:
        raise ValueError(f"Invalid URL: {err}") from err

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("Unsupported URL scheme")

    if parsed.host not in ALLOWED_HOSTS:
        raise ValueError("Untrusted hostname")

    return parsed
```


## Category: interface protocol hardening

### Validate HTTP Request Methods and Reject Invalid Verbs

**Use when**

Making HTTP requests and defining custom method names using urllib3

**Secure rules**

**Rule 1: Use urllib3’s request API to reject malformed HTTP methods**

Send HTTP requests through `PoolManager.request()`. It normalizes the method to uppercase, and urllib3’s HTTP/1.1 connection rejects methods containing non-token characters with `ValueError`. Do not use `Retry.allowed_methods` for validation; that option only controls which methods may be retried.

```python
import urllib3

http = urllib3.PoolManager()

try:
    http.request("GET\n", "https://httpbin.org/")
except ValueError as error:
    print(f"Invalid HTTP method rejected: {error}")
```


## Category: network boundary

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


## Category: resource exhaustion

### Configure Explicit Operation Timeouts on Requests

**Use when**

Making HTTP requests when you need to prevent threads or processes from hanging indefinitely due to slow or unresponsive servers.

**Secure rules**

**Rule 1: Configure read timeouts and enforce a separate overall streaming limit**

Set an explicit read timeout with `urllib3.util.Timeout` to limit the time between consecutive socket reads. Because a read timeout does not limit the total response duration when a server continuously sends small amounts of data, separately enforce an overall deadline or byte limit.

```python
import time

import urllib3
from urllib3.util import Timeout

http = urllib3.PoolManager()
response = http.request(
    "GET",
    "https://example.com/stream",
    preload_content=False,
    timeout=Timeout(connect=2.0, read=5.0),
)

deadline = time.monotonic() + 30.0
completed = False

try:
    for chunk in response.stream(amt=8192):
        if time.monotonic() > deadline:
            raise TimeoutError("Response exceeded the total time limit")

        process(chunk)

    completed = True
finally:
    if completed:
        response.release_conn()
    else:
        response.close()
```


### Enforce strict decompression limits and bounded streaming for compressed responses

**Use when**

When handling HTTP responses compressed with encodings like gzip, deflate, brotli, or zstd using urllib3 to prevent resource exhaustion and decompression bombs.

**Secure rules**

**Rule 1: Use Brotli versions that support bounded-output decompression**

When processing Brotli-compressed responses with `decode_content=True`, install `brotli >= 1.2.0` or `brotlicffi >= 1.2.0.0`. These versions support the bounded-output decompression interface used by urllib3 2.7.0.

```python
# requirements.txt
# urllib3 == 2.7.0
# brotli >= 1.2.0
#
# Alternatively:
# brotlicffi >= 1.2.0.0

for chunk in response.stream(amt=65536, decode_content=True):
    process_chunk(chunk)
```

**Rule 2: Catch streaming exceptions and maintain an application-level processed-byte count**

Request responses with `preload_content=False` and process them through `stream()` or bounded `read()` calls. Catch exceptions exposed by urllib3, such as `ProtocolError`, `DecodeError`, and `ReadTimeoutError`. Maintain a processed-byte counter instead of relying on low-level exception attributes to determine how much response data was processed.

```python
import urllib3
from urllib3.exceptions import DecodeError, ProtocolError, ReadTimeoutError

http = urllib3.PoolManager()
response = http.request(
    "GET",
    "https://example.com/large-stream",
    preload_content=False,
)

bytes_read = 0
completed = False

try:
    for chunk in response.stream(amt=65536):
        bytes_read += len(chunk)
        process_data(chunk)

    completed = True
except (ProtocolError, DecodeError, ReadTimeoutError) as err:
    logger.error(
        "Streaming failed after processing %d bytes: %s",
        bytes_read,
        err,
    )
    raise
finally:
    if completed:
        response.release_conn()
    else:
        response.close()
```

**Rule 3: Handle `DecodeError` exceptions when content encoding depth limits are exceeded.**

Catch `urllib3.exceptions.DecodeError` exceptions raised by decoder depth limits to safely handle or reject multi-layered payloads that exceed `MultiDecoder.max_decode_links`.

```python
import urllib3
from urllib3.exceptions import DecodeError

http = urllib3.PoolManager()
try:
    response = http.request("GET", "https://example.com/api/data")
except DecodeError:
    pass
```


### Stream large HTTP responses safely with preloading disabled and strict resource controls

**Use when**

When handling large or arbitrary-sized HTTP response payloads where buffering the full body into memory would cause resource exhaustion or out-of-memory crashes.

**Secure rules**

**Rule 1: Disable response preloading and process data incrementally using stream or read methods.**

Configure `preload_content=False` on the request or pool call and consume data incrementally via `stream()` or `read(amt)` to prevent unbounded memory buffering of HTTP response bodies.

```python
resp = pool.request("GET", "https://example.com/large-file", preload_content=False)
try:
    for chunk in resp.stream(64 * 1024):
        process(chunk)
finally:
    resp.release_conn()
```

**Rule 2: Drain or close streaming connections before pool release.**

Ensure all data is read or explicitly discarded via `resp.drain_conn()` or `resp.close()` before releasing unexhausted streaming connections back to the connection pool to prevent protocol corruption.

```python
import urllib3

http = urllib3.PoolManager()
resp = http.request("GET", "https://example.com/data", preload_content=False)
try:
    chunk = resp.read(1024)
    resp.drain_conn()
finally:
    resp.release_conn()
```


## Category: runtime environment hardening

### Deploy Applications on Python Runtimes Compiled with OpenSSL 1.1.1 or Later

**Use when**

Configuring the production runtime environment and container base images for deploying applications using urllib3.

**Secure rules**

**Rule 1: Deploy applications on Python 3.10+ runtimes compiled with OpenSSL 1.1.1 or higher.**

Ensure your production environments, container base images, or server deployments run supported Python versions compiled against OpenSSL 1.1.1 or newer to avoid outdated cryptographic builds and ensure proper support for modern TLS protocol features.

```dockerfile
FROM python:3.11-slim

RUN pip install 'urllib3>=2.0.0'
```


## Category: secret handling

### Strip Custom Sensitive Headers on Cross-Host Redirects

**Use when**

Configuring connection retry behaviors and making HTTP requests where custom API keys or authentication tokens may be exposed during cross-host redirects.

**Secure rules**

**Rule 1: Include urllib3’s standard sensitive headers and all custom secret headers in `remove_headers_on_redirect`**

Passing a custom `remove_headers_on_redirect` collection replaces the default collection. When adding custom secret headers, also include `Authorization`, `Cookie`, and `Proxy-Authorization` so these standard sensitive headers continue to be removed when a redirect crosses host boundaries.

```python
from urllib3 import PoolManager
from urllib3.util import Retry

custom_retry = Retry(
    remove_headers_on_redirect=[
        "Authorization",
        "Cookie",
        "Proxy-Authorization",
        "X-API-Secret",
    ]
)

with PoolManager() as http:
    response = http.request(
        "GET",
        "https://example.com/redirect-target",
        headers={
            "X-API-Secret": "my-secret-key",
            "Authorization": "Bearer token123",
        },
        retries=custom_retry,
    )
```


## Category: security control integrity

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


## Category: session management

### Extract and manage session cookies securely using CookieJar

**Use when**

Handling session cookies returned in urllib3 HTTP responses to ensure security attributes like HttpOnly and path restrictions are properly interpreted.

**Secure rules**

**Rule 1: Pass the HTTPResponse object directly to CookieJar for standard library cookie extraction.**

When handling session cookies in `urllib3`, pass the `HTTPResponse` object directly to `http.cookiejar.CookieJar.extract_cookies()` along with the corresponding request object. This ensures correct interpretation of security attributes like `HttpOnly`, `expires`, and `path` restrictions, avoiding manual parsing errors that can compromise session security.

```python
import http.cookiejar
import urllib.request
from urllib3.response import HTTPResponse

req = urllib.request.Request("https://example.com")
jar = http.cookiejar.CookieJar()
# response is a urllib3.response.HTTPResponse instance
jar.extract_cookies(response, req)
```
