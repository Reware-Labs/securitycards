# Security cards

Repository: `https://github.com/sgl-project/sglang#v0.5.16`
Category: session management

## session management

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
