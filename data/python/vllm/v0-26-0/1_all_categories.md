# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`

## Category: access control

### Enforce Restricted Local Media Path and Allowed Origin Boundaries

**Use when**

Configuring file access and cross-origin resource sharing for model inputs and server endpoints.

**Secure rules**

**Rule 1: Restrict local media file access to an explicitly designated root directory.**

When processing video inputs using codec backends, configure `allowed_local_media_path` to restrict file access to a specific root directory and supply absolute paths within that directory.

```python
from vllm.model_executor.models.llava_onevision2 import prepare_codec_video_input
valid_video_path = "/var/app/media/sample.mp4"
multi_modal_data = {
    "video": prepare_codec_video_input(valid_video_path)
}
```

**Rule 2: Explicitly list trusted origins when configuring CORS credentials**

Do not set `allow_origins` to a wildcard when `allow_credentials` is enabled in `CorsConfig` to prevent mirroring arbitrary request origins and unauthorized cross-origin access.

```python
let cors_config = CorsConfig {
    allow_origins: vec!["https://app.example.com".to_string()],
    allow_credentials: true,
    allow_methods: vec!["GET".to_string(), "POST".to_string()],
    allow_headers: vec!["authorization".to_string(), "content-type".to_string()],
};
let layer = cors_layer(&cors_config);
```


## Category: api contract misuse

### Validate Generation Parameters and Role Sequences against Chat Templates

**Use when**

Applying chat templates and configuring tokenization or request parameters for language model inference.

**Secure rules**

**Rule 1: Validate conversation role sequences and avoid supplying conflicting prompt generation flags.**

Ensure that role sequences strictly match generation prompt parameters. Setting `add_generation_prompt=True` requires the last message to be from a non-assistant role, whereas `continue_final_message=True` requires the last message to be from an assistant role. Do not combine both flags simultaneously, and avoid passing unsupported custom `chat_template` or `chat_template_kwargs` arguments.

```python
messages = [{"role": "user", "content": "Hello"}]
tokenizer.apply_chat_template(messages, add_generation_prompt=True)
```


## Category: authentication

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


## Category: boundary control

### Enforce strict tool invocation boundaries by disabling tools on choice none

**Use when**

Serving chat models and configuring request parameters to prevent unauthorized tool execution when tool use is explicitly disabled.

**Secure rules**

**Rule 1: Configure the server to exclude tool definitions when tool choice is set to none.**

Launch the vLLM server with `--exclude-tools-when-tool-choice-none` alongside `--tool-call-parser` and `--enable-auto-tool-choice`. Client applications can then reliably disable tool execution per request by passing `tool_choice="none"` so the model cannot issue tool calls when tool use is disabled.

```python
response = await client.chat.completions.create(
    model="openai/gpt-oss-20b",
    messages=[{"role": "user", "content": "What is the weather in Dallas?"}],
    tools=tools,
    tool_choice="none",
    temperature=0.0,
)
assert response.choices[0].message.tool_calls is None
```


## Category: configuration source integrity

### Enforce Strict Validation and Trusted Sources for Configuration and Middleware

**Use when**

Setting up server configurations, YAML files, environment variables, and deployment scripts for vLLM services.

**Secure rules**

**Rule 1: Validate compilation options and server parameters against strict schema constraints using trusted configuration parsers.**

Ensure configuration files use supported formats and validate compilation options against defined Pydantic schema constraints using FlexibleArgumentParser to prevent server execution in an improperly configured state.

```python
from pydantic import ValidationError
from vllm.config.compilation import CompilationConfig
from vllm.utils.argparse_utils import FlexibleArgumentParser

parser = FlexibleArgumentParser()
parser.add_argument('serve')
parser.add_argument('model_tag', nargs='?')
parser.add_argument('--config', type=str)

try:
    args = parser.parse_args(['serve', 'my-model', '--config', 'config.yaml'])
except ValueError as err:
    print(f'Configuration file error: {err}')

try:
    comp_config = CompilationConfig(mode='VLLM_COMPILE')
except ValidationError as err:
    print(f'Invalid compilation configuration: {err}')
```


## Category: cryptography

### Use Authenticated Encryption for Tensorizer Model Serialization

**Use when**

When serializing or deserializing vLLM models and LoRA adapters using Tensorizer and `TensorizerConfig` to prevent unauthorized inspection or theft.

**Secure rules**

**Rule 1: Configure model weight encryption by providing an encryption keyfile to TensorizerConfig.**

