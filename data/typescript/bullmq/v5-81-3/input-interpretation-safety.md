# Security cards

Repository: `https://github.com/taskforcesh/bullmq#v5.81.3`
Category: input interpretation safety

## input interpretation safety

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
