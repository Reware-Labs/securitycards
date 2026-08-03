# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`

## Category: access control

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


## Category: api contract misuse

### Specify Only One Output Constraint Parameter Per Request

**Use when**

Configuring structured generation requests with constraints such as json_schema, regex, or ebnf.

**Secure rules**

**Rule 1: Provide at most one constraint parameter per structured generation request.**

When configuring structured generation requests, specify a single constraint parameter type per request payload. Combining multiple constraint options in a single request violates the SGLang structured generation contract and can cause request handling failures or grammar compilation errors.

```python
response = client.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "What is the capital of France?"}],
    extra_body={"regex": "(Paris|London)"}
)
```


## Category: authentication

### Configure API Key Authentication on SGLang Gateways and Servers

**Use when**

When launching SGLang model gateways, routers, or OpenAI-compatible server instances that require API key verification on incoming requests.

**Secure rules**

**Rule 1: Enforce API key authentication on server endpoints using configured keys and bearer headers**

Explicitly configure the `api_key` parameter or CLI option during server or gateway launch so that incoming requests require valid authorization credentials. Callers must supply the token using the standard Authorization Bearer header.

```python
process = popen_launch_server(model_name, base_url, api_key="sk-secure-key-123")
client = openai.Client(api_key="sk-secure-key-123", base_url="http://localhost:30000/v1")
```

**Rule 2: Use constant-time comparison for Bearer token validation.**

SGLang relies on constant-time string comparison (`ConstantTimeEq`) for Bearer tokens during header validation to prevent timing side-channel attacks during header verification.

```rust
let auth_config = AuthConfig {
    api_key: Some(std::env::var("SGLANG_API_KEY").expect("API key must be set")),
};

let app = Router::new()
    .route("/v1/chat/completions", post(handle_chat))
    .layer(axum::middleware::from_fn_with_state(auth_config, auth_middleware));
```


### Configure JWT Authentication and JTI Replay Protection for Control Plane Routes

**Use when**

When securing the router control plane using JWT/OIDC identity integration and preventing token reuse.

**Secure rules**

**Rule 1: Specify both required JWT issuer and audience.**

When configuring JWT authentication via `build_control_plane_auth_config` or `RouterArgs`, developers must provide both `jwt_issuer` and `jwt_audience`. Supplying optional claims or role mappings without both fields will cause the configuration builder to drop the JWT configuration and leave control plane APIs unprotected.

```python
args = RouterArgs(
    jwt_issuer="https://auth.example.com/",
    jwt_audience="sglang-router",
    jwt_jwks_uri="https://auth.example.com/.well-known/jwks.json",
    jwt_role_claim="roles",
    jwt_role_mapping={"admin": "router_admin"},
)
```

**Rule 2: Enable JTI replay protection for control plane JWTs.**

Enable JTI replay protection when instantiating `JwtValidator` using `JwtValidator::from_config_with_options(jwt_config, true)` to ensure individual JWT tokens cannot be re-used within their validity window.

```rust
let validator = JwtValidator::from_config_with_options(jwt_config, true)
    .await
    .expect("Failed to create JWT validator with JTI replay protection");
```


## Category: boundary control

### Restrict Multimodal Feature Transport to Single-Node Environments

**Use when**

Deploying SGLang with multimodal models and configuring `mm_feature_transport`

**Secure rules**

**Rule 1: Constrain GPU IPC multimodal feature transport strictly to single-node deployments.**

When configuring `mm_feature_transport="cuda_ipc"`, ensure the execution environment has `nnodes=1`. SGLang rejects `cuda_ipc` in multi-node configurations because GPU IPC memory handle sharing cannot safely cross physical host boundaries.

```python
from sglang.srt.server_args import ServerArgs

server_args = ServerArgs(
    model_path="Qwen/Qwen2-VL-7B-Instruct",
    mm_feature_transport="cuda_ipc",
    nnodes=1,
)
```


## Category: configuration source integrity

