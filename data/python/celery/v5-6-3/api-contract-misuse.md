# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: api contract misuse

## api contract misuse

### Avoid Re-executing Frozen Task Signatures Multiple Times

**Use when**

Developing workflows that construct, freeze, and asynchronously execute Celery signature instances.

**Secure rules**

**Rule 1: Clone an unfrozen task signature before each frozen dispatch**

Do not dispatch the same `Signature` more than once after calling `.freeze()`, because each dispatch will use the same task ID. When multiple independently tracked executions are required, create a separate clone from an unfrozen base signature, then freeze and dispatch each clone once.

```python
base_sig = my_task.s(arg1)

exec1_sig = base_sig.clone()
exec1_sig.freeze()
res1 = exec1_sig.apply_async()

exec2_sig = base_sig.clone()
exec2_sig.freeze()
res2 = exec2_sig.apply_async()
```
