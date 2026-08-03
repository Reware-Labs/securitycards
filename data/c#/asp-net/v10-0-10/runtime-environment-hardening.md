# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: runtime environment hardening

## runtime environment hardening

### Disable detailed authentication exception logging in production

**Use when**

Configuring custom error handlers or authentication event hooks where raw exception details might otherwise be exposed to callers.

**Secure rules**

**Rule 1: Restrict raw authentication exception details to development environments.**

Check `IWebHostEnvironment.IsDevelopment()` before writing exception strings to the HTTP response within authentication event handlers such as `OpenIdConnectEvents.OnAuthenticationFailed`. Return generic error messages in production environments to avoid leaking sensitive system information and internal stack traces.

```csharp
o.Events = new OpenIdConnectEvents()
{
    OnAuthenticationFailed = c =>
    {
        c.HandleResponse();
        c.Response.StatusCode = 500;
        c.Response.ContentType = "text/plain";
        if (Environment.IsDevelopment())
        {
            return c.Response.WriteAsync(c.Exception.ToString());
        }
        return c.Response.WriteAsync("An error occurred processing your authentication.");
    }
};
```


### Restrict Developer Exception Page Middleware to Development Environments

**Use when**

Configuring the application middleware pipeline during bootstrap to handle runtime exceptions safely across different environments.

**Secure rules**

**Rule 1: Conditionally register the developer exception page middleware only when running in the local development environment.**

Exposing detailed diagnostic and debug information outside development provides unauthorized users with an interactive administrative interface containing sensitive runtime values, source code frames, and request headers. Check `builder.Environment.IsDevelopment()` before adding `UseDeveloperExceptionPage`, and ensure production environments use a secure generic error handler instead.

```csharp
if (builder.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
}
```
