# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: resource exhaustion

## resource exhaustion

### Prevent Connection and Socket Exhaustion in Server-Sent Events

**Use when**

Implementing Server-Sent Events (SSE) or managing persistent connections in NestJS applications using Express or Fastify.

**Secure rules**

**Rule 1: Provide teardown for resources started by a custom SSE Observable.**

Nest unsubscribes from an SSE Observable when the client disconnects. When a custom Observable starts a resource such as an interval, return teardown logic from the Observable so that unsubscription releases that resource.

```typescript
@Sse('events')
sendEvents(): Observable<MessageEvent> {
  return new Observable(subscriber => {
    const intervalId = setInterval(() => {
      subscriber.next({ data: { hello: 'world' } });
    }, 1000);

    return () => clearInterval(intervalId);
  });
}
```

**Rule 2: Force shutdown without waiting for requests to finish when needed.**

By default, Nest HTTP adapters wait for responses to finish before closing the application. If the application does not exit when expected because requests remain open, pass `forceCloseConnections: true` to `NestFactory.create()` so shutdown does not wait for those requests to end. Most applications do not need this option.

```typescript
const app = await NestFactory.create(AppModule, {
  forceCloseConnections: true,
});
```


**Source files**

- [`integration/nest-application/sse/e2e/express.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/e2e/express.spec.ts)
- [`integration/nest-application/sse/e2e/fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/e2e/fastify.spec.ts)
- [`integration/nest-application/sse/src/app.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/src/app.controller.ts)
- [`packages/core/router/router-response-controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/core/router/router-response-controller.ts)
- [`content/faq/keep-alive-connections.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/keep-alive-connections.md) _(documentation repository)_

### Bound Request Bodies and the Expansion of Untrusted Input

**Use when**

Accepting request bodies, uploads, or any input the application decompresses, expands, or repeats.

**Secure rules**

**Rule 1: Set an explicit body size limit rather than relying on the parser default.**

The body parser buffers the whole request before a pipe, guard, or handler sees any of it, so validation rules on a DTO bound nothing about how much memory the request consumes. Call `useBodyParser()` on the Express application with a limit chosen for the largest legitimate payload; oversized requests are then refused at the parser, before the framework builds an object out of them.

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });
  await app.listen(3000);
}
bootstrap();
```

**Rule 2: Cap the output of a decompression, not just the size of its input.**

A size limit on the upload bounds the compressed bytes, and a compressed format's whole purpose is that those bytes expand -- a few kilobytes of archive can produce gigabytes, exhausting memory or disk while every check on the request passed. Count bytes as they are produced and abort the moment the running total crosses the ceiling, and bound the number of entries as well so many small members cannot achieve the same result. Stream each entry through the counter rather than decompressing it into a buffer and measuring afterwards, because by then the memory has already been spent.

```typescript
const MAX_EXTRACTED_BYTES = 16 * 1024 * 1024;
const MAX_ENTRIES = 1_000;

let written = 0;
let entries = 0;

for await (const chunk of entry.stream()) {
  written += chunk.length;
  if (written > MAX_EXTRACTED_BYTES || ++entries > MAX_ENTRIES) {
    throw new BadRequestException('archive too large');
  }
  await sink.write(chunk);
}
```

**Rule 3: Bound nesting depth, and carry one budget across the whole recursive expansion.**

An archive entry can itself be an archive. A per-pass limit then bounds nothing: each individual layer looks small and passes its own check, while the product across layers is unbounded -- an outer archive whose members are archives expands by a multiple at every level. Cap how deep extraction may recurse, and thread a _single_ running byte and entry total through the recursion rather than resetting it per archive, so the budget is spent across the whole tree and not per layer. Refuse nested archives outright when the feature does not need them.

```typescript
const MAX_DEPTH = 2;

interface Budget { bytes: number; entries: number; }

async function extract(archive: Archive, depth: number, budget: Budget): Promise<void> {
  if (depth > MAX_DEPTH) {
    throw new BadRequestException('archive nested too deeply');
  }
  for (const entry of archive.entries) {
    budget.bytes += entry.uncompressedSize;
    if (++budget.entries > MAX_ENTRIES || budget.bytes > MAX_EXTRACTED_BYTES) {
      throw new BadRequestException('archive too large');
    }
    if (isArchive(entry)) {
      await extract(await open(entry), depth + 1, budget); // same budget object
    }
  }
}
```

**Rule 4: Give every externally triggered operation a deadline.**

A spawned converter, an outbound HTTP call, or a query with no timeout occupies its resources for as long as the far side chooses, so a slow dependency turns into exhausted workers rather than a failed request. Set an explicit timeout on the operation and return an error when it elapses, so the failure is bounded and visible instead of accumulating.

```typescript
await run('ffmpeg', ['-i', source, '-y', target], { timeout: 10_000 });
```


**Source files**

- [`content/faq/raw-body.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/raw-body.md) _(documentation repository)_
- [`content/security/rate-limiting.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/security/rate-limiting.md) _(documentation repository)_
