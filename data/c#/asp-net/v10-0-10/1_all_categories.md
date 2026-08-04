# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`

## Category: access control

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


## Category: api contract misuse

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


## Category: authentication

### Configure Strict Token Validation Parameters for JWT and WS-Federation Authentication

**Use when**

Setting up inbound JWT bearer authentication, OpenID Connect flows, or WS-Federation token handlers that require cryptographic verification of signatures, issuers, and audiences.

**Secure rules**

**Rule 1: Configure JWT bearer authentication with an HTTPS authority and the expected audience**

Set `JwtBearerOptions.Authority` to the issuer’s HTTPS base address and `JwtBearerOptions.Audience` to the API’s expected audience. ASP.NET Core (v10.0) will:

* Build the `.well-known/openid-configuration` metadata URL from `Authority`.
* Enforce HTTPS for that metadata unless `RequireHttpsMetadata` is disabled.
* Copy `Audience` into `TokenValidationParameters.ValidAudience` when it is otherwise unset.

These defaults provide complete, standards-based validation; override `TokenValidationParameters` only when you must support non-standard issuers or multiple audiences.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // HTTPS issuer metadata discovery
        options.Authority = builder.Configuration["Api:Authority"];
        // Expected audience for this API
        options.Audience  = builder.Configuration["Api:Audience"];
        // No additional TokenValidationParameters needed for the common case
    });
```

**Rule 2: Enable PKCE for authorization code flows to prevent code interception.**

Ensure `UsePkce` is enabled on `OpenIdConnectOptions` when using the OpenID Connect authorization code flow so that a cryptographically secure code verifier and challenge are utilized.

```csharp
builder.Services.AddAuthentication().AddOpenIdConnect(options =>
{
    options.ResponseType = OpenIdConnectResponseType.Code;
    options.UsePkce = true;
});
```


### Enforce Account Lockout and Client Certificate Validation Controls

**Use when**

Implementing password sign-in controls, identity login endpoints, or mutual TLS transport security connections.

**Secure rules**

**Rule 1: Enable account lockout by passing `lockoutOnFailure: true` to `PasswordSignInAsync`**

If your security policy relies on ASP.NET Core Identity’s account-lockout feature, you must pass `lockoutOnFailure: true` when calling `SignInManager.PasswordSignInAsync`. When this flag is set, failed password attempts increment the user’s access-failed count and can lock the account after the configured threshold; when it is `false`, failures are not counted.

```csharp
// Trigger lockout after the configured number of failed attempts.
var result = await _signInManager.PasswordSignInAsync(
    userName,
    password,
    isPersistent: false,
    lockoutOnFailure: true);

if (result.IsLockedOut)
{
    // Handle locked-out users (for example, show a lockout page).
    return Forbid();
}
```

**Rule 2: Require strict client certificate validation mode on Kestrel endpoints.**

Explicitly set `ClientCertificateMode` to `ClientCertificateMode.RequireCertificate` in `HttpsConnectionAdapterOptions` to enforce client certificate authentication at the transport layer.

```csharp
listenOptions.UseHttps(new HttpsConnectionAdapterOptions
{
    ServerCertificate = serverCertificate,
    ClientCertificateMode = ClientCertificateMode.RequireCertificate
});
```


## Category: boundary control

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


## Category: configuration source integrity

### Secure configuration sources and restrict unauthorized overrides for authentication and token validation parameters

**Use when**

Binding authentication, WS-Federation, JWT bearer token validation options, or Kestrel configurations from external or file-based configuration providers.

**Secure rules**

**Rule 1: Accept security-critical options only from trusted configuration**

Keep `JwtBearerOptions.RequireHttpsMetadata` at its secure default (**true**) and prevent untrusted configuration sources (for example, environment variables) from enabling permissive features like unconditional Forwarded Headers. Reject startup when `ASPNETCORE_FORWARDEDHEADERS_ENABLED` (or `ForwardedHeaders_Enabled`) is set outside a controlled deployment script.

```csharp
var builder = WebApplication.CreateBuilder(args);

