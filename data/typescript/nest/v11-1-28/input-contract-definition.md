# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: input contract definition

## input contract definition

### Validate DTO Payload Structure with ValidationPipe

**Use when**

Defining incoming request shapes and DTOs for NestJS HTTP endpoints and GraphQL resolvers.

**Secure rules**

**Rule 1: Annotate class-based DTO fields with `class-validator` decorators**

Add `class-validator` decorators to a class DTO to declare validation annotations for its fields. A `ValidationPipe` uses these annotations when validating the request body.

```typescript
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

**Rule 2: Configure a global ValidationPipe to reject non-whitelisted request properties**

Initialize the global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` during application bootstrap. When non-whitelisted properties are present, this combination stops the request from processing and returns an error response.

```typescript
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  await app.listen(3000);
}
```


**Source files**

- [`sample/01-cats-app/src/common/pipes/validation.pipe.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/01-cats-app/src/common/pipes/validation.pipe.ts)
- [`integration/graphql-code-first/e2e/pipes.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/graphql-code-first/e2e/pipes.spec.ts)

### Validate Client Payloads with Class-Based DTOs and ValidationPipe

**Use when**

When defining endpoints, controllers, or handlers in NestJS that accept client-provided request bodies, query parameters, or parameters.

**Secure rules**

**Rule 1: Declare incoming payload validation rules in class-based DTOs**

Define a class DTO and declare its validation rules with `class-validator` decorators. `ValidationPipe` uses these decorators to enforce the rules for incoming client payloads.

```typescript
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

**Rule 2: Configure ValidationPipe to strip or forbid non-whitelisted properties**

Enable `whitelist: true` on your global `ValidationPipe` to automatically discard incoming properties that are not explicitly defined in the DTO. Set `forbidNonWhitelisted: true` to instead reject requests containing extra parameters.

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true
}));
```

**Rule 3: Validate an SSE query before opening the stream**

Bind a global `ValidationPipe` with `transform: true` and validate the SSE query with a DTO. The official Express and Fastify integration tests verify that an invalid `limit` query returns an HTTP 400 JSON response before the SSE stream opens.

```typescript
import {
  Controller,
  MessageEvent,
  Module,
  Query,
  Sse,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Observable, of } from 'rxjs';

class SseQueryDto {
  @Type(() => Number)
  @IsInt()
  limit!: number;
}

@Controller()
class AppController {
  @Sse('sse/validated')
  sseWithValidatedQuery(@Query() query: SseQueryDto): Observable<MessageEvent> {
    return of({ data: { limit: query.limit } });
  }
}

@Module({
  controllers: [AppController],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  await app.listen(3000);
}
bootstrap();
```


**Source files**

- [`sample/19-auth-jwt/src/auth/auth.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.controller.ts)
- [`sample/29-file-upload/src/main.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/29-file-upload/src/main.ts)
- [`integration/nest-application/sse/e2e/express.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/e2e/express.spec.ts)