When saving or loading model weights and LoRA adapters with Tensorizer, supply an encryption keyfile via `encryption_keyfile` in `TensorizerConfig` to enforce authenticated encryption. Ensure that `libsodium` is installed in your environment to properly support tensor encryption and decryption operations.

```python
from vllm.model_executor.model_loader.tensorizer import TensorizerConfig

tensorizer_config = TensorizerConfig(
    tensorizer_uri="s3://my-bucket/vllm/model.tensors",
    encryption_keyfile="/etc/secrets/tensorizer_encryption.key",
)
```


## Category: deserialization

### Restrict Insecure Serialization Configurations

**Use when**

Configuring deployment environments and environment variables for vLLM to handle untrusted requests safely.

**Secure rules**

**Rule 1: Keep insecure serialization flags disabled in production and untrusted environments.**

Ensure that the `VLLM_ALLOW_INSECURE_SERIALIZATION` environment variable remains explicitly disabled or set to `0` to prevent arbitrary object deserialization and remote code execution vulnerabilities.

```bash
export VLLM_ALLOW_INSECURE_SERIALIZATION="0"
```


## Category: escape hatch

### Restrict Multimodal Embeddings to Trusted Environments

**Use when**

Configuring the `LLM` engine and managing multimodal inputs where raw pre-computed embedding inputs could bypass media pre-processing validation.

**Secure rules**

**Rule 1: Keep enable_mm_embeds disabled by default and restrict its activation to trusted internal services.**

Do not enable `enable_mm_embeds=True` for public or untrusted API clients. Pre-computed embedding inputs bypass standard media pre-processing validation, and passing malformed embedding tensor shapes can crash the vLLM engine. Ensure `enable_mm_embeds=False` is used unless running in an environment where all inputs originate from trusted users.

```python
from vllm import LLM

# Enable mm embeds only in trusted internal services
llm = LLM(
    model="llava-hf/llava-1.5-7b-hf",
    enable_mm_embeds=True,
)
```


## Category: file handling

### Validate and Restrict File Paths for Media, Datasets, and Templates

**Use when**

Handling user-supplied file paths, multimodal media inputs, datasets, or template configurations in vLLM.

**Secure rules**

**Rule 1: Configure allowed local media paths to constrain filesystem access for multimodal inputs.**

Set `allowed_local_media_path` in `EngineArgs` to restrict local filesystem access when processing multimodal media inputs and prevent path traversal or unauthorized local file disclosure.

```python
from vllm.engine.arg_utils import EngineArgs

engine_args = EngineArgs(
    model="organization/multimodal-model",
    allowed_local_media_path="/var/app/safe_media_uploads"
)
```


## Category: input contract definition

### Validate chat completion and generation request parameters against schema and range boundaries

**Use when**

When handling incoming chat completion, tokenization, generation, and batch requests to ensure parameters conform to required types, ranges, lengths, and logical constraints.

**Secure rules**

**Rule 1: Validate request schemas and cross-parameter constraints using validation traits or request normalization.**

Invoke `validate()` on deserialized request structs to enforce parameter range limits and logical dependencies such as `min_tokens` <= `max_completion_tokens` and mutually exclusive options before passing payloads into the execution pipeline.

```rust
use validator::Validate;

let mut req: ChatCompletionRequest = serde_json::from_slice(&body_bytes)?;
req.normalize();
req.validate()?;
```

**Rule 2: Enforce strict float range validation for reasoning effort parameters.**

Ensure `reasoning_effort` template kwargs are restricted to recognized string keywords or numeric float values strictly within the range `[0.0, 0.99]` to prevent template generation errors.

```rust
use serde_json::json;

let kwargs = json!({"reasoning_effort": "high"});
let numeric_kwargs = json!({"reasoning_effort": 0.7});
```

**Rule 3: Validate multimodal pooling and embedding input fields and content schemas strictly.**

Ensure embedding requests specify exactly one non-empty input field among `texts`, `images`, or `inputs`, and that nested content objects provide required valid fields such as `image_url.url`.

```python
from vllm.entrypoints.pooling.embed.protocol import CohereEmbedRequest

req_text = CohereEmbedRequest(
    model="cohere-embed-v3",
    texts=["Represent this text"]
)
```

**Rule 4: Enforce strict tensor shape and dtype validation for user prompt embeddings.**

Verify that custom prompt embedding payloads conform strictly to 2D floating-point tensors matching the model hidden size, rejecting non-tensor payloads and dimension mismatches.

