# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: configuration source integrity

## configuration source integrity

### Secure configuration sources and restrict unauthorized overrides for authentication and token validation parameters

**Use when**

Binding authentication, WS-Federation, JWT bearer token validation options, or Kestrel configurations from external or file-based configuration providers.

**Secure rules**

**Rule 1: Accept security-critical options only from trusted configuration**

Keep `JwtBearerOptions.RequireHttpsMetadata` at its secure default (**true**) and prevent untrusted configuration sources (for example, environment variables) from enabling permissive features like unconditional Forwarded Headers. Reject startup when `ASPNETCORE_FORWARDEDHEADERS_ENABLED` (or `ForwardedHeaders_Enabled`) is set outside a controlled deployment script.

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. Identity tokens – always fetch metadata over HTTPS.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = builder.Configuration["Auth:Authority"];
        o.RequireHttpsMetadata = true;          // don’t allow dev-only overrides in prod
    });

// 2. Edge server – refuse permissive proxy settings from env/config.
if (builder.Environment.IsProduction() &&
    string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_FORWARDEDHEADERS_ENABLED"), "true",
        StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "ForwardedHeaders must be enabled explicitly in code with KnownProxies; " +
        "the ASPNETCORE_FORWARDEDHEADERS_ENABLED environment variable is not allowed.");
}

var app = builder.Build();
app.Run();
```
