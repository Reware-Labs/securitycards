# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: api contract misuse

## api contract misuse

### Register Security Schemes in DocumentBuilder to Match Controller Decorators

**Use when**

When documenting NestJS APIs using OpenAPI (Swagger) decorators such as `@ApiSecurity` or `@ApiBearerAuth`.

**Secure rules**

**Rule 1: Register Security Definitions for API Security Decorators in the Base Document.**

When using `@ApiSecurity('basic')`, `@ApiBearerAuth()`, `@ApiBasicAuth()`, or `@ApiCookieAuth()` on a controller or endpoint handler, add the corresponding security definition to the base document using `DocumentBuilder` before running the application.

```typescript
import { Controller } from '@nestjs/common';
import { ApiBearerAuth, DocumentBuilder } from '@nestjs/swagger';

const options = new DocumentBuilder()
  .addBearerAuth()
  .build();

@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```


**Source files**

- [`content/openapi/security.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/openapi/security.md) _(documentation repository)_
