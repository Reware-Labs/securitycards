# Security blueprint

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`

## Security posture

When developing applications with BullMQ, engineers must assume responsibility for securing Redis connectivity, validating job inputs and runtime configurations, and managing distributed concurrency locks safely. While BullMQ handles queue orchestration and default lock renewal, it does not validate custom input schemas, prevent unvalidated script or process execution paths, or secure network boundaries by default. Developers must enforce strict payload limits, authenticate credentials securely, and fail closed when concurrency or state transition boundaries are violated.

## Essential implementation rules

1. **Enforce Lock Ownership and Token Validation for Manual Operations**

When manually fetching jobs via `Worker.getNextJob()`, generate a fresh UUID token and pass it to all lock-sensitive operations including `extendLock()`, `moveToCompleted()`, `moveToFailed()`, and script helpers like `scripts.extendLock`. Verify server-side ownership to prevent unauthorized or stale worker instances from altering Redis lock states.

2. **Match Parameter Signatures, Key Counts, and Declare Cancellation Signals**

Declare at least three positional parameters `(job, token, signal)` in inline processor functions to receive cancellation signals correctly. When executing custom Lua scripts, ensure `num_keys` strictly matches the provided key argument list and adheres to naming conventions.

3. **Pass Lock Tokens and Throw Control Errors During Manual State Transitions**

Always pass the worker lock token when calling manual job transition methods such as `moveToDelayed`, `moveToWaitingChildren`, or `moveToWait`. Immediately throw the corresponding control error (`DelayedError`, `WaitingChildrenError`, or `WaitingError`) to yield execution and prevent concurrent completion or failure handling.

4. **Validate Configuration Inputs and Environment Sources Before Initialization**

Sanitize and validate configuration parameters derived from environment variables or external sources before passing them into `Queue` or `Worker` constructors to prevent runtime errors and ensure namespace integrity.

5. **Configure Collision-Resistant Repeatable Key Hashing**

Set the `repeatKeyHashAlgorithm` option on Queue instances to an approved standard algorithm such as `sha256` instead of the default `md5` mechanism to meet strict compliance and cryptographic policies.

6. **Validate Processor Paths and Restrict Script Loader Directories**

Ensure sandboxed worker processor paths and ScriptLoader directory mappings use explicit, hardcoded application references or strict allowlists. Never accept unvalidated dynamic paths to prevent arbitrary code execution or path traversal.

7. **Validate Queue Names, Cron Expressions, Timezones, and Schedulers**

Validate dynamic queue names to reject empty strings and colon characters. Verify cron patterns, IANA timezones, and ensure scheduler `endDates` are not set in the past before upserting job schedulers.

8. **Reject Non-Finite Numeric Values in Job Payloads and Schedulers**

Recursively inspect and reject `NaN`, positive infinity, and negative infinity using `Number.isFinite()` across all nested numbers in job data and scheduler templates prior to enqueueing.

9. **Restrict Redis and MemoryDB Access to Authorized VPC and Security Group Boundaries**

Deploy applications connecting to Redis or AWS MemoryDB within trusted Virtual Private Clouds, and restrict security group inbound rules on port `6379` strictly to authorized application services and workers.

10. **Configure Job Retention, Concurrency Bounds, and Payload Size Limits**

Configure explicit job retention limits (`removeOnComplete`, `removeOnFail`), worker concurrency and rate limiting bounds, and default payload size limits (`defaultJobOptions.sizeLimit`) to prevent memory exhaustion and resource degradation.

11. **Paginate Queue Getter Queries to Prevent Heap Memory Exhaustion**

Always supply explicit start and end offsets when querying queue items, job lists, or logs via methods like `queue.getCompleted()` or `queue.getJobLogs()` to avoid loading massive datasets into memory.

12. **Isolate Sandboxed Worker Processes and Execution Options**

Set `useWorkerThreads` to false for sandboxed processors, and use `workerForkOptions` to explicitly configure environment variables like `NODE_ENV` and resource limits via `execArgv` without inheriting unintended parent process secrets.

13. **Load Redis Credentials and Package Registry Tokens Securely**

Load Redis authentication credentials from environment variables or managed secret providers, and use environment variable interpolation for private package registry authentication tokens in `.npmrc` files.

14. **Keep Automatic Lock Renewal Enabled and Design for Idempotency**

Leave `skipLockRenewal` set to `false` to let BullMQ periodically renew active-job locks. Design processors for idempotent re-execution to handle cases where lock renewal fails and stalled-job recovery retries execution.
