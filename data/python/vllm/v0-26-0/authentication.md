# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: authentication

## authentication

### Enforce API key authentication for the OpenAI API server

**Use when**

Deploying and starting the vLLM OpenAI API server to ensure incoming requests are authenticated.

**Secure rules**

**Rule 1: Configure an API key using the environment variable or CLI argument so that incoming requests require authentication.**

The vLLM OpenAI API server requires an API key to be explicitly provided through the `VLLM_API_KEY` environment variable or the `--api-key` argument. Without this configuration, the server defaults to unauthenticated access across all exposed API endpoints. Set the environment variable before starting the server to verify client identities and prevent unauthorized access.

```bash
export VLLM_API_KEY="secret-api-key-token"
python -m vllm.entrypoints.openai.api_server --model facebook/opt-125m
```
