# Security cards

Repository: `https://github.com/celery/celery#v5.6.3`
Category: access control

## access control

### Restrict Access to Destructive Worker Management Commands

**Use when**

When operators manage Celery workers, monitor task queues, or execute administrative commands like `celery purge` and `celery shell`.

**Secure rules**

**Rule 1: Scope Celery purge operations to the intended queues**

Because `celery purge` permanently deletes queued messages and cannot be undone, specify the queues to purge with `-Q` or protect queues from purging with `-X` instead of unintentionally purging every configured task queue.

```bash
celery -A proj purge -Q specific_queue
celery -A proj purge -X sensitive_queue
```
