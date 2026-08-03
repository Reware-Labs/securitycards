# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: configuration source integrity

## configuration source integrity

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
