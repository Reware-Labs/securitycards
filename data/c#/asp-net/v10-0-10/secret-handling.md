# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: secret handling

## secret handling

### Clean up temporary secret buffers and restrict token storage exposure

**Use when**

Handling temporary key derivation buffers, XML secret arrays, temporary certificate files, and authentication tokens in ASP.NET Core.

**Secure rules**

**Rule 1: Explicitly clear temporary secret byte buffers and key material inside finally blocks.**

Ensure temporary cryptographic key buffers, derived subkeys, and XML secret byte arrays are wiped using `Span<byte>.Clear()` or `Array.Clear()` inside `finally` blocks immediately after execution.

```csharp
Span<byte> derivedKey = stackalloc byte[32];
try
{
    // Perform key derivation and cryptographic operations
}
finally
{
    derivedKey.Clear();
}
```

**Rule 2: Delete temporary certificate files immediately after use in try-finally blocks.**

Wrap temporary certificate files created during import or verification routines in `try-finally` blocks to guarantee prompt file deletion and prevent disk leakage of sensitive files.

```csharp
string tmpFile = Path.GetTempFileName();
try
{
    ExportCertificate(cert, tmpFile, includePrivateKey: false, password: null, CertificateKeyExportFormat.Pem);
}
finally
{
    if (File.Exists(tmpFile))
    {
        File.Delete(tmpFile);
    }
}
```


### Load and store secrets using secure configuration and encryption providers

**Use when**

Configuring application authentication secrets, cryptographic signing keys, and Data Protection master keys in ASP.NET Core.

**Secure rules**

**Rule 1: Load sensitive credentials and application secrets from secure configuration providers rather than embedding plaintext values in source code.**

Always retrieve credentials like OAuth app secrets, Twitter consumer secrets, and Kestrel certificate passwords dynamically from secure sources such as Environment Variables, User Secrets, or Azure Key Vault rather than hardcoding them in source files or `appsettings.json`.

```csharp
builder.Services.AddAuthentication()
    .AddFacebook(options =>
    {
        options.AppId = builder.Configuration["Authentication:Facebook:AppId"]!;
        options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]!;
    });
```

**Rule 2: Protect persisted Data Protection master keys and XML descriptors with at-rest encryption.**

Ensure master keys stored in XML key descriptors or written to file systems are encrypted at rest by invoking configuration methods like `ProtectKeysWithCertificate` or `ProtectKeysWithDpapi`.

```csharp
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(@"/etc/keys"))
    .ProtectKeysWithDpapi();
```

**Rule 3: Base64 encode symmetric JWT signing keys specified in configuration.**

Ensure any symmetric JWT signing key specified via configuration sections has its value encoded as a valid Base64 string because the binder uses `Convert.FromBase64String` during parsing.

```json
{
  "Authentication": {
    "Schemes": {
      "Bearer": {
        "ValidIssuer": "https://auth.example.com",
        "SigningKeys": [
          {
            "Issuer": "https://auth.example.com",
            "Value": "k3X8v9M0...Base64EncodedSymmetricKeyMaterial..."
          }
        ]
      }
    }
  }
}
```


### Redact and Restrict Sensitive Logging and Telemetry Data

**Use when**

Use when configuring logging, telemetry, or diagnostic output levels across ASP.NET Core middleware, authentication handlers, and client connections to prevent the disclosure of tokens, cookies, secrets, and telemetry metadata.

**Secure rules**

**Rule 1: Disable framework telemetry metadata in OpenID Connect requests to avoid leaking client information.**

Set `DisableTelemetry` to true when configuring `OpenIdConnectOptions` to prevent sending SDK version and platform metadata to remote identity providers.

```csharp
builder.Services.AddAuthentication()
    .AddOpenIdConnect(options =>
    {
        options.ClientId = "your-client-id";
        options.Authority = "https://idp.example.com";
        options.DisableTelemetry = true;
    });
```

**Rule 2: In production, set the default log level to `Warning` (or higher) and rely on HTTP-logging redaction to keep credentials out of the logs**

Large volumes of **Trace**, **Debug**, or **Information** entries can leak data and inflate storage costs. Configure the default log level to **Warning** (or higher) for production deployments, then enable `HttpLogging` without opting-in sensitive headers—values that aren’t whitelisted are automatically shown as `[Redacted]`.

```csharp
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Limit noise in production
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Warning);
}

// HTTP logging with built-in redaction (header values are redacted
// unless their names are added to RequestHeaders / ResponseHeaders)
builder.Services.AddHttpLogging();

var app = builder.Build();
app.UseHttpLogging();

app.MapGet("/", () => "Hello, secure logs!");
app.Run();
```

**Rule 3: Omit raw cookie values and sensitive payload properties from structured log events.**

Log only non-sensitive key names, identifiers, and configuration parameters using structured logging attributes instead of capturing raw cookie values or authentication tokens.

```csharp
[LoggerMessage(5, LogLevel.Debug, "Cookie '{key}' suppressed due to consent policy.", EventName = "CookieSuppressed")]
public static partial void CookieSuppressed(this ILogger logger, string key);
```