// 1. Identity tokens – always fetch metadata over HTTPS.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = builder.Configuration["Auth:Authority"];
        o.RequireHttpsMetadata = true;          // don’t allow dev-only overrides in prod
    });

// 2. Edge server – refuse permissive proxy settings from env/config.
if (builder.Environment.IsProduction() &&
    string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_FORWARDEDHEADERS_ENABLED"), "true",
        StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException(
        "ForwardedHeaders must be enabled explicitly in code with KnownProxies; " +
        "the ASPNETCORE_FORWARDEDHEADERS_ENABLED environment variable is not allowed.");
}

var app = builder.Build();
app.Run();
```


## Category: cryptography

### Configure Authenticated Encryption and Cryptographic Algorithms in ASP.NET Core Data Protection

**Use when**

Configuring cryptographic algorithms, encryption mechanisms, and exception handling for data protection and payload encryption.

**Secure rules**

**Rule 1: Configure Data Protection with approved algorithms and let the framework handle AAD**

Use `UseCryptographicAlgorithms` to select FIPS-approved ciphers.
* **AES-CBC with HMAC** (confidentiality + integrity) – pick a matching `ValidationAlgorithm`.
* **AES-GCM** (built-in authentication) – omit `ValidationAlgorithm`; the property is ignored.

```csharp
// AES-256-CBC with explicit HMAC-SHA-256 validation
builder.Services.AddDataProtection()
    .UseCryptographicAlgorithms(
        new AuthenticatedEncryptorConfiguration
        {
            EncryptionAlgorithm  = EncryptionAlgorithm.AES_256_CBC,
            ValidationAlgorithm  = ValidationAlgorithm.HMACSHA256
        });

// — or — AES-256-GCM (validation built in; no ValidationAlgorithm needed)
builder.Services.AddDataProtection()
    .UseCryptographicAlgorithms(
        new AuthenticatedEncryptorConfiguration
        {
            EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM
        });
// Later: normal protect / unprotect flow.
// Data Protection automatically supplies and checks its own AAD.
var protector = app.Services.GetRequiredService<IDataProtectionProvider>().CreateProtector("sample-purpose");

byte[] ciphertext = protector.Protect("secret"u8.ToArray());
byte[] plaintext  = protector.Unprotect(ciphertext);
```

**Rule 2: Verify the MAC before decrypting and expose only a generic `CryptographicException`**

Always calculate and validate the message-authentication code (HMAC) over the IV and ciphertext — using constant-time comparison — *before* a CBC-mode decryption is attempted. If either the integrity check or the decryption fails, throw a single, generic `CryptographicException` so callers cannot distinguish between padding and authentication errors, blocking padding-oracle attacks.

```csharp
using System;
using System.Security.Cryptography;

byte[] DecryptAuthenticatedPayload(
    byte[] cipherText, byte[] iv, byte[] actualTag,
    ReadOnlySpan<byte> encKey, ReadOnlySpan<byte> macKey)
{
    try
    {
        // 1.  Compute expected HMAC(tag) over IV || ciphertext.
        using var hmac = new HMACSHA256(macKey.ToArray());
        byte[] expectedTag = hmac.ComputeHash(
            Combine(iv, cipherText)); // Combine concatenates the arrays.

        // 2.  Reject tampered data *before* decryption.
        if (!CryptographicOperations.FixedTimeEquals(expectedTag, actualTag))
        {
            throw new CryptographicException("Authentication tag mismatch.");
        }

        // 3.  Proceed to decrypt.
        using var aes = Aes.Create();
        aes.Mode = CipherMode.CBC;
        aes.Padding = PaddingMode.PKCS7;

        using ICryptoTransform decryptor = aes.CreateDecryptor(encKey.ToArray(), iv);
        return decryptor.TransformFinalBlock(cipherText, 0, cipherText.Length);
    }
    catch (Exception)
    {
        // Return a generic failure to avoid oracle disclosures.
        throw new CryptographicException("The payload could not be decrypted or authenticated.");
    }
}
```

**Rule 3: Ensure custom algorithm implementations provide public parameterless constructors and valid key sizes.**

When configuring managed or custom authenticated encryption types, ensure custom `SymmetricAlgorithm` and `KeyedHashAlgorithm` subclasses maintain a public parameterless constructor and use key sizes of at least 128 bits to prevent deserialization failures and weak cryptographic security.

```csharp
builder.Services.AddDataProtection()
    .UseCustomCryptographicAlgorithms(new ManagedAuthenticatedEncryptorConfiguration
    {
        EncryptionAlgorithmType = typeof(System.Security.Cryptography.Aes),
        EncryptionAlgorithmKeySize = 256,
        ValidationAlgorithmType = typeof(System.Security.Cryptography.HMACSHA256)
    });
