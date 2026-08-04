# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: resource exhaustion

## resource exhaustion

### Limit Multipart Upload Memory Allocation

**Use when**

Processing multipart form uploads in Gin applications to prevent memory exhaustion and Denial of Service.

**Secure rules**

**Rule 1: Configure MaxMultipartMemory to limit the memory allocated during multipart form processing.**

Explicitly set `router.MaxMultipartMemory` to an appropriate size limit to prevent concurrent large uploads from exhausting server RAM and causing a Denial of Service. Values can be assigned in bytes, such as using byte shift operations for readability.

```go
router := gin.Default()
router.MaxMultipartMemory = 8 << 20 // Limit memory buffer to 8 MiB
```
