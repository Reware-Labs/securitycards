# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: network boundary

## network boundary

### Configure Explicit Trusted Proxies and Handle Errors

**Use when**

Configuring trusted upstream proxies or load balancers for Gin routers to accurately parse client IP headers.

**Secure rules**

**Rule 1: Configure explicit trusted proxy IP ranges and handle errors using SetTrustedProxies.**

Trusting arbitrary proxy headers permits attackers to fake their client IP address, undermining access controls and rate limiting. Applications must explicitly configure trusted proxy IP ranges using `SetTrustedProxies` or pass `nil` to disable proxy header parsing when direct client connections are expected. Always handle error returns when calling `SetTrustedProxies` with IP address or CIDR range strings, because invalid IP addresses or out-of-range CIDR notations fail parsing and return an error.

```go
router := gin.New()
err := router.SetTrustedProxies([]string{"192.168.1.0/24", "10.0.0.1"})
if err != nil {
    log.Fatalf("Failed to configure trusted proxies: %v", err)
}
```
