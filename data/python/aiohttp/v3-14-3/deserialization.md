# Security cards

Repository: `https://github.com/aio-libs/aiohttp#v3.14.3`
Category: deserialization

## deserialization

### Use restricted unpickling and JSON serialization for cookie jar loading

**Use when**

When loading cookie files into `aiohttp.CookieJar` where untrusted data could lead to arbitrary object construction via insecure pickling.

**Secure rules**

**Rule 1: Load cookie jars using safe JSON parsing and restrict unpickling classes to a strict allowlist**

Use `CookieJar.load()` to restore cookie stores safely. When loading legacy pickled cookie stores, `CookieJar.load()` relies on `_RestrictedCookieUnpickler` to restrict object construction exclusively to an approved allowlist of cookie-related builtins and container types, preventing arbitrary object injection.

```python
jar = aiohttp.CookieJar()
jar.save("/path/to/cookies.json")

loaded_jar = aiohttp.CookieJar()
loaded_jar.load("/path/to/cookies.json")
```
