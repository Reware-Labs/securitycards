# Security cards

Repository: `https://github.com/adonisjs/core#v7.3.5`
Documentation repository: `https://github.com/adonisjs/v7-docs#main`
Category: api contract misuse

## api contract misuse

### Verify validation results and handle error tuples correctly when using tryValidateUsing

**Use when**

Validating incoming request input using tryValidateUsing in AdonisJS controllers and inspecting the resulting error tuple.

**Secure rules**

**Rule 1: Check the error tuple element returned by tryValidateUsing before using validated data**

When calling `ctx.request.tryValidateUsing()`, verify that the returned `error` element in the tuple is null before accessing the data object. Failing to check the error value can result in accessing null data and bypassing validation controls.

```typescript
export default class ProfileController {
  async update({ request, response }: HttpContext) {
    const [error, data] = await request.tryValidateUsing(profileValidator)
    if (error) {
      return response.unprocessableEntity(error.messages)
    }

    await updateProfile(data)
  }
}
```