### Enforce Strict Configuration Mutation Guards and Immutable Server Arguments

**Use when**

Configuring server parameters or implementing custom model overrides during SGLang initialization and runtime updates.

**Secure rules**

**Rule 1: Enable strict configuration mutation guards to prevent post-resolution attribute modification**

Set the `SGLANG_STRICT_CONFIG_MUTATION` environment variable to `1` so that direct post-resolution mutations on `ServerArgs` attributes raise exceptions. Use the `ServerArgs.override` method instead of direct attribute mutation when runtime updates are required.

```python
import os
os.environ["SGLANG_STRICT_CONFIG_MUTATION"] = "1"

# Use ServerArgs.override() instead of direct attribute mutation
server_args.override("runtime_update", disable_radix_cache=True)
```

**Rule 2: Return declarative dictionaries for custom model overrides without mutating pristine configurations.**

When extending SGLang with custom model overrides or configuration passes, return dictionary declarations through registration functions like `@register_model_override` rather than attempting to directly mutate `server_args` or `ResolvedView` objects, which enforce read-only access.

```python
from sglang.srt.arg_groups.overrides import register_model_override

@register_model_override("CustomModelForCausalLM")
def _custom_model_overrides(server_args, hf_config):
    if server_args.is_attention_backend_not_set():
        return {"attention_backend": "flashinfer"}
    return {}
```


## Category: dangerous execution

### Disable remote code execution and restrict dynamic inputs in model loading and request parameters

**Use when**

When configuring SGLang server arguments or handling incoming request parameters that could load custom models or execute dynamic processors.

**Secure rules**

**Rule 1: Leave trust_remote_code disabled when loading models from unverified sources.**

Ensure that the `trust_remote_code` configuration argument in `ServerArgs` is set to `False` to prevent automatic execution of arbitrary Python code embedded in Hugging Face Hub model repositories.

```python
from sglang.srt.server_args import ServerArgs

# Secure configuration enforcing default trust_remote_code=False
args = ServerArgs(
    model_path="meta-llama/Llama-2-7b-chat-hf",
    trust_remote_code=False
)
```

**Rule 2: Filter and sanitize custom logit processors against an explicit allowlist**

At the API gateway, allow only exact serialized `custom_logit_processor` values generated with `CustomLogitProcessor.to_str()`; symbolic processor names are not valid SGLang values.

```python
def sanitize_request(
    request_dict: dict, allowed_processors: set[str]
) -> dict:
    if "custom_logit_processor" in request_dict:
        if request_dict["custom_logit_processor"] not in allowed_processors:
            raise ValueError("Unauthorized custom_logit_processor specified")
    return request_dict
```


## Category: deserialization

### Secure Pickle-Based IPC and Distributed Diffusion Endpoints Against Arbitrary Code Execution

**Use when**

Configuring SGLang engine IPC ports, distributed disaggregation endpoints, and generation request inputs that rely on pickle deserialization or custom processors.

**Secure rules**

**Rule 1: Isolate pickle-based IPC and ZeroMQ orchestrator endpoints behind trusted network boundaries or localhost, and avoid exposing them to untrusted external callers.**

When initializing `DiffusionServer` or managing internal IPC communication channels, bind frontend and result endpoints strictly to loopback interfaces like `tcp://127.0.0.1` or secure private network perimeters. Ensure that unvalidated serialized data or custom logit processor inputs are never directly accepted from untrusted external clients to prevent remote code execution through unsafe pickle deserialization.

```python
server = DiffusionServer(
    frontend_endpoint="tcp://127.0.0.1:5555",
    encoder_work_endpoints=["tcp://127.0.0.1:5556"],
    denoiser_work_endpoints=["tcp://127.0.0.1:5557"],
    decoder_work_endpoints=["tcp://127.0.0.1:5558"],
    encoder_result_endpoint="tcp://127.0.0.1:5559",
    denoiser_result_endpoint="tcp://127.0.0.1:5560",
    decoder_result_endpoint="tcp://127.0.0.1:5561"
)
server.start()
```


