# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: network boundary

## network boundary

### Secure API Gateway and Proxy Trust Boundaries for gRPC and HTTP Services

**Use when**

Developing or configuring Goa microservices that sit behind an API gateway, load balancer, or reverse proxy and consume incoming request metadata or forwarding headers.

**Secure rules**

**Rule 1: Explicitly configure gRPC request ID metadata trust and length limits behind API gateways**

When handling gRPC request correlation behind an API gateway or reverse proxy, configure `grpcm.UseXRequestIDMetadataOption(true)` to explicitly trust incoming metadata IDs, and pair it with `grpcm.XRequestMetadataLimitOption` to truncate incoming request IDs to an acceptable boundary length and prevent metadata injection attacks.

```go
import (
	grpcm "goa.design/goa/v3/grpc/middleware"
)

requestIDMiddleware := grpcm.UnaryRequestID(
	grpcm.UseXRequestIDMetadataOption(true),
	grpcm.XRequestMetadataLimitOption(64),
)
```

**Rule 2: Validate trusted proxy context keys before relying on client network identity headers**

Only trust header values extracted via `RequestXForwardedForKey` or `RequestXRealIPKey` when the connection originates from a trusted API gateway IP address stored in `RequestRemoteAddrKey`, or ensure upstream proxies overwrite these headers before reaching the Goa application service.

```go
if remoteAddr, ok := ctx.Value(middleware.RequestRemoteAddrKey).(string); ok && isTrustedProxy(remoteAddr) {
    if forwardedFor, ok := ctx.Value(middleware.RequestXForwardedForKey).(string); ok {
        // Use verified client IP from X-Forwarded-For
    }
}
```


### Specify Secure Schemes and Host Variable Defaults in Server DSL

**Use when**

Defining server and host expressions in the Goa DSL for non-local environments to prevent insecure default transport schemes.

**Secure rules**

**Rule 1: Explicitly define encrypted transport schemes and provide validated default values for host URI variables in your server design.**

When defining `Server` and `Host` expressions in the Goa DSL, explicitly specify encrypted transport schemes such as `https` or `grpcs` for non-local environments. Ensure all URI variables specify primitive types along with explicit default values or enum validation rules to prevent unencrypted fallback and invalid host construction.

```go
var _ = Server("SecureServer", func() {
    Host("production", func() {
        URI("https://{domain}/v1")
        Variable("domain", String, "Host domain", func() {
            Enum("api.example.com", "api-staging.example.com")
            Default("api.example.com")
        })
    })
})
```


### Validate target base URLs and restrict outbound RPC clients to trusted endpoints

**Use when**

Instantiating outbound clients using `url.Parse` and `url.URL.ResolveReference` for HTTP, SSE, or WebSocket requests where target base URLs or endpoint paths are derived from configuration or external inputs.

**Secure rules**

**Rule 1: Validate the URL scheme, hostname, and target IP address prior to issuing requests to prevent server-side request forgery**

Parse the raw base URL using `url.Parse` and explicitly verify that the scheme is restricted to allowed protocols such as `http` or `https`. Confirm that the hostname matches an explicit allowed host list, configure config.HTTPClient.Transport to revalidate every request including redirects and reject disallowed resolved IPs when dialing, and configure config.WSDialer to reject disallowed resolved IPs at connection time before calling harness.NewClient.

```go
parsedURL, err := url.Parse(rawBaseURL)
if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
    return nil, fmt.Errorf("unsupported URL scheme")
}
if !isAllowedHost(parsedURL.Hostname()) {
    return nil, fmt.Errorf("prohibited target host: %s", parsedURL.Hostname())
}
client, err := harness.NewClient(parsedURL.String(), config)
```
