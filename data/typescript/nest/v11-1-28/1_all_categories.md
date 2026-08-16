# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`

## Category: access control

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

## Category: api contract misuse

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

## Category: authentication

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

## Category: boundary control

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

## Category: configuration source integrity

### Secure workspace dependencies and automated installations

**Use when**

Configuring monorepo tooling scripts, managing external dependencies, or querying package metadata during build or initialization in NestJS applications.

**Secure rules**

**Rule 1: Configure Automated Dependency Installation for Sample Directories**

The `install:samples` task calls `executeNpmScriptInSamples('npm install --legacy-peer-deps')` to install dependencies across sample directories. For each directory, the helper runs the configured command with `--prefix` set to that directory.

**Rule 2: Check Whether a Directory Contains a `package.json` File**

The `containsPackageJson(dir)` helper reads the directory entries and returns whether one of them is named `package.json`.

```typescript
import { readdirSync } from 'fs';

export function containsPackageJson(dir: string) {
  return readdirSync(dir).some(file => file === 'package.json');
}
```

**Rule 3: Create the Redis Client Info Tag with a NestJS Version Fallback**

In `RedisIoAdapter.getClientInfoTag()`, read the version from `@nestjs/common/package.json` and return it as `nestjs_v${nestVersion}`. If the version cannot be determined, return `nestjs`.

```typescript
private getClientInfoTag(): string {
  try {
    // Try to get NestJS version from package.json
    const nestVersion = require('@nestjs/common/package.json').version;
    return `nestjs_v${nestVersion}`;
  } catch {
    // Fallback if version cannot be determined
    return 'nestjs';
  }
}
```


**Source files**

