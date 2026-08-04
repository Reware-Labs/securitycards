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


**Source files**

- [`sample/05-sql-typeorm/src/users/users.service.spec.ts`](https://github.com/nestjs/nest/blob/v11.1.28/sample/05-sql-typeorm/src/users/users.service.spec.ts)