## Category: file handling

### Secure File Paths and Archive Extraction in SGLang

**Use when**

Handling user-influenced file paths, log archives, and storage directories in SGLang applications.

**Secure rules**

**Rule 1: Set explicit extraction filters when unpacking untrusted tar archives**

When extracting tarball archives, set the extraction filter explicitly to `data` when supported by Python's tarfile module to prevent directory traversal attacks.

```python
import tarfile
from pathlib import Path

def extract_tarball(tarball: Path, destination: Path) -> None:
    with tarfile.open(tarball, 'r:gz') as archive:
        if 'data' in tarfile._NAMED_FILTERS:
            archive.extractall(destination, filter='data')
        else:
            raise RuntimeError("Safe tar extraction requires filter='data'")
```

**Rule 2: Restrict file permissions on local storage and cache directories.**

Create dedicated storage directories with restricted POSIX permissions such as `0700` and export environment variables like `SGLANG_HICACHE_NIXL_BACKEND_STORAGE_DIR` to avoid world-writable temporary directories.

```bash
mkdir -p /var/lib/sglang/hicache_storage
chmod 700 /var/lib/sglang/hicache_storage
export SGLANG_HICACHE_NIXL_BACKEND_STORAGE_DIR=/var/lib/sglang/hicache_storage
```

**Rule 3: Validate and canonicalize client-supplied adapter or corpus file paths**

Sanitize and validate requested file paths against a strict directory allowlist and canonicalize paths before loading external corpora or model adapters.

```python
import os

ALLOWED_DIR = "/var/data/corpora"

def safe_add_corpus(tokenizer_manager, corpus_req):
    if corpus_req.file_path:
        real_path = os.path.realpath(corpus_req.file_path)
        if os.path.commonpath([real_path, os.path.realpath(ALLOWED_DIR)]) != os.path.realpath(ALLOWED_DIR):
            raise ValueError("Unauthorized file path provided")
    return tokenizer_manager.add_external_corpus(corpus_req)
```


## Category: input contract definition

### Validate and Enforce Input Contracts on Requests and Parameters

**Use when**

When developers construct request objects, parse incoming client payloads, or configure model generation and chat parameters.

**Secure rules**

**Rule 1: Ensure prompt inputs are mutually exclusive and request identifiers are unique**

When instantiating `GenerateReqInput`, developers must specify exactly one prompt input mode (`text`, `input_ids`, or `input_embeds`) and ensure all request IDs (`rid`) in batch requests are unique. Verify the one-of-three condition before calling `normalize_batch_and_arguments()` because v0.5.16 does not reject every two-input combination.

```python
from sglang.srt.managers.io_struct import GenerateReqInput

req = GenerateReqInput(
    rid="req_001",
    text="Summarize the document.",
)
req.normalize_batch_and_arguments()
```

**Rule 2: Validate external router URLs and port numbers before initializing router configurations.**

Applications constructing router configurations dynamically must validate and sanitize worker URLs and port arguments prior to instantiating `RouterArgs` or invoking `launch_router` to prevent malformed bindings or unintended network targets.

```python
import urllib.parse
from sglang_router.launch_router import RouterArgs

def create_safe_router_args(worker_urls, port):
    validated_urls = []
    for url in worker_urls:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError(f"Invalid or unsafe URL scheme: {url}")
        validated_urls.append(url)
    if not (1 <= port <= 65535):
        raise ValueError(f"Port out of valid range: {port}")
    return RouterArgs(worker_urls=validated_urls, port=port)
```

**Rule 3: Enforce schema validation on custom tool definitions.**

When sending custom tool definitions through the Anthropic messages API protocol, developers must provide a valid `input_schema` for each custom tool definition. SGLang enforces schema validation during request parsing via `AnthropicMessagesRequest.model_validate`, immediately rejecting custom tools missing `input_schema`.

