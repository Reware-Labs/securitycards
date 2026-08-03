# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`

## Category: access control

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


## Category: api contract misuse

### Enforce Strict Parameter Arity and Key Count Matching for BullMQ Scripts and Processors

**Use when**

When defining worker processor functions, custom Lua scripts, or handling cancellation tokens where exact parameter signatures and key counts are required by BullMQ APIs.

**Secure rules**

**Rule 1: Declare at least three processor parameters to receive cancellation signals**

For an inline cancellation-aware processor, declare at least three positional parameters in this order: `(job, token, signal)`. BullMQ uses the processor’s declared arity to determine whether to create an `AbortController`; processors with fewer than three declared parameters are not treated as signal-aware.

The second parameter is the job’s lock token. The third parameter is the optional `AbortSignal`. Use the signal with cancellation-aware APIs or listen for its `abort` event so the processor can stop work and release resources cooperatively.

```typescript
import { Worker } from 'bullmq';

interface FetchJobData {
  url: string;
}

const worker = new Worker<FetchJobData>(
  'fetch-queue',
  async (job, _token, signal) => {
    const response = await fetch(job.data.url, { signal });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
);

worker.on('error', error => {
  console.error('Worker error:', error);
});
```

**Rule 2: Ensure exact key count matching when executing Lua scripts or naming custom script files.**

When instantiating `LuaScript` or invoking script execution, ensure `num_keys` strictly equals the number of elements passed in the keys argument list, and adhere to expected naming conventions like `commandName-numberOfKeys.lua` so that Redis correctly separates key parameters from regular arguments.

```rust
use bullmq::scripts::LuaScript;

// Create script requiring 1 key argument
let script = LuaScript::new("updateJob", 1, "return redis.call('SET', KEYS[1], ARGV[1])");

// Pass exactly 1 key and 1 argument during execution
let keys = vec!["bull:myqueue:1"];
let args = vec!["completed"];
let res = script.execute(&mut conn, &keys, &args).await;
```


### Pass Lock Tokens and Control Errors During Manual Job State Transitions

**Use when**

When managing job state manually inside BullMQ worker processor functions by invoking transition methods like `moveToDelayed`, `moveToWaitingChildren`, or `moveToWait`.

**Secure rules**

**Rule 1: Provide the worker lock token and throw the corresponding control error during manual job state transitions.**

When invoking methods such as `job.moveToDelayed()`, `job.moveToWaitingChildren()`, or `job.moveToWait()` within a worker processor function, always pass the worker's lock `token` parameter. Immediately after, throw the designated control error (`DelayedError`, `WaitingChildrenError`, or `WaitingError`) to signal the worker lifecycle runner to yield execution and prevent concurrent completion or failure handling.

```typescript
import { Worker, Job, DelayedError, WaitingChildrenError } from 'bullmq';

const worker = new Worker(
  'queueName',
  async (job: Job, token?: string) => {
    if (needDelay) {
      await job.moveToDelayed(Date.now() + 1000, token);
      throw new DelayedError();
    }
    if (needChildren) {
      const shouldWait = await job.moveToWaitingChildren(token);
      if (shouldWait) {
        throw new WaitingChildrenError();
      }
    }
  },
  { connection }
);
```


## Category: boundary control

### Validate Lock Tokens During Job Lock Extension

**Use when**

When implementing or managing explicit job lock extensions and concurrency control across distributed worker instances.

**Secure rules**

**Rule 1: Validate the worker's unique lock token during job lock extension**

Ensure explicit job lock extension calls pass the worker's unique lock token alongside the job ID so that Redis lock state cannot be altered by stale or unauthorized worker instances. Supply the unique lock token generated for the job attempt when using low-level script helpers such as `scripts.extendLock`.

```typescript
await scripts.extendLock(jobId, token, durationMs);
```

**Rule 2: Verify lock ownership prior to state transitions**

Always enforce server-side ownership checks by validating authorization tokens before permitting state transitions or lock extensions across distributed worker boundaries.


## Category: configuration source integrity

### Validate configuration and environment sources before initializing BullMQ components

**Use when**

