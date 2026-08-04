# Security cards

Repository: `https://github.com/ollama/ollama#v0.32.5`
Category: file handling

## file handling

### Enforce Strict File Permissions and Validated Types on Uploads and Configurations

**Use when**

Persisting authentication tokens, backing up configurations, and processing user file uploads or extensions in Ollama.

**Secure rules**

**Rule 1: Create sensitive configuration and token files with restrictive permissions and enforce those permissions when modifying existing files**

Use a restrictive mode such as `0600` when creating sensitive files, and explicitly enforce that mode before overwriting an existing file.

```go
f, err := os.OpenFile(pairedJsonPath, os.O_WRONLY|os.O_CREATE, 0o600)
if err != nil { return err }
defer f.Close()
if err := f.Chmod(0o600); err != nil { return err }
if err := f.Truncate(0); err != nil { return err }
if _, err := f.Write(out); err != nil { return err }
```

**Rule 2: Validate file extensions and types against explicit allowed sets when processing uploads.**

When processing user files in UI components, validate file extensions against explicit allowed sets and custom validation rules to prevent processing unexpected file types or malicious inputs.

```typescript
import { processFiles } from '@/utils/fileValidation';

const options = {
  maxFileSize: 5,
  allowedExtensions: ['pdf', 'txt', 'png', 'jpeg'],
  customValidator: (file: File) => {
    if (file.name.includes('..')) {
      return { valid: false, error: 'Invalid filename' };
    }
    return { valid: true };
  }
};

const result = await processFiles(selectedFiles, options);
```


### Prevent Path Traversal and Enforce Containment during File and Model Operations

**Use when**

Processing user-supplied paths, model directories, tokenizers, skill imports, and output save operations in Ollama.

**Secure rules**

**Rule 1: Resolve symbolic links using `filepath.EvalSymlinks` and ensure local paths stay contained within storage boundaries.**

When processing filesystem paths for model components or files, always resolve symbolic links using `filepath.EvalSymlinks` before opening files to prevent unauthorized access outside expected directories. Ensure paths satisfy containment constraints such as `filepath.IsLocal(rel)` or prefix validation.

```go
realPath, err := filepath.EvalSymlinks(path)
if err != nil {
    return "", err
}
bin, err := os.Open(realPath)
if err != nil {
    return "", err
}
defer bin.Close()
```

**Rule 2: Sanitize path parameters and filenames to prevent directory traversal in file saving and import routines.**

When handling commands that write files to disk or import external assets, sanitize and reject path parameters containing directory traversal sequences (`..`) or directory separators to restrict writes and reads strictly to the intended working directory.

```go
if filepath.Base(filename) != filename || strings.Contains(filename, "..") {
    return fmt.Errorf("invalid path: filename must not contain directory paths")
}
```

**Rule 3: Validate and sanitize model directory paths before invoking tokenizer loading**

If accepting an untrusted model path, resolve symlinks and verify that the resolved path remains within an allowed base before calling `tokenizer.Load`, which reads the supplied file or fixed companion files from the supplied directory.

```go
cleanDir, err := filepath.EvalSymlinks(userProvidedPath)
if err != nil { return nil, err }
trustedBase, err := filepath.EvalSymlinks(trustedModelBaseDir)
if err != nil { return nil, err }
rel, err := filepath.Rel(trustedBase, cleanDir)
if err != nil || !filepath.IsLocal(rel) {
    return nil, fmt.Errorf("unauthorized path access: %s", cleanDir)
}
tok, err := tokenizer.Load(cleanDir)
```
