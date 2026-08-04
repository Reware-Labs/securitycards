# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: dangerous execution

## dangerous execution

### Disable remote code execution and restrict dynamic inputs in model loading and request parameters

**Use when**

When configuring SGLang server arguments or handling incoming request parameters that could load custom models or execute dynamic processors.

**Secure rules**

**Rule 1: Leave trust_remote_code disabled when loading models from unverified sources.**

Ensure that the `trust_remote_code` configuration argument in `ServerArgs` is set to `False` to prevent automatic execution of arbitrary Python code embedded in Hugging Face Hub model repositories.

```python
from sglang.srt.server_args import ServerArgs

# Secure configuration enforcing default trust_remote_code=False
args = ServerArgs(
    model_path="meta-llama/Llama-2-7b-chat-hf",
    trust_remote_code=False
)
```

**Rule 2: Filter and sanitize custom logit processors against an explicit allowlist**

At the API gateway, allow only exact serialized `custom_logit_processor` values generated with `CustomLogitProcessor.to_str()`; symbolic processor names are not valid SGLang values.

```python
def sanitize_request(
    request_dict: dict, allowed_processors: set[str]
) -> dict:
    if "custom_logit_processor" in request_dict:
        if request_dict["custom_logit_processor"] not in allowed_processors:
            raise ValueError("Unauthorized custom_logit_processor specified")
    return request_dict
```
