# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: resource exhaustion

## resource exhaustion

### Configure Job Retention and Auto-Removal

**Use when**

When managing finalized jobs in Redis to prevent unbounded storage growth and memory exhaustion.

**Secure rules**

**Rule 1: Configure job retention limits and auto-removal rules.**

Configure job retention rules using completion and failure removal options with explicit count and age bounds to automatically prune finished job data from Redis.

```typescript
const worker = new Worker(
  'myQueueName',
  async (job) => {},
  {
    connection,
    removeOnComplete: {
      age: 3600,
      count: 1000,
      limit: 100,
    },
    removeOnFail: {
      age: 24 * 3600,
      count: 5000,
      limit: 50,
    },
  }
);
```


### Configure Worker Concurrency and Rate Limiting Bounds

**Use when**

When initializing worker instances and defining job processing throughput limits to prevent resource exhaustion.

**Secure rules**

**Rule 1: Set concurrency and rate limiting bounds on worker options.**

Explicitly configure concurrency limits and rate limiting parameters on worker instances to prevent high volumes of jobs from overwhelming local host resources or downstream systems.

```rust
use std::time::Duration;
use bullmq::{RateLimiterOptions, WorkerOptions};

let options = WorkerOptions::new()
    .concurrency(8)
    .limiter(RateLimiterOptions::new(100, Duration::from_secs(1)))
    .max_started_attempts(5);
```


### Enforce Job Payload Size Limits

**Use when**

When creating jobs with user-supplied or dynamic payloads to prevent Redis memory exhaustion.

**Secure rules**

**Rule 1: Apply a default payload-size limit to TypeScript queues**

Set `defaultJobOptions.sizeLimit` when constructing a TypeScript `Queue`. BullMQ measures the UTF-8 byte length of the JSON-serialized job data and rejects job creation when that length exceeds the configured limit.

Per-job options are merged after queue defaults and can override `sizeLimit`. When the value is a mandatory upper bound, expose a controlled enqueue function that does not accept arbitrary job options capable of weakening the limit.

```typescript
import { Queue } from 'bullmq';

interface UploadJobData {
  objectKey: string;
  checksum: string;
}

const MAX_PAYLOAD_BYTES = 64 * 1024;

const queue = new Queue<UploadJobData>('uploads', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
  defaultJobOptions: {
    sizeLimit: MAX_PAYLOAD_BYTES,
  },
});

async function enqueueUpload(data: UploadJobData) {
  return queue.add('process-upload', data);
}

try {
  await enqueueUpload({
    objectKey: 'incoming/report.pdf',
    checksum: 'sha256:0123456789abcdef',
  });
} finally {
  await queue.close();
}
```


### Paginate Queue Getter Queries

**Use when**

When fetching job lists or logs from queues to prevent Node.js heap memory exhaustion.

**Secure rules**

**Rule 1: Supply explicit start and end offsets when querying queue items.**

Always supply explicit start and end offsets to paginate queue getter queries and avoid loading massive datasets into memory.

```typescript
const pageSize = 50;
const start = 0;
const end = start + pageSize - 1;

const completedJobs = await queue.getCompleted(start, end);
const jobLogs = await queue.getJobLogs(jobId, start, end);
```
