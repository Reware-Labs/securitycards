# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: boundary control

## boundary control

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
