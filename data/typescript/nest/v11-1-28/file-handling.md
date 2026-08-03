# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: file handling

## file handling

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
