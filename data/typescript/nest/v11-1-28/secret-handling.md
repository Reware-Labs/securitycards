# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: secret handling

## secret handling

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
