# Security cards

Repository: `https://github.com/psf/requests#v2.34.2`
Category: file handling

## file handling

### Use atomic file opening for safe file creation and updates

**Use when**

Writing or updating files on disk to prevent race conditions or partially written data exposure.

**Secure rules**

**Rule 1: Use atomic_open() when creating or updating files on disk to safely write data to a secure temporary file before atomically replacing the destination path.**

Always use `atomic_open()` when writing files to disk so that data is written to a secure temporary location first and only replaces the final destination upon successful completion. This prevents race conditions and exposure of partially written files during concurrent operations or application crashes.

```python
from requests.utils import atomic_open

with atomic_open('/path/to/target_file.txt') as handle:
    handle.write(b'sensitive data content')
```
