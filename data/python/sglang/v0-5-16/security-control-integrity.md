# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: security control integrity

## security control integrity

### Enforce Configuration Validation and Context Initialization During Gateway Startup

**Use when**

Building router configurations and restoring persisted workflow states for the model gateway.

**Secure rules**

**Rule 1: Always build model gateway router configurations using validation enabled.**

When configuring the model gateway router, avoid using methods that bypass verification checks. Always build configurations using `build()` or `build_with_validation(true)` to ensure that certificates, API keys, and security constraints are verified prior to gateway startup.

```rust
let config = RouterConfigBuilder::new()
    .host("127.0.0.1")
    .port(8080)
    .api_key("secure-api-key-string")
    .build()?;
```

**Rule 2: Re-populate transient runtime context and invoke initialization checks after deserializing workflow state.**

When deserializing persisted workflow state objects, transient runtime context references are skipped. Callers must explicitly re-populate `app_context` and invoke `validate_initialized()` prior to executing workflow steps to prevent uninitialized execution paths.

```rust
let mut workflow_data: LocalWorkerWorkflowData = serde_json::from_str(&persisted_json)?;
workflow_data.app_context = Some(app_context.clone());
workflow_data.validate_initialized()?;
```