```python
import io
import pybase64 as base64
import torch

tensor = torch.randn(10, 768, dtype=torch.float32)
buffer = io.BytesIO()
torch.save(tensor, buffer)
encoded_payload = base64.b64encode(buffer.getvalue())
```


### Validate token IDs, vocabulary bounds, and custom logits processor parameters

**Use when**

When verifying token ID arrays, sampling parameters, and custom processor arguments prior to engine execution.

**Secure rules**

**Rule 1: Validate token ID arrays against non-negative integer bounds and vocabulary limits.**

Ensure all user-supplied token IDs in prompts, sampling parameters, and derender requests contain only non-negative integers and fall within configured model vocabulary limits before execution.

```python
def validate_token_ids(token_ids: list[int]) -> list[int]:
    if not token_ids:
        raise ValueError("token_ids list cannot be empty")
    if any(t < 0 for t in token_ids):
        raise ValueError("token_ids must contain only non-negative integers")
    return token_ids
```

**Rule 2: Implement strict parameter validation inside custom logits processor `validate_params` methods.**

Define `validate_params` on custom logits processor subclasses to verify type, presence, and boundary bounds of extra parameters when requests arrive at the entrypoint.

```python
from vllm.sampling_params import SamplingParams
from vllm.v1.sample.logits_processor import LogitsProcessor

class CustomLogitsProcessor(LogitsProcessor):
    @classmethod
    def validate_params(cls, params: SamplingParams):
        target_token = params.extra_args and params.extra_args.get("target_token")
        if target_token is not None and not isinstance(target_token, int):
            raise ValueError(f"target_token value {target_token} is not an integer")
```


## Category: input driven boundary selection

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


## Category: input interpretation safety

### Sanitize and Validate Untrusted Input to Reject Reserved Placeholders and Invalid Formats

**Use when**

When validating, sanitizing, or parsing untrusted user chat messages, prompt strings, tool call arguments, or reasoning effort parameters to ensure unambiguous interpretation and prevent parser tampering.

**Secure rules**

**Rule 1: Reject user-supplied chat text and prompts containing internal reserved sentinel tokens or embedding placeholders.**

Always validate or sanitize user-provided text content before processing to ensure it does not contain reserved internal tokens such as `<prompt_embeds>`, `<##IMAGE##>`, `<##AUDIO##>`, `<##VIDEO##>`, or `<##PROMPT_EMBEDS##>`. Catch `ValueError` exceptions during chat message parsing to gracefully handle reserved placeholder injection attempts.

```python
RESERVED_TOKENS = ["<prompt_embeds>", "<##IMAGE##>", "<##AUDIO##>", "<##VIDEO##>"]

def sanitize_chat_text(text: str) -> str:
    for token in RESERVED_TOKENS:
        if token in text:
            raise ValueError(f"Text contains reserved token {token!r}")
    return text
```

**Rule 2: Strictly validate assistant tool call arguments and numeric boundaries before prompt rendering.**

Ensure tool call arguments parse into valid JSON objects or dictionaries and that numeric parameters like `reasoning_effort` are strictly restricted to allowed bounds such as between `0.0` and `0.99` prior to downstream rendering.

```python
reasoning_effort = 0.5
if not (isinstance(reasoning_effort, (int, float)) and 0.0 <= float(reasoning_effort) <= 0.99):
    raise ValueError("Invalid reasoning_effort")
```


## Category: interface protocol hardening

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


## Category: memory safety

### Validate sparse tensor bounds before dense memory conversion

**Use when**

Processing user-supplied sparse COO tensors or prompt embeddings to prevent out-of-bounds memory writes.

**Secure rules**

**Rule 1: Validate sparse tensor index bounds prior to dense conversion operations.**

Ensure that any user-supplied sparse tensors have their index boundaries verified against expected shapes before performing operations like `to_dense()`. Use embedding helpers such as `safe_load_prompt_embeds` or media IO classes to reject out-of-bounds, negative, or extremely large sparse indices.

```python
from vllm.config import ModelConfig
from vllm.renderers.embed_utils import safe_load_prompt_embeds

try:
    loaded_embeds = safe_load_prompt_embeds(model_config, encoded_tensor_bytes)
except (RuntimeError, ValueError) as err:
    pass
```


## Category: network boundary

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


## Category: resource exhaustion

### Configure Resource and Media Input Limits to Prevent Denial of Service

**Use when**

When configuring vLLM inference servers and processing media files, requests, or structured inputs that could cause resource exhaustion or out-of-memory errors.

**Secure rules**

**Rule 1: Enforce explicit media decode resource limits and avoid zero values in public environments**

