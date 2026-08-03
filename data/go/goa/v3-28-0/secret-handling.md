# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: secret handling

## secret handling

### Load Model Provider Credentials via Environment Variables

**Use when**

Instantiating model clients or initializing services that require third-party API keys or sensitive credentials.

**Secure rules**

**Rule 1: Load API keys from external runtime configuration or environment variables instead of hardcoding them in source files.**

Retrieve sensitive credentials dynamically using `os.Getenv` when configuring client options to prevent exposing API keys in version control systems and generated artifacts.

```go
modelClient, err := openai.New(openai.Options{
    APIKey:       os.Getenv("OPENAI_API_KEY"),
    DefaultModel: "gpt-5-mini",
})
if err != nil {
    panic(err)
}
```


### Secure Distributed Tracing and Protect Sensitive Data in Goa

**Use when**

Configuring distributed tracing, gRPC interceptors, HTTP tracing middleware, or handling request context and logging for Goa microservices.

**Secure rules**

**Rule 1: Exclude sensitive methods and endpoints from distributed trace collection and sampling**

Use `middleware.DiscardFromTrace` with explicit regular expressions when configuring HTTP or gRPC tracing to exclude sensitive endpoints handling authentication tokens, credentials, or confidential payload data from trace generation.

```go
authPathPattern := regexp.MustCompile("^/(auth|login|tokens|credentials)")
traceMiddleware := middleware.Trace(
    middleware.DiscardFromTrace(authPathPattern),
)
```

**Rule 2: Sanitize returned errors before recording in X-Ray interceptors**

Ensure sensitive data in returned errors is omitted, masked, or sanitized before being intercepted by `xray.NewUnaryServer` to prevent leaking confidential data into AWS X-Ray.

```go
xrayInterceptor, err := xray.NewUnaryServer("user-service", "127.0.0.1:2000")
if err != nil {
    log.Fatalf("failed to initialize xray interceptor: %v", err)
}

server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(middleware.UnaryServerTrace(), xrayInterceptor),
)
```

**Rule 3: Filter sensitive context keys before exporting to traces or logs**

Selectively extract non-sensitive identifiers like `middleware.RequestXRequestIDKey` for trace correlation, and explicitly filter out sensitive context keys such as `middleware.RequestAuthorizationKey` and `middleware.RequestXCSRFTokenKey` before exporting metadata to traces or logs.

```go
func RecordTraceMetadata(ctx context.Context, span trace.Span) {
    if reqID, ok := ctx.Value(middleware.RequestXRequestIDKey).(string); ok {
        span.SetAttributes(attribute.String("http.request_id", reqID))
    }
}
```
