# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: access control

## access control

### Configure Global Authorization Policies and Fallbacks

**Use when**

When designing or configuring application-wide authorization defaults to ensure unannotated endpoints and default policy checks enforce secure access control standards.

**Secure rules**

**Rule 1: Configure FallbackPolicy in AuthorizationOptions to enforce authorization rules globally across all endpoints and unmapped requests.**

By default, ASP.NET Core `DefaultPolicy` is only evaluated when an endpoint is explicitly decorated with `[Authorize]`. Use `AuthorizationOptions.FallbackPolicy` to enforce baseline rules such as `RequireAuthenticatedUser()` across all unmapped and unannotated requests.

```csharp
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});
```

**Rule 2: Ensure DefaultPolicy matches fallback security requirements to prevent lowering protection on authorized routes.**

Endpoints marked with `[Authorize]` evaluate `DefaultPolicy` rather than `FallbackPolicy`. Ensure that `DefaultPolicy` is configured with baseline security requirements at least as strict as your fallback policy.

```csharp
builder.Services.AddAuthorization(options =>
{
    var defaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.DefaultPolicy = defaultPolicy;
    options.FallbackPolicy = defaultPolicy;
});
```


### Enforce Route and Controller Level Authorization Filters and Conventions

**Use when**

When implementing route-level, controller-level, or folder-level authorization restrictions and combining global filters with individual endpoint attributes.

**Secure rules**

**Rule 1: Ensure UseAuthorization is placed after UseRouting in the request pipeline.**

`AuthorizationMiddleware` inspects endpoint metadata attached during routing. If invoked prior to routing resolution via `UseRouting()`, endpoint authorization attributes and policies will not be evaluated, causing route-level authorization policies to be skipped.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization(); // Must be invoked after UseRouting

app.MapControllers();
app.Run();
```

**Rule 2: Apply folder authorization conventions relative to the Razor Pages root directory.**

When configuring Razor Pages with custom base paths, apply authorization conventions such as `AuthorizeFolder` relative to the configured root directory and ensure page model attributes do not unintentionally override folder restrictions.

```csharp
builder.Services.AddRazorPages(options =>
{
    options.Conventions.AuthorizeFolder("/Admin");
    options.Conventions.AuthorizeAreaFolder("Accounts", "/RequiresAuth");
});
```
