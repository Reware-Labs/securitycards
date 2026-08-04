# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: access control

## access control

### Restrict Access to Administrative Control Plane and Worker Endpoints

**Use when**

Configuring SGLang server deployments and routing layers that expose management, worker registration, tokenizers, cache flushing, or runtime model update APIs.

**Secure rules**

**Rule 1: Protect administrative and worker management routes using control plane authentication middleware and network security boundaries.**

Always configure `control_plane_auth` in `ServerConfig` when initializing the model gateway server to restrict administrative routes like `/workers`, `/wasm`, `/v1/tokenizers`, and `/flush_cache` to authorized operators. Ensure management requests are placed behind an API gateway or firewall that restricts access to trusted administrative clients only.

```rust
let server_config = ServerConfig {
    host: "0.0.0.0".to_string(),
    port: 3000,
    router_config: router_config,
    max_payload_size: 10 * 1024 * 1024,
    log_dir: None,
    log_level: Some("info".to_string()),
    json_log: true,
    service_discovery_config: None,
    prometheus_config: None,
    request_timeout_secs: 60,
    request_id_headers: None,
    shutdown_grace_period_secs: 30,
    control_plane_auth: Some(control_plane_auth_config),
    mesh_server_config: None,
};
```

**Rule 2: Enforce explicit JWT verification claims and role mappings in control plane authentication.**

When configuring gateway JWT authentication with `PyJwtConfig` and `PyControlPlaneAuthConfig`, specify explicit issuer, audience, and `jwks_uri` properties, and verify role mappings. Any role mapping string not matching `admin` strictly defaults to standard User permissions, and `audit_enabled` should remain set to `True`.

```python
from sglang_router import PyJwtConfig, PyControlPlaneAuthConfig

jwt_cfg = PyJwtConfig(
    issuer="https://auth.example.com/",
    audience="sglang-gateway",
    jwks_uri="https://auth.example.com/.well-known/jwks.json",
    role_mapping={"idp_admin_role": "admin", "idp_user_role": "user"},
    role_claim="roles",
)

auth_cfg = PyControlPlaneAuthConfig(
    jwt=jwt_cfg,
    api_keys=[],
    audit_enabled=True,
)
```

**Rule 3: Enforce upstream authentication and omit built-in keys when running multi-tokenizer worker mode.**

Multi-tokenizer worker mode in SGLang explicitly prohibits setting a built-in API key via `server_args.api_key`. When scaling tokenizer workers, developers must enforce authentication and access control at an upstream network boundary such as an API gateway or reverse proxy.

```python
# When deploying SGLang with multiple tokenizer workers, do not set server_args.api_key. Place the HTTP server behind an authenticated reverse proxy (e.g., Nginx, Envoy, or an API gateway) to perform token verification before forwarding requests.

# Example Nginx reverse proxy auth configuration
location /v1/ {
    auth_request /auth;
    proxy_pass http://127.0.0.1:30000;
}
```

**Rule 4: Restrict Kubernetes service discovery to a specific namespace to prevent excessive RBAC permissions.**

When configuring Kubernetes service discovery for worker endpoints, explicitly pass `service_discovery_namespace` rather than leaving it as `None`. Unspecified namespaces cause pod watching across all cluster namespaces, requiring excessive cluster-wide RBAC permissions.

```python
args = RouterArgs(
    service_discovery=True,
    service_discovery_namespace="sglang-prod",
    selector={"app": "sglang-worker"}
)
router = Router.from_args(args)
```

**Rule 5: Isolate scheduler ports and dynamic file loading control channels from external untrusted callers.**

Isolate SGLang scheduler ports and IPC control channels that handle dynamic file loading requests such as `LoadLoRAAdapterReqInput` and `UpdateWeightFromDiskReqInput`. Restrict management RPC access exclusively to authenticated internal controllers by binding to private interfaces.

```bash
python3 -m sglang.launch_server \
  --host 127.0.0.1 \
  --port 30000 \
  --model-path meta-llama/Llama-2-7b-chat-hf
```

**Rule 6: Require admin API keys for administrative authorization levels and reject improper access attempts.**

Endpoints marked with `AuthLevel.ADMIN_FORCE` strictly require `admin_api_key` and will reject requests authorized only with standard `api_key`. If `ADMIN_FORCE` endpoints are evaluated without an admin API key configured on the server, requests return HTTP 403.

```python
from sglang.srt.utils.auth import decide_request_auth, AuthLevel

decision = decide_request_auth(
    method="POST",
    path="/admin/endpoint",
    authorization_header="Bearer admin-secret-key",
    api_key="normal-user-key",
    admin_api_key="admin-secret-key",
    auth_level=AuthLevel.ADMIN_FORCE,
)
if not decision.allowed:
    raise PermissionError(f"Access denied: status {decision.error_status_code}")
```

**Rule 7: Protect runtime control-plane APIs from unauthenticated network access.**

Protect runtime control-plane APIs such as weight updates, cache storage modifications, and profiling execution from unauthenticated network access. Ensure control endpoints triggering `TokenizerControlMixin` methods are restricted to internal networks or wrapped with administrator-level authentication dependencies.

```python
@app.post("/update_weights")
async def update_weights(req: UpdateWeightsReq, user: User = Depends(get_admin_user)):
    return await tokenizer_manager.update_weights_from_distributed(req.input)
```
