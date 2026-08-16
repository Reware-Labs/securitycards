# Security blueprint

Repository: `https://github.com/nestjs/nest#v11.1.28`

## Security posture

NestJS v11.1.28 provides modular guards, pipes, filters, middleware, and dependency injection primitives, but applications must compose them into deliberate security boundaries. Apply controls at the broadest appropriate scope, validate client input before handlers or persistent streams run, isolate request-specific state, and keep secrets outside source code. Adapter-specific routing, middleware, connection, and plugin behavior must also be configured explicitly so controls cover every intended path and lifecycle stage. A NestJS project's manifest also lists the packages NestJS is built on -- the HTTP adapter, the ORM, authentication middleware -- but those are transitive implementation details of this framework, so prefer these NestJS cards for anything reached through a controller, provider, guard, pipe, filter, or module, and consult another library's cards only for code written directly against that library's own API.

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

Validate uploads with `ParseFilePipe`, `MaxFileSizeValidator`, and `FileTypeValidator`; file presence is required by default. Configure `ServeStaticModule.rootPath`, use NestJS v11 named wildcard exclusions for dynamic routes, and apply `setGlobalPrefix()` when all HTTP routes need a shared prefix. Resolve any path built from a route parameter, query value, uploaded filename, or archive entry name to an absolute path and verify it is still inside the intended directory, and store uploads under a server-generated name rather than the one the caller supplied.

6. **Protect Credentials and Use Structured Data Access**

Hash passwords and verify them with an approved timing-safe library such as `bcrypt` or `argon2`, never direct string equality. Access persisted users through injected TypeORM repositories and structured methods such as `findOneBy()` and `delete()`. Where a raw SQL string is unavoidable, bind every value as a named or positional parameter instead of concatenating it, and check identifiers such as column or sort names against a fixed list, because those cannot be parameterized.

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

13. **Encode Values for the Output Context That Receives Them**

Returning an object serializes JSON, which is inert; composing an HTML body is not. Escape every interpolated value when a handler builds markup, keep rendered views on the escaping interpolation form rather than the raw one, and send `X-Content-Type-Options: nosniff`. When the contract requires the caller's own markup to survive, run it through an allowlist sanitizer such as `sanitize-html` instead of escaping or hand-written filtering. Before writing request data to a log, strip newline and control characters and cap the length, so a caller cannot forge log lines, and log a non-reversible reference to a secret rather than the secret.

14. **Keep Untrusted Input Out of Evaluators and Shells**

Never pass request data to `eval`, `new Function`, or `node:vm`; parse submitted expressions with a grammar that accepts only what the feature needs, and cap the accepted length and nesting depth. Invoke external programs with `execFile` or `spawn` and an argument array, never `exec` or `shell: true`, and reject a leading `-` on values meant as operands. Resolve dynamic behavior through a fixed map of approved identifiers rather than a module or class name taken from the request.

15. **Bound the Work a Single Request Can Cause**

Set explicit body size limits with `useBodyParser()` rather than relying on the parser default, because the body is buffered in full before any pipe or guard runs. When input is decompressed or otherwise expanded, cap the produced bytes and the entry count and abort on the threshold, since a limit on the compressed upload bounds nothing about its output. Give externally triggered work -- spawned processes, outbound calls, long-running queries -- an explicit timeout.
