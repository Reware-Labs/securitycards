# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: deserialization

## deserialization

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
