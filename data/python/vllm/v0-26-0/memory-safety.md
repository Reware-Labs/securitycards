# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: memory safety

## memory safety

### Validate sparse tensor bounds before dense memory conversion

**Use when**

Processing user-supplied sparse COO tensors or prompt embeddings to prevent out-of-bounds memory writes.

**Secure rules**

**Rule 1: Validate sparse tensor index bounds prior to dense conversion operations.**

Ensure that any user-supplied sparse tensors have their index boundaries verified against expected shapes before performing operations like `to_dense()`. Use embedding helpers such as `safe_load_prompt_embeds` or media IO classes to reject out-of-bounds, negative, or extremely large sparse indices.

```python
from vllm.config import ModelConfig
from vllm.renderers.embed_utils import safe_load_prompt_embeds

try:
    loaded_embeds = safe_load_prompt_embeds(model_config, encoded_tensor_bytes)
except (RuntimeError, ValueError) as err:
    pass
```
