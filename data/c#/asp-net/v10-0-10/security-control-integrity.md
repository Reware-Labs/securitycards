# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: security control integrity

## security control integrity

### Maintain Principal and Security Context Synchronization in Authentication Handlers

**Use when**

When managing user authentication tickets, session validation, principal refreshing, or updating identity features during request processing.

**Secure rules**

**Rule 1: Keep HttpContext.User and IAuthenticateResultFeature synchronized when modifying authenticated user identities.**

When mutating identity state during a request, directly update `IAuthenticateResultFeature` so both `HttpContext.User` and the feature state stay synchronized, preventing downstream middleware or authorization handlers from receiving null.

```csharp
var feature = httpContext.Features.Get<IAuthenticateResultFeature>();
if (feature != null)
{
    var newTicket = new AuthenticationTicket(newPrincipal, "CustomScheme");
    feature.AuthenticateResult = AuthenticateResult.Success(newTicket);
}
```

**Rule 2: Preserve principal integrity and avoid clearing user claims during cookie principal renewal.**

When customizing claims during periodic cookie principal renewal via `SecurityStampValidatorOptions.OnRefreshingPrincipal`, ensure `replaceContext.NewPrincipal` is not set to null and retains required user identity claims.

```csharp
builder.Services.Configure<SecurityStampValidatorOptions>(options =>
{
    options.OnRefreshingPrincipal = replaceContext =>
    {
        if (replaceContext.NewPrincipal?.Identity is ClaimsIdentity identity)
        {
            identity.AddClaim(new Claim("last_validated", DateTime.UtcNow.ToString("o")));
        }
        return Task.CompletedTask;
    };
});
```


### Safely Configure Dependency Injection and Component State Services in ASP.NET Core

**Use when**

Use when configuring application dependency injection containers, registering health checks, setting up Blazor component state serializers, or managing service lifetimes.

**Secure rules**

**Rule 1: Resolve instance route-handlers from the request DI scope**

When creating a `RequestDelegate` for an **instance method**, supply a `targetFactory` that pulls the handler from `HttpContext.RequestServices`.
Because the `RequestDelegate` invokes this factory on every call, the handler comes from the request-scoped container, preventing cross-request state leaks and accidental singleton capture.

```csharp
// Register the handler with a scoped (or transient) lifetime.
builder.Services.AddScoped<MyHandler>();

public sealed class MyHandler
{
    private readonly IDataService _data;
    public MyHandler(IDataService data) => _data = data;

    public IResult HandleAsync(int id) => Results.Json(_data.GetById(id));
}

// Build a RequestDelegate that resolves the handler per request.
var method = typeof(MyHandler).GetMethod(nameof(MyHandler.HandleAsync))!;

var rdResult = RequestDelegateFactory.Create(
    method,
    ctx => ctx.RequestServices.GetRequiredService<MyHandler>()  // per-request resolution
);

// Safe to map:
app.MapGet("/items/{id:int}", rdResult.RequestDelegate);
```

**Rule 2: Register strongly-typed custom state serializers directly within the Dependency Injection container**

When using custom serializers for Blazor component state restoration, register `PersistentComponentStateSerializer<T>` implementations in the container to ensure safe, typed dependency resolution rather than unvalidated dynamic reflection.

```csharp
builder.Services.AddSingleton<PersistentComponentStateSerializer<MyCustomData>, MyCustomDataSerializer>();
```

**Rule 3: Explicitly register or annotate endpoint parameters to control route dependency injection.**

Register injected dependencies in the DI container or explicitly annotate endpoint delegate parameters with `[FromServices]` to prevent parameter reflection from misinterpreting services as request body inputs.

```csharp
builder.Services.AddScoped<ITodoService, TodoService>();
app.MapGet("/todos/{id}", ([FromServices] ITodoService todoService, int id) => todoService.GetById(id));
```

**Rule 4: Register all required ASP.NET Core Identity services in the dependency injection container.**

Ensure services such as `ISecurityStampValidator` and `SignInManager<TUser>` are registered in the DI container attached to `HttpContext.RequestServices` before executing cookie principal validation to prevent runtime validation exceptions.

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.Configure<CookieAuthenticationOptions>(IdentityConstants.ApplicationScheme, options =>
{
    options.Events.OnValidatePrincipal = SecurityStampValidator.ValidatePrincipalAsync;
});
```

**Rule 5: Register custom encoder implementations into `IServiceCollection` prior to calling `AddWebEncoders`.**

When registering security controls such as encoders into the dependency injection container, `AddWebEncoders` respects existing service registrations and preserves custom implementations.

```csharp
var serviceCollection = new ServiceCollection();
serviceCollection.AddSingleton<HtmlEncoder, CustomHtmlEncoder>();
serviceCollection.AddWebEncoders();
```

**Rule 6: Isolate persisted state services within scoped dependency injection containers.**

When configuring persistent service state for Blazor components using `AddPersistentService<TService>()`, services must be registered with scoped lifetimes and resolved using per-request or per-circuit async DI scopes to avoid state pollution and cross-session data leakage.

```csharp
builder.Services.AddScoped<IMyService, MyService>();
builder.Services.AddPersistentService<IMyService>(renderMode);

await using var scope = serviceProvider.CreateAsyncScope();
var persistentService = scope.ServiceProvider.GetRequiredService<IMyService>();
```

**Rule 7: Use non-nullable parameter types when injecting required keyed dependencies via `[FromKeyedServices]`.**

Non-nullable keyed service parameters guarantee that ASP.NET Core throws an `InvalidOperationException` if the requested key is not registered in the container, enforcing fail-closed dependency resolution.

```csharp
app.MapGet("/secure", ([FromKeyedServices("authService")] IAuthService auth) => auth.Verify());
```
