# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: interface protocol hardening

## interface protocol hardening

### Restrict CORS Origins to Trusted Domains

**Use when**

Configuring cross-origin resource sharing policies for the vLLM API server to prevent cross-site request abuse.

**Secure rules**

**Rule 1: Specify explicit trusted domain lists using --allowed-origins instead of wildcard configurations.**

Avoid using wildcard origins such as `["*"]`, which allows any website loaded in a user browser to perform cross-origin HTTP requests against the vLLM API server. Instead, explicitly supply a JSON-encoded array of trusted domains to `--allowed-origins`.

```bash
vllm-rs serve \
  --model /path/to/model \
  --allowed-origins '["https://app.example.com", "https://admin.example.com"]' \
  --allowed-methods '["GET", "POST"]'
```
