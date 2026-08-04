# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: access control

## access control

### Enforce Lock Ownership When Processing Jobs Manually

**Use when**

When manually fetching jobs from a queue and performing custom state transitions or lock extensions.

**Secure rules**

**Rule 1: Use a unique ownership token for each manually fetched job**

Before each manual call to `Worker.getNextJob()`, generate a fresh UUID and pass it as the lock token. Reuse that same token for every lock-sensitive operation on the fetched job, including `extendLock()`, `moveToCompleted()`, and `moveToFailed()`. Create the processor-less worker with the required `connection` option.

Manual processing does not renew locks automatically. Finish within the configured `lockDuration` or extend the lock with the job’s token.

```typescript
import { randomUUID } from 'node:crypto';
import { Worker } from 'bullmq';

const worker = new Worker<{ value: number }, number>('my-queue', null, {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

async function processOneJob(): Promise<void> {
  const token = randomUUID();
  const job = await worker.getNextJob(token);

  if (!job) {
    return;
  }

  try {
    await job.extendLock(token, 30_000);

    const result = job.data.value * 2;
    await job.moveToCompleted(result, token, false);
  } catch (error) {
    const failure =
      error instanceof Error ? error : new Error(String(error));

    await job.moveToFailed(failure, token, false);
  }
}

try {
  await processOneJob();
} finally {
  await worker.close();
}
```
