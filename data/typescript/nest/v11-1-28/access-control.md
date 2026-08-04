# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: access control

## access control

### Apply Role Guards and Build Per-Request Tenant Context

**Use when**

Implementing role-based authorization, guard binding, or tenant context that varies between incoming requests.

**Secure rules**

**Rule 1: Check Handler and Class Role Metadata with Reflector**

When implementing role-based authorization in a custom NestJS guard, retrieve the required roles from the current route handler and controller class with `reflector.getAllAndOverride`. If no required roles are defined, allow the request. Otherwise, allow the request only when the user has at least one required role.

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

enum Role {
  User = 'user',
  Admin = 'admin',
}

const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Rule 2: Bind Guards at the Controller Level**

Apply `@UseGuards()` at the controller level to attach the specified guards to every handler declared by that controller. Applying `@UseGuards()` at the method level instead attaches the specified guards only to that method.

**Rule 3: Create a Separate Tenant Context for Each Request**

When tenant context varies per request, declare its provider with `{ scope: Scope.REQUEST }`. Nest creates a new provider instance for each incoming request, and injecting `REQUEST` gives the provider access to that request. An authentication guard can assign its verified payload to `request.user`; use that assigned payload when building the authenticated tenant context.

```typescript
import {
  Injectable,
  Inject,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';

type AuthenticatedRequest = {
  user?: {
    tenantId?: string;
  };
};

@Injectable({ scope: Scope.REQUEST })
export class AuthenticatedTenantProvider {
  constructor(
    @Inject(REQUEST) private readonly request: AuthenticatedRequest,
  ) {}

  getTenantContext() {
    const tenantId = this.request.user?.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException();
    }
    return { tenantId };
  }
}
```


**Source files**

- [`sample/01-cats-app/src/common/guards/roles.guard.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/01-cats-app/src/common/guards/roles.guard.ts)
- [`sample/19-auth-jwt/src/auth/auth.guard.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.guard.ts)
- [`sample/10-fastify/src/common/decorators/roles.decorator.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/10-fastify/src/common/decorators/roles.decorator.ts)
- [`sample/01-cats-app/src/cats/cats.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/01-cats-app/src/cats/cats.controller.ts)
- [`integration/injector/e2e/request-scoped-factory-provider.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/injector/e2e/request-scoped-factory-provider.spec.ts)
- [`content/fundamentals/provider-scopes.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/fundamentals/provider-scopes.md) _(documentation repository)_

### Restrict Cross-Origin Resource Sharing (CORS) Access

**Use when**

Configuring cross-origin communication policies for HTTP servers or WebSocket gateways within a NestJS application.

**Secure rules**

**Rule 1: Configure CORS for NestJS HTTP applications.**

To customize CORS behavior, pass a configuration object to `app.enableCors()`. Alternatively, pass a callback function that defines the configuration object asynchronously based on the request.

**Rule 2: Configure CORS for NestJS WebSocket gateways.**

Pass WebSocket gateway CORS settings through the `cors` property of the options object supplied to `@WebSocketGateway()`.


**Source files**

- [`integration/cors/e2e/express.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/cors/e2e/express.spec.ts)
- [`sample/02-gateways/src/events/events.gateway.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/02-gateways/src/events/events.gateway.ts)
