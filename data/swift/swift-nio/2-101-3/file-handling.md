# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: file handling

## file handling

### Enforce Strict File Creation Options and Explicit Permissions

**Use when**

When creating new files or replacing existing files on disk to prevent race conditions, unauthorized access, or partial file materialization.

**Secure rules**

**Rule 1: Specify explicit file permissions when creating files.**

Provide explicit `FilePermissions` when invoking file opening operations with the `.create` option to prevent runtime precondition failures and avoid exposing persistent data to unauthorized local users.

```swift
let path = FilePath("secure_data.txt")
let permissions: FilePermissions = [.ownerRead, .ownerWrite]
let result = directoryFd.open(
    atPath: path,
    mode: .writeOnly,
    options: [.create, .exclusive],
    permissions: permissions
)
```

**Rule 2: Use exclusive file creation and rename flags to prevent destructive race conditions.**

Use `OpenOptions.Write.newFile(replaceExisting: false)` or exclusive destination flags during file renames to guarantee atomic operations and prevent time-of-check to time-of-use race conditions.

```swift
var options = OpenOptions.Write.newFile(replaceExisting: false, permissions: [.ownerReadWrite])
options.followSymbolicLinks = false
```

**Rule 3: Create new files transactionally and roll back writes on error**

When you need to write fresh data, open the path with `OpenOptions.Write.newFile(replaceExisting: false)`.

* The option’s default `transactionalCreation` flag delays materialisation until the handle is closed without error.
* The `withFileHandle` helper automatically closes the handle with `makeChangesVisible: false` if your write block throws, so an incomplete file is never left on disk.

```swift
import _NIOFileSystem        // part of Swift NIO

let bytes: [UInt8] = [/* … */]
let safeOptions = OpenOptions.Write.newFile(replaceExisting: false)

try await FileSystem.shared.withFileHandle(
    forWritingAt: "/var/data/new-image.bin",
    options: safeOptions
) { handle in
    // All writes are buffered until successful close.
    try await handle.write(contentsOf: bytes, toAbsoluteOffset: 0)
    // throw here to test rollback behaviour
}
```


### Prevent Symlink Traversal and Enforce File Containment in Untrusted Directories

**Use when**

When opening, copying, or unlinking files and directories within shared, temporary, or user-writable paths where untrusted symbolic links or unauthorized entries might be present.

**Secure rules**

**Rule 1: Prevent automatic symbolic-link resolution when opening files or directories**

When you need to make sure that a path is **not** transparently redirected through a symbolic link (e.g., to avoid unexpected access), set `followSymbolicLinks` to `false` in the corresponding `OpenOptions` variant.
Swift NIO will pass `O_NOFOLLOW` to the underlying `open(2)` call and throw an error if the final component is a symlink.

```swift
import NIOFS
import SystemPackage

// Read-only open that fails if the target is a symbolic link.
var opts = OpenOptions.Read()
opts.followSymbolicLinks = false   // inserts .noFollow

let fdOptions = FileDescriptor.OpenOptions(opts) // contains .noFollow
```

**Rule 2: Validate entry types during recursive directory or file copy operations.**

Utilize the `shouldCopyItem` predicate callback in copy operations to explicitly check entry types and reject dangerous or unsupported items such as FIFOs, sockets, or unwanted symbolic links.

```swift
try await FileSystem.shared.copyItem(
    at: source,
    to: destination,
    strategy: .platformDefault,
    replaceExisting: false,
    shouldProceedAfterError: { entry, error in throw error },
    shouldCopyItem: { entry, dest in
        return entry.type == .regular || entry.type == .directory
    }
)
```

**Rule 3: Safely remove stale UNIX domain socket files before binding**

When rebinding to a UNIX domain socket, pass **`cleanupExistingSocketFile: true`** to `bind(unixDomainSocketPath:cleanupExistingSocketFile:)`.
Swift NIO will call `BaseSocket.cleanupSocket`, which unlinks the file *only* if it is of socket type and otherwise throws `UnixDomainSocketPathWrongType`, protecting against symlink-based or non-socket deletions.

```swift
import NIOPosix

let group = MultiThreadedEventLoopGroup(numberOfThreads: System.coreCount)
defer { try? group.syncShutdownGracefully() }

let bootstrap = ServerBootstrap(group: group)
// …configure options and childChannelInitializer as needed…

let udsPath = "/tmp/myapp.sock"

do {
    // Remove any stale socket file safely, then bind.
    let channel = try bootstrap
        .bind(unixDomainSocketPath: udsPath,
              cleanupExistingSocketFile: true)
        .wait()

    // Server is now listening on the UDS.
    try channel.closeFuture.wait()
} catch BaseSocket.UnixDomainSocketPathWrongType {
    // Existing file was not a socket – log and abort startup.
}
```
