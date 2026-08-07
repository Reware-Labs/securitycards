# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: access control

## access control

### Enforce Strict File Permissions and Ownership Checks

**Use when**

Creating or modifying files and directories, or inspecting file metadata for authorization and permission checks in Swift NIO.

**Secure rules**

**Rule 1: Set explicit restrictive permissions when creating files or directories to prevent unauthorized local access.**

Always explicitly specify restrictive permissions such as `.ownerReadWrite` or `FilePermissions(rawValue: 0o700)` when creating directories or files that store sensitive data, configuration, keys, or internal application state, avoiding default umask settings.

```swift
let writeOptions = OpenOptions.Write.newFile(
    replaceExisting: false,
    permissions: [.ownerRead, .ownerWrite]
)
```

**Rule 2: Use normalized portable FileInfo properties for authorization and ownership validation.**

When verifying file system metadata to enforce authorization and ownership, inspect normalized portable fields like `fileInfo.userID` on `FileInfo` rather than platform-specific status structures to avoid authorization bypasses.

```swift
let fileInfo: FileInfo = try await fileSystem.info(for: filePath)
guard fileInfo.userID.rawValue == expectedOwnerUID else {
    throw FileAccessError.unauthorizedOwner
}
```

**Rule 3: Modify permissions on active file handles to prevent TOCTOU race conditions.**

Use descriptor-backed permission modification APIs such as `replacePermissions` on active `SystemFileHandle` instances instead of modifying permissions by string path.

```swift
try await handle.replacePermissions(.ownerReadWrite)
```
