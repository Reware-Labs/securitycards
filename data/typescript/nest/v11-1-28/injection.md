# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: injection

## injection

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
