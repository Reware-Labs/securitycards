# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: resource exhaustion

## resource exhaustion

### Configure request body parser limits to prevent denial of service

**Use when**

Defining body parser configurations to restrict incoming payload sizes for JSON, form, and multipart requests in AdonisJS applications.

**Secure rules**

**Rule 1: Enforce strict request size limits using the limit and fieldsLimit options across body parsers.**

Configure explicit limit values for all configured parsers in `config/bodyparser.ts` to protect the application from Denial of Service attacks caused by excessively large request bodies or field payloads.

```typescript
import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  json: {
    limit: '1mb',
  },
  form: {
    limit: '1mb',
  },
  multipart: {
    limit: '20mb',
    fieldsLimit: '2mb',
  },
})

export default bodyParserConfig
```
