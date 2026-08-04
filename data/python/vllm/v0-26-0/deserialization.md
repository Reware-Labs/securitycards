# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: deserialization

## deserialization

### Restrict Insecure Serialization Configurations

**Use when**

Configuring deployment environments and environment variables for vLLM to handle untrusted requests safely.

**Secure rules**

**Rule 1: Keep insecure serialization flags disabled in production and untrusted environments.**

Ensure that the `VLLM_ALLOW_INSECURE_SERIALIZATION` environment variable remains explicitly disabled or set to `0` to prevent arbitrary object deserialization and remote code execution vulnerabilities.

```bash
export VLLM_ALLOW_INSECURE_SERIALIZATION="0"
```