Initializing BullMQ components such as `Queue` or `Worker` using configuration parameters derived from environment variables or external sources.

**Secure rules**

**Rule 1: Validate and sanitize configuration inputs from environment variables before initializing components.**

Ensure that parameters like queue names and job options are strictly checked and confirmed to be defined strings or numbers prior to passing them into classes like `Queue` or `Worker` to prevent runtime errors and unexpected behavior.

```typescript
const queueName = process.env.QUEUE_NAME;
if (!queueName) {
  throw new Error("QUEUE_NAME is not defined or is empty.");
}

const queue = new Queue(queueName, { connection });
```


## Category: cryptography

### Configure standard hash algorithms for repeatable keys

**Use when**

When instantiating a Queue in BullMQ and configuring repeatable job key generation settings to meet compliance standards.

**Secure rules**

**Rule 1: Specify a collision-resistant standard algorithm for repeatable key hashing**

Set the `repeatKeyHashAlgorithm` setting to an approved algorithm like `sha256` instead of relying on the default `md5` hashing mechanism, ensuring compliance with strict security and cryptographic policies.

```typescript
import { Queue } from 'bullmq';

const myQueue = new Queue('tasks', {
  connection: { host: '127.0.0.1', port: 6379 },
  settings: {
    repeatKeyHashAlgorithm: 'sha256'
  }
});
```


## Category: dangerous execution

### Validate Processor File Paths Before Spawning Sandboxed Workers

**Use when**

Instantiating a `Worker` with a sandboxed file path or URL processor where processor paths must be configured securely.

**Secure rules**

**Rule 1: Ensure processor paths for sandboxed workers are hardcoded or validated against a strict allowlist instead of using dynamic, user-controlled input.**

When instantiating a `Worker` with a sandboxed file path or URL processor, use explicit, static file paths or safe path resolution references rather than accepting unvalidated dynamic paths to prevent arbitrary code execution or local file inclusion.

```typescript
import { Worker } from 'bullmq';
import * as path from 'path';

const processorPath = path.join(__dirname, 'processors/my-job-processor.js');
const worker = new Worker('my-queue', processorPath, {
  connection: { host: 'localhost', port: 6379 },
  useWorkerThreads: true,
});
```


## Category: file handling

### Sanitize and restrict local filesystem paths supplied to script loader mappings

**Use when**

Configuring path mappings or loading Lua scripts from directory paths where untrusted input could influence filesystem paths.

**Secure rules**

**Rule 1: Restrict script loader path mappings and Lua script loading directories to explicit, trusted, hardcoded locations.**

Always configure path mappings with explicit, hardcoded application directories and avoid accepting dynamic path input. Ensure paths supplied to `ScriptLoader.addPathMapping` or when loading scripts originate strictly from trusted locations to prevent path traversal or arbitrary filesystem reading.

```typescript
const scriptLoader = new ScriptLoader();
scriptLoader.addPathMapping('custom', path.resolve(__dirname, '../scripts/lua'));
await scriptLoader.load(redisClient, path.resolve(__dirname, '../scripts/lua'));
```


## Category: input contract definition

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


## Category: input interpretation safety

### Restrict Job Payload Numbers to Finite Values and Reject Non-Compliant Formats

**Use when**

When validating, sanitizing, and restricting numeric formats in job payload dictionaries or scheduler data before serialization.

**Secure rules**

**Rule 1: Recursively reject non-finite numbers before enqueueing TypeScript payloads**

Before passing data to `Queue.add()` or as a job-scheduler template, recursively inspect every numeric value in nested objects and arrays. Reject `NaN`, positive infinity, and negative infinity with `Number.isFinite()`.

Do not rely on TypeScript payload types or a top-level-only check: BullMQ’s data type is not runtime validation, and BullMQ serializes the complete payload with `JSON.stringify`.

```typescript
import { Queue } from 'bullmq';

type JsonValue =
  | null
  | boolean
  | string
  | number
  | JsonValue[]
  | { [key: string]: JsonValue };

function assertFiniteNumbers(
  value: JsonValue,
  path = 'payload',
): void {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path} must be a finite number`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      assertFiniteNumbers(item, `${path}[${index}]`);
    });
    return;
  }

  if (value !== null && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      assertFiniteNumbers(item, `${path}.${key}`);
    }
  }
}

