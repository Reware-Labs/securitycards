# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: csrf

## csrf

### Validate Authentication State Data and Anti-Forgery Tokens to Prevent CSRF

**Use when**

Configuring authentication handlers, remote identity providers, or processing state-changing form submissions in ASP.NET Core applications.

**Secure rules**

**Rule 1: Protect OpenID Connect request state parameters by relying on standard Data Protection formatting.**

Keep `OpenIdConnectOptions.StateDataFormat` configured with standard Data Protection formatting to protect authentication request state parameters and prevent cross-site request forgery attacks.

```csharp
builder.Services.AddAuthentication().AddOpenIdConnect(options =>
{
    options.CallbackPath = "/signin-oidc";
});
```

**Rule 2: Enforce state correlation token validation in WS-Federation authentication.**

Keep `AllowUnsolicitedLogins` disabled to ensure WS-Federation state correlation tokens are validated on incoming authentication responses, protecting against login CSRF attacks.

```csharp
builder.Services.AddAuthentication()
    .AddWsFederation(options =>
    {
        options.Wtrealm = "urn:my-app";
        options.MetadataAddress = "https://idp.example.com/federationmetadata/2007-06/federationmetadata.xml";
        options.AllowUnsolicitedLogins = false;
    });
```

**Rule 3: Configure secure settings for temporary authentication state cookies.**

Ensure that temporary correlation state cookies maintain secure defaults including `HttpOnly`, `SecurePolicy = CookieSecurePolicy.Always`, and appropriate `SameSite` restrictions to prevent state tampering.

```csharp
builder.Services.AddAuthentication()
    .AddTwitter(options =>
    {
        options.ConsumerKey = builder.Configuration["Authentication:Twitter:ConsumerKey"]!;
        options.ConsumerSecret = builder.Configuration["Authentication:Twitter:ConsumerSecret"]!;
        options.StateCookie.HttpOnly = true;
        options.StateCookie.SecurePolicy = CookieSecurePolicy.Always;
        options.StateCookie.SameSite = SameSiteMode.Lax;
    });
```

**Rule 4: Include valid anti-forgery tokens on programmatic POST requests in Razor Pages.**

When submitting custom or programmatic POST requests to Razor Pages handlers, always retrieve and submit the anti-forgery token in form data along with the anti-forgery cookie to prevent cross-site request forgery.

```csharp
var content = new FormUrlEncodedContent(new Dictionary<string, string>
{
    ["__RequestVerificationToken"] = token,
    ["Email"] = userEmail
});
var request = new HttpRequestMessage(HttpMethod.Post, "/CustomModelTypeModel") { Content = content };
request.Headers.TryAddWithoutValidation("Cookie", $"{cookieKey}={cookieValue}");
```
