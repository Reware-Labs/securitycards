# Security cards

Repository: `https://github.com/run-llama/llama_index#v0.14.23`
Category: dangerous execution

## dangerous execution

### Disable Remote Code Execution When Loading Untrusted Models

**Use when**

Configuring model loaders and initializers where custom scripts or remote execution mechanisms might be enabled.

**Secure rules**

**Rule 1: Set trust_remote_code to False to prevent loading arbitrary code from model repositories.**

When configuring model parameters for model initializers like `GaudiLLM`, ensure `trust_remote_code` is set to `False` unless loading from a thoroughly vetted repository. Enabling remote code execution allows custom scripts hosted on repository hubs to run arbitrary code on the host execution environment.

```python
args = AttributeContainer(
    device="hpu",
    model_name_or_path="meta-llama/Meta-Llama-3-8B-Instruct",
    trust_remote_code=False
)

llm = GaudiLLM(
    args=args,
    model_name="meta-llama/Meta-Llama-3-8B-Instruct",
    tokenizer_name="meta-llama/Meta-Llama-3-8B-Instruct"
)
```
