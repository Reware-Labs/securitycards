# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: input driven boundary selection

## input driven boundary selection

### Validate model parameter formats when overriding lora path adapters

**Use when**

When accepting client-provided model strings or adapter specifications in OpenAI-compatible serving interfaces.

**Secure rules**

**Rule 1: Validate and allowlist client-selected LoRA adapter names before routing to SGLang serving instances**

Sanitize model parameters to prevent unauthorized selection of already loaded LoRA adapters when untrusted clients use the `base-model:adapter-name` syntax. Check the model string for embedded adapter parameters and verify them against an explicit allowlist of permitted adapters.

```python
ALLOWED_ADAPTERS = {"sql-expert", "python-expert"}

def sanitize_model_request(model_param: str) -> str:
    if ":" in model_param:
        base_model, adapter = model_param.split(":", 1)
        adapter = adapter.strip()
        if adapter and adapter not in ALLOWED_ADAPTERS:
            raise ValueError(f"Access to adapter '{adapter}' is not allowed.")
    return model_param
```
