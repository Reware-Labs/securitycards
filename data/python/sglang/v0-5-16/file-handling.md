# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: file handling

## file handling

### Secure File Paths and Archive Extraction in SGLang

**Use when**

Handling user-influenced file paths, log archives, and storage directories in SGLang applications.

**Secure rules**

**Rule 1: Set explicit extraction filters when unpacking untrusted tar archives**

When extracting tarball archives, set the extraction filter explicitly to `data` when supported by Python's tarfile module to prevent directory traversal attacks.

```python
import tarfile
from pathlib import Path

def extract_tarball(tarball: Path, destination: Path) -> None:
    with tarfile.open(tarball, 'r:gz') as archive:
        if 'data' in tarfile._NAMED_FILTERS:
            archive.extractall(destination, filter='data')
        else:
            raise RuntimeError("Safe tar extraction requires filter='data'")
```

**Rule 2: Restrict file permissions on local storage and cache directories.**

Create dedicated storage directories with restricted POSIX permissions such as `0700` and export environment variables like `SGLANG_HICACHE_NIXL_BACKEND_STORAGE_DIR` to avoid world-writable temporary directories.

```bash
mkdir -p /var/lib/sglang/hicache_storage
chmod 700 /var/lib/sglang/hicache_storage
export SGLANG_HICACHE_NIXL_BACKEND_STORAGE_DIR=/var/lib/sglang/hicache_storage
```

**Rule 3: Validate and canonicalize client-supplied adapter or corpus file paths**

Sanitize and validate requested file paths against a strict directory allowlist and canonicalize paths before loading external corpora or model adapters.

```python
import os

ALLOWED_DIR = "/var/data/corpora"

def safe_add_corpus(tokenizer_manager, corpus_req):
    if corpus_req.file_path:
        real_path = os.path.realpath(corpus_req.file_path)
        if os.path.commonpath([real_path, os.path.realpath(ALLOWED_DIR)]) != os.path.realpath(ALLOWED_DIR):
            raise ValueError("Unauthorized file path provided")
    return tokenizer_manager.add_external_corpus(corpus_req)
```
