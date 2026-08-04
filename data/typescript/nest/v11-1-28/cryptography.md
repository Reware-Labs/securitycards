# Security cards

Repository: `https://github.com/nestjs/nest#v11.1.28`
Documentation repository: `https://github.com/nestjs/docs.nestjs.com#master`
Category: cryptography

## cryptography

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
