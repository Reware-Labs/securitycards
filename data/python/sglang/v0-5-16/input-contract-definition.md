# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: input contract definition

## input contract definition

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
