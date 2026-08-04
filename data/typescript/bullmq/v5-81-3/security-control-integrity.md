# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: security control integrity

## security control integrity

### Enforce fail-closed error handling and automatic lock renewal for worker execution paths

**Use when**

Configuring worker locks and handling lock renewal failures to ensure jobs fail closed and prevent concurrent duplicate execution.

**Secure rules**

**Rule 1: Keep automatic lock renewal enabled and design processors for possible re-execution**

Leave `skipLockRenewal` set to `false`. BullMQ periodically renews active-job locks, with `lockRenewTime` normally derived from half of `lockDuration`; therefore, `lockDuration` does not need to cover the job’s entire processing time. Avoid blocking the Node.js event loop so renewal can run, and use sandboxed processors for CPU-heavy work.

Do not treat lock renewal as a fail-closed or exactly-once guarantee. If renewal fails and the lock expires, stalled-job recovery can return the job to waiting for another execution. Keep job effects idempotent and monitor `lockRenewalFailed`, `stalled`, and `error` events.

```typescript
import { Worker } from 'bullmq';

interface NormalizeJobData {
  value: string;
}

const worker = new Worker<NormalizeJobData>(
  'normalization',
  async job => {
    // This pure transformation is safe to execute again.
    return {
      normalized: job.data.value.trim().toLowerCase(),
    };
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
    skipLockRenewal: false,
    lockDuration: 30_000,
  },
);

worker.on('lockRenewalFailed', jobIds => {
  console.error('Lock renewal failed:', jobIds);
});

worker.on('stalled', jobId => {
  console.warn('Job stalled and may be retried:', jobId);
});

worker.on('error', error => {
  console.error('Worker error:', error);
});
```
