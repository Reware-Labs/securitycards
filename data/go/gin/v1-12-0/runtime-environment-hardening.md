# Security cards

Repository: `https://github.com/gin-gonic/gin#v1.12.0`
Category: runtime environment hardening

## runtime environment hardening

### Configure Gin to Release Mode in Production

**Use when**

initializing the Gin application engine for a production environment to disable internal debugging outputs.

**Secure rules**

**Rule 1: Set Gin execution mode to release mode before instantiating the router engine.**

Explicitly configure Gin's execution mode to `gin.ReleaseMode` by invoking `gin.SetMode(gin.ReleaseMode)` or by setting the `GIN_MODE=release` environment variable during application startup. Avoid running production servers in `DebugMode` to prevent leaking sensitive application internal information, full route tables, file system paths, and internal error details to standard output.

```go
func main() {
    gin.SetMode(gin.ReleaseMode)
    router := gin.New()
    // ... register middleware and routes
}
```
