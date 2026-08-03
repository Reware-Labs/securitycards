# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: escape hatch

## escape hatch

### Restrict Multimodal Embeddings to Trusted Environments

**Use when**

Configuring the `LLM` engine and managing multimodal inputs where raw pre-computed embedding inputs could bypass media pre-processing validation.

**Secure rules**

**Rule 1: Keep enable_mm_embeds disabled by default and restrict its activation to trusted internal services.**

Do not enable `enable_mm_embeds=True` for public or untrusted API clients. Pre-computed embedding inputs bypass standard media pre-processing validation, and passing malformed embedding tensor shapes can crash the vLLM engine. Ensure `enable_mm_embeds=False` is used unless running in an environment where all inputs originate from trusted users.

```python
from vllm import LLM

# Enable mm embeds only in trusted internal services
llm = LLM(
    model="llava-hf/llava-1.5-7b-hf",
    enable_mm_embeds=True,
)
```
