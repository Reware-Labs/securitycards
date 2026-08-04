# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: resource exhaustion

## resource exhaustion

### Configure transport and application buffer limits to prevent memory exhaustion

**Use when**

Configuring connection handlers and buffer thresholds in ASP.NET applications to enforce backpressure against slow or malicious clients.

**Secure rules**

**Rule 1: Enforce explicit buffer thresholds on connection endpoints using transport and application max buffer size options.**

Set explicit buffer thresholds using `HttpConnectionDispatcherOptions.TransportMaxBufferSize` and `ApplicationMaxBufferSize` to enforce backpressure on HTTP connection endpoints. When incoming or outgoing pipe data exceeds these limits, asynchronous writes pause until buffered bytes are consumed, preventing attackers from exhausting server memory.

```csharp
app.MapConnectionHandler<MyConnectionHandler>("/myconnection", options =>
{
    options.TransportMaxBufferSize = 65536; // 64 KB limit
    options.ApplicationMaxBufferSize = 65536;
});
```
