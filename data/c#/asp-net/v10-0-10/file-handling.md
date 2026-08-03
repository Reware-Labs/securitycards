# Security cards

Repository: `https://github.com/dotnet/aspnetcore#v10.0.10`
Category: file handling

## file handling

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