```


### Restrict Supported WebAuthn Passkey Algorithms

**Use when**

Configuring passkey registration options and security policies in ASP.NET Core Identity.

**Secure rules**

**Rule 1: Configure allowed algorithm predicates for WebAuthn passkey registration.**

Configure the `IdentityPasskeyOptions.IsAllowedAlgorithm` delegate to restrict which public key algorithms are permitted during WebAuthn passkey registration and attestation, ensuring that only strong cryptographic algorithms are accepted.

```csharp
builder.Services.Configure<IdentityPasskeyOptions>(options =>
{
    options.IsAllowedAlgorithm = alg => alg == -7 || alg == -8;
});
```


## Category: csrf

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


## Category: deserialization

### Use Cryptographically Protected State Data Formats for Authentication Callbacks

**Use when**

Configuring state parameter serialization and deserialization in `OpenIdConnectHandler` for callback requests.

**Secure rules**

**Rule 1: Ensure OpenIdConnectOptions.StateDataFormat relies on cryptographically signed and encrypted serialization mechanisms to prevent untrusted object deserialization.**

When processing callback requests in `OpenIdConnectHandler`, state tokens received from untrusted incoming request parameters are deserialized using `Options.StateDataFormat.Unprotect`. Developers must ensure custom `StateDataFormat` implementations rely on standard Data Protection-backed `PropertiesDataFormat` to prevent unauthorized tampering or untrusted object deserialization when parsing state.

```csharp
builder.Services.Configure<OpenIdConnectOptions>(OpenIdConnectDefaults.AuthenticationScheme, options =>
{
    var dataProtector = builder.Services.BuildServiceProvider()
        .GetRequiredService<IDataProtectionProvider>()
        .CreateProtector("OpenIdConnectState");
    options.StateDataFormat = new PropertiesDataFormat(dataProtector);
});
```


## Category: file handling

### Enforce Strict Directory Permissions for Stored Certificates and Keys

**Use when**

Exporting and persisting HTTPS certificates or private key files onto disk storage.

**Secure rules**

**Rule 1: Secure certificate-export directories and files on Unix-like systems**

Before exporting a certificate, be sure the target directory is owner-only (mode `700`) **even if it already exists**, and lock the exported `.pfx` (or `.key`) to owner-read/write (`600`). Otherwise other local users could read private-key material.

```csharp
using System.IO;
using System.Runtime.InteropServices;

var certDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
    ".aspnet", "dev-certs", "https");

const UnixFileMode DirMode  = UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute; // 0700
const UnixFileMode FileMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;                           // 0600

// 1. Ensure the directory exists *and* is restricted
if (!Directory.Exists(certDir))
{
    Directory.CreateDirectory(certDir, DirMode);
}
else
{
    var di = new DirectoryInfo(certDir);
    if ((di.UnixFileMode & ~DirMode) != 0)           // anything beyond 0700?
        di.UnixFileMode = DirMode;                   // tighten it
}

// 2. Write and lock down the certificate file
var pfxPath = Path.Combine(certDir, "certificate.pfx");
File.WriteAllBytes(pfxPath, pfxBytes);

