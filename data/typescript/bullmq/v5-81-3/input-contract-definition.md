# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: input contract definition

## input contract definition

### Validate Queue Names and Scheduling Input Against Explicit Contracts

**Use when**

Enforcing input validation and schema structures on queue names, cron expressions, timezones, and scheduler end dates before registering tasks or instantiating components in BullMQ.

**Secure rules**

**Rule 1: Validate queue names to reject empty strings, invalid characters, and colons before initialization.**

Check that dynamic queue names supplied to components do not contain colon characters or empty identifiers to maintain Redis key namespace integrity and prevent runtime syntax errors.

```rust
use bullmq::{QueueKeys, Error};

fn create_safe_queue_keys(queue_name: &str, prefix: Option<&str>) -> Result<QueueKeys, Error> {
    if queue_name.is_empty() || queue_name.contains(':') {
        return Err(Error::InvalidConfig("Queue name cannot be empty or contain ':'".to_string()));
    }
    Ok(QueueKeys::new(queue_name, prefix))
}
```

**Rule 2: Reject past end dates when upserting job schedulers**

Before calling `Queue.upsertJobScheduler()`, reject an `endDate` that is already earlier than the current timestamp. BullMQ v5.81.3 performs the same input check and throws `End date must be greater than current timestamp` for a past value.

Distinguish this initial validation from normal scheduler expiration: after an existing scheduler reaches its valid `endDate`, BullMQ stops scheduling subsequent jobs without treating the expiration as an error.

```typescript
import { Queue } from 'bullmq';

const queue = new Queue('reports', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function upsertExpiringScheduler(endDate: Date): Promise<void> {
  if (endDate.getTime() < Date.now()) {
    throw new RangeError('Scheduler endDate must not be in the past');
  }

  await queue.upsertJobScheduler(
    'temporary-report',
    {
      every: 60_000,
      endDate,
    },
    {
      name: 'generate-report',
      data: { format: 'json' },
    },
  );
}

try {
  await upsertExpiringScheduler(new Date(Date.now() + 60 * 60 * 1000));
} finally {
  await queue.close();
}
```

**Rule 3: Validate cron expressions and timezone identifiers prior to registering repeat schedulers.**

Verify user-supplied cron patterns and IANA timezone strings against validation libraries before passing configuration parameters to `upsertJobScheduler` to prevent uncaught exceptions.

```python
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from croniter import croniter

def schedule_task(queue, scheduler_id: str, pattern: str, tz_name: str, payload: dict):
    if tz_name:
        try:
            ZoneInfo(tz_name)
        except ZoneInfoNotFoundError:
            raise ValueError(f"Invalid timezone: {tz_name}")
    if not croniter.is_valid(pattern):
        raise ValueError(f"Invalid cron expression: {pattern}")

    return queue.upsertJobScheduler(
        scheduler_id,
        {"pattern": pattern, "tz": tz_name},
        job_name="scheduled_task",
        job_data=payload
    )
```
