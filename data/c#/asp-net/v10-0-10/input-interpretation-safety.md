# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: input interpretation safety

## input interpretation safety

### Normalize Identity Strings for Consistent Lookups

**Use when**

When performing user or role lookups within ASP.NET Core Identity to ensure string representations are consistently normalized.

**Secure rules**

**Rule 1: Apply consistent string normalization to user names and emails prior to executing queries or identity lookups.**

Ensure that identity components rely on `ILookupNormalizer` via standard methods like `FindByNameAsync` or `FindByEmailAsync` so that input variations do not bypass lookup checks or cause account collisions.

```csharp
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

public async Task<ApplicationUser?> FindUserAsync(UserManager<ApplicationUser> userManager, string userInput)
{
    return await userManager.FindByNameAsync(userInput);
}
```
