# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: output encoding

## output encoding

### HTML encode untrusted user input before rendering manual HTML responses

**Use when**

When writing untrusted data or request query parameters directly into HTTP HTML response bodies in custom middleware or endpoint handlers.

**Secure rules**

**Rule 1: Sanitize or encode untrusted content using HtmlEncoder.Default.Encode to prevent Cross-Site Scripting (XSS).**

Always use `HtmlEncoder.Default.Encode()` or built-in Razor and framework view engines which perform automatic output encoding before injecting untrusted dynamic strings into HTML markup. This ensures that user-supplied identity names or query parameters like `ReturnUrl` are safely encoded and cannot execute arbitrary JavaScript in the user's browser.

```csharp
string safeUser = HtmlEncoder.Default.Encode(context.User.Identity.Name);
string safeReturnUrl = HtmlEncoder.Default.Encode(context.Request.Query["ReturnUrl"]);
await context.Response.WriteAsync($"<h1>Access Denied for user {safeUser} to resource '{safeReturnUrl}'</h1>");
```
