# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: output encoding

## output encoding

### Use String or Bytes types for HTML and plain text HTTP responses

**Use when**

Defining HTTP responses with a `Content-Type` of `text/html` or `text/plain` in Goa service designs.

**Secure rules**

**Rule 1: Define response bodies and service results strictly as `String` or `Bytes` when configuring `text/html` or `text/plain` content types.**

When explicitly defining HTTP responses with a `Content-Type` of `text/html` or `text/plain`, ensure the response body or service result type is defined strictly as `String` or `Bytes` unless `SkipRequestBodyEncodeDecode` or `SkipResponseBodyEncodeDecode` is enabled. Goa's validation logic enforces that structured object types cannot be used directly with plain text or HTML content types.

```go
var _ = Service("web", func() {
    Method("render", func() {
        Result(String)
        HTTP(func() {
            GET("/html")
            Response(StatusOK, func() {
                ContentType("text/html")
            })
        })
    })
})
```
