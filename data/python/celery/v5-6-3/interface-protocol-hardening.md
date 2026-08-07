# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: interface protocol hardening

## interface protocol hardening

### Exclude Broker Dead-Letter Headers When Re-publishing Task Messages

**Use when**

When converting task request contexts into task signatures during retries or manually forwarding message headers.

**Secure rules**

**Rule 1: Ensure broker-specific dead-letter headers are excluded when manually constructing task execution signatures from raw message contexts.**

When converting task request contexts into task signatures during retries, Celery automatically strips broker dead-letter headers such as `x-death`, `x-first-death-*`, and `x-last-death-*`. Developers must ensure broker-specific death headers are excluded when manually forwarding headers to prevent routing conflicts and unexpected messaging transport behavior.

```python
@app.task(bind=True)
def safe_retry_task(self):
    try:
        do_work()
    except Exception as exc:
        sig = self.signature_from_request()
        raise self.retry(exc=exc)
```
