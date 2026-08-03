# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: input driven boundary selection

## input driven boundary selection

### Isolate prefix caching across tenants using unique cache salts

**Use when**

Handling chat completion requests in a multi-tenant environment or shared vLLM instance where prompt prefix caches must be strictly partitioned.

**Secure rules**

**Rule 1: Provide a unique cache salt for each tenant or security context when configuring chat completion requests.**

Always populate the `cache_salt` field with a distinct tenant- or security-context-specific salt string in `ChatCompletionRequest`. This ensures that requests sharing prompt prefix structures do not reuse KV-cache states across unauthorized tenant boundaries.

```rust
let request = ChatCompletionRequest {
    messages,
    model: "model_name".to_string(),
    cache_salt: Some(tenant_id.to_string()),
    ..Default::default()
};
```