```python
from sglang.srt.entrypoints.anthropic.protocol import AnthropicMessagesRequest

request = AnthropicMessagesRequest.model_validate({
    "model": "test-model",
    "max_tokens": 64,
    "messages": [{"role": "user", "content": "Execute lookup"}],
    "tools": [
        {
            "name": "lookup",
            "description": "Perform database lookup",
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        }
    ]
})
```

**Rule 4: Validate realtime audio frame payload formatting over WebSocket endpoints.**

SGLang strictly validates incoming audio frames over the WebSocket endpoint by requiring JSON text frames with base64-encoded audio, checking PCM16 sample alignment, and enforcing that `session.update` is called prior to frame appends.

```python
await websocket.send_json({
    "type": "session.update",
    "session": {
        "audio": {
            "input": {
                "format": {"type": "audio/pcm", "rate": 24000}
            }
        }
    }
})
```

**Rule 5: Enforce strict schema validation on structured model outputs.**

When relying on model outputs for structured data ingestion, developers should enforce structured output constraints (`json_schema`, `regex`, or `ebnf`) during generation and perform schema validation using tools like Pydantic prior to consuming the payload in backend logic.

```python
from pydantic import BaseModel, Field
import openai

class CapitalInfo(BaseModel):
    name: str = Field(..., pattern=r"^\w+$")
    population: int

client = openai.Client(base_url="http://127.0.0.1:30000/v1", api_key="None")
response = client.chat.completions.create(
    model="meta-llama/Meta-Llama-3.1-8B-Instruct",
    messages=[{"role": "user", "content": "Return capital info for France in JSON."}],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "capital_info",
            "schema": CapitalInfo.model_json_schema()
        }
    }
)
data = CapitalInfo.model_validate_json(response.choices[0].message.content)
```

**Rule 6: Validate non-empty image path arguments in layered image pipelines.**

When providing image inputs to multimodal pipeline stages, ensure image path arguments are explicitly formatted as non-empty strings or non-empty lists of strings to prevent runtime errors during path resolution.

```python
def process_image_request(image_path_input):
    if not image_path_input:
        raise ValueError('image_path must be a non-empty string or list of paths')
    resolved_path = _resolve_layered_image_path(image_path_input)
    return resolved_path
```

**Rule 7: Configure reasoning effort within allowed numeric ranges and keywords**

