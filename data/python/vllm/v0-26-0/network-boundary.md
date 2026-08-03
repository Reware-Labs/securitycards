# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: network boundary

## network boundary

### Enforce TLS Certificate Validation and Encrypted Endpoints for Network Connections

**Use when**

Configuring network connections, multi-port external load balancing, or benchmark HTTP clients communicating with remote or public endpoints.

**Secure rules**

**Rule 1: Verify server certificates and enforce TLS encryption for external and distributed data parallel communication endpoints.**

Ensure TLS certificate validation is enabled by default to prevent Man-in-the-Middle attacks. When deploying vLLM with multi-port external load balancing, pass the appropriate SSL certificate paths such as `ssl_keyfile`, `ssl_certfile`, and `ssl_ca_certs` to enforce encrypted network communications across trust boundaries.

```rust
let client_builder = reqwest::Client::builder();
if config.insecure {
    client_builder = client_builder.danger_accept_invalid_certs(true);
}
```
