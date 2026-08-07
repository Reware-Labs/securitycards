# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: secret handling

## secret handling

### Load credentials and secrets using environment variables

**Use when**

Configuring application settings, encryption keys, database connections, mail services, storage drivers, authentication guards, and API integrations.

**Secure rules**

**Rule 1: Load sensitive credentials and keys strictly from environment variables instead of hardcoding them in source files.**

Always fetch sensitive values like `APP_KEY`, database passwords, cloud storage credentials, and API keys using `env.get()` within configuration files and make sure to validate that all required secret parameters are non-empty strings.

```typescript
import env from '#start/env'
import { defineConfig, drivers } from '@adonisjs/core/encryption'

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

**Rule 2: Omit sensitive secret values from example environment files.**

When defining environment variables programmatically, pass sensitive key names in the `omitFromExample` option array so that secret default values are excluded from `.env.example`.

```typescript
await codemods.defineEnvVariables(
  {
    API_KEY: 'secret-key-here',
  },
  {
    omitFromExample: ['API_KEY']
  }
)
```


### Redact and protect sensitive tokens and secrets during runtime handling

**Use when**

Handling plain-text tokens, logging application messages, rendering user inputs or models, and managing terminal or REPL prompts.

**Secure rules**

**Rule 1: Redact or exclude sensitive credentials and token fields from logs, session state, and outputs.**

Configure global key redaction paths in `config/logger.ts`, wrap sensitive data inside `Secret` instances prior to logging or verification, and explicitly exclude sensitive user inputs using `session.flashExcept()`.

```typescript
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
  loggers: {
    app: {
      redact: {
        paths: ['password', '*.password', 'creditCard', 'token'],
        censor: '[REDATED]'
      }
    }
  }
})
```

**Rule 2: Avoid exposing raw unhashed token values or logging plain text secrets.**

Only expose plain access token strings immediately upon creation using `token.value!.release()` when responding to the client, and never store or log plain text token strings on the server.

```typescript
router.post('/users/:id/tokens', async ({ params }) => {
  const user = await User.findOrFail(params.id)
  const token = await User.accessTokens.create(user)

  return {
    type: 'bearer',
    value: token.value!.release(),
  }
})
```
