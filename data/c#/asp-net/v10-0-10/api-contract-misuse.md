# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: api contract misuse

## api contract misuse

### Configure Cookie Lifetime Using ExpireTimeSpan

**Use when**

Configuring cookie authentication options and session lifetimes in ASP.NET Core applications.

**Secure rules**

**Rule 1: Configure cookie session lifetimes using ExpireTimeSpan or AuthenticationProperties.ExpiresUtc instead of the unsupported Cookie.Expiration property.**

Setting `Cookie.Expiration` on `CookieAuthenticationOptions` directly is unsupported and triggers an `OptionsValidationException` at runtime. Instead, set session lifetimes using `ExpireTimeSpan` or `AuthenticationProperties.ExpiresUtc`.

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromDays(14);
        options.SlidingExpiration = true;
    });
```
