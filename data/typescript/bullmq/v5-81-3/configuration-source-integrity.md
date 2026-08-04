# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: configuration source integrity

## configuration source integrity

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
