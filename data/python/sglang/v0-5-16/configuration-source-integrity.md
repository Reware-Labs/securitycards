# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: configuration source integrity

## configuration source integrity

### Enforce Strict Configuration Mutation Guards and Immutable Server Arguments

**Use when**

Configuring server parameters or implementing custom model overrides during SGLang initialization and runtime updates.

**Secure rules**

**Rule 1: Enable strict configuration mutation guards to prevent post-resolution attribute modification**

Set the `SGLANG_STRICT_CONFIG_MUTATION` environment variable to `1` so that direct post-resolution mutations on `ServerArgs` attributes raise exceptions. Use the `ServerArgs.override` method instead of direct attribute mutation when runtime updates are required.

```python
import os
os.environ["SGLANG_STRICT_CONFIG_MUTATION"] = "1"

# Use ServerArgs.override() instead of direct attribute mutation
server_args.override("runtime_update", disable_radix_cache=True)
```

**Rule 2: Return declarative dictionaries for custom model overrides without mutating pristine configurations.**

When extending SGLang with custom model overrides or configuration passes, return dictionary declarations through registration functions like `@register_model_override` rather than attempting to directly mutate `server_args` or `ResolvedView` objects, which enforce read-only access.

```python
from sglang.srt.arg_groups.overrides import register_model_override

@register_model_override("CustomModelForCausalLM")
def _custom_model_overrides(server_args, hf_config):
    if server_args.is_attention_backend_not_set():
        return {"attention_backend": "flashinfer"}
    return {}
```
