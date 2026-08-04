# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: cryptography

## cryptography

### Use Authenticated Encryption for Tensorizer Model Serialization

**Use when**

When serializing or deserializing vLLM models and LoRA adapters using Tensorizer and `TensorizerConfig` to prevent unauthorized inspection or theft.

**Secure rules**

**Rule 1: Configure model weight encryption by providing an encryption keyfile to TensorizerConfig.**

When saving or loading model weights and LoRA adapters with Tensorizer, supply an encryption keyfile via `encryption_keyfile` in `TensorizerConfig` to enforce authenticated encryption. Ensure that `libsodium` is installed in your environment to properly support tensor encryption and decryption operations.

```python
from vllm.model_executor.model_loader.tensorizer import TensorizerConfig

tensorizer_config = TensorizerConfig(
    tensorizer_uri="s3://my-bucket/vllm/model.tensors",
    encryption_keyfile="/etc/secrets/tensorizer_encryption.key",
)
```
