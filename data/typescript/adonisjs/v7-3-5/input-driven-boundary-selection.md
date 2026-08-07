# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: input driven boundary selection

## input driven boundary selection

### Validate dynamic provider parameters before invoking drivers

**Use when**

When handling dynamic route parameters to select an OAuth provider or adapter in AdonisJS applications.

**Secure rules**

**Rule 1: Allowlist and validate dynamic provider inputs prior to client invocation.**

Check whether the provider is supported using `ally.has(params.provider)` and restrict expected parameters using route constraints like `.where('provider', /github|google|twitter/)` before calling `ally.use(params.provider)`.

```typescript
router
  .get('/:provider/redirect', ({ ally, params, response }) => {
    if (!ally.has(params.provider)) {
      return response.badRequest('Invalid OAuth provider')
    }
    return ally.use(params.provider).redirect()
  })
  .where('provider', /github|google|twitter/)
```
