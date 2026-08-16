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
