# Security cards

Repository: `https://github.com/vllm-project/vllm#v0.26.0`
Documentation repository: `https://github.com/vllm-project/vllm-docs#main`
Category: security control integrity

## security control integrity

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
