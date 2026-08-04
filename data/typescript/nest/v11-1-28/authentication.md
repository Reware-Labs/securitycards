# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: authentication

## authentication

### Secure Token Authentication and Guard Enforcement

**Use when**

Implementing JWT-based token authentication, route guards, and custom header parsing in NestJS applications.

**Secure rules**

**Rule 1: Protect endpoints with an AuthGuard backed by a configured JWT strategy**

Configure a Passport JWT strategy with the token extractor, expiration handling, and verification key, then apply its `AuthGuard('jwt')` to protected endpoints. The guard invokes the configured strategy; after the strategy verifies and validates the JWT, Passport assigns the object returned by `validate()` to `request.user`.

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  @UseGuards(AuthGuard('jwt')) // Uses the configured "jwt" strategy
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

**Rule 2: Extract Bearer Tokens from the Authorization Header**

When extracting a token from the authorization header in a custom guard, split the header value on a space and return the token only when the authorization type is exactly `'Bearer'`.

```typescript
private extractTokenFromHeader(request: Request): string | undefined {
  const [type, token] = request.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}
```

**Rule 3: Declare Bearer Authentication in the OpenAPI Definition**

Use `@ApiBearerAuth()` on a controller to describe bearer authentication for its operations, and add the bearer security definition to the base OpenAPI document with `DocumentBuilder.addBearerAuth()`. These APIs describe the OpenAPI document; protect runtime endpoints separately with an authentication guard.

```typescript
const options = new DocumentBuilder()
  .addBearerAuth()
  .build();

@ApiBearerAuth()
@Controller('cats')
export class CatsController {}
```


**Source files**

- [`sample/19-auth-jwt/src/auth/auth.guard.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.guard.ts)
- [`sample/19-auth-jwt/e2e/app/app.e2e-spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/e2e/app/app.e2e-spec.ts)
- [`content/recipes/passport.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/recipes/passport.md) _(documentation repository)_
- [`content/openapi/security.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/openapi/security.md) _(documentation repository)_
