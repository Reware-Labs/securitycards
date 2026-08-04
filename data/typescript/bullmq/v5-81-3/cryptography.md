# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: cryptography

## cryptography

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
