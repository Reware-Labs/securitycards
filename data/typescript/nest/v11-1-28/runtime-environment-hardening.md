# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: runtime environment hardening

## runtime environment hardening

### Disable the Interactive NestJS REPL in Production Environments

**Use when**

Bootstrapping a NestJS application using `@nestjs/core` and governing runtime modes.

**Secure rules**

**Rule 1: Recognize that the interactive REPL can invoke providers and controllers directly.**

The NestJS REPL lets you inspect the dependency graph and call methods on providers and controllers directly.


**Source files**

- [`integration/repl/e2e/repl.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/repl/e2e/repl.spec.ts)
