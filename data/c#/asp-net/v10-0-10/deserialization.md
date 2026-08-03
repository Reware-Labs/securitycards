# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: deserialization

## deserialization

### Use Cryptographically Protected State Data Formats for Authentication Callbacks

**Use when**

Configuring state parameter serialization and deserialization in `OpenIdConnectHandler` for callback requests.

**Secure rules**

**Rule 1: Ensure OpenIdConnectOptions.StateDataFormat relies on cryptographically signed and encrypted serialization mechanisms to prevent untrusted object deserialization.**

When processing callback requests in `OpenIdConnectHandler`, state tokens received from untrusted incoming request parameters are deserialized using `Options.StateDataFormat.Unprotect`. Developers must ensure custom `StateDataFormat` implementations rely on standard Data Protection-backed `PropertiesDataFormat` to prevent unauthorized tampering or untrusted object deserialization when parsing state.

```csharp
builder.Services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    var dataProtector = builder.Services.BuildServiceProvider()
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("OpenIdConnectState");
    options.StateDataFormat = new PropertiesDataFormat(dataProtector);
});
```
