# Security blueprint

Repository: `https://github.com/sgl-project/sglang#v0.5.16`

## Security posture

The SGLang security model assumes that administrative control planes, routing gateways, and model workers operate within trusted network perimeters, and relies on strict authentication, input validation, and boundary enforcement to protect against unauthorized access and resource exhaustion. It protects internal routing and state integrity when secure configuration builders and explicit authorization middleware are enforced, but it does not automatically secure unauthenticated management endpoints, unconstrained file paths, or unsafe remote deserialization channels. Developers must treat all external client inputs, custom model weights, and distributed peer communication channels as untrusted, ensuring that security-sensitive operations fail closed when verification checks or limits are breached.

## Essential implementation rules

1. **Enforce Strict Administrative and Control Plane Authentication**

Protect administrative and worker management routes such as `/workers`, `/wasm`, `/v1/tokenizers`, and `/flush_cache` using control plane authentication middleware like `control_plane_auth` or constant-time Bearer token validation. Enforce explicit JWT issuer, audience, and `jwks_uri` claims with JTI replay protection, require admin API keys for `AuthLevel.ADMIN_FORCE` endpoints, and isolate scheduler ports and IPC control channels from untrusted external access.

2. **Validate and Restrict Input Contracts and Structured Generation Parameters**

Ensure that request payloads adhere strictly to expected schemas by specifying exactly one constraint parameter per structured generation request, validating unique request identifiers (`rid`) and mutually exclusive prompt inputs, and enforcing schema validation on custom tool definitions and structured model outputs before consumption.

3. **Disable Remote Code Execution and Unsafe Deserialization**

Leave `trust_remote_code` disabled by default when loading models from unverified sources to prevent arbitrary Python code execution. Isolate pickle-based IPC and ZeroMQ orchestrator endpoints behind loopback interfaces or private networks, and filter custom logit processors and model parameters against strict allowlists.

4. **Secure File Paths and Local Storage Permissions**

Prevent directory traversal and unauthorized file access by setting explicit extraction filters such as `filter='data'` on untrusted tar archives, canonicalizing and validating client-supplied adapter or corpus file paths against strict directory allowlists, and configuring restricted POSIX permissions like `0700` on local storage and cache directories.

5. **Enforce Network Boundaries and Secure Transport-Layer Communications**

Bind router and model server hosts to private interfaces or local loopback addresses rather than unconstrained interfaces like `0.0.0.0`, enable TLS server certificates and mutual authentication for router communications, and restrict GPU IPC multimodal feature transport (`mm_feature_transport="cuda_ipc"`) strictly to single-node deployments (`nnodes=1`).

6. **Mitigate Resource Exhaustion via Rate Limits and Eviction Policies**

Protect backend model workers and storage backends against resource starvation by enforcing explicit limits on request concurrency, maximum payload sizes, request timeouts, token generation bounds (`SGLANG_MAX_NEW_TOKENS_LIMIT`), thread allocations (`SGLANG_CPU_WORKERS`), and streaming buffer sizes. Configure idle session eviction intervals, disable request persistence for background responses without TTL, and set storage watermark cleaner thresholds.

7. **Manage Sessions and State Lifecycle Safely**

Ensure multi-turn streaming sessions and workflow states do not leak or pollute application memory by explicitly invoking `session.abort_req()` on errors or cancellations, setting non-zero session timeouts, re-populating transient runtime context references, and invoking `validate_initialized()` after state deserialization.

8. **Enforce Configuration Integrity and Secure Secret Handling**

Load sensitive credentials, database URLs, and API keys dynamically from environment variables rather than hardcoding them in source code or configuration files. Enable strict configuration mutation guards (`SGLANG_STRICT_CONFIG_MUTATION=1`) and build gateway router configurations using validation enabled (`build_with_validation(true)`) to ensure all security constraints are verified prior to startup.