- [`tools/gulp/tasks/samples.ts`](https://github.com/nestjs/nest/blob/v11.1.28/tools/gulp/tasks/samples.ts)
- [`tools/gulp/util/task-helpers.ts`](https://github.com/nestjs/nest/blob/v11.1.28/tools/gulp/util/task-helpers.ts)
- [`sample/02-gateways/src/adapters/redis-io.adapter.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/02-gateways/src/adapters/redis-io.adapter.ts)

## Category: cryptography

### Securely Hash Passwords and Utilize Timing-Safe Comparisons

**Use when**

Implementing user authentication and credential verification workflows in a NestJS application.

**Secure rules**

**Rule 1: Verify credentials using a cryptographically secure, timing-safe password hashing function instead of direct string parity checks.**

Do not perform plain-text or direct equality comparison on passwords (such as `user.password !== pass`). In production environments, passwords must be securely hashed and compared using a timing-safe hashing function from an approved library like `bcrypt` or `argon2` to protect against timing analysis attacks and credential exposure.

```typescript
import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException();
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```


**Source files**

- [`sample/19-auth-jwt/src/auth/auth.service.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.service.ts)

## Category: dangerous execution

### Evaluate Submitted Expressions with a Parser, Not the JavaScript Engine

**Use when**

A request supplies an expression, formula, filter, or template that a controller, service, or pipe computes a result from.

**Secure rules**

**Rule 1: Never pass request data to `eval`, `new Function`, or `node:vm`.**

Each of these compiles its argument as JavaScript with the process's full authority, so an endpoint that evaluates arithmetic also runs `require('node:child_process')`. `node:vm` does not close the gap: it isolates trusted code for convenience and its context is escapable, so it is not a boundary against hostile input. Accept only the grammar the feature needs, then evaluate the parsed tree yourself. A custom `PipeTransform` is the natural place for the check, because it rejects before the handler is entered.

```typescript
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const ARITHMETIC = /^[0-9+\-*/(). ]{1,100}$/;

@Injectable()
export class ArithmeticExpressionPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !ARITHMETIC.test(value)) {
      throw new BadRequestException('unsupported expression');
    }
    return value;
  }
}
```

**Rule 2: Bound the work a submitted expression is allowed to perform.**

An expression can be syntactically harmless and still expensive: deep nesting, a very large exponent, or a repetition count consumes CPU for as long as the evaluator runs, and one request then occupies the event loop for every other. Cap the accepted length and the nesting depth, and reject rather than truncate so the caller receives a clear error instead of a silently different answer.

```typescript
const MAX_DEPTH = 16;

function parseExpression(tokens: string[], depth = 0): Node {
  if (depth > MAX_DEPTH) {
    throw new BadRequestException('expression nested too deeply');
  }
  return parseTerm(tokens, depth + 1);
}
```

**Rule 3: Resolve dynamic behavior through a fixed map, never by loading a named module or class.**

An identifier taken from a request and passed to `require()`, a dynamic `import()`, or a container lookup lets the caller choose which code runs, and the reachable set is every module on disk rather than the handful the feature intends. Map the approved identifiers to implementations explicitly and reject anything absent from the map, so adding a capability is a code change rather than a request parameter.

```typescript
const EXPORTERS: Record<string, () => Exporter> = {
  csv: () => new CsvExporter(),
  json: () => new JsonExporter(),
};

const createExporter = (format: string): Exporter => {
  const factory = EXPORTERS[format];
  if (!factory) {
    throw new BadRequestException('unsupported format');
  }
  return factory();
};
```


**Source files**

- [`content/pipes.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/pipes.md) _(documentation repository)_
- [`content/techniques/validation.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/validation.md) _(documentation repository)_

## Category: file handling

### Secure Static File Serving and Path Boundaries

**Use when**

When configuring static asset hosting within a NestJS application using @nestjs/serve-static.

**Secure rules**

**Rule 1: Exclude dynamic route patterns from static files routing using version-compliant wildcard syntax.**

Configure the `exclude` array inside `ServeStaticModule` options to establish routing boundaries. In NestJS v11, use named wildcards such as `'/api/{*test}'` instead of legacy wildcard structures to ensure the underlying router correctly differentiates static files from dynamic API endpoints.

```typescript
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api/{*test}'],
    }),
  ],
})
export class AppModule {}
```

**Rule 2: Use `setGlobalPrefix()` when every registered HTTP route should share a prefix.**

Call `setGlobalPrefix()` on the Nest application instance to set a prefix for every route registered in the HTTP application. The NestJS static-serving sample calls `app.setGlobalPrefix('api')` after creating the application and before starting the HTTP listener.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
```

**Rule 3: Define the static content location with `rootPath`.**

Configure `ServeStaticModule` by passing a configuration object to `forRoot()`. The `rootPath` property specifies the location containing the static website content; the documented example uses `join(__dirname, '..', 'client')`.

```typescript
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
})
export class AppModule {}
```


**Source files**

- [`sample/24-serve-static/src/app.module.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/24-serve-static/src/app.module.ts)
- [`sample/24-serve-static/src/main.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/24-serve-static/src/main.ts)

### Validate File Upload Size and Type Using ParseFilePipe

**Use when**

When handling multipart file uploads in NestJS controllers using file interceptors.

**Secure rules**

**Rule 1: Validate File Size and Type with ParseFilePipe**

When accepting file uploads, validate files using `ParseFilePipe`. Configure the pipe with `MaxFileSizeValidator` to require the file size to be less than the configured `maxSize` in bytes and `FileTypeValidator` to require the file MIME type to match the configured string or regular expression. File presence is required by default.

```typescript
import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('file')
export class FileUploadController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1000 }),
          new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      })
    )
    file: Express.Multer.File
  ) {
    return file;
  }
}
```


**Source files**

- [`sample/29-file-upload/e2e/app/app.e2e-spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/29-file-upload/e2e/app/app.e2e-spec.ts)

### Contain Request-Derived Paths Within Their Intended Directory

**Use when**

Building a filesystem path from a route parameter, query value, uploaded filename, or archive entry name.

**Secure rules**

**Rule 1: Resolve the path first, then verify it is still inside the base directory.**

`join()` collapses `..` segments, so a parameter of `../../etc/passwd` produces a path outside the directory the handler intended without any part of the string looking unusual. Rejecting on a substring such as `'..'` is not equivalent: it misses absolute paths and encoded variants while also rejecting legitimate names. Resolve to an absolute path and compare it against the resolved base, keeping the trailing separator in the comparison so that a sibling directory sharing a name prefix does not pass.

```typescript
import { NotFoundException } from '@nestjs/common';
import { resolve, sep } from 'path';

const STORAGE_ROOT = resolve(process.cwd(), 'storage');

const resolveWithin = (name: string): string => {
  const target = resolve(STORAGE_ROOT, name);
  if (target !== STORAGE_ROOT && !target.startsWith(STORAGE_ROOT + sep)) {
    throw new NotFoundException();
  }
  return target;
};
```

**Rule 2: Apply the same containment to every entry read out of an archive.**