Request `reasoning_effort` values may be finite numbers in `[0.0, 0.99]` or recognized effort keywords (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`); `SGLANG_INKLING_DEFAULT_REASONING_EFFORT` must be numeric and within `[0.0, 0.99]`.

```python
import os

os.environ["SGLANG_INKLING_DEFAULT_REASONING_EFFORT"] = "0.7"
```

**Rule 8: Validate model input dimensions as positive integers.**

When accepting dimension specifications in string format (such as `1024x1024`) for image or video generation workflows, strictly parse and validate that both width and height are positive integers before passing parameters to model execution routines.

```python
def parse_dimensions(size_string: str | None) -> tuple[int | None, int | None]:
    if not size_string:
        return (None, None)
    parts = size_string.strip().split('x')
    if len(parts) != 2:
        return (None, None)
    try:
        width, height = int(parts[0].strip()), int(parts[1].strip())
        if width <= 0 or height <= 0:
            return (None, None)
        return (width, height)
    except ValueError:
        return (None, None)
```


## Category: input driven boundary selection

### Validate model parameter formats when overriding lora path adapters

**Use when**

When accepting client-provided model strings or adapter specifications in OpenAI-compatible serving interfaces.

**Secure rules**

**Rule 1: Validate and allowlist client-selected LoRA adapter names before routing to SGLang serving instances**

Sanitize model parameters to prevent unauthorized selection of already loaded LoRA adapters when untrusted clients use the `base-model:adapter-name` syntax. Check the model string for embedded adapter parameters and verify them against an explicit allowlist of permitted adapters.

```python
ALLOWED_ADAPTERS = {"sql-expert", "python-expert"}

def sanitize_model_request(model_param: str) -> str:
    if ":" in model_param:
        base_model, adapter = model_param.split(":", 1)
        adapter = adapter.strip()
        if adapter and adapter not in ALLOWED_ADAPTERS:
            raise ValueError(f"Access to adapter '{adapter}' is not allowed.")
    return model_param
```


## Category: input interpretation safety

### Validate and Normalize Untrusted Input Payloads and Tool Call Arguments

**Use when**

Parsing, decoding, or interpreting incoming request payloads, chat completions, and model-generated tool call arguments from untrusted clients.

**Secure rules**

**Rule 1: Validate request payload structure and fields defensively using targeted parsing structs or default fallbacks before allocating deep dynamic memory.**

Perform light-weight schema probing on incoming request bodies using targeted structs, or use safe extraction methods such as `.get()`, `.and_then()`, and `.as_array()` with default fallbacks to prevent panics, excessive memory consumption, or unhandled errors from malformed input variants.

```rust
#[derive(Debug, serde::Deserialize)]
struct RequestProbe {
    #[serde(default)]
    stream: Option<bool>,
    #[serde(default)]
    model: Option<String>,
}

let probe: RequestProbe = serde_json::from_slice(&body_bytes)?;
```

**Rule 2: Enforce strict JSON object validation for assistant tool call arguments.**

Ensure that function arguments in tool call histories are formatted as valid JSON strings that deserialize strictly into JSON objects or dictionaries, raising errors for invalid or non-object structures to prevent execution bypasses or parsing failures.

```python
assistant_message = {
    "role": "assistant",
    "tool_calls": [
        {
            "function": {
                "name": "search_db",
                "arguments": "{\"query\": \"security_audit\"}"
            }
        }
    ]
}
```


## Category: network boundary

### Restrict Router Host Binding and Enforce Transport-Layer Security

**Use when**

Deploying the SGLang model gateway, router, or worker services in production environments where network trust boundaries must be enforced.

**Secure rules**

**Rule 1: Bind the router and model server host to private interfaces or local loopback addresses rather than exposing them on unconstrained network interfaces.**

Avoid binding network services to `0.0.0.0` by default. Explicitly configure the host parameter to a loopback address like `127.0.0.1` or a private internal IP address to prevent unauthorized external access when public exposure is not required.

```python
args = RouterArgs(
    host="127.0.0.1",
    port=30000,
)
```

**Rule 2: Configure TLS server certificates and mutual authentication for router and gateway communications.**

Enable transport-layer security by supplying server certificate paths, private keys, and client certificate authorities using configuration parameters such as `server_cert_path` and `server_key_path` to prevent traffic interception and peer impersonation.

```python
args = RouterArgs(
    host="127.0.0.1",
    port=30000,
    server_cert_path="/etc/ssl/certs/router_server.crt",
    server_key_path="/etc/ssl/private/router_server.key",
    client_cert_path="/etc/ssl/certs/router_client.crt",
    client_key_path="/etc/ssl/private/router_client.key",
    ca_cert_paths=["/etc/ssl/certs/ca.crt"],
)
```


### Validate Disaggregation Endpoints and Isolate Internal Communication Channels

**Use when**

Configuring distributed prefill-decode disaggregation, ZeroMQ endpoints, or peer-to-peer data transfer channels across SGLang instances.

**Secure rules**

**Rule 1: Isolate disaggregated scheduler and ZeroMQ communication channels to loopback or private network interfaces.**

Bind scheduling endpoints and peer-to-peer hostnames such as `pool_work_endpoint` and `disagg_p2p_hostname` strictly to local loopback addresses or isolated internal networks to prevent unauthorized external entities from injecting tasks or intercepting tensor buffers.

```python
server_args.pool_work_endpoint = "tcp://127.0.0.1:5555"
server_args.pool_result_endpoint = "tcp://127.0.0.1:5556"
server_args.disagg_p2p_hostname = "127.0.0.1"
```

**Rule 2: Have the model gateway overwrite client-supplied bootstrap parameters**

Route untrusted PD traffic through the SGLang model gateway, which overwrites `bootstrap_host`, `bootstrap_port`, and `bootstrap_room` using the selected prefill worker; do not expose decode endpoints directly to untrusted clients.

```python
from sglang_router import Router, RouterArgs

args = RouterArgs(
    pd_disaggregation=True,
    prefill_urls=[("http://prefill:30000", 8998)],
    decode_urls=["http://decode:30000"],
)
router = Router.from_args(args)
```


## Category: resource exhaustion

### Configure Request Concurrency, Payload, and Rate Limits

**Use when**

When initializing gateways, routers, and server configurations to handle untrusted incoming inference traffic safely.

**Secure rules**

**Rule 1: Set maximum request concurrency limits to protect backend model workers from traffic spikes and request floods.**

Specify explicit request concurrency bounds using `--max-concurrent-requests` when launching the gateway or configuring router arguments to prevent cluster resource exhaustion.

```bash
./target/release/sgl-model-gateway \
  --enable-igw \
  --policy cache_aware \
  --max-concurrent-requests 512
```

**Rule 2: Enforce explicit payload size limits on server and gateway routing handlers.**

Configure `max_payload_size` within server configuration structs and use appropriate request body size limit extractors like `DefaultBodyLimit` on routing layers to reject oversized payloads before parsing.

```rust
let app = Router::new()
    .route("/v1/chat/completions", post(chat_completions))
    .layer(DefaultBodyLimit::max(MAX_CHAT_BODY_BYTES));
```

**Rule 3: Define explicit operational timeouts and queue bounds for incoming requests.**

Explicitly configure non-zero bounds for request timeouts, connect timeouts, queue capacity, and queue timeouts to prevent hanging connections and thread starvation.

```toml
port = 3000
max_payload_size = 10485760
request_timeout_secs = 60
connect_timeout_secs = 10
queue_size = 100
queue_timeout_secs = 30
```


### Configure Session Eviction, Timeouts, and Storage Watermarks

**Use when**

When managing persistent routing entries, background response stores, cache storage backends, and connection lifecycles.

**Secure rules**

**Rule 1: Configure idle and eviction intervals for sticky sessions to prevent unbounded memory growth**

Set non-zero values for `max_idle_secs` and `eviction_interval_secs` on `PolicyConfig::Manual` to automatically sweep and evict unused routing key mappings from memory.

```rust
let policy = PolicyConfig::Manual {
    assignment_mode: ManualAssignmentMode::Random,
    max_idle_secs: 600,
    eviction_interval_secs: 60,
};
```

**Rule 2: Disable request persistence for background responses**

Avoid setting `store=True` in background request configurations; v0.5.16 stores responses in an in-memory dictionary without TTL eviction.

```python
request = ResponsesRequest(
    model="gpt-oss",
    input="Hello",
    store=False,
    background=False
)
```

**Rule 3: Set L3 cleaner watermarks for storage-backed cache plugins to avoid disk exhaustion.**

Explicitly define `l3_cleaner_enabled`, `l3_cleaner_high_watermark`, and `l3_cleaner_low_watermark` in configuration files to trigger automatic disk purging before storage limits are reached.

```toml
use_direct_io = true
l3_cleaner_enabled = true
l3_cleaner_high_watermark = 80.0
l3_cleaner_low_watermark = 70.0
```


### Limit Token Generation, Processing Workers, and Buffer Allocations

**Use when**

When setting up model scheduler parameters, multimodal processing pools, and real-time streaming buffers to avoid resource starvation and out-of-memory errors.

**Secure rules**

**Rule 1: Enforce upper bounds on token generation and estimation limits per request**

Use `SGLANG_MAX_NEW_TOKENS_LIMIT` to constrain maximum output generation; `SGLANG_CLIP_MAX_NEW_TOKENS_ESTIMATION` only caps scheduling estimates.

```bash
export SGLANG_MAX_NEW_TOKENS_LIMIT=4096
python3 -m sglang.launch_server --model-path meta-llama/Llama-2-7b-chat-hf --host 127.0.0.1 --port 30000
```

**Rule 2: Configure explicit CPU and IO worker bounds for multimodal processing pools.**

Bound the internal thread and process pool allocations by setting `SGLANG_CPU_WORKERS` and `SGLANG_IO_WORKERS` to prevent excessive process spawning in resource-constrained environments.

```bash
export SGLANG_CPU_WORKERS=4
export SGLANG_IO_WORKERS=4
python3 -m sglang.launch_server --model-path /path/to/multimodal-model
```

**Rule 3: Bound real-time streaming session audio buffers to prevent memory exhaustion.**

Configure `asr_max_buffer_seconds` when initializing `ServerArgs` for real-time ASR WebSocket sessions so uncommitted streaming audio is bounded in memory.

```python
from sglang.srt.server_args import ServerArgs

server_args = ServerArgs(
    model_path="Qwen/Qwen2-Audio-7B-Instruct",
    asr_max_buffer_seconds=60,
)
```


## Category: runtime environment hardening

### Restrict Container Privileges and Host Resource Access in Deployment Manifests

**Use when**

Configuring deployment manifests and security contexts for Sglang worker and leader containers.

**Secure rules**

**Rule 1: Enforce the principle of least privilege in container security contexts by avoiding `privileged: true` and granting only required capabilities.**

Do not grant full `privileged: true` access alongside `hostIPC: true` and `hostNetwork: true` to containers unless strictly required. Instead, disable privileged mode and explicitly add only necessary capabilities such as `IPC_LOCK`.

```yaml
securityContext:
  privileged: false
  capabilities:
    add:
    - IPC_LOCK
```


## Category: secret handling

### Load Credentials and Secrets Dynamically via Environment Variables

**Use when**

When configuring gateways, database connections, API keys, and external service integrations in SGLang.

**Secure rules**

**Rule 1: Load sensitive credentials and keys from environment variables rather than hardcoding them in source files or configuration strings.**

Retrieve credentials such as database URLs, API keys, and access tokens dynamically using `os.environ.get` or environment variable substitution in configuration files to prevent secret leakage in version control.

```python
import os

args = RouterArgs(
    postgres_db_url=os.environ.get("POSTGRES_DB_URL"),
    redis_url=os.environ.get("REDIS_URL"),
)
```


## Category: security control integrity

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


## Category: session management

### Abort Failed Multi-Turn Sessions and Enforce Explicit Timeouts

**Use when**

Managing multi-turn streaming sessions and cleaning up idle or failed request states in SGLang session controllers.

**Secure rules**

**Rule 1: Call abort_req when a session request errors or is cancelled to prevent state pollution.**

Ensure that `session.abort_req()` is called whenever a multi-turn streaming request encounters an error or cancellation before `finish_req()` executes. This rolls back uncommitted origin and fill token arrays to prevent partial or cancelled turn data from polluting subsequent turns.

```python
from sglang.srt.session.session_controller import Session

session = Session(capacity_of_str_len=0, session_id="s", streaming=True)
try:
    req = session.create_req(recv_req, tokenizer=tokenizer, vocab_size=vocab_size)
    session.finish_req(req)
except Exception:
    session.abort_req()
    raise
```

**Rule 2: Specify explicit session timeouts to prevent resource exhaustion from idle sessions.**

When creating multi-turn sessions using `OpenSessionReqInput` or `SessionController`, always provide an explicit `timeout` parameter to ensure idle sessions are properly expired and memory resources are reclaimed.

```python
req = OpenSessionReqInput(
    session_id="user_session_123",
    capacity_of_str_len=4096,
    streaming=True,
    timeout=300.0
)
controller.open(req)
```
