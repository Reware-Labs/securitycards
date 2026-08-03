# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: network boundary

## network boundary

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
