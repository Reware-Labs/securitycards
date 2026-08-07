# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: cryptography

## cryptography

### Configure Secure Password Hashing with Argon2

**Use when**

Implementing user authentication and password storage mechanisms in AdonisJS applications.

**Secure rules**

**Rule 1: Select Argon2 or Scrypt as the password hashing driver to avoid bcrypt truncation issues.**

Configure Argon2 using the `id` variant in `config/hash.ts` to properly process long passwords and prevent silent truncation beyond 72 bytes.

```typescript
import { defineConfig, drivers } from '@adonisjs/core/hash'

export default defineConfig({
  default: 'argon',
  list: {
    argon: drivers.argon2({
      variant: 'id',
      version: 0x13,
      iterations: 3,
      memory: 65536,
      parallelism: 4,
    }),
  },
})
```


### Use Authenticated Encryption with Purpose Binding

**Use when**

Encrypting sensitive payloads or tokens requiring confidentiality and integrity guarantees across distinct application contexts.

**Secure rules**

**Rule 1: Specify purpose options during encryption and decryption to prevent cross-context token reuse.**

Pass a distinct purpose string when encrypting data to bind the purpose to the ciphertext authentication tag. Always verify that decryption returns non-null output before using the payload.

```typescript
import encryption from '@core/services/encryption'

const resetToken = encryption.encrypt(
  { userId: 1 },
  { purpose: 'password-reset' }
)

const payload = encryption.decrypt(resetToken, 'password-reset')
if (!payload) {
  // Handle invalid context or tampered token
}
```

**Rule 2: Select modern authenticated encryption drivers such as AES-256-GCM or ChaCha20-Poly1305 for new data.**

Configure application encryption with authenticated encryption algorithms using `defineConfig` to ensure both data confidentiality and authenticity.

```typescript
import { defineConfig, drivers } from '@adonisjs/core/encryption'
import env from '#start/env'

export const encryptionConfig = defineConfig({
  default: 'app',
  list: {
    app: drivers.aes256gcm({
      id: 'app',
      keys: [env.get('APP_KEY')],
    }),
  },
})
```