if (!OperatingSystem.IsWindows())
{
    File.SetUnixFileMode(pfxPath, FileMode);
}
```


### Validate and Canonicalize File Paths and Permissions to Prevent Traversal

**Use when**

Developing file providers, handling user-supplied friendly names or subpaths, and persisting sensitive files or certificates in ASP.NET Core applications.

**Secure rules**

**Rule 1: Restrict file system permissions on sensitive data files to the owner on non-Windows systems.**

When persisting sensitive files such as key material or configuration stores on POSIX and Unix environments, explicitly restrict file permissions using `UnixFileMode.UserRead | UnixFileMode.UserWrite` to prevent unauthorized local users or processes from reading or modifying the data.

```csharp
if (!OperatingSystem.IsWindows())
{
    var fileInfo = new FileInfo(keyFilePath);
    fileInfo.UnixFileMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
}
```


## Category: input contract definition

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


## Category: input interpretation safety

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


## Category: interface protocol hardening

### Restrict Access Token Extraction to Appropriate Transport Protocols

**Use when**

Configuring JWT bearer authentication events to extract access tokens from query string parameters for specific network protocols like WebSockets or Server-Sent Events.

**Secure rules**

**Rule 1: Restrict reading access tokens from query string parameters to WebSockets or Server-Sent Events and enforce explicit route path checking.**

When configuring `JwtBearerEvents.OnMessageReceived`, ensure token extraction from the query string is limited strictly to transport protocols where custom HTTP headers cannot be set, such as WebSockets or Server-Sent Events. Validate the target request path using `StartsWithSegments` to prevent exposing tokens across unauthorized endpoints.

```csharp
options.Events = new JwtBearerEvents
{
    OnMessageReceived = context =>
    {
        var accessToken = context.Request.Query["access_token"];
        var path = context.HttpContext.Request.Path;
        if (!string.IsNullOrEmpty(accessToken) &&
            path.StartsWithSegments("/broadcast") &&
            (context.HttpContext.WebSockets.IsWebSocketRequest || context.Request.Headers["Accept"] == "text/event-stream"))
        {
            context.Token = accessToken;
        }
        return Task.CompletedTask;
    }
};
```


### Secure Inter-Process and Inter-Component Communication Channels and IPC Endpoints

**Use when**

Configuring local named pipes, inter-component streaming endpoints, inter-process communication transports, or message dispatchers in ASP.NET applications.

**Secure rules**

**Rule 1: Secure Windows named-pipe endpoints with ACLs and an explicit impersonation level**

For Kestrel’s named-pipe transport on Windows, restrict server access to the intended SID and keep `CurrentUserOnly` true, then connect with a client impersonation level that prevents the server from acting on the caller’s identity.

```csharp
using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;

// ---------- Server configuration ----------
var pipeName = "myapp_pipe";

// Grant the current user full access; no one else.
var sid = WindowsIdentity.GetCurrent().User!;
var security = new PipeSecurity();
security.AddAccessRule(new PipeAccessRule(
    sid,
    PipeAccessRights.ReadWrite | PipeAccessRights.CreateNewInstance,
    AccessControlType.Allow));

builder.WebHost.ConfigureKestrel(k =>
{
    k.ListenNamedPipe(pipeName, opts =>
    {
        opts.CurrentUserOnly = true;   // refuse other users/elevation levels
        opts.PipeSecurity    = security;
    });
});

// ---------- Client connection ----------
using var client = new NamedPipeClientStream(
    serverName: ".",
    pipeName:  pipeName,
    direction: PipeDirection.InOut,
    options:   PipeOptions.Asynchronous | PipeOptions.WriteThrough,
    impersonationLevel: TokenImpersonationLevel.Identification); // server cannot impersonate fully

