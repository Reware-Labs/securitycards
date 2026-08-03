# Security cards

Repository: `https://github.com/urllib3/urllib3#2.7.0`
Category: resource exhaustion

## resource exhaustion

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