Entry names inside a zip or tar are caller-controlled strings that the extraction step turns into paths, so an entry named `../../app/main.js` writes outside the extraction directory and can replace a file the application later executes. Run each entry name through the same resolve-and-verify check before creating anything, and skip entries that are not regular files -- a symbolic link re-introduces the escape after the name itself has been checked.

```typescript
for (const entry of archive.entries) {
  if (!entry.isFile()) {
    continue;
  }
  const target = resolveWithin(entry.name);
  await writeFile(target, await entry.buffer());
}
```

**Rule 3: Generate the stored name for an upload instead of trusting the supplied one.**

A multipart filename is chosen by the caller and travels with the request, so reusing it as the stored name carries path separators and leading dots into the filesystem, and lets one upload replace another user's file by reusing its name. Store the file under an identifier the server generates, and keep the original name as metadata when it has to be shown back to the user.

```typescript
import { randomUUID } from 'crypto';
import { extname } from 'path';

const storedName = (originalName: string): string => {
  const extension = extname(originalName).toLowerCase();
  return /^\.[a-z0-9]{1,8}$/.test(extension)
    ? `${randomUUID()}${extension}`
    : randomUUID();
};
```


**Source files**

- [`sample/29-file-upload/src/app.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/29-file-upload/src/app.controller.ts)
- [`packages/common/file-stream/streamable-file.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/common/file-stream/streamable-file.ts)
- [`content/techniques/streaming-files.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/streaming-files.md) _(documentation repository)_
- [`content/techniques/file-upload.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/file-upload.md) _(documentation repository)_

## Category: injection

### Use Parameterized Methods to Prevent SQL Injection

**Use when**

When querying or mutating database records with TypeORM in NestJS services.

**Secure rules**

**Rule 1: Access users through an injected TypeORM repository.**

In the documented `UsersService`, `@InjectRepository(User)` injects a `Repository<User>`. Its `findOne()` method calls `findOneBy({ id })`, and its `remove()` method passes the user ID to `delete()`.

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

**Rule 2: Bind values as parameters whenever a raw SQL string is unavoidable.**

The repository methods build the statement for you, but `query()`, `createQueryBuilder().where()` and a raw database driver all accept a string, and a value concatenated into that string is read as syntax rather than data. Supply the value separately -- a named parameter for the query builder, a positional placeholder for a raw statement -- so the driver never parses it. This holds for every clause: quoting a value by hand is not a substitute, and an identifier such as a column or sort direction cannot be parameterized at all, so it has to be checked against a fixed list of permitted names.

```typescript
const SORTABLE = ['created_at', 'name'] as const;

async search(term: string, sortBy: string): Promise<User[]> {
  const column = SORTABLE.includes(sortBy as never) ? sortBy : 'created_at';
  return this.userRepository
    .createQueryBuilder('user')
    .where('user.name LIKE :term', { term: `%${term}%` })
    .orderBy(`user.${column}`)
    .getMany();
}
```


**Source files**

- [`sample/05-sql-typeorm/src/users/users.service.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/05-sql-typeorm/src/users/users.service.spec.ts)
- [`content/techniques/sql.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/sql.md) _(documentation repository)_

### Run External Commands with an Argument Array, Never a Shell String

**Use when**

A service invokes an external program -- an archiver, converter, or other command-line tool -- with any part of the invocation derived from a request.

**Secure rules**

**Rule 1: Pass arguments as an array to `execFile` or `spawn`, and do not enable a shell.**

`exec` and `execFile`/`spawn` with `shell: true` hand the whole string to `/bin/sh`, where `;`, `|`, backticks and `$(...)` are syntax, so one filename can append a second command. The array forms pass each element to the program as a single argument with no shell in between, so a value containing shell metacharacters stays one argument. Build the array from fixed flags plus the validated value, never by joining strings.

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const run = promisify(execFile);

async convert(source: string, target: string): Promise<void> {
  await run('ffmpeg', ['-i', source, '-y', target], { timeout: 10_000 });
}
```

**Rule 2: Stop a request-derived value from being read as an option.**

Removing the shell does not stop a value that begins with `-` from being interpreted by the program itself, so a filename such as `--output=/etc/passwd` becomes a flag rather than an argument. Reject leading dashes on values that are meant to be operands, or place the value after the `--` separator where the program supports it.

```typescript
if (name.startsWith('-')) {
  throw new BadRequestException('invalid name');
}
await run('gzip', ['--decompress', '--', name], { timeout: 10_000 });
```


**Source files**

- [`content/pipes.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/pipes.md) _(documentation repository)_

