# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: network boundary

## network boundary

### Configure Fastify Host Binding for Intended Network Reachability

**Use when**

When bootstrapping a NestJS application and launching the HTTP listener using NestFactory.

**Secure rules**

**Rule 1: Bind Fastify to all interfaces only when accepting connections from other hosts**

Fastify listens only on the `localhost` (`127.0.0.1`) interface by default. Only when the application is intended to accept connections from other hosts, pass `'0.0.0.0'` as the host argument to `app.listen()`.

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
```


**Source files**

- [`content/techniques/performance.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/performance.md) _(documentation repository)_
