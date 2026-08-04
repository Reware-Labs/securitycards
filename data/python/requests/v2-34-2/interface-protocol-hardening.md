# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: interface protocol hardening

## interface protocol hardening

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
