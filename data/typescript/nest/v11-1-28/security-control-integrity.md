# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: security control integrity

## security control integrity

### Ensure Complete Coverage of Security Middleware Across Routing Paths and Methods

**Use when**

When configuring routing-level security controls, including middleware binders, routing prefixes, path exclusions, and multi-method routing.

**Secure rules**

**Rule 1: Bind middleware to controller routes with class references.**

Passing a controller class to `forRoutes()` binds the applied middleware to that controller's routes. This binding supports routes under a `RouterModule` module path and Fastify routes with or without a trailing slash.

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes(UsersController);
```

**Rule 2: Apply middleware to all request methods for a path.**

Passing a path string to `forRoutes()` applies the middleware without restricting it to a particular request method. When using a route object, set `method` to `RequestMethod.ALL` to target all request methods.

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes({ path: 'api/resource', method: RequestMethod.ALL });
```

**Rule 3: Use named wildcards and version metadata in middleware route configuration.**

When defining route exclusions, use named wildcards such as `*splat` for NestJS v11 middleware paths. To configure middleware for a specific route version, provide the `version` property in the route object passed to `forRoutes()` instead of adding a version prefix to `path`.

```typescript
consumer
  .apply(AuthMiddleware)
  .exclude(
    'public-route',
    'assets/*splat'
  )
  .forRoutes({
    path: '/sensitive',
    version: '1',
    method: RequestMethod.ALL
  });
```


**Source files**

- [`integration/hello-world/e2e/middleware-fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-fastify.spec.ts)
- [`integration/hello-world/e2e/exclude-middleware-fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/exclude-middleware-fastify.spec.ts)
- [`integration/hello-world/e2e/middleware-class.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-class.spec.ts)
- [`integration/hello-world/e2e/middleware-with-versioning.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-with-versioning.spec.ts)
- [`integration/hello-world/e2e/router-module-middleware.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/router-module-middleware.spec.ts)
- [`integration/versioning/src/middleware.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/versioning/src/middleware.controller.ts)

### Guarantee Fail-Closed and Sequential Implementation of Security Controls

**Use when**

When establishing global guards, implementing service initialization schedules, or defining dependencies with dynamic providers.

**Secure rules**

**Rule 1: Register security guards globally to establish a fail-closed default state.**

Use the NestJS `APP_GUARD` provider token within your core module to bind authorization guards globally. This ensures that all endpoints, including future routes, are secure by default, and requires explicit opt-out annotations like `@Public()`.

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  }
]
```

**Rule 2: Register Helmet as a Fastify plugin.**

When using `FastifyAdapter`, register `@fastify/helmet` as a Fastify plugin with `app.register()` rather than applying it as middleware. Register Helmet before other `app.use()` calls or setup functions that may call `app.use()`, because middleware and route definition order determines which routes receive it.

```typescript
import helmet from '@fastify/helmet';

await app.register(helmet);
```

**Rule 3: Account for unavailable optional factory dependencies.**

An optional factory dependency declared with `{ token, optional: true }` is passed to `useFactory` when available and is `undefined` when unavailable. The factory can use nullish coalescing to return a default value when the dependency is unavailable.

```typescript
const defaultValue = 'DEFAULT_VALUE';

export const factoryProvider = {
  provide: 'FACTORY',
  useFactory: (dependency?: string) => dependency ?? defaultValue,
  inject: [{ token: 'MISSING_DEP', optional: true }],
};
```


**Source files**

- [`sample/19-auth-jwt/src/auth/auth.module.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.module.ts)
- [`integration/hello-world/e2e/fastify-middleware-before-init.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/fastify-middleware-before-init.spec.ts)
- [`integration/hello-world/e2e/middleware-execute-order.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-execute-order.spec.ts)
- [`integration/injector/e2e/optional-factory-provider-dep.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/injector/e2e/optional-factory-provider-dep.spec.ts)
