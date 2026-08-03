# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: authentication

## authentication

### Configure Strict Token Validation Parameters for JWT and WS-Federation Authentication

**Use when**

Setting up inbound JWT bearer authentication, OpenID Connect flows, or WS-Federation token handlers that require cryptographic verification of signatures, issuers, and audiences.

**Secure rules**

**Rule 1: Configure JWT bearer authentication with an HTTPS authority and the expected audience**

Set `JwtBearerOptions.Authority` to the issuer’s HTTPS base address and `JwtBearerOptions.Audience` to the API’s expected audience. ASP.NET Core (v10.0) will:

* Build the `.well-known/openid-configuration` metadata URL from `Authority`.
* Enforce HTTPS for that metadata unless `RequireHttpsMetadata` is disabled.
* Copy `Audience` into `TokenValidationParameters.ValidAudience` when it is otherwise unset.

These defaults provide complete, standards-based validation; override `TokenValidationParameters` only when you must support non-standard issuers or multiple audiences.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // HTTPS issuer metadata discovery
        options.Authority = builder.Configuration["Api:Authority"];
        // Expected audience for this API
        options.Audience  = builder.Configuration["Api:Audience"];
        // No additional TokenValidationParameters needed for the common case
    });
```

**Rule 2: Enable PKCE for authorization code flows to prevent code interception.**

Ensure `UsePkce` is enabled on `OpenIdConnectOptions` when using the OpenID Connect authorization code flow so that a cryptographically secure code verifier and challenge are utilized.

```csharp
builder.Services.AddAuthentication().AddOpenIdConnect(options =>
{
    options.ResponseType = OpenIdConnectResponseType.Code;
    options.UsePkce = true;
});
```


### Enforce Account Lockout and Client Certificate Validation Controls

**Use when**

Implementing password sign-in controls, identity login endpoints, or mutual TLS transport security connections.

**Secure rules**

**Rule 1: Enable account lockout by passing `lockoutOnFailure: true` to `PasswordSignInAsync`**

If your security policy relies on ASP.NET Core Identity’s account-lockout feature, you must pass `lockoutOnFailure: true` when calling `SignInManager.PasswordSignInAsync`. When this flag is set, failed password attempts increment the user’s access-failed count and can lock the account after the configured threshold; when it is `false`, failures are not counted.

```csharp
// Trigger lockout after the configured number of failed attempts.
var result = await _signInManager.PasswordSignInAsync(
    userName,
    password,
    isPersistent: false,
    lockoutOnFailure: true);

if (result.IsLockedOut)
{
    // Handle locked-out users (for example, show a lockout page).
    return Forbid();
}
```

**Rule 2: Require strict client certificate validation mode on Kestrel endpoints.**

Explicitly set `ClientCertificateMode` to `ClientCertificateMode.RequireCertificate` in `HttpsConnectionAdapterOptions` to enforce client certificate authentication at the transport layer.

```csharp
listenOptions.UseHttps(new HttpsConnectionAdapterOptions
{
    ServerCertificate = serverCertificate,
    ClientCertificateMode = ClientCertificateMode.RequireCertificate
});
```
