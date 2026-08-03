# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: runtime environment hardening

## runtime environment hardening

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
