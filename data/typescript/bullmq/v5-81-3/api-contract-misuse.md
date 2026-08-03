# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: api contract misuse

## api contract misuse

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