## Category: input contract definition

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

## Category: input interpretation safety

### Prevent Route Decoupling Bypasses via Path Canonicalization

**Use when**

Configuring route-level security middleware and authorization policies in NestJS applications.

**Secure rules**

**Rule 1: Fastify middleware matching decodes percent-encoded paths**

The Fastify middie adapter decodes the request URL before matching middleware regular expressions to avoid bypassing middleware. An integration test registers POST middleware for `tests/included` and verifies that a request to `/tests/%69ncluded` executes the registered middleware.

```typescript
consumer
  .apply((_req, res) => res.end('test_included'))
  .forRoutes({ path: 'tests/included', method: RequestMethod.POST });
```


**Source files**

- [`integration/hello-world/e2e/middleware-fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/hello-world/e2e/middleware-fastify.spec.ts)

## Category: network boundary

### Configure Fastify Host Binding for Intended Network Reachability

**Use when**

When bootstrapping a NestJS application and launching the HTTP listener using NestFactory.

**Secure rules**

**Rule 1: Bind Fastify to all interfaces only when accepting connections from other hosts**

Fastify listens only on the `localhost` (`127.0.0.1`) interface by default. Only when the application is intended to accept connections from other hosts, pass `'0.0.0.0'` as the host argument to `app.listen()`.

```typescript
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
```


**Source files**

- [`content/techniques/performance.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/performance.md) _(documentation repository)_

## Category: output encoding

### Encode Untrusted Data for the Context the Response Places It In

**Use when**

Returning request-derived or stored text inside an HTML response body, or rendering a view with values that originated from a client.

**Secure rules**

**Rule 1: Escape interpolated values when a handler composes an HTML body itself.**

Returning an object from a controller serializes JSON, which the browser does not execute. The exposure appears when a handler builds markup instead: `@Header('Content-Type', 'text/html')` around a concatenated template literal places untrusted values into an executable context, so a stored `<script>` runs under your origin. Escape every interpolated value, and set `X-Content-Type-Options: nosniff` so the browser does not sniff a response into a richer type than it was labelled.

```typescript
import { Controller, Get, Header, Param } from '@nestjs/common';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

@Controller('profiles')
export class ProfilesController {
  @Get(':id')
  @Header('Content-Type', 'text/html')
  @Header('X-Content-Type-Options', 'nosniff')
  async show(@Param('id') id: string): Promise<string> {
    const profile = await this.profiles.find(id);
    return `<h1>${escapeHtml(profile.name)}</h1>`;
  }
}
```

**Rule 2: Keep view rendering on the escaping interpolation form.**

A template engine registered with `app.setViewEngine()` and used through `@Render()` escapes interpolated values by default, which is why rendering a view is safer than concatenating a string. That default is per-syntax, not per-engine: Handlebars escapes `{{ value }}` but emits `{{{ value }}}` verbatim, and other engines have an equivalent raw form. Reserve the raw form for markup the application itself produced.

```html
<h1>{{ message }}</h1>
```

**Rule 3: Sanitize, rather than escape, when the response is specified to carry caller-supplied markup.**

Escaping is the right answer when the value is text. When an endpoint is specified to return the caller's own markup as `text/html`, escaping it defeats the feature and returning plain text contradicts the contract. Run the value through an allowlist sanitizer that keeps the permitted elements and attributes and drops everything else, including event-handler attributes and `javascript:` URLs. Do not hand-roll the filter with a regular expression; stripping `<script>` does not stop `<img onerror=...>`.

```typescript
import * as sanitizeHtml from 'sanitize-html';

const renderComment = (markup: string): string =>
  sanitizeHtml(markup, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'code'],
    allowedAttributes: { a: ['href', 'title'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
```


**Source files**

- [`sample/15-mvc/src/app.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/15-mvc/src/app.controller.ts)
- [`sample/15-mvc/views/index.hbs`](https://github.com/nestjs/nest/blob/v11.1.28/sample/15-mvc/views/index.hbs)
- [`content/techniques/mvc.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/mvc.md) _(documentation repository)_

### Neutralize Request Data Before It Reaches the Log

**Use when**

Passing request-derived values -- headers, query parameters, body fields, usernames -- to `Logger` or any other logging sink.

**Secure rules**

**Rule 1: Strip newline and control characters before logging a request-derived value.**

