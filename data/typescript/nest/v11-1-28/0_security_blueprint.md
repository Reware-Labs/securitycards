# Security blueprint

Repository: `https://github.com/nestjs/nest#v11.1.28`

## Security posture

NestJS v11.1.28 provides modular guards, pipes, filters, middleware, and dependency injection primitives, but applications must compose them into deliberate security boundaries. Apply controls at the broadest appropriate scope, validate client input before handlers or persistent streams run, isolate request-specific state, and keep secrets outside source code. Adapter-specific routing, middleware, connection, and plugin behavior must also be configured explicitly so controls cover every intended path and lifecycle stage.

## Essential implementation rules

1. **Resolve and Enforce Route Authorization Metadata**

In custom role guards, use `Reflector.getAllAndOverride()` with both the current handler and controller class. Allow routes with no required-role metadata, but when roles are declared, admit only users possessing at least one required role.

2. **Bind Guards and Middleware Across Complete Route Surfaces**

Use controller-level `@UseGuards()` when every handler needs the same protection, or register an `APP_GUARD` for a secure global default with explicit opt-outs. Bind middleware with controller class references or `RequestMethod.ALL`, and use NestJS v11 named wildcards and route version metadata correctly.

3. **Isolate Request-Scoped State**

Mark providers that store tenant, session, or authenticated-user context with `{ scope: Scope.REQUEST }`. This gives each request a distinct provider instance and cascades request scope through the dependent injection graph, preventing cross-request state sharing.

4. **Validate Client Inputs Before Processing**

Declare request rules on class DTOs with `class-validator`, then install a global `ValidationPipe`. Use `whitelist: true` to strip undeclared properties, add `forbidNonWhitelisted: true` when they should be rejected, and enable transformation when validated DTO values are needed before opening an SSE stream.

5. **Constrain Uploads and Static File Boundaries**

Validate uploads with `ParseFilePipe`, `MaxFileSizeValidator`, and `FileTypeValidator`; file presence is required by default. Configure `ServeStaticModule.rootPath`, use NestJS v11 named wildcard exclusions for dynamic routes, and apply `setGlobalPrefix()` when all HTTP routes need a shared prefix.

6. **Protect Credentials and Use Structured Data Access**

Hash passwords and verify them with an approved timing-safe library such as `bcrypt` or `argon2`, never direct string equality. Access persisted users through injected TypeORM repositories and structured methods such as `findOneBy()` and `delete()`.

7. **Configure Cross-Origin Behavior Explicitly**

Pass the intended HTTP CORS policy to `app.enableCors()` as an options object or request-aware callback. Configure WebSocket cross-origin behavior separately through the `cors` option supplied to `@WebSocketGateway()`.

8. **Centralize Secret and Config Management**

Keep JWT signing and verification secrets outside source code, load them through `ConfigService`, and pass the verification secret to `JwtService.verifyAsync()`. Configure TypeORM asynchronously with `forRootAsync()` so database credentials and connection settings come from injected configuration.

9. **Control Errors and Dynamic Routing Boundaries**

Use custom HTTP exception filters to control status codes and response bodies. For every unhandled exception type, leave `@Catch()` empty and register the filter globally with `app.useGlobalFilters()`. Treat dynamic values in `setGlobalPrefix()` as route parameters requiring the same downstream authorization and validation as other parameters.

10. **Harden Runtime and Network Exposure**

Fastify-backed applications bind to localhost by default; pass `0.0.0.0` only when external reachability is intended. Do not expose the interactive REPL in production, clean up custom SSE work on unsubscribe, and use `forceCloseConnections: true` when persistent Fastify connections must terminate during shutdown.

11. **Maintain Synchronized API Documentation**

Apply authentication guards to protected endpoints, extract custom bearer tokens only for the exact `Bearer` scheme, and keep OpenAPI declarations aligned. Register every referenced bearer, basic, cookie, or named security definition in `DocumentBuilder` before creating the document.

12. **Preserve Adapter and Factory Control Coverage**

With `FastifyAdapter`, register `@fastify/helmet` as a plugin before middleware or routes that must receive its headers. In dependency factories, handle unavailable optional injections explicitly with a safe default, and keep workspace installation and package-discovery behavior constrained to the intended sample directory.
