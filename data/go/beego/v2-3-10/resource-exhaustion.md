# Security cards

Repository: `https://github.com/beego/beego#v2.3.10`
Category: resource exhaustion

## resource exhaustion

### Configure Explicit Request Body Size Limits

**Use when**

Configuring web application server parameters or handling incoming request payloads in Beego to protect against memory exhaustion and denial-of-service vulnerabilities.

**Secure rules**

**Rule 1: Enforce strict size limits on incoming request payloads and server request bodies.**

Set strict size bounds using `MaxMemory` and `MaxUploadSize` configurations to prevent excessive heap allocation or disk utilization caused by unbounded request bodies.

```go
web.BConfig.MaxMemory = 10 << 20
web.BConfig.MaxUploadSize = 20 << 20
```