const queue = new Queue('measurements', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});

const jobData: JsonValue = {
  deviceId: 'sensor-7',
  readings: [18.4, 18.7],
  summary: {
    average: 18.55,
  },
};

const schedulerData: JsonValue = {
  source: {
    latitude: 52.52,
    longitude: 13.405,
  },
};

try {
  assertFiniteNumbers(jobData);
  await queue.add('process-readings', jobData);

  assertFiniteNumbers(schedulerData);
  await queue.upsertJobScheduler(
    'collect-readings',
    { every: 60_000 },
    {
      name: 'collect',
      data: schedulerData,
    },
  );
} finally {
  await queue.close();
}
```


## Category: network boundary

### Restrict Redis and MemoryDB Access to Authorized VPC and Security Group Boundaries

**Use when**

Configuring network access and connection endpoints for BullMQ producers and workers connecting to Redis or AWS MemoryDB.

**Secure rules**

**Rule 1: Restrict network inbound rules and deployment boundaries exclusively to trusted VPCs and application security groups.**

Ensure applications connecting to AWS MemoryDB are deployed within the target AWS Virtual Private Cloud, and restrict AWS Security Group inbound traffic on port `6379` exclusively to the application services and workers interacting with BullMQ rather than using broad source CIDRs in production.

```typescript
import { Cluster } from 'ioredis';
import { Worker } from 'bullmq';

const connection = new Cluster([
  {
    host: 'clustercfg.xxx.amazonaws.com',
    port: 6379,
  },
], {
  tls: {},
});
```


## Category: resource exhaustion

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


## Category: runtime environment hardening

### Configure Sandboxed Worker Process Isolation and Execution Options

**Use when**

When instantiating sandboxed job processors in BullMQ to isolate execution and prevent resource leaks or unintended environment variable inheritance.

**Secure rules**

**Rule 1: Isolate sandboxed processors using separate child processes and explicitly configure worker fork options to restrict environment variable inheritance and resource usage.**

Set `useWorkerThreads` to false to ensure workers run in separate child processes rather than shared worker threads. Use `workerForkOptions` to explicitly define environment variables like `NODE_ENV` and pass execution arguments such as resource limits via `execArgv` to avoid exposing sensitive parent process secrets.

```typescript
import { Worker } from 'bullmq';
import path from 'path';

const worker = new Worker('sandboxed-queue', path.join(__dirname, 'processor.js'), {
  connection: { host: '127.0.0.1', port: 6379 },
  useWorkerThreads: false,
  workerForkOptions: {
    env: { NODE_ENV: 'production' },
    execArgv: ['--max-old-space-size=512']
  }
});
```


## Category: secret handling

### Load Redis connection credentials securely via environment variables or trusted secret providers

**Use when**

Configuring Redis connection parameters, client options, or private registries when initializing BullMQ queues, workers, or package managers.

**Secure rules**

**Rule 1: Load Redis authentication credentials from environment variables or managed secret providers instead of hardcoding them into source code or connection strings.**

When instantiating a Queue or Redis connection, pass credentials dynamically from environment variables rather than embedding plaintext passwords or secrets directly in code, configuration files, or supervision tree specifications.

```php
$queue = new Queue('email-queue', [
    'connection' => [
        'host' => getenv('REDIS_HOST') ?: '127.0.0.1',
        'port' => (int)(getenv('REDIS_PORT') ?: 6379),
        'username' => getenv('REDIS_USER') ?: null,
        'password' => getenv('REDIS_PASSWORD') ?: null,
    ],
]);
```

**Rule 2: Use environment variable interpolation for private package registry authentication tokens.**

When configuring `.npmrc` to download packages from private registries, use environment variable interpolation instead of hardcoding actual authentication tokens into configuration files or container files.

```ini
@taskforcesh:registry=https://npm.taskforce.sh/
//npm.taskforce.sh/:_authToken=${NPM_TASKFORCESH_TOKEN}
always-auth=true
```


## Category: security control integrity

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
