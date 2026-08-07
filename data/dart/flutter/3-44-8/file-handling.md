# Security cards

Repository: `https://github.com/flutter/flutter#3.44.8`
Category: file handling

## file handling

### Use Exclusive Mode for Safe File Creation

**Use when**

When creating temporary or sensitive files on disk to prevent overwriting pre-existing files or following malicious symlinks.

**Secure rules**

**Rule 1: Use exclusive file creation mode to ensure file creation is atomic and fails if the target path already exists.**

When creating secure files on disk, set the `exclusive` parameter to true during file creation so that the operation fails safely if the target path already exists, protecting against symlink attacks and file overwrites.

```dart
final File file = fileSystem.file('/path/to/secure_file.dat');
file.createSync(exclusive: true);
```