await client.ConnectAsync();
```

**Rule 2: Verify connection context before handling commands, and configure protocol & buffer limits on raw endpoints**

For IPC or SignalR-style endpoints, ensure a valid context (for example, an attached `PageContext`) exists **before** processing non-bootstrap messages, then constrain the connection with a minimum protocol version and tight application/transport buffer limits to mitigate request tampering and resource-exhaustion attacks.

```csharp
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Connections;
using Microsoft.AspNetCore.Http.Connections;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Raw connection endpoint with strict limits
app.MapConnectionHandler<ChatConnectionHandler>("/chat", options =>
{
    options.MinimumProtocolVersion = 1;          // refuse outdated handshake formats
    options.TransportMaxBufferSize   = 65 * 1024; // back-pressure for outgoing data
    options.ApplicationMaxBufferSize = 65 * 1024; // back-pressure for incoming data
});

app.Run();

// Connection-handler that refuses commands until bootstrap (context attach) succeeded
public sealed class ChatConnectionHandler : ConnectionHandler
{
    public override async Task OnConnectedAsync(ConnectionContext connection)
    {
        if (!connection.Items.TryGetValue("PageContext", out var ctx) || ctx is not PageContext)
        {
            await connection.AbortAsync(new InvalidOperationException(
                "Cannot process IPC messages when no page context is attached."));
            return;
        }

        // …process validated messages…
    }
}
```


## Category: network boundary

### Enforce HTTPS Metadata Retrieval for WS-Federation Authentication

**Use when**

Configuring WS-Federation authentication options in production environments to retrieve signing keys and metadata securely.

**Secure rules**

**Rule 1: Maintain RequireHttpsMetadata as true in non-development environments to ensure WS-Federation metadata and signing keys are retrieved over secure TLS connections.**

Always ensure that `RequireHttpsMetadata` is explicitly set to true in non-development environments. Disabling this setting exposes metadata fetch operations to man-in-the-middle attacks where an attacker could modify signing keys or endpoint URLs.

```csharp
builder.Services.AddAuthentication()
    .AddWsFederation(options =>
    {
        options.Wtrealm = "https://myapp.example.com";
        options.MetadataAddress = "https://idp.example.com/FederationMetadata/2007-06/FederationMetadata.xml";
        options.RequireHttpsMetadata = true;
    });
```


## Category: output encoding

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


## Category: resource exhaustion

### Configure transport and application buffer limits to prevent memory exhaustion

**Use when**

Configuring connection handlers and buffer thresholds in ASP.NET applications to enforce backpressure against slow or malicious clients.

**Secure rules**

**Rule 1: Enforce explicit buffer thresholds on connection endpoints using transport and application max buffer size options.**

Set explicit buffer thresholds using `HttpConnectionDispatcherOptions.TransportMaxBufferSize` and `ApplicationMaxBufferSize` to enforce backpressure on HTTP connection endpoints. When incoming or outgoing pipe data exceeds these limits, asynchronous writes pause until buffered bytes are consumed, preventing attackers from exhausting server memory.

```csharp
app.MapConnectionHandler<MyConnectionHandler>("/myconnection", options =>
{
    options.TransportMaxBufferSize = 65536; // 64 KB limit
    options.ApplicationMaxBufferSize = 65536;
});
```


## Category: runtime environment hardening

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


## Category: secret handling

### Clean up temporary secret buffers and restrict token storage exposure

**Use when**

Handling temporary key derivation buffers, XML secret arrays, temporary certificate files, and authentication tokens in ASP.NET Core.

**Secure rules**

**Rule 1: Explicitly clear temporary secret byte buffers and key material inside finally blocks.**

Ensure temporary cryptographic key buffers, derived subkeys, and XML secret byte arrays are wiped using `Span<byte>.Clear()` or `Array.Clear()` inside `finally` blocks immediately after execution.

```csharp
Span<byte> derivedKey = stackalloc byte[32];
try
{
    // Perform key derivation and cryptographic operations
}
finally
{
    derivedKey.Clear();
}
```

**Rule 2: Delete temporary certificate files immediately after use in try-finally blocks.**

Wrap temporary certificate files created during import or verification routines in `try-finally` blocks to guarantee prompt file deletion and prevent disk leakage of sensitive files.

```csharp
string tmpFile = Path.GetTempFileName();
try
{
    ExportCertificate(cert, tmpFile, includePrivateKey: false, password: null, CertificateKeyExportFormat.Pem);
}
finally
{
    if (File.Exists(tmpFile))
    {
        File.Delete(tmpFile);
    }
}
```


### Load and store secrets using secure configuration and encryption providers

**Use when**

Configuring application authentication secrets, cryptographic signing keys, and Data Protection master keys in ASP.NET Core.

**Secure rules**

**Rule 1: Load sensitive credentials and application secrets from secure configuration providers rather than embedding plaintext values in source code.**

Always retrieve credentials like OAuth app secrets, Twitter consumer secrets, and Kestrel certificate passwords dynamically from secure sources such as Environment Variables, User Secrets, or Azure Key Vault rather than hardcoding them in source files or `appsettings.json`.

```csharp
builder.Services.AddAuthentication()
    .AddFacebook(options =>
    {
        options.AppId = builder.Configuration["Authentication:Facebook:AppId"]!;
        options.AppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]!;
    });
