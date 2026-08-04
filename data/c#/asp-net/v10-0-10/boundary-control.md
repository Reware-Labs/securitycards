# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: boundary control

## boundary control

### Secure Client-Side Deep Links and Routing Boundaries

**Use when**

Developing single-page applications or Blazor components that handle client-side deep links, navigation targets, and unmapped route parameters.

**Secure rules**

**Rule 1: Validate external deep link URIs against the application base path before performing navigation.**

Always pass untrusted deep link targets through `NavigationManager.ToBaseRelativePath` to verify they remain within the application boundary before invoking `NavigateTo`, preventing open redirection vulnerabilities.

```csharp
public void SafeDeepLinkNavigate(NavigationManager navManager, string rawDeepLinkTarget)
{
    try
    {
        string relativePath = navManager.ToBaseRelativePath(rawDeepLinkTarget);
        navManager.NavigateTo(relativePath);
    }
    catch (ArgumentException)
    {
        navManager.NavigateTo("/");
    }
}
```