A value containing `\n` or `\r` splits one entry into two, letting a caller forge lines that appear to have come from the server and push real events out of the visible window. Replace line breaks and other control characters before the value reaches `Logger`, and cap its length so a single request cannot flood the log. Do this at the point of logging rather than at the point of input, so the protection does not depend on which handler the value arrived through.

```typescript
import { Body, Controller, Logger, Post } from '@nestjs/common';

const sanitizeForLog = (value: unknown, limit = 200): string =>
  String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, limit);

@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  @Post()
  record(@Body('message') message: string) {
    this.logger.log(`client event: ${sanitizeForLog(message)}`);
    return { status: 'recorded' };
  }
}
```

**Rule 2: Log an identifier for a secret, never the secret itself.**

Tokens, passwords, session identifiers and API keys that reach the log outlive the request in a store with weaker access control than the one they came from, and they survive there in backups. Log a stable non-reversible reference when entries need to be correlated, and keep the value out of the message entirely.

```typescript
import { createHash } from 'crypto';

const tokenReference = (token: string): string =>
  createHash('sha256').update(token).digest('hex').slice(0, 12);

this.logger.log(`authenticated request for token ${tokenReference(token)}`);
```


**Source files**

- [`packages/common/services/console-logger.service.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/common/services/console-logger.service.ts)
- [`packages/common/services/logger.service.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/common/services/logger.service.ts)
- [`content/techniques/logger.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/logger.md) _(documentation repository)_

## Category: resource exhaustion

### Prevent Connection and Socket Exhaustion in Server-Sent Events

**Use when**

Implementing Server-Sent Events (SSE) or managing persistent connections in NestJS applications using Express or Fastify.

**Secure rules**

**Rule 1: Provide teardown for resources started by a custom SSE Observable.**

Nest unsubscribes from an SSE Observable when the client disconnects. When a custom Observable starts a resource such as an interval, return teardown logic from the Observable so that unsubscription releases that resource.

```typescript
@Sse('events')
sendEvents(): Observable<MessageEvent> {
  return new Observable(subscriber => {
    const intervalId = setInterval(() => {
      subscriber.next({ data: { hello: 'world' } });
    }, 1000);

    return () => clearInterval(intervalId);
  });
}
```

**Rule 2: Force shutdown without waiting for requests to finish when needed.**

By default, Nest HTTP adapters wait for responses to finish before closing the application. If the application does not exit when expected because requests remain open, pass `forceCloseConnections: true` to `NestFactory.create()` so shutdown does not wait for those requests to end. Most applications do not need this option.

```typescript
const app = await NestFactory.create(AppModule, {
  forceCloseConnections: true,
});
```


**Source files**

- [`integration/nest-application/sse/e2e/express.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/e2e/express.spec.ts)
- [`integration/nest-application/sse/e2e/fastify.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/e2e/fastify.spec.ts)
- [`integration/nest-application/sse/src/app.controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/nest-application/sse/src/app.controller.ts)
- [`packages/core/router/router-response-controller.ts`](https://github.com/nestjs/nest/blob/v11.1.28/packages/core/router/router-response-controller.ts)
- [`content/faq/keep-alive-connections.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/keep-alive-connections.md) _(documentation repository)_

### Bound Request Bodies and the Expansion of Untrusted Input

**Use when**

Accepting request bodies, uploads, or any input the application decompresses, expands, or repeats.

**Secure rules**

**Rule 1: Set an explicit body size limit rather than relying on the parser default.**

The body parser buffers the whole request before a pipe, guard, or handler sees any of it, so validation rules on a DTO bound nothing about how much memory the request consumes. Call `useBodyParser()` on the Express application with a limit chosen for the largest legitimate payload; oversized requests are then refused at the parser, before the framework builds an object out of them.

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '1mb' });
  app.useBodyParser('urlencoded', { limit: '1mb', extended: true });
  await app.listen(3000);
}
bootstrap();
```

**Rule 2: Cap the output of a decompression, not just the size of its input.**

A size limit on the upload bounds the compressed bytes, and a compressed format's whole purpose is that those bytes expand -- a few kilobytes of archive can produce gigabytes, exhausting memory or disk while every check on the request passed. Count bytes as they are produced and abort the moment the running total crosses the ceiling, and bound the number of entries as well so many small members cannot achieve the same result. Stream each entry through the counter rather than decompressing it into a buffer and measuring afterwards, because by then the memory has already been spent.

```typescript
const MAX_EXTRACTED_BYTES = 16 * 1024 * 1024;
const MAX_ENTRIES = 1_000;

let written = 0;
let entries = 0;

for await (const chunk of entry.stream()) {
  written += chunk.length;
  if (written > MAX_EXTRACTED_BYTES || ++entries > MAX_ENTRIES) {
    throw new BadRequestException('archive too large');
  }
  await sink.write(chunk);
}
```

**Rule 3: Bound nesting depth, and carry one budget across the whole recursive expansion.**

An archive entry can itself be an archive. A per-pass limit then bounds nothing: each individual layer looks small and passes its own check, while the product across layers is unbounded -- an outer archive whose members are archives expands by a multiple at every level. Cap how deep extraction may recurse, and thread a *single* running byte and entry total through the recursion rather than resetting it per archive, so the budget is spent across the whole tree and not per layer. Refuse nested archives outright when the feature does not need them.

```typescript
const MAX_DEPTH = 2;

interface Budget { bytes: number; entries: number; }

async function extract(archive: Archive, depth: number, budget: Budget): Promise<void> {
  if (depth > MAX_DEPTH) {
    throw new BadRequestException('archive nested too deeply');
  }
  for (const entry of archive.entries) {
    budget.bytes += entry.uncompressedSize;
    if (++budget.entries > MAX_ENTRIES || budget.bytes > MAX_EXTRACTED_BYTES) {
      throw new BadRequestException('archive too large');
    }
    if (isArchive(entry)) {
      await extract(await open(entry), depth + 1, budget); // same budget object
    }
  }
}
```

**Rule 4: Give every externally triggered operation a deadline.**

A spawned converter, an outbound HTTP call, or a query with no timeout occupies its resources for as long as the far side chooses, so a slow dependency turns into exhausted workers rather than a failed request. Set an explicit timeout on the operation and return an error when it elapses, so the failure is bounded and visible instead of accumulating.

```typescript
await run('ffmpeg', ['-i', source, '-y', target], { timeout: 10_000 });
```


**Source files**

- [`content/faq/raw-body.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/raw-body.md) _(documentation repository)_
- [`content/security/rate-limiting.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/security/rate-limiting.md) _(documentation repository)_

## Category: runtime environment hardening

### Disable the Interactive NestJS REPL in Production Environments

**Use when**

Bootstrapping a NestJS application using `@nestjs/core` and governing runtime modes.

**Secure rules**

**Rule 1: Recognize that the interactive REPL can invoke providers and controllers directly.**

The NestJS REPL lets you inspect the dependency graph and call methods on providers and controllers directly.


**Source files**

- [`integration/repl/e2e/repl.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/integration/repl/e2e/repl.spec.ts)

## Category: secret handling

### Load Application Secrets from Configuration

**Use when**

Configuring modules, database providers, or authentication handlers in NestJS that require sensitive credentials or cryptographic keys.

**Secure rules**

**Rule 1: Load JWT secrets from application configuration**

Do not use a hardcoded JWT secret from a module or constants file. The Nest JWT sample explicitly warns that its demonstration secret must be replaced with a complex secret kept outside source code. `ConfigModule` can load environment variables and `ConfigService.get()` can read the resulting configuration value.

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AuthModule {
  constructor(private readonly configService: ConfigService) {}

  getJwtSecret() {
    return this.configService.get<string>('JWT_SECRET_KEY');
  }
}
```

**Rule 2: Keep JWT verification secrets outside source code**

Create a complex JWT secret and keep it safe outside source code. When a guard validates an extracted bearer token, pass the verification secret to `JwtService.verifyAsync()` through its `secret` option.

**Rule 3: Configure TypeORM asynchronously with an injected ConfigService**

`TypeOrmModule.forRootAsync()` supports a factory that imports `ConfigModule`, injects `ConfigService`, and obtains the host, port, username, password, and database settings through `configService.get()`.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```


**Source files**

- [`sample/19-auth-jwt/src/auth/auth.module.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.module.ts)
- [`sample/19-auth-jwt/src/auth/auth.guard.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/auth.guard.ts)
- [`sample/19-auth-jwt/src/auth/constants.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/19-auth-jwt/src/auth/constants.ts)
- [`sample/05-sql-typeorm/README.md`](https://github.com/nestjs/nest/blob/v11.1.28/sample/05-sql-typeorm/README.md)
- [`content/techniques/configuration.md`](https://github.com/nestjs/docs.nestjs.com/blob/master/content/techniques/configuration.md) _(documentation repository)_

## Category: security control integrity

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

## Category: session management

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
