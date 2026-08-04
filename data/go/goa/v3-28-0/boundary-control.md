# Security cards

Repository: `https://github.com/goadesign/goa#v3.28.0`
Documentation repository: `https://github.com/goadesign/goa.design#main`
Category: boundary control

## boundary control

### Enforce System Boundary Validation via Generated Endpoints

**Use when**

When routing incoming HTTP and gRPC traffic to service implementations and handling data payloads at the application boundary.

**Secure rules**

**Rule 1: Route all incoming traffic through Goa's generated transport endpoints and servers to enforce automatic boundary validation**

Always wrap your business logic implementation in generated endpoints and servers using `gencalc.NewEndpoints` and `genhttp.New`. This ensures that Goa validates request data against constraints declared in the design before invoking the service method; request bodies using SkipRequestBodyEncodeDecode require application validation.

```go
svc := calc.New()
endpoints := gencalc.NewEndpoints(svc)
mux := goahttp.NewMuxer()
server := genhttp.New(endpoints, mux, goahttp.RequestDecoder, goahttp.ResponseEncoder, nil, nil)
genhttp.Mount(mux, server)
```
