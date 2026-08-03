# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: boundary control

## boundary control

### Control Exception Responses with Exception Filters

**Use when**

Designing error-handling policies and configuring exception filters in NestJS applications.

**Secure rules**

**Rule 1: Control HTTP Exception Responses with a Custom Exception Filter.**

Implement the `ExceptionFilter<HttpException>` interface and provide its `catch()` method. Use `ArgumentsHost` to access the HTTP request and response objects, then use `response.status().json()` to control the content of the response sent to the client.

```typescript
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = exception.getStatus();

    response.status(statusCode).json({
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}
```

**Rule 2: Apply a global catch-all filter for unhandled exceptions.**

Leave the `@Catch()` decorator parameter list empty when a filter must catch every unhandled exception regardless of type. Register the filter with `app.useGlobalFilters()` to apply it globally.

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}

app.useGlobalFilters(new AllExceptionsFilter());
```


**Source files**

- [`integration/inspector/src/common/filters/http-exception.filter.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/inspector/src/common/filters/http-exception.filter.ts)
- [`integration/inspector/e2e/graph-inspector.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/inspector/e2e/graph-inspector.spec.ts)
- [`content/exception-filters.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/exception-filters.md) _(documentation repository)_

### Validate Dynamic Route Parameters in Global Prefixes

**Use when**

When establishing routing structures where the global prefix contains dynamic parameters used for determining logical context boundaries, such as tenant isolation.

**Secure rules**

**Rule 1: Configure Dynamic Parameters in the Global Prefix.**

Define a dynamic parameter in the global prefix by passing a parameterized path such as `'/api/:tenantId'` to `app.setGlobalPrefix()`. Matching requests expose the value as the `tenantId` parameter.

```typescript
app.setGlobalPrefix('/api/:tenantId');
```


**Source files**

- [`integration/nest-application/global-prefix/e2e/global-prefix.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/global-prefix/e2e/global-prefix.spec.ts)
