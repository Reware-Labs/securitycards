# Security cards

Repository: `https://github.com/feathersjs/feathers#v5.0.46`
Category: input interpretation safety

## input interpretation safety

### Configure Query Parser Limits to Handle Array Inputs Securely

**Use when**

Configuring the express query parser in a Feathers application when handling URL query strings with large array parameters.

**Secure rules**

**Rule 1: Configure explicit array limits on the query string parser to prevent implicit type transformations.**

The default `qs` query string parser converts query arrays exceeding twenty items into standard JavaScript objects with numeric keys, which can disrupt schema validation and application logic. Set an explicit `arrayLimit` option when configuring the parser to ensure predictable input interpretation.

```typescript
import qs from 'qs'
import { feathers } from '@feathersjs/feathers'
import express from '@feathersjs/express'

const app = express(feathers())
app.set('query parser', (str: string) => qs.parse(str, { arrayLimit: 1000 }))
```
