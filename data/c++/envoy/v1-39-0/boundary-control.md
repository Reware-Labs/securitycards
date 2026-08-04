# Security cards

Repository: `https://github.com/envoyproxy/envoy#v1.39.0`
Category: boundary control

## boundary control

### Restrict Envoy Dynamic Modules to Fully Trusted Code

**Use when**

When loading dynamic modules into Envoy that run in-process and share its full privilege level and memory space.

**Secure rules**

**Rule 1: Only load dynamic modules from fully trusted sources and verify ABI compatibility.**

Because dynamic modules run in-process with Envoy without security sandboxing, ensure that you only load binary modules compiled from trusted, code-reviewed source repositories and adhere strictly to memory ownership rules in `abi.h`.

```c
// Verify ABI compatibility and ensure pointers remain valid for their specified lifetime.
typedef const char* envoy_dynamic_module_type_abi_version_module_ptr;

// Module-owned buffers must remain allocated and unmodified for the lifetime expected
// by the specific event hook or callback.
```
