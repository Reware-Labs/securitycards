# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: resource exhaustion

## resource exhaustion

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
