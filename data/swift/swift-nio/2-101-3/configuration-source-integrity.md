# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: configuration source integrity

## configuration source integrity

### Use System User Database Instead of Environment Variables for Configuration Path Resolution

**Use when**

Resolving home directory paths or security-sensitive configuration file locations within application startup or user session initialization.

**Secure rules**

**Rule 1: Resolve the current user’s home directory from the password database (SPI) instead of relying on environment variables**

`Libc.homeDirectoryFromPasswd()` queries the system user database with `getpwuid_r`, producing a trusted path that cannot be forged through `HOME` or `USERPROFILE`.
Because this API is published under Swift NIO’s **Testing SPI**, add an `@_spi(Testing)` import for `_NIOFileSystem` (or `NIOFileSystem`) before calling it.

```swift
@_spi(Testing) import _NIOFileSystem   // exposes Libc SPI symbols

#if canImport(Darwin) || canImport(Glibc) || canImport(Musl) || canImport(Bionic)
switch Libc.homeDirectoryFromPasswd() {
case .success(let secureHomeDir):
    let configPath = secureHomeDir.appending("config.json")
    // safely use `configPath`
case .failure(let errno):
    // handle lookup failure (log, throw, etc.)
}
#endif
```
