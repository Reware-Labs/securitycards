# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: network boundary

## network boundary

### Enforce HTTPS Metadata Retrieval for WS-Federation Authentication

**Use when**

Configuring WS-Federation authentication options in production environments to retrieve signing keys and metadata securely.

**Secure rules**

**Rule 1: Maintain RequireHttpsMetadata as true in non-development environments to ensure WS-Federation metadata and signing keys are retrieved over secure TLS connections.**

Always ensure that `RequireHttpsMetadata` is explicitly set to true in non-development environments. Disabling this setting exposes metadata fetch operations to man-in-the-middle attacks where an attacker could modify signing keys or endpoint URLs.

```csharp
builder.Services.AddAuthentication()
    .AddWsFederation(options =>
    {
        options.Wtrealm = "https://myapp.example.com";
        options.MetadataAddress = "https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml";
        options.RequireHttpsMetadata = true;
    });
```
