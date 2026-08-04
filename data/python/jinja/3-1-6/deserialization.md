# Security cards

Repository: `https://github.com/pallets/jinja#3.1.6`
Category: deserialization

## deserialization

### Secure Bytecode Cache Storage Backends and Avoid Untrusted Deserialization

**Use when**

Configuring Jinja bytecode caches or handling serialized Environment instances where untrusted data or insecure deserialization could lead to arbitrary code execution.

**Secure rules**

**Rule 1: Isolate and write-protect bytecode cache storage backends against untrusted access.**

Ensure that bytecode cache storage backends such as filesystem directories or Memcached instances are strictly write-protected so that untrusted users cannot tamper with cache contents loaded via `pickle.load` or `marshal.load`.

```python
from jinja2 import Environment, FileSystemBytecodeCache

bcc = FileSystemBytecodeCache(directory="/var/app/private_cache")
env = Environment(bytecode_cache=bcc)
```

**Rule 2: Initialize the Jinja environment once with explicit, trusted configuration**

Create the Environment during application initialization, configure its loader and autoescaping explicitly, and avoid modifying it after templates have been loaded because Jinja documents that later modifications cause undefined behavior.

```python
from jinja2 import Environment, FileSystemLoader, select_autoescape

env = Environment(
 loader=FileSystemLoader("templates"),
 autoescape=select_autoescape(["html", "htm", "xml"]),
)
```
