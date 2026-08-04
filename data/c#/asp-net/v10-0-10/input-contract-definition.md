# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: input contract definition

## input contract definition

### Enforce Strict Input Validation and ModelState Checks for Model Binding

**Use when**

Use when binding user requests to controllers or minimal APIs, updating models via `TryUpdateModelAsync`, or validating hierarchical and complex model properties.

**Secure rules**

**Rule 1: Annotate action parameters and model properties with validation attributes to enforce strict parameter validation contracts during model binding.**

Apply `[Required]`, `[Range]`, and `[BindRequired]` directly to endpoint parameters and model properties. Always verify `ModelState.IsValid` before executing any business logic to ensure malformed input is rejected.

```csharp
[HttpPost]
public IActionResult CreateTransfer([FromBody] TransferInfo transferInfo)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    return Ok();
}
```

**Rule 2: Whitelist properties with `TryUpdateModelAsync` and verify the result**

When binding request data into an existing model, call the **public** `TryUpdateModelAsync` on `ControllerBase` (or `PageModel`).
Pass one or more `includeExpressions` to restrict updates to known-safe properties, and check the boolean result before continuing.

```csharp
// Inside a controller action
var user = await _db.Users.FindAsync(id);
if (user is null) return NotFound();

// Bind only the allowed fields from form / JSON input.
if (!await TryUpdateModelAsync(
        user,
        prefix: "",                // no prefix
        u => u.DisplayName,        // whitelisted properties
        u => u.Email))
{
    return BadRequest(ModelState); // binding or validation failed
}

await _db.SaveChangesAsync();
return Ok(user);
```

**Rule 3: Disable empty body model binding defaults when strict body payloads are required.**

Configure `MvcOptions.AllowEmptyInputInBodyModelBinding` to false to ensure missing request body payloads generate model validation errors rather than evaluating to default null models.

```csharp
builder.Services.AddControllers(options =>
{
    options.AllowEmptyInputInBodyModelBinding = false;
});
```

**Rule 4: Evaluate validation state for complex or nested inputs using GetFieldValidationState or ModelState.IsValid.**

Use `ModelState.GetFieldValidationState` to inspect parent object boundaries and aggregate child property validation errors instead of relying on direct indexer lookups.

```csharp
if (ModelState.GetFieldValidationState("user") == ModelValidationState.Invalid)
{
    return BadRequest(ModelState);
}
```

**Rule 5: Never reset or skip a model field that is already invalid**

After a key in `ModelStateDictionary` is marked **invalid** (for example by `AddModelError`), calling `MarkFieldValid` or `MarkFieldSkipped` for that key throws `InvalidOperationException`. Transition fields only from *Unvalidated* (or *Skipped*) to *Valid* or *Skipped*—never from *Invalid*.

```csharp
// Example validation step
if (!IsValidEmail(input.Email))
{
    modelState.AddModelError("Email", "Invalid email address.");
}

// Safe state change: act only if the field isn’t already invalid
if (modelState.GetValidationState("Email") == ModelValidationState.Unvalidated)
{
    modelState.MarkFieldValid("Email");   // Allowed
}

// This would throw because "Email" is currently Invalid
// modelState.MarkFieldSkipped("Email");
```


### Secure Model Data Binding and Prevent Mass Assignment

**Use when**

Use when configuring model binding, request parameters, and property mappings in ASP.NET Core controllers and Razor Pages to protect against over-posting, parameter pollution, and uninitialized binding states.

**Secure rules**

**Rule 1: Protect sensitive model properties against mass assignment by explicitly excluding them with `[BindNever]` or using dedicated DTOs.**

Complex object model binding automatically matches request form and query keys to public model properties. To prevent over-posting or mass-assignment attacks where clients supply untrusted values for sensitive properties like `IsAdmin` or `Role`, explicitly mark internal or non-updateable properties with `[BindNever]` or use input-specific DTOs.

```csharp
public class UserEditModel
{
    public string DisplayName { get; set; }

    [BindNever]
    public bool IsAdmin { get; set; }
}

[HttpPost]
public async Task<IActionResult> EditUser(UserEditModel model)
{
    if (!ModelState.IsValid)
    {
        return BadRequest(ModelState);
    }
    return Ok();
}
```

**Rule 2: Apply validation attributes (for example `[Required]`) to `FromBody` DTOs and reject requests when `ModelState` is invalid**

When an action receives JSON or XML data through an **input formatter** (`[FromBody]`), use data-annotation attributes such as `System.ComponentModel.DataAnnotations.RequiredAttribute` to mark mandatory fields. Attributes like `[BindRequired]` don’t run for body-bound data. Always check `ModelState.IsValid` before processing the request to prevent default or empty objects.

```csharp
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

public class UserProfileRequest
{
    // This field must be present and non-null in the JSON body.
    [Required]
    public string Username { get; set; }
}

[ApiController]
[Route("[controller]")]
public class ProfileController : ControllerBase
{
    [HttpPost("update")]
    public IActionResult Update([FromBody] UserProfileRequest request)
    {
        if (!ModelState.IsValid)
        {
            // Returns 400 with validation problem details.
            return ValidationProblem(ModelState);
        }

        // Safe to proceed – mandatory data supplied.
        return Ok();
    }
}
```

**Rule 3: Enable `SupportsGet` only for idempotent, read-only properties**

`[BindProperty]` binds request data to PageModel properties.
Because its `SupportsGet` flag is **off by default**, Razor Pages won’t copy query-string values into a property unless you explicitly opt-in.
Turn `SupportsGet = true` **only** on properties whose values are safe to expose in the URL and that do **not** mutate server-side state; leave it `false` for anything that adds, edits, or deletes data.

```csharp
public class EditUserModel : PageModel
{
    //POST-only: saves changes to the database, so keep SupportsGet = false
    [BindProperty]                                   // default SupportsGet = false
    public UserInputModel Input { get; set; } = default!;

    //GET-safe: used to filter the list; idempotent and read-only
    [BindProperty(SupportsGet = true)]
    public string? SearchTerm { get; set; }
}
```

**Rule 4: Prevent mass-assignment on getter-only mutable collection properties by using read-only collection types or DTOs.**

Be aware that ASP.NET Core MVC parameter binding automatically populates getter-only mutable collection properties using incoming HTTP request data. To prevent mass-assignment vulnerabilities on internal collections, use explicit read-only collection types like `ReadOnlyCollection<T>` or bind strictly controlled DTOs.

```csharp
public class SafeInputModel
{
    public ReadOnlyCollection<AddressDto> Addresses { get; }
}
```
