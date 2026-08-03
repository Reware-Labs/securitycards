# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: interface protocol hardening

## interface protocol hardening

### Sanitize Hop-by-Hop Headers During Request Proxying

**Use when**

When proxying requests and responses between clients and cloud endpoints

**Secure rules**

**Rule 1: Strip hop-by-hop headers and connection-token headers before forwarding requests or responses**

When proxying requests or responses between clients and cloud endpoints, always strip hop-by-hop headers, including headers enumerated inside the `Connection` header token list. Custom headers marked in `Connection` must not be forwarded upstream or downstream to prevent HTTP request smuggling and proxy confusion.

```go
src := http.Header{}
src.Add("Connection", "keep-alive, X-Trace-Hop")
src.Add("X-Trace-Hop", "drop-me")

dst := http.Header{}
copyProxyRequestHeaders(dst, src)
// dst will have Connection and X-Trace-Hop removed
```
