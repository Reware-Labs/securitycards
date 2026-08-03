# Security cards

Repository: `https://github.com/honojs/hono#v4.12.32`
Category: input contract definition

## input contract definition

### Validate input presence and content type when processing request bodies and parameters

**Use when**

Handling incoming JSON, form payloads, and localized language configurations where input validation and allowed structures must be strictly enforced.

**Secure rules**

**Rule 1: Validate required JSON fields in the validator callback before application logic**

Hono parses the `json` validation target only when the request has a matching JSON `Content-Type`. Otherwise, the validator callback receives an empty object. Check the required shape and fields in the callback, return a 400 response for invalid input, and return only validated data for the route handler to consume with `c.req.valid('json')`.

```typescript
import { Hono } from 'hono'
import { validator } from 'hono/validator'

const app = new Hono()

app.post(
  '/account',
  validator('json', (value, c) => {
    if (typeof value !== 'object' || value === null) {
      return c.text('Invalid!', 400)
    }

    const email = value.email

    if (typeof email !== 'string' || email.length === 0) {
      return c.text('Invalid!', 400)
    }

    return { email }
  }),
  (c) => {
    const { email } = c.req.valid('json')
    return c.json({ received: email })
  }
)

export default app
```

**Rule 2: Enforce strict whitelisting of permitted options when configuring language detection and fallback values.**

Ensure `fallbackLanguage` is explicitly included in `supportedLanguages`, and that `supportedLanguages` contains a strict whitelist of permitted language codes to prevent unvalidated inputs from entering application context.

```typescript
app.use(
  '*',
  languageDetector({
    supportedLanguages: ['en', 'fr', 'es'],
    fallbackLanguage: 'en',
  })
)
```
