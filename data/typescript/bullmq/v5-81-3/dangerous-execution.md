# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: dangerous execution

## dangerous execution

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
