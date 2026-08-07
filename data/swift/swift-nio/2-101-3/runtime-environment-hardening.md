# Security cards

Repository: `https://github.com/apple/swift-nio#2.101.3`
Category: runtime environment hardening

## runtime environment hardening

### Enable Close-On-Exec for File Descriptors in Subprocess Environments

**Use when**

Configuring runtime file descriptors and open options when the application executes subprocesses to prevent handle leaks.

**Secure rules**

**Rule 1: Set closeOnExec to true when opening file descriptors to restrict resource inheritance in child processes.**

Configure `OpenOptions` instances by explicitly setting `closeOnExec: true` for read, directory, and write operations. This prevents sensitive socket handles and open file descriptors from leaking across `execve` subprocess boundaries.

```swift
let readOptions = OpenOptions.Read(
    followSymbolicLinks: true,
    closeOnExec: true
)

let dirOptions = OpenOptions.Directory(
    followSymbolicLinks: false,
    closeOnExec: true
)
```
