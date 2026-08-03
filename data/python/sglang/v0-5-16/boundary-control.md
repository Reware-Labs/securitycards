# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: boundary control

## boundary control

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
