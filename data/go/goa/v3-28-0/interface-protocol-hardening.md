# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: interface protocol hardening

## interface protocol hardening

### Enforce Consistent Path Parameters and Primitive Header Mappings in Goa Protocol Definitions

**Use when**

Use when defining routing, HTTP endpoints, headers, cookies, and gRPC mappings in Goa service design specifications to ensure strict protocol framing and parameter enforcement.

**Secure rules**

**Rule 1: Ensure that all alternative routes mapped to a single Goa endpoint define identical sets of path parameters**

Goa v3.28.0 requires matching path parameters across every route defined for an endpoint.

```go
var _ = Service("ArticleService", func() {
    Method("Show", func() {
        Payload(func() {
            Attribute("category", String)
            Attribute("id", String)
            Required("category", "id")
        })
        HTTP(func() {
            GET("/articles/{category}/{id}")
            GET("/v1/articles/{category}/{id}")
            Params(func() {
                Param("category")
                Param("id")
            })
        })
    })
})
```

**Rule 2: Restrict HTTP response header and cookie mapping to primitive types in Goa design DSL.**

Verify that service result attributes mapped to HTTP response headers or cookies use only scalar primitive types to prevent invalid protocol headers and header injection risks.

```go
var _ = Service("auth", func() {
    Method("login", func() {
        Result(LoginResult)
        HTTP(func() {
            POST("/login")
            Response(StatusOK, func() {
                Header("token:X-Auth-Token")
                Cookie("session_id:session")
            })
        })
    })
})
```

**Rule 3: Map each attribute uniquely to either gRPC metadata or response message bodies without duplication.**

Structure gRPC responses in the DSL so that headers, trailers, and message attributes remain mutually exclusive to avoid protocol parsing inconsistencies and metadata header pollution.

```go
var _ = Service("AccountService", func() {
    Method("GetAccount", func() {
        Result(AccountResult)
        GRPC(func() {
            Response(CodeOK, func() {
                Headers(func() {
                    Attribute("request_id", String, "Unique request identifier")
                })
            })
        })
    })
})
```

**Rule 4: Authenticate JSON-RPC WebSocket connections at handshake or payload level rather than per-endpoint headers.**

Design WebSocket endpoints to handle authentication within the method payload schema or during the initial HTTP GET handshake since persistent connections multiplex multiple requests over a single TCP stream.

```go
var _ = Service("json_rpc_service", func() {
    Meta("jsonrpc:service", "true")
    Method("stream_data", func() {
        StreamingPayload(func() {
            Attribute("token", String, "Authentication token")
            Attribute("data", String)
            Required("token")
        })
    })
})
```
