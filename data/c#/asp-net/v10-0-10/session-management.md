# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: session management

## session management

### Configure Secure Cookie Attributes and Server-Side Session Stores

**Use when**

When configuring authentication cookies, cookie security policies, and server-side ticket storage for sessions.

**Secure rules**

**Rule 1: Enforce HTTPS cookie security policies in production environments.**

Configure `CookieSecurePolicy` to `Always` so that authentication cookies are explicitly marked with the `Secure` attribute and are protected from unencrypted transmission.

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "__Host-AuthCookie";
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
    });
```

**Rule 2: Use a server-side SessionStore to enforce centralized session revocation.**

Configure `CookieAuthenticationOptions.SessionStore` with a custom `ITicketStore` implementation to track session keys on the server and immediately invalidate them during global sign-out or session expiration.

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.SessionStore = builder.Services.BuildServiceProvider().GetRequiredService<ITicketStore>();
        options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
        options.SlidingExpiration = true;
    });
```


### Validate Security Stamps and Update Session Sign-Ins

**Use when**

When managing authenticated user sessions, handling sign-outs, or performing user state updates that require immediate session invalidation.

**Secure rules**

**Rule 1: Validate user security stamps to immediately invalidate revoked or expired sessions.**

Call `ValidateSecurityStampAsync` when processing session principals to check if the security stamp has changed after credential changes or revocations. Configure `SecurityStampValidatorOptions` to set an appropriate validation interval.

```csharp
ClaimsPrincipal userPrincipal = httpContext.User;
var user = await signInManager.ValidateSecurityStampAsync(userPrincipal);
if (user == null)
{
    await signInManager.SignOutAsync();
}
```

**Rule 2: Use RefreshSignInAsync exclusively for the currently authenticated user session updates.**

Verify that `RefreshSignInAsync` is only used to refresh session state for a user who is already authenticated, rather than for initial user logins or account switching.

```csharp
var user = await userManager.GetUserAsync(User);
await userManager.UpdateAsync(user);
await signInManager.RefreshSignInAsync(user);
```

**Rule 3: Invalidate refresh tokens and active sessions using security stamp updates.**

Update the user security stamp using `UserManager.UpdateSecurityStampAsync` during sensitive security events such as password changes or revoking active user sessions.

```csharp
await userManager.UpdateSecurityStampAsync(user);
```