Configure media decode resource limits such as `VLLM_MAX_IMAGE_PIXELS`, `VLLM_MAX_AUDIO_CLIP_FILESIZE_MB`, and `VLLM_MAX_AUDIO_DECODE_DURATION_S` to prevent decompression bombs and out-of-memory crashes.

```bash
export VLLM_MAX_IMAGE_PIXELS=178956970
export VLLM_MAX_AUDIO_CLIP_FILESIZE_MB=25
export VLLM_MAX_AUDIO_DECODE_DURATION_S=600
vllm serve mistralai/Pixtral-12B-2409
```

**Rule 2: Restrict maximum sequence generation count and batch concurrency parameters**

Cap request sequence parameters and environment variables like `VLLM_MAX_N_SEQUENCES` and configure scheduler limits to prevent excessive memory and execution time allocation.

```bash
export VLLM_MAX_N_SEQUENCES=64
vllm serve meta-llama/Llama-2-7b-chat-hf
```


## Category: runtime environment hardening

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


## Category: secret handling

### Protect API Tokens and Credentials in Execution Environments

**Use when**

Setting up Hugging Face tokens, OpenAI API keys, and server authorization credentials for benchmark runners and API servers.

**Secure rules**

**Rule 1: Protect Hugging Face access tokens in environment variables or container secrets.**

When fetching gated or private datasets or models, ensure credentials are automatically read from environment variables like `HF_TOKEN` rather than being hardcoded.

```bash
export HF_TOKEN="hf_your_access_token_here"
```


### Secure Cloud Storage and Model Loader Credentials

**Use when**

Configuring cloud storage credentials, tensorizer URIs, or KV cache offloading destinations for vLLM models.

**Secure rules**

**Rule 1: Load S3 access keys and secrets via environment variables instead of hardcoding them into source files or configuration options.**

Avoid hardcoding sensitive credentials such as access keys or secret keys in source code or configuration files. Rely on environment variables like `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` or secure key files.

```python
import os
from vllm.model_executor.model_loader.tensorizer import TensorizerConfig

config = TensorizerConfig(
    tensorizer_uri="s3://my-bucket/model.tensors",
    encryption_keyfile="/secrets/tensor_key.bin",
    s3_access_key_id=os.getenv("S3_ACCESS_KEY_ID"),
    s3_secret_access_key=os.getenv("S3_SECRET_ACCESS_KEY"),
)
```

**Rule 2: Avoid embedding explicit cloud credentials in server arguments or CLI configurations.**

Do not embed explicit cloud credentials directly in command-line arguments or plain JSON configuration strings. Leave credential fields empty to rely on IAM roles, workload identity, or environment variables.

```bash
vllm serve <model> \
  --kv-transfer-config '{
    "kv_connector": "OffloadingConnector",
    "kv_role": "kv_both",
    "kv_connector_extra_config": {
      "spec_name": "TieringOffloadingSpec",
      "cpu_bytes_to_use": 10737418240,
      "secondary_tiers": [
        {
          "type": "obj",
          "store_config": {
            "bucket": "my-kv-cache-bucket",
            "endpoint_override": "s3.us-west-2.amazonaws.com",
            "scheme": "https"
          }
        }
      ]
    }
  }'
```

**Rule 3: Inject API keys and cloud storage secrets using container environment secret managers.**

Pass sensitive credentials such as `VLLM_API_KEY`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` from environment variables without committing them to source control, container images, or shell histories.

```bash
docker run -e VLLM_API_KEY="$SECURE_VLLM_API_KEY" \
           -e S3_ACCESS_KEY_ID="$SECURE_S3_KEY" \
           -e S3_SECRET_ACCESS_KEY="$SECURE_S3_SECRET" \
           vllm/vllm-openai:latest
```


## Category: security control integrity

### Disconnect P2P Sessions Instantly on Protocol Validation Failures

**Use when**

Developing or extending control message handlers for P2P offloading in vLLM to ensure protocol violations trigger immediate connection termination.

**Secure rules**

**Rule 1: Raise a ValueError when encountering malformed control payloads in P2P message validation logic.**

Perform strict field checks within control message handlers and explicitly raise a `ValueError` when encountering malformed data. `P2PSession` relies on catching this exception as an unrecoverable protocol contract violation to immediately terminate the connection and prevent peer-induced fault state loops.

```python
def validate_custom_msg(msg: dict) -> None:
    if 'required_key' not in msg or not isinstance(msg['required_key'], str):
        raise ValueError('Invalid protocol message payload format')
```
