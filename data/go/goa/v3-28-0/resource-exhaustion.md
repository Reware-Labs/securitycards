# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: resource exhaustion

## resource exhaustion

### Configure bounded retries and exponential backoff for WebSocket and JSON-RPC streams

**Use when**

Configuring connection retry behaviors and stream options for JSON-RPC WebSocket connections in Goa services.

**Secure rules**

**Rule 1: Do not rely on jsonrpc.WithRetryConfig to prevent reconnection loops**

In v3.28.0, jsonrpc.WithRetryConfig stores values in StreamConfig, but generated WebSocket clients do not consume them.

```go
cfg := jsonrpc.NewStreamConfig(
	jsonrpc.WithRequestTimeout(30*time.Second),
)
```


### Configure explicit HTTP server timeouts and header limits in production

**Use when**

Configuring and deploying Goa HTTP services in production environments to protect against connection resource exhaustion and header memory consumption attacks.

**Secure rules**

**Rule 1: Always configure explicit timeouts and header size limits on `http.Server`.**

Set explicit timeouts including `ReadHeaderTimeout`, `ReadTimeout`, `WriteTimeout`, and `IdleTimeout`, along with a request header size limit via `MaxHeaderBytes` when initializing `http.Server` for Goa HTTP services in production. This prevents Slowloris attacks, hung connection resource exhaustion, and header memory consumption.

```go
server := &http.Server{
    Addr:              ":8080",
    Handler:           mux,
    ReadHeaderTimeout: 10 * time.Second,
    ReadTimeout:       30 * time.Second,
    WriteTimeout:      60 * time.Second,
    IdleTimeout:       120 * time.Second,
    MaxHeaderBytes:    1 << 20, // 1MB
}
```
