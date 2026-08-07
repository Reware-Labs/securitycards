# Security cards

Repository: `https://github.com/protocolbuffers/protobuf#v35.1`
Category: configuration source integrity

## configuration source integrity

### Sanitize Environment Variables for Code Generator Configuration Sources

**Use when**

Configuring protocol buffer code generators in automated or multi-tenant build environments that read options from environment variables.

**Secure rules**

**Rule 1: Clear untrusted Objective-C generator environment variables before invoking `protoc`**

The Objective-C code generator (`--objc_out`) in **Protobuf v35.1** changes its behaviour based on environment variables. Inherited or attacker-supplied values can suppress output or make the compiler read arbitrary paths:

* `GPB_OBJC_SKIP_IMPLS_FILE` – absolute path to a file whose contents tell the generator which `.proto` implementations to skip.
* `GPB_OBJC_HEADERS_ONLY` – if present, the generator emits headers only and omits `.m` sources.

Always launch `protoc` with these variables **unset** or set to trusted, validated values. Prefer deterministic `--objc_opt` parameters instead of environment variables whenever possible.

```cpp
// Sanitize environment before spawning protoc
unsetenv("GPB_OBJC_SKIP_IMPLS_FILE");
unsetenv("GPB_OBJC_HEADERS_ONLY");

// (Optional) provide a vetted allow-list instead of inheriting an unknown path.
setenv("GPB_OBJC_SKIP_IMPLS_FILE",
       "/build/proto/skip_impls_allowlist.txt",
       /*overwrite=*/1);

// execve("protoc", argv, environ);
```
