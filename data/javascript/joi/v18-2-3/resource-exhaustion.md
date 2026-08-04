# Security cards

Repository: `https://github.com/hapijs/joi#v18.2.3`
Category: resource exhaustion

## resource exhaustion

### Limit recursive link schema depth

**Use when**

Defining recursive validation schemas using Joi.link() to validate nested object hierarchies.

**Secure rules**

**Rule 1: Configure maxRecursion on recursive link schemas to prevent excessive stack allocation and CPU consumption.**

When defining recursive schemas using `Joi.link()`, always configure `maxRecursion()` to explicitly limit the depth of nested object validation and protect against Denial of Service conditions.

```javascript
const schema = Joi.object({
    name: Joi.string().required(),
    children: Joi.array().items(
        Joi.link('...').maxRecursion(5)
    )
});
```
