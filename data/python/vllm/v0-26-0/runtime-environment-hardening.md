# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: runtime environment hardening

## runtime environment hardening

### Disable Development Mode and Administrative Endpoints in Production

**Use when**

Deploying vLLM serving instances to production environments where unprivileged access and reduced attack surface are required.

**Secure rules**

**Rule 1: Ensure developer mode and administrative debug endpoints are disabled in production runtime configurations.**

Do not set `VLLM_SERVER_DEV_MODE=1` in production deployment scripts. Leaving developer mode active exposes high-risk unauthenticated endpoints such as `/collective_rpc`, cache resets, and engine sleep triggers, which allow unauthorized execution of arbitrary RPC methods and compromise operational stability.

```bash
unset VLLM_SERVER_DEV_MODE
vllm serve facebook/opt-125m
```
