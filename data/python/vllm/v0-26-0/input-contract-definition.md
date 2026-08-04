# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: input contract definition

## input contract definition

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
