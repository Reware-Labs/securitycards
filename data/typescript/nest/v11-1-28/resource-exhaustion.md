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