```

**Rule 2: Protect persisted Data Protection master keys and XML descriptors with at-rest encryption.**

Ensure master keys stored in XML key descriptors or written to file systems are encrypted at rest by invoking configuration methods like `ProtectKeysWithCertificate` or `ProtectKeysWithDpapi`.

```csharp
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(@"/etc/keys"))
    .ProtectKeysWithDpapi();
```

**Rule 3: Base64 encode symmetric JWT signing keys specified in configuration.**

Ensure any symmetric JWT signing key specified via configuration sections has its value encoded as a valid Base64 string because the binder uses `Convert.FromBase64String` during parsing.

```json
{
  "Authentication": {
    "Schemes": {
      "Bearer": {
        "ValidIssuer": "https://auth.example.com",
        "SigningKeys": [
          {
            "Issuer": "https://auth.example.com",
            "Value": "k3X8v9M0...Base64EncodedSymmetricKeyMaterial..."
          }
        ]
      }
    }
  }
}
```


### Redact and Restrict Sensitive Logging and Telemetry Data

**Use when**

Use when configuring logging, telemetry, or diagnostic output levels across ASP.NET Core middleware, authentication handlers, and client connections to prevent the disclosure of tokens, cookies, secrets, and telemetry metadata.

**Secure rules**

**Rule 1: Disable framework telemetry metadata in OpenID Connect requests to avoid leaking client information.**

Set `DisableTelemetry` to true when configuring `OpenIdConnectOptions` to prevent sending SDK version and platform metadata to remote identity providers.

```csharp
builder.Services.AddAuthentication()
    .AddOpenIdConnect(options =>
    {
        options.ClientId = "your-client-id";
        options.Authority = "https://idp.example.com";
        options.DisableTelemetry = true;
    });
```

**Rule 2: In production, set the default log level to `Warning` (or higher) and rely on HTTP-logging redaction to keep credentials out of the logs**

Large volumes of **Trace**, **Debug**, or **Information** entries can leak data and inflate storage costs. Configure the default log level to **Warning** (or higher) for production deployments, then enable `HttpLogging` without opting-in sensitive headers—values that aren’t whitelisted are automatically shown as `[Redacted]`.

```csharp
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Limit noise in production
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.SetMinimumLevel(LogLevel.Warning);
}

// HTTP logging with built-in redaction (header values are redacted
// unless their names are added to RequestHeaders / ResponseHeaders)
builder.Services.AddHttpLogging();

var app = builder.Build();
app.UseHttpLogging();

app.MapGet("/", () => "Hello, secure logs!");
app.Run();
```

**Rule 3: Omit raw cookie values and sensitive payload properties from structured log events.**

Log only non-sensitive key names, identifiers, and configuration parameters using structured logging attributes instead of capturing raw cookie values or authentication tokens.

```csharp
[LoggerMessage(5, LogLevel.Debug, "Cookie '{key}' suppressed due to consent policy.", EventName = "CookieSuppressed")]
public static partial void CookieSuppressed(this ILogger logger, string key);
```


## Category: security control integrity

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


## Category: session management

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
