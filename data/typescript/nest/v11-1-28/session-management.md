# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: session management

## session management

### Use Request Scope for Request-Specific Context

**Use when**

When implementing a custom provider whose lifetime must be tied to one incoming request.

**Secure rules**

**Rule 1: Use Scope.REQUEST when a provider requires per-request lifetime.**

Nest recommends singleton scope for most providers. When a provider requires request-based lifetime, use `{ scope: Scope.REQUEST }` so Nest creates a new instance for each incoming request. Request scope bubbles up the injection chain, so a controller that depends on the provider also becomes request-scoped.

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class RequestContext {
  public currentUserId?: string;
}

@Injectable()
export class AccountService {
  constructor(private readonly context: RequestContext) {}
}
```


**Source files**

- [`integration/injector/e2e/injector.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/injector/e2e/injector.spec.ts)
- [`content/fundamentals/provider-scopes.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/fundamentals/provider-scopes.md) _(documentation repository)_
