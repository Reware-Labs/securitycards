# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: file handling

## file handling

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
